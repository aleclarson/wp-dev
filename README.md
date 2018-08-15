# wp-dev v0.0.1

Command line tool for managing WordPress installations ✏️

&nbsp;

## Commands

All commands should be performed while in the root directory of your project.

### auth

Setup authorization for the remote MySQL database.

Run this command to refresh the contents of the `auth.json` file. The `wp-config.php` file is loaded and database-related constants are extracted into the `auth.json` file.

### backup

Create a backup of the remote MySQL database.

The default filename is `./backup.sql`.

The `mysqldump` executable must exist.

### pull

Import the remote database into your local database.

The `options` table is *not* imported to avoid issues.

Existing rows may be overwritten, but never deleted.

&nbsp;

## License

MIT
