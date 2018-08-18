<?php

$wp_root = preg_replace('/\/$/', '', getenv('WP_INSTALL_DIR'));
if (empty($wp_root)) {
  echo "Must define \$WP_INSTALL_DIR\n";
  exit(1);
}

$wp_config = $wp_root . '/wp-config.php';
if (!is_file($wp_config)) {
  $wp_config = dirname($wp_root) . '/wp-config.php';
  if (!is_file($wp_config)) {
    echo "Cannot find wp-config.php\n";
    exit(1);
  }
}

define('ABSPATH', $wp_root . '/');

$_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.0';
$_SERVER['SERVER_NAME'] = '';
$_SERVER['SERVER_PORT'] = '80';

function use_local_db() {
  putenv('DB_NAME=');
  putenv('DB_USER=');
  putenv('DB_PASS=');
  putenv('DB_HOST=');
}

function eval_wp_config() {
  global $wp_config;

  $htaccess = dirname($wp_config) . '/.htaccess';
  if (file_exists($htaccess)) {
    $pattern = '/(?:^|\n)SetEnv ([^\s]+) ([^\n]+)/';
    preg_match_all($pattern, file_get_contents($htaccess), $matches);
    foreach ($matches[1] as $i => $name) {
      $value = $matches[2][$i];
      putenv("$name=$value");
    }
  }

  // Remove wp-settings.php and any code after it
  $lines = explode("\n", file_get_contents($wp_config));
  $settings_line = find_key($lines, function($line) {
    return preg_match('/^\s*require.+wp-settings\.php/', $line);
  });
  if (is_numeric($settings_line)) {
    $lines = array_slice($lines, 0, $settings_line);
  }

  $code = implode("\n", $lines);
  $code = replace_path_consts($code, $wp_config);

  // Write to a temporary file.
  $tmp = sys_get_temp_dir() . '/wp-config.php';
  file_put_contents($tmp, $code);

  ob_start();
  require_once($tmp);
  ob_end_clean();

  // Remove the temporary file.
  unlink($tmp);
}

function replace_path_consts($code, $path) {
  $replacements = array(
    '__FILE__' => "'$path'",
    '__DIR__'  => "'" . dirname($path) . "'",
  );
  $old = array_keys($replacements);
  $new = array_values($replacements);
  return str_replace($old, $new, $code);
}

function find_key($arr, $iter) {
  foreach ($arr as $key => $value) {
    if ($iter($value, $key)) return $key;
  }
}
