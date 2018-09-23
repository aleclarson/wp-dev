
const env = {
  WP_INSTALL_DIR: {
    description: 'Path to wordpress'
  }
};

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

function escape(str) {
  return str.replace(/([./])/g, '\\$1');
}

function replacePath(input, replaced, replacer) {
  replaced = escape(replaced);

  // PHP-serialized values must be replaced first.
  let encoded = `\\bs:[0-9]+:\\\\"${replaced}([^"]*)\\\\";`;
  let output = input.replace(new RegExp(encoded, 'g'), (_, uri) => {
    let path = replacer + (uri || '');
    return `s:${path.length}:\\"${path}\\";`;
  });

  // Replace any remaining occurrences.
  return output.replace(new RegExp(replaced, 'g'), replacer);
}

module.exports = {
  ask,
  getenv,
  escape,
  replacePath,
};
