<?php
// public_html/api/config.php

// Prefer env, fall back to defined constants from secrets.
function envpick(string $key, $default = null) {
  $v = getenv($key);
  if ($v === false) $v = $_SERVER[$key] ?? $_ENV[$key] ?? null;
  return ($v !== null) ? $v : $default;
}

/*
 * [EDIT #1] Robust secrets resolution:
 * - Prefer top-level ~/www/janetxiushi.me/private/contact.secrets.php (outside web root)
 * - Fallback to public_html/private/contact.secrets.php if someone placed it there
 * - Emit a hint to /tmp/contact.log if nothing is found (helps debugging)
 */
$root = dirname(dirname(__DIR__)); // -> /.../www/janetxiushi.me
$candidates = [
  $root . '/private/contact.secrets.php',           // preferred (outside web root)
  dirname(__DIR__) . '/private/contact.secrets.php' // fallback inside public_html
];

$foundSecrets = null;
foreach ($candidates as $p) {
  if (is_readable($p)) { $foundSecrets = $p; break; }
}
if ($foundSecrets) {
  require_once $foundSecrets; // This file defines constants like SMTP_HOST, etc.
} else {
  // [EDIT #1a] Optional debug bread crumb:
  error_log("config.php: secrets not found in: " . implode(', ', $candidates) . "\n", 3, '/tmp/contact.log');
}

// Helper: read env first, then defined() constants, else default.
function pick(string $key, $default = '') {
  $env = envpick($key, null);
  if ($env !== null) return $env;
  if (defined($key)) return constant($key);
  return $default;
}

/*
 * [EDIT #2] Optional: log the effective values when DEBUG_LOG is on,
 * and which secrets file (if any) was loaded. This goes to /tmp/contact.log.
 */
$__debug_on = (bool) pick('DEBUG_LOG', false);
if ($__debug_on) {
  $dbg = sprintf(
    "config.php: secrets=%s; SMTP_HOST=%s; SMTP_USER=%s; PORT=%s; SECURE=%s\n",
    $foundSecrets ?: 'none',
    pick('SMTP_HOST', 'mail.yourdomain.tld'),
    pick('SMTP_USER', 'info@yourdomain.tld'),
    pick('SMTP_PORT', 465),
    pick('SMTP_SECURE', 'ssl')
  );
  error_log($dbg, 3, '/tmp/contact.log');
}

// ---- Final effective config ----
// [EDIT #3] Define in an order that avoids referencing undefined constants.
define('SMTP_HOST',   pick('SMTP_HOST',   'mail.yourdomain.tld'));
define('SMTP_PORT',   (int) pick('SMTP_PORT', 465));            // 465=ssl, 587=tls
define('SMTP_SECURE', strtolower(pick('SMTP_SECURE', 'ssl')));  // 'ssl' or 'tls'
define('SMTP_USER',   pick('SMTP_USER',   'info@yourdomain.tld'));
define('SMTP_PASS',   pick('SMTP_PASS',   ''));

// Use SMTP_USER as default *after* it's defined.
define('MAIL_TO',     pick('MAIL_TO',     (defined('SMTP_USER') ? SMTP_USER : 'info@yourdomain.tld')));
define('FROM_EMAIL',  pick('FROM_EMAIL',  (defined('SMTP_USER') ? SMTP_USER : 'info@yourdomain.tld')));
define('FROM_NAME',   pick('FROM_NAME',   'Portfolio Contact'));

define('ALLOW_ORIGIN', pick('ALLOW_ORIGIN', '')); // e.g., https://janetxiushi.me
define('DEBUG_LOG',    (bool) pick('DEBUG_LOG', false));
