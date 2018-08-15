const loadAuth = require('../auth');
const mysql = require('../mysql');
const log = require('lodge');

exports.run = async function(args) {
  const file = args[0] || 'backup.sql';
  const auth = await loadAuth();

  log(log.gray('Backing up...'));
  mysql(auth).dump(file);
  log(log.green(`Saved to ${file}`));
};
