<?php
// public_html/api/contact.php
declare(strict_types=1);

// CORS + JSON headers (works for same-origin too)
require_once __DIR__ . '/config.php';
header('Content-Type: application/json; charset=utf-8');
if (ALLOW_ORIGIN) {
  header('Access-Control-Allow-Origin: ' . ALLOW_ORIGIN);
  header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(204);
  exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Method not allowed']);
  exit;
}

// Read JSON (fallback to form-encoded if needed)
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) {
  $data = $_POST ?? [];
}

// Extract & sanitize
$trim = fn($v) => trim((string)($v ?? ''));
$name      = $trim($data['name'] ?? '');
$email     = $trim($data['email'] ?? '');
$portfolio = $trim($data['portfolio'] ?? '');
$linkedin  = $trim($data['linkedin'] ?? '');
$github    = $trim($data['github'] ?? '');
$message   = $trim($data['message'] ?? '');
$human     = !!($data['humanVerification'] ?? false);

// Server-side validation (mirrors your JS)
$errors = [];
if ($name === '' || mb_strlen($name) > 40)             $errors['name'] = 'Name is required (≤ 40 chars)';
if ($email === '' || mb_strlen($email) > 40 || !filter_var($email, FILTER_VALIDATE_EMAIL))
  $errors['email'] = 'Valid email is required (≤ 40 chars)';
$checkUrl = function($u) {
  if ($u === '') return true;
  // allow http/https URLs
  return (bool) filter_var($u, FILTER_VALIDATE_URL);
};
if (!$checkUrl($portfolio)) $errors['portfolio'] = 'Enter a valid URL';
if (!$checkUrl($linkedin))  $errors['linkedin']  = 'Enter a valid URL';
if (!$checkUrl($github))    $errors['github']    = 'Enter a valid URL';
if ($message === '' || mb_strlen($message) < 10 || mb_strlen($message) > 150)
  $errors['message'] = 'Message must be 10–150 chars';
if (!$human) $errors['humanVerification'] = 'Please confirm you are human';

if ($errors) {
  http_response_code(422);
  echo json_encode(['error' => 'Validation failed', 'fields' => $errors]);
  exit;
}

// Compose email
$subject = 'Portfolio contact form — ' . $name;

$bodyText = "New message from your portfolio site\n\n"
  . "Name: {$name}\n"
  . "Email: {$email}\n"
  . ($portfolio ? "Portfolio: {$portfolio}\n" : '')
  . ($linkedin  ? "LinkedIn: {$linkedin}\n"   : '')
  . ($github    ? "GitHub: {$github}\n"       : '')
  . "\nMessage:\n{$message}\n";

$bodyHtml = nl2br(htmlentities($bodyText, ENT_QUOTES, 'UTF-8'));

// Send with PHPMailer
$sent = false;
$err  = null;

try {
  // Load PHPMailer (Composer)
  $autoload = __DIR__ . '/vendor/autoload.php';
  if (!file_exists($autoload)) {
    throw new Exception('PHPMailer is missing. Install via Composer in /api.');
  }
  require_once $autoload;

  $mail = new PHPMailer\PHPMailer\PHPMailer(true);
  $mail->isSMTP();
  $mail->Host       = SMTP_HOST;
  $mail->Port       = SMTP_PORT;
  $mail->SMTPAuth   = true;
  $mail->Username   = SMTP_USER;
  $mail->Password   = SMTP_PASS;
  $mail->SMTPSecure = SMTP_SECURE; // 'ssl' or 'tls'

  $mail->setFrom(FROM_EMAIL, FROM_NAME);
  $mail->addAddress(MAIL_TO);
  // So you can reply straight to the sender:
  $mail->addReplyTo($email, $name);

  $mail->Subject = $subject;
  $mail->isHTML(true);
  $mail->Body    = $bodyHtml;
  $mail->AltBody = $bodyText;

  // Optional metadata headers
  $mail->addCustomHeader('X-Portfolio-Form', 'contact');
  $mail->addCustomHeader('X-Sender-IP', $_SERVER['REMOTE_ADDR'] ?? 'unknown');

  $sent = $mail->send();

} catch (Throwable $e) {
  $err = $e->getMessage();
}

// Debug log (server-side)
if (DEBUG_LOG) {
  $log = [
    'time' => date('c'),
    'ok'   => $sent,
    'err'  => $err,
    'ip'   => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
    'ua'   => $_SERVER['HTTP_USER_AGENT'] ?? '',
  ];
  error_log(json_encode($log) . PHP_EOL, 3, '/tmp/contact.log');
}

if ($sent) {
  echo json_encode(['ok' => true]);
} else {
  http_response_code(500);
  echo json_encode(['error' => 'Email failed to send' . ($err ? ": $err" : '')]);
}
