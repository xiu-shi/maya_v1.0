# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

**Email**: info@janetxiushi.me

Please include:
- Description of the vulnerability
- Steps to reproduce (if applicable)
- Potential impact
- Any suggested fixes (optional)

We will respond within 48 hours and work with you to address the issue.

---

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

---

## Security Best Practices

This project follows industry-standard security practices:

- **Environment Variables**: Sensitive credentials are stored in environment variables, never in code
- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **HTTPS**: Production deployment uses HTTPS encryption
- **Security Headers**: Modern security headers are implemented (CSP, HSTS, etc.)
- **Dependency Scanning**: Regular security audits of dependencies

---

## Known Security Features

- API key protection via environment variables
- Request size limits
- CORS configuration
- Error sanitization (no sensitive data in error messages)
- Audit logging for monitoring

---

## Disclosure Policy

We follow responsible disclosure practices:
- Security issues are addressed promptly
- Fixes are deployed before public disclosure
- Credit is given to researchers who report issues responsibly

---

**Last Updated**: January 25, 2026

For general inquiries: info@janetxiushi.me  
Website: https://janetxiushi.me

