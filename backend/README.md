# Maya MCP Backend

Backend API server for Maya's Digital Twin chat interface using AI Builders MCP server.

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your AI_BUILDER_TOKEN
   nano .env  # or use your preferred editor
   ```

3. **Test MCP Connection**
   ```bash
   npm run discover
   ```

4. **Start Server** (when implemented)
   ```bash
   npm start
   ```

## Security

All security measures are documented in `../SECURITY.md`. Key features:

- ✅ API key protection via environment variables
- ✅ Input validation and sanitization
- ✅ Rate limiting (20 requests per 15 minutes)
- ✅ CORS configuration
- ✅ Security headers (Helmet.js)
- ✅ Secure error handling
- ✅ Audit logging

## Project Structure

```
backend/
├── config/
│   └── env.js              # Environment configuration
├── middleware/
│   ├── audit.js            # Audit logging
│   ├── cors.js             # CORS configuration
│   ├── errorHandler.js     # Error handling
│   ├── rateLimit.js        # Rate limiting
│   ├── securityHeaders.js  # Security headers
│   └── validation.js       # Input validation
├── scripts/
│   └── discover-mcp.js     # MCP discovery script
├── utils/
│   ├── logger.js           # Secure logging
│   └── sanitize.js         # Input sanitization
├── server.example.js        # Example server implementation
├── package.json
└── README.md
```

## Environment Variables

See `.env.example` for all available configuration options.

**Required:**
- `AI_BUILDER_TOKEN` - Your AI Builders API token

**Optional:**
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window

## Development

### Testing MCP Connection

```bash
npm run discover
```

This will:
- Connect to the MCP server
- Discover available tools
- Save results to `../mcp-discovery-results.json`

### Running the Server

Once `server.js` is implemented:

```bash
npm start
```

The server will:
- Validate environment variables
- Start on the configured PORT
- Apply all security middleware
- Log startup information

## Security Checklist

Before deploying to production:

- [ ] `.env` file created with real values
- [ ] `.env` file is in `.gitignore` (should be automatic)
- [ ] `ALLOWED_ORIGINS` configured for production domains
- [ ] `NODE_ENV=production` set
- [ ] HTTPS enabled (`ENABLE_HTTPS_REDIRECT=true`)
- [ ] Rate limits reviewed and adjusted if needed
- [ ] Security headers tested
- [ ] Error handling tested
- [ ] Audit logs configured

## Troubleshooting

### "AI_BUILDER_TOKEN is required"
- Make sure `.env` file exists in the `backend/` directory
- Check that `AI_BUILDER_TOKEN` is set in `.env`
- Verify `.env` file is not in `.gitignore` (it should be, but check it exists)

### "CORS policy violation"
- Add your frontend origin to `ALLOWED_ORIGINS` in `.env`
- Check that the origin matches exactly (including protocol and port)

### Rate limit errors
- Check `RATE_LIMIT_MAX_REQUESTS` and `RATE_LIMIT_WINDOW_MS` in `.env`
- Adjust limits if needed for your use case

## Resources

- [Security Documentation](../SECURITY.md)
- [Project Progress Documentation](../PROJECT_PROGRESS.md)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)



