const sha256 = require('./etc/sha256');
const path = require('path');
const php = require('./php');
const fs = require('saxon/sync');
const os = require('os');

const envPath = path.join(os.tmpdir(), sha256(process.cwd(), 15)) + '.json';
const env = fs.isFile(envPath) ? JSON.parse(fs.read(envPath)) : {};

exports._get = function(key) {
  return env[key];
};

exports.get = async function(keys) {
  if (keys == null) {
    return env;
  }

  if (typeof keys == 'string') {
    let key = keys;
    let val = env[key];
    if (val == null) {
      let json = await php.inspect({ keys });
      val = JSON.parse(json)[key];
      if (val != null) {
        this.set(key, val);
      }
    }
    return val;
  }

  let vals = {};
  keys = keys.filter(key => {
    let val = env[key];
    if (val == null) {
      return true;
    }
    vals[key] = val;
    return false;
  });
  if (keys.length) {
    let json = JSON.parse(await php.inspect({ keys }));
    Object.assign(vals, json);
    this.set(json);
  }
  return vals;
};

exports.set = function(key, val) {
  if (typeof key == 'string') {
    if (val == null) {
      return this.unset(key);
    }
    env[key] = val;
  } else {
    Object.assign(env, key);
  }
  fs.write(envPath, JSON.stringify(env));
};

exports.unset = function(keys) {
  if (typeof keys == 'string') {
    delete env[keys];
  } else {
    keys.forEach(key => {
      delete env[key];
    });
  }
  fs.write(envPath, JSON.stringify(env));
};
