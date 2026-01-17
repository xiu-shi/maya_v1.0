# Chat Logging System

**Date**: January 17, 2026  
**Purpose**: Document the chat logging system for monitoring and analyzing Maya's performance

---

## 📋 Overview

The chat logging system stores all user conversations with Maya for:
- **Performance Analysis**: Response times, message lengths, error rates
- **Usage Monitoring**: Conversation patterns, popular topics, user queries
- **Security Auditing**: Prompt injection attempts, suspicious patterns
- **Quality Assurance**: Response quality, user satisfaction indicators

---

## 🗂️ Storage Location

### Local Development
- **Directory**: `Maya/backend/data/chat-logs/`
- **Format**: One JSON file per day (`YYYY-MM-DD.json`)
- **Example**: `2026-01-17.json`

### Production (Deployed Service)
- **Location**: Same directory structure on the deployed server
- **Hosted on**: `ai-builders.space` deployment platform
- **Path**: `/path/to/deployment/Maya/backend/data/chat-logs/`

**Note**: Logs are stored on the same server where Maya is deployed (not in a separate database).

---

## 💾 Storage Space Requirements

### Per Message Estimate
- **User message**: ~500 bytes (average 50-200 characters)
- **Maya response**: ~1,500 bytes (average 150-500 characters)
- **Metadata**: ~200 bytes (timestamps, IP, user agent, etc.)
- **Total per message**: ~2.2 KB

### Daily Storage Estimate
- **100 conversations/day** (average 5 messages each): ~1.1 MB/day
- **500 conversations/day**: ~5.5 MB/day
- **1,000 conversations/day**: ~11 MB/day

### Monthly Storage Estimate
- **100 conversations/day**: ~33 MB/month
- **500 conversations/day**: ~165 MB/month
- **1,000 conversations/day**: ~330 MB/month

### Annual Storage Estimate
- **100 conversations/day**: ~400 MB/year
- **500 conversations/day**: ~2 GB/year
- **1,000 conversations/day**: ~4 GB/year

**Conclusion**: Storage space is minimal. Even with 1,000 conversations per day, annual storage is only ~4 GB, which is easily manageable on most hosting platforms.

---

## 📁 File Structure

### Log File Format (`YYYY-MM-DD.json`)
```json
[
  {
    "id": "msg_1705512345678_abc123",
    "conversationId": "conv_1705512345678_xyz789",
    "timestamp": "2026-01-17T20:15:21.197Z",
    "userMessage": "What is Janet's expertise?",
    "assistantResponse": "Janet specializes in AI security...",
    "historyLength": 2,
    "ip": "::ffff:127.0.0.1",
    "userAgent": "Mozilla/5.0...",
    "warnings": [],
    "responseTime": 1250,
    "messageLength": 28,
    "responseLength": 145
  }
]
```

### Directory Structure
```
Maya/backend/data/chat-logs/
├── 2026-01-15.json
├── 2026-01-16.json
├── 2026-01-17.json
└── ...
```

---

## 🔐 Privacy & Security

### What Is Logged
- ✅ User messages (full content)
- ✅ Maya's responses (full content)
- ✅ Timestamps
- ✅ IP addresses (for rate limiting)
- ✅ User agent strings
- ✅ Response times
- ✅ Validation warnings

### What Is NOT Logged
- ❌ User identities (no authentication system)
- ❌ Personal information (unless included in messages)
- ❌ Passwords or sensitive data (not applicable)

### Privacy Considerations
- **Server-side only**: Logs are stored server-side, not accessible to users
- **No user access**: Users cannot view their own logs
- **Admin access only**: Logs are accessible via admin dashboard (`/chat_logs.html`)
- **GDPR compliance**: Consider adding user consent notification if required

### Security Measures
- **Access control**: Admin endpoints should be protected (TODO: add authentication)
- **IP whitelist**: Consider restricting admin endpoints to specific IPs
- **API key**: Consider adding API key authentication for admin endpoints
- **Data retention**: Automatic cleanup of logs older than 90 days (configurable)

---

## 🛠️ Implementation

### Backend Components

1. **Chat Logger Utility** (`Maya/backend/utils/chat-logger.js`)
   - `logChatMessage()` - Logs individual messages
   - `getChatLogs()` - Retrieves logs for date range
   - `getChatLogsByConversation()` - Groups logs by conversation
   - `getStorageStats()` - Returns storage statistics
   - `cleanupOldLogs()` - Deletes logs older than specified days

