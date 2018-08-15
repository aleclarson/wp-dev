const php = require('../php');
const log = require('lodge');

exports.run = async function() {
  log(log.gray(await php.wipe()));
};
