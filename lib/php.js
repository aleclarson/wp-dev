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
  if (!env.WP_INSTALL_DIR) {
    let cache = require('./env');
    let WP_INSTALL_DIR = await cache._get('WP_INSTALL_DIR');
    if (!WP_INSTALL_DIR) {
      WP_INSTALL_DIR = await getenv('WP_INSTALL_DIR');
      cache.set('WP_INSTALL_DIR', WP_INSTALL_DIR);
    }
    env.WP_INSTALL_DIR = path.resolve(WP_INSTALL_DIR);
  }
  opts.env = env;
  return exec('php', cmdPath, opts)
    .catch(err => {
      if (err.stdout) log(log.gray(err.stdout));
      if (err.stderr) log.error(err.stderr);
      throw err;
    });
}
