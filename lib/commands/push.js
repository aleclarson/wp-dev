const MagicString = require('@cush/magic-string');
const {ask, replacePath} = require('../etc');
const loadAuth = require('../auth');
const {parse} = require('sql-ast');
const mysql = require('../mysql');
const elaps = require('elaps');
const path = require('path');
const log = require('lodge');
const env = require('../env');
const fs = require('saxon/sync');

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

  // Swap the local URL with the live URL.
  let localBaseURL = `https?://localhost:${process.env.PORT || 8888}`;
  sql = replacePath(sql, localBaseURL, `https://${opts.domain}`);

  // Swap the local home path with the live home path.
  sql = replacePath(sql, process.cwd(), opts.root);

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

  // Update the live database.
  let auth = await loadAuth();
  log(log.gray('Pushing data...'));
  mysql(auth).exec({
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
