const env = require('../env');
const log = require('lodge');

const delim = /[, ]+/g;

exports.run = async function(args) {
  let [keys, val] = args.join(' ').split('=');

  // Keys may be separated with spaces or commas.
  if (keys) keys = keys.trim().split(delim);
  else keys = [];

  if (val != null) {
    let vals = {};
    keys.forEach(key => {
      vals[key] = val || undefined;
    });
    env.set(vals);
    return;
  }

  switch (keys.length) {
    case 1:
      val = await env.get(keys[0]);
      return val != null ? log(val) : null;
    case 0:
      keys = null;
      /* fallthrough */
    default:
      var vals = await env.get(keys);
      log(JSON.stringify(vals, null, 2));
  }
};
