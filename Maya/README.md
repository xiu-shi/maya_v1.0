# Maya - Janet's Digital Twin

ChatGPT-like interface for Janet Xiu Shi's Digital Twin, powered by AI Builders MCP server.

## 📚 Documentation

**👉 [Complete Implementation Documentation](./Implementation.md)** - All progress, timestamps, security, and testing details

## 🚀 Quick Start

### Backend

```bash
cd Maya/backend
npm install
cp .env.example .env
# Edit .env and add your AI_BUILDER_TOKEN
npm start
```

### Restart Backend Server

```bash
cd Maya/backend
./stop.sh && ./start.sh
```

### Frontend

Open in browser: `http://localhost:3001/maya.html`

## 📋 Project Structure

```
Maya/
├── frontend/          # Frontend files
├── backend/           # Backend API server
├── tests/             # Test files
├── Implementation.md  # Complete documentation
└── README.md          # This file
```

## ✅ Status

**Status**: ✅ Fully Functional  
**Last Updated**: January 11, 2026, 20:03 GMT

**Recent Updates** (January 11, 2026):
- ✅ **Test Driven Development Journey** - 444 tests across 28 suites (increased from 394 tests, 26 suites)
- ✅ **Dynamic Test Counts System** - Eliminated all hardcoded test counts, single source of truth
- ✅ **Button Confirmation Dialog Fix** - Fixed browser compatibility issues (Firefox/Chrome)
- ✅ **Critical Security Fixes** - Error Log Information Leakage (Issue #15)
  - Error messages limited to 100 characters (reduced from 500)
  - Console statements gated behind development mode (53 instances)
  - File paths removed from error display (generic identifiers only)
  - Assertion pattern extraction removed (generic categories only)
  - Risk reduced from HIGH to LOW
- ✅ **Error Log Sanitization & Security Logging** (Issue #11)
- ✅ **E2E Dashboard Metrics** - Fully dynamic, traceable, auditable (Issue #12)
- ✅ **KB Cache & Memory Management** system implemented
- ✅ **Comprehensive evaluation system** for quality assurance
- ✅ **Transparency and explainability** features

**Key Features**:
- **Trust & Confidence**: KB system evaluated continuously for accuracy
- **Transparency**: Maya explains KB usage and accuracy
- **Performance**: Optimized caching and response times
- **Memory Safety**: Efficient memory usage
- **KB Accuracy**: Validation and integrity checks ensure reliable responses

See [Implementation.md](./Implementation.md) for complete details.


