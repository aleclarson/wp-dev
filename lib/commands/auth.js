const loadAuth = require('../auth');
const log = require('lodge');

exports.run = async function(args) {
  log(log.gray('Fetching credentials...'));
  const authPath = await loadAuth(true);
  log(log.green('Success!'));
};
