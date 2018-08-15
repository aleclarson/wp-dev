<?php
$keys = getenv('keys');
if (!$keys) {
  echo 'Must define $keys';
  exit(1);
}

require 'etc/config.php';
eval_wp_config($wp_config);

$arr = array();
foreach (explode(',', $keys) as $key) {
  $arr[$key] = defined($key) ? constant($key) :
    (array_key_exists($key, $GLOBALS) ? $GLOBALS[$key] :
    (getenv($key) ?: NULL));
}

echo json_encode($arr);
