const {getenv} = require('./etc');
const exec = require('@aleclarson/exec');
const path = require('path');
const log = require('lodge');
const fs = require('saxon/sync');

fs.list(__dirname)
  .filter(name => path.extname(name) == '.php')
  .forEach(name => {
    name = name.slice(0, -4);
    exports[name] = function(env, opts) {
      return run(name, env, opts);
    };
  });

async function run(cmd, env = {}, opts = {}) {
  let cmdPath = path.resolve(__dirname, cmd + '.php');
  if (!env.WP_HOME) {
    let cache = require('./env');
    let WP_HOME = await cache.ask('WP_HOME');
    if (!WP_HOME) {
      WP_HOME = await getenv('WP_HOME');
      cache.set('WP_HOME', WP_HOME);
    }
    env.WP_HOME = path.resolve(WP_HOME);
  }
  opts.env = env;
  return exec('php', cmdPath, opts)
    .catch(err => {
      if (err.stdout) log(log.gray(err.stdout));
      if (err.stderr) log.error(err.stderr);
      throw err;
    });
}
