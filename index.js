#!/usr/bin/env node
const log = require('lodge');

let cmd = process.argv[2];
if (!cmd || cmd == 'help') {
  log(log.yellow('Available commands:'));
  const commands = {
    auth: 'Refresh the MySQL credentials by evaluating wp-config.php',
    backup: 'Backup the remote MySQL database',
    pull: 'Update the local MySQL database with remote data',
  };
  const names = Object.keys(commands);
  const width = names.reduce((result, name) => Math.max(result, name.length), 0);
  names.forEach(name => {
    const space = (' ').repeat(1 + width - name.length);
    log('  ' + name + space + log.gray(commands[name]));
  });
  process.exit();
}

// Validate the command.
const cmdPath = './lib/commands/' + cmd;
try {
  require.resolve(cmdPath);
} catch(e) {
  log.error('Invalid command: ' + cmd);
  process.exit(1);
}

// Load the command.
cmd = require(cmdPath);

// Parse any arguments.
const args = require('slurm')(cmd.args);
args.shift();

// Run the command.
cmd.run(args);
