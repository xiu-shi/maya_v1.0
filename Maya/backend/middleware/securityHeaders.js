/**
 * Security Headers Middleware
 * 
 * Adds security headers to all responses
 */

import helmet from 'helmet';
import config from '../config/env.js';

/**
 * Security headers configuration
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Allow inline styles
        "https://fonts.googleapis.com" // Google Fonts
      ],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'", // Allow inline scripts (needed for chat functionality)
        "https://www.googletagmanager.com" // Google Tag Manager
      ],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://www.googletagmanager.com", // Google Tag Manager
        "https://*.google-analytics.com", // Google Analytics (all regions)
        "https://*.analytics.google.com", // Google Analytics (regional endpoints)
        "https://space.ai-builders.com" // AI Builders API
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com", // Google Fonts
        "data:" // Data URIs for fonts
      ],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // May need to adjust for frontend
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  dnsPrefetchControl: true,
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
});

/**
 * Additional custom security headers
 */
export function customSecurityHeaders(req, res, next) {
  // X-Content-Type-Options
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options (redundant with helmet, but explicit)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Permissions-Policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // HTTPS redirect in production
  if (config.isProduction && config.enableHttpsRedirect) {
    if (req.protocol === 'http') {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
  }
  
  next();
}

