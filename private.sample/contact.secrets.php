<?php
// /home/<sg-user>/private/contact.secrets.php
return [
  'SMTP_HOST'   => 'mail.janetxiushi.me',  // SiteGround "Outgoing server"
  'SMTP_PORT'   => 465,                    // 465=SSL (or 587 for TLS)
  'SMTP_SECURE' => 'ssl',                  // 'ssl' or 'tls'
  'SMTP_USER'   => 'info@janetxiushi.me',
  'SMTP_PASS'   => 'YOUR_MAILBOX_PASSWORD',
  'MAIL_TO'     => 'info@janetxiushi.me',
  'FROM_EMAIL'  => 'info@janetxiushi.me',
  'FROM_NAME'   => 'Portfolio Contact',
  // Optional:
  'ALLOW_ORIGIN'=> 'https://janetxiushi.me', // if you need cross-origin POSTs
  'DEBUG_LOG'   => true,                     // turn off after testing
];
