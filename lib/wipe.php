<?php
require 'etc/config.php';
eval_wp_config();
use_local_db();

require 'etc/wpdb.php';
if ($wpdb->dbname != 'mysql') {
  echo 'Cannot wipe a remote database';
  exit(1);
}

$tables = $wpdb->get_results("
  SELECT table_name FROM information_schema.tables
    WHERE table_name LIKE '$table_prefix%';
");

$tables = array_map(function($tbl) {
  return $tbl->table_name;
}, $tables);
$tables = implode(', ', $tables);

echo "\nDeleting: $tables";
$wpdb->query("
  DROP TABLE IF EXISTS $tables;
");