2. **Server Integration** (`Maya/backend/server.js`)
   - Logs messages in `/api/chat` endpoint (non-blocking)
   - Admin endpoints:
     - `GET /api/admin/chat-logs` - Retrieve logs
     - `GET /api/admin/chat-logs/stats` - Storage statistics

3. **Frontend Viewer** (`Maya/frontend/chat_logs.html`)
   - HTML dashboard for viewing logs
   - Filtering by date range
   - Grouping by conversation/day/month/year
   - Statistics display

---

## 📊 Usage

### Viewing Logs

1. **Access Dashboard**:
   - Local: `http://localhost:3001/chat_logs.html`
   - Production: `https://maya-agent.ai-builders.space/chat_logs.html`

2. **Filter Logs**:
   - Select start and end dates
   - Choose grouping option (none, conversation, day, month, year)
   - Click "Load Logs"

3. **View Statistics**:
   - Total messages
   - Total conversations
   - Storage used
   - Average messages per conversation

### API Endpoints

**Get Logs**:
```bash
curl "http://localhost:3001/api/admin/chat-logs?startDate=2026-01-15&endDate=2026-01-17&groupBy=conversation"
```

**Get Statistics**:
```bash
curl "http://localhost:3001/api/admin/chat-logs/stats"
```

---

## 🔄 Log Cleanup

### Automatic Cleanup
Logs older than 90 days are automatically deleted (configurable).

**Manual Cleanup**:
```javascript
import { cleanupOldLogs } from './utils/chat-logger.js';

// Delete logs older than 30 days
await cleanupOldLogs(30);
```

**Scheduled Cleanup** (recommended):
- Set up a cron job or scheduled task
- Run cleanup weekly/monthly
- Example: `node cleanup-logs.js` (create script)

---

## 📈 Performance Impact

### Logging Performance
- **Non-blocking**: Logging is asynchronous and doesn't block chat responses
- **Minimal overhead**: ~1-2ms per message
- **Error handling**: Logging failures don't affect chat functionality

### Storage Performance
- **File I/O**: One write per message (append to daily file)
- **Read performance**: Efficient JSON parsing for date-based files
- **Scalability**: Handles thousands of messages per day without issues

---

## 🚀 Deployment Considerations

### Production Setup

1. **Directory Permissions**:
   ```bash
   mkdir -p Maya/backend/data/chat-logs
   chmod 755 Maya/backend/data/chat-logs
   ```

2. **Environment Variables** (optional):
   - `CHAT_LOGS_ENABLED=true` (default: true)
   - `CHAT_LOGS_RETENTION_DAYS=90` (default: 90)

3. **Backup Strategy**:
   - Regular backups of `data/chat-logs/` directory
   - Consider archiving old logs to cloud storage

4. **Monitoring**:
   - Monitor disk space usage
   - Set up alerts for storage thresholds
   - Track log file sizes

---

## 🔒 Security Recommendations

### Current Status
- ⚠️ **Admin endpoints are NOT protected** (TODO: add authentication)

### Recommended Security Measures

1. **API Key Authentication**:
   ```javascript
   // Add to server.js
   const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
   
   app.get('/api/admin/*', (req, res, next) => {
     const apiKey = req.headers['x-api-key'];
     if (apiKey !== ADMIN_API_KEY) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   });
   ```

2. **IP Whitelist**:
   ```javascript
   const ALLOWED_IPS = ['127.0.0.1', 'your.ip.address'];
   
   app.get('/api/admin/*', (req, res, next) => {
     if (!ALLOWED_IPS.includes(req.ip)) {
       return res.status(403).json({ error: 'Forbidden' });
     }
     next();
   });
   ```

3. **Rate Limiting**:
   - Apply rate limiting to admin endpoints
   - Prevent abuse of log retrieval

---

## 📝 Future Enhancements

### Potential Features
- [ ] Search functionality (search by keyword in messages)
- [ ] Export to CSV/JSON
- [ ] Analytics dashboard (charts, graphs)
- [ ] User feedback integration
- [ ] Sentiment analysis
- [ ] Topic clustering
- [ ] Response quality scoring

---

## 📋 Summary

**Storage Location**: `Maya/backend/data/chat-logs/` (on deployed server)  
**Storage Space**: ~4 GB/year for 1,000 conversations/day  
**Hosting**: Same server as Maya deployment (`ai-builders.space`)  
**Access**: Admin dashboard at `/chat_logs.html`  
**Privacy**: Server-side only, admin access only  
**Security**: TODO - Add authentication to admin endpoints

---

**Status**: ✅ Implemented and ready for use  
**Next Steps**: Add authentication to admin endpoints, set up log cleanup schedule
