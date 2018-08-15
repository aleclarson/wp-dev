
function ask(...args) {
  const inquirer = require('@aleclarson/inquirer');
  return inquirer.prompt(...args);
}

async function getenv(key) {
  return process.env[key] ||
    (await ask({
      name: key,
      message: (env[key] ? env[key].description : key) + ':',
    }))[key];
}

module.exports = {
  ask,
  getenv,
};

const env = {
  WP_HOME: {
    description: 'Path to wordpress'
  }
};
