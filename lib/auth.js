const {ask} = require('./etc');
const path = require('path');
const php = require('./php');
const env = require('./env');
const log = require('lodge');

const AUTH_KEYS = [
  'DB_NAME', 'DB_USER', 'DB_PASSWORD'
];

async function loadAuth(force) {
  let host = await env.get('DB_HOST');

  let auth;
  if (force) env.unset(AUTH_KEYS);
  auth = await env.get(AUTH_KEYS);
  if (!force) auth.DB_HOST = host;

  let questions = [{
    name: 'DB_NAME',
    message: 'Database name:',
    required: true,
  }, {
    name: 'DB_USER',
    message: 'MySQL username:',
    required: true,
  }, {
    type: 'password',
    name: 'DB_PASSWORD',
    message: 'MySQL password:',
    required: true,
  }, {
    name: 'DB_HOST',
    message: 'Database host:',
    default: host,
    required: true,
  }];

  // Fill in undefined variables.
  auth = await ask(questions, auth);
  env.set(auth);

  return {
    db: auth.DB_NAME,
    user: auth.DB_USER,
    pass: auth.DB_PASSWORD,
    host: auth.DB_HOST,
  };
}

module.exports = loadAuth;
