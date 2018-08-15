const MagicString = require('@cush/magic-string');
const {parse} = require('sql-ast');
const {ask} = require('../etc');
const mysql = require('../mysql');
const elaps = require('elaps');
const path = require('path');
const log = require('lodge');
const env = require('../env');
const afs = require('saxon');
const fs = require('saxon/sync');
const os = require('os');

exports.args = {
  hard: true, // Destroy existing rows
  s: true,    // SQL script path
  x: {        // Skip the given tables
    type: 'string',
  },
};

exports.run = async function(args) {
  let sql, sqlPath = args.s;

  if (sqlPath) {
    sql = fs.read(sqlPath);
  } else try {
    sql = fs.read('/dev/stdin');
  } catch(e) {}

  if (sql == null) {
    log.error('Must specify -s or pipe a script via stdin');
    process.exit(1);
  }

  const DB_HOST = env._get('DB_HOST');
  const HOME = env._get('HOME');

  let opts = await ask([{
    name: 'domain',
    message: 'Domain:',
    required: true,
  }, {
    name: 'root',
    message: 'Home path:',
    required: true,
  }], {
    domain: DB_HOST,
    root: HOME,
  });

  if (!DB_HOST) env.set('DB_HOST', opts.domain);
  if (!HOME) env.set('HOME', opts.root);

  // Swap the live URL with the local URL.
  let localBaseURL = `http://localhost:${process.env.PORT || 8888}`;
  sql = replacePath(sql, `https?://${opts.domain}`, localBaseURL);

  // Swap the live content dir with the local content dir.
  sql = replacePath(sql, opts.root + '/wp-content', process.cwd() + '/content');

  // Swap the live home path with the local home path.
  sql = replacePath(sql, opts.root, process.cwd());

  if (!args.hard) {
    let t = elaps(log.gray('Parsing script...'));
    let ast = parse(sql);
    t.stop(true);

    let ms = new MagicString(sql);
    if (args.x) {
      // Skip the given table names.
      let skip = args.x.replace(/,/g, '|');
      skip = new RegExp(`_(${skip})$`);
      ast = ast.filter(stmt => {
        if (isTable(stmt, skip)) {
          let {start, end} = stmt;
          if (~stmt.version) {
            end -= 3; // avoid stripping */;
          }
          ms.remove(start, end);
          return false;
        }
        return true;
      });
    }
    ast.forEach(stmt => {
      switch (stmt.type) {
        case 'DROP':
          // Strip DROP statements.
          ms.remove(stmt.start, stmt.end);
          break;
        case 'CREATE':
          // Add "IF NOT EXISTS" attribute.
          let i = stmt.start + 'CREATE TABLE'.length;
          ms.appendLeft(i, ' IF NOT EXISTS');
          break;
        case 'INSERT':
          // Replace "INSERT" with "REPLACE".
          let end = stmt.start + 'INSERT'.length;
          ms.overwrite(stmt.start, end, 'REPLACE');
          break;
      }
    });
    sql = ms.toString();
  }

  // Update the local database.
  log(log.gray('Updating database...'));
  mysql().exec({
    input: sql,
  });
};

function isTable(stmt, regex) {
  switch (stmt.type) {
    case 'DROP':
      return stmt.names.some(name => regex.test(name));
    case 'ALTER':
    case 'CREATE':
      return regex.test(stmt.name);
    case 'INSERT':
      return regex.test(stmt.table);
    case 'LOCK':
      return stmt.tables.some(table => regex.test(table[0]));
  }
  return false;
}

function escape(str) {
  return str.replace(/([./])/g, '\\$1');
}

function replacePath(input, replaced, replacer) {
  replaced = escape(replaced);

  // PHP-serialized values must be replaced first.
  let encoded = `\\bs:[0-9]+:\\\\"${replaced}([^"]*)\\\\";`;
  let output = input.replace(new RegExp(encoded, 'g'), (_, uri) => {
    let path = replacer + (uri || '');
    return `s:${path.length}:\\"${path}\\";`;
  });

  // Replace any remaining occurrences.
  return output.replace(new RegExp(replaced, 'g'), replacer);
}
