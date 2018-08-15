const crypto = require('crypto');

function sha256(data, len) {
  let hash = crypto.createHash('sha256')
    .update(data).digest('hex');

  if (typeof len == 'number') {
    return hash.slice(0, len);
  }
  return hash;
}

module.exports = sha256;
