<?php

if (!defined('ABSPATH'))
  define('ABSPATH', $wp_home . '/');

if (!defined('WPINC'))
  define('WPINC', 'wp-includes');

if (!defined('WP_DEBUG'))
  define('WP_DEBUG', true);

if (!defined('WP_DEBUG_DISPLAY'))
  define('WP_DEBUG_DISPLAY', false);

function wp_load_translations_early() {}
function is_multisite() {}

require ABSPATH . WPINC . '/pomo/mo.php';
require ABSPATH . WPINC . '/l10n.php';
require ABSPATH . WPINC . '/functions.php';
require ABSPATH . WPINC . '/plugin.php';
require ABSPATH . WPINC . '/wp-db.php';

$wpdb = new wpdb(
  getenv('DB_USER') ?: 'root',
  getenv('DB_PASS') ?: 'root',
  getenv('DB_NAME') ?: 'mysql',
  getenv('DB_HOST') ?: '127.0.0.1:8889'
);
