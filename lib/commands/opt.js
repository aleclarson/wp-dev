const loadAuth = require('../auth');
const mysql = require('../mysql');
const env = require('../env');
const log = require('lodge');

const delim = /[, ]+/g;

exports.args = {
  prod: true, // Use live database
};

exports.run = async function(args) {
  let [names, val] = args.join(' ').split('=');

  // Names may be separated with spaces or commas.
  names = names.trim().split(delim);

  let prefix = await env.get('table_prefix');
  if (!prefix) {
    log.error('Must declare `table_prefix` as global');
    process.exit(1);
  }

  let auth = await (args.prod ? loadAuth() : null);
  let db = mysql(auth);

  let cond = names.map(name => `option_name='${name}'`).join(' OR ');
  let table = ident(prefix + 'options');
  if (val == null) {
    let rows = db.query(`SELECT option_name, option_value FROM ${table} WHERE ${cond}`);
    if (names.length > 1) {
      let values = {};
      rows && rows.forEach(props => {
        values[props.option_name] = props.option_value;
      });
      names.forEach(name => {
        if (name in values) return;
        values[name] = undefined;
      });
      log(JSON.stringify(values, null, 2));
    }
    else if (rows) {
      log(rows[0].option_value);
    }
  }
  else if (val == '') {
    db.query(`DELETE FROM ${table} WHERE ${cond}`);
  }
  else {
    val = JSON.stringify(val);

    let results = db.query(`SELECT option_id, option_name FROM ${table} WHERE ${cond}`) || [];

    let createRow = (props) =>
      `(${props.option_id || 'NULL'}, "${props.option_name}", ${val}, "yes")`;

    let replaced = results
      .map(createRow)
      .join(', ');

    let inserted = names
      .filter(name =>
        !results.some(props => props.option_name == name))
      .map(name => createRow({
        option_name: name,
      }))
      .join(', ');

    if (inserted)
      db.query(`INSERT INTO ${table} VALUES ${inserted}`);

    if (replaced)
      db.query(`REPLACE INTO ${table} VALUES ${replaced}`);
  }
};

function ident(name) {
  return `\`${name}\``;
}
