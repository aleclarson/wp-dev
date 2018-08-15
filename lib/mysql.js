const exec = require('@aleclarson/exec');
const tabd = require('tab-delimited');
const log = require('lodge');
const fs = require('saxon/sync');

class Session {
  constructor(opts) {
    this.db = opts.db || 'mysql';
    this.user = opts.user || 'root';
    this.pass = opts.pass || 'root';
    this.host = opts.host || 'localhost';
  }
  query(cmd, opts) {
    return this._exec([
      '-e', cmd,
    ], opts);
  }
  exec(path, opts) {
    if (typeof path == 'string') {
      if (!opts) opts = {};
      opts.input = fs.read(path);
    } else if (path && !opts) {
      opts = path;
    } else {
      throw Error(
        path ? 'Invalid path argument' : 'Must specify a path or object'
      );
    }
    let args = take(opts, 'args') || [];
    return this._exec(args, opts);
  }
  dump(dest) {
    return this._exec([], {
      bin: 'mysqldump',
      args: ['-r', dest],
    });
  }
  _exec(args, opts = {}) {
    if (!opts.env) opts.env = Object.create(process.env);
    opts.env.MYSQL_PWD = this.pass;
    try {
      let bin = take(opts, 'bin') || 'mysql';
      let result = exec.sync(bin, [
        this.db,
        '-u', this.user,
        '-h', this.host,
        ...args,
      ], opts);

      if (result) {
        return tabd.parse(result);
      }
    }
    catch(err) {
      if (err.stdout) log(log.gray(err.stdout));
      if (err.stderr) log.error(err.stderr);
      throw err;
    }
  }
}

module.exports = function(opts) {
  return new Session(opts || {});
};

function take(obj, key) {
  let val = obj[key];
  delete obj[key];
  return val;
}
