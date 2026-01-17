# Leveraging Cursor Rules & Commands for Maya Production

**Date**: January 6, 2025  
**Last Updated**: January 9, 2026, 22:00  
**Purpose**: Translate Cursor IDE rules into production guardrails for Maya

---

## Understanding Cursor Rules & Commands

### What They Are

**Cursor Rules**:
- IDE-specific guidelines that help Cursor's AI understand your project
- Stored in `.cursorrules` file (project-level) or user settings (global)
- Guide AI behavior during development (code suggestions, refactoring, etc.)
- **Only work in Cursor IDE** - not in production

**Cursor Commands**:
- Custom commands you can run in Cursor IDE
- Stored in `~/.cursor/commands` or `~/.claude/commands`
- Reusable workflows for development tasks
- **Only work in Cursor IDE** - not in production

### Key Limitation

⚠️ **Cursor Rules/Commands are IDE-only features**  
- They don't run in production
- They don't affect Maya's responses to end users
- They only guide AI assistance during development

---

## How to Leverage Them for Production

### Strategy: Extract Principles → Implement in Maya

**The Good News**: You can extract the **principles** from Cursor Rules and implement them as **production guardrails** in Maya's system prompt and KB.

---

## Translation Strategy

### 1. Cursor Rules → Maya System Prompt

#### Example Cursor Rule:
```
When writing responses as Maya:
- Keep responses under 200 words
- Use bullet points for lists
- Always mention Janet's expertise areas
- Never include internal reasoning
```

#### Translated to Maya System Prompt:
```javascript
// In backend/mcp-client.js
const MAYA_SYSTEM_PROMPT = `You are Maya, Janet Xiu Shi's digital twin...

RESPONSE GUIDELINES:
- Keep responses under 200 words
- Use bullet points for lists (3-5 items max)
- Always mention Janet's expertise areas when relevant
- Never include internal reasoning or thinking process
...`;
```

### 2. Cursor Rules → KB Structure

#### Example Cursor Rule:
```
Maya should prioritize:
1. Janet's bio and background
2. AI security expertise
3. Digital transformation experience
```

#### Translated to KB Config:
```json
// knowledge/config/priorities.json
{
  "high": [
    "bio/janet-bio.md",
    "expertise/ai-security.md",
    "expertise/digital-transformation.md"
  ]
}
```

### 3. Cursor Commands → Production Scripts

#### Example Cursor Command:
```
Command: "test-maya-response-length"
Description: Test if Maya's response is under 250 words
```

#### Translated to Production Test:
```javascript
// Note: Response length testing is part of KB response accuracy tests
// See: tests/integration_tests/kb-response-accuracy.test.js
test('Maya responses should be under 250 words', async () => {
  const response = await chatWithMaya('Tell me about Janet');
  const wordCount = response.split(/\s+/).length;
  expect(wordCount).toBeLessThan(250);
});
```

---

## Recommended Cursor Rules for Maya

### Create `.cursorrules` File

Create this file in your project root (`.cursorrules`):

```markdown
# Maya Digital Twin - Cursor Rules

## Project Context
This is Maya, Janet Xiu Shi's digital twin - a ChatGPT-like interface powered by AI Builders API.

## Response Guidelines (for Maya)
When working on Maya's system prompt or response handling:
- Responses must be 100-250 words (prefer 150 words)
- Use bullet points for lists (3-5 items max)
- Be conversational and friendly
- Never include internal reasoning
- Always mention Janet's expertise areas when relevant

## Knowledge Base Structure
- Documents in `Maya/knowledge/docs/` organized by category
- High-priority docs: bio, main expertise areas
- PDFs stored in `Maya/knowledge/pdfs/` (gitignored)
- Google Docs referenced via markdown files

## Code Style
- Use ES modules (import/export)
- Follow existing error handling patterns
- Log errors with context
- Use async/await, not callbacks

## Security
- Never expose AI_BUILDER_TOKEN
- Validate all user inputs
- Sanitize responses
- Rate limit API endpoints

## Testing
- All tests in `Maya/tests/`
- Run tests before committing
- Test response lengths
- Test security measures
```

### Create User Commands

Create `~/.cursor/commands/maya-test.md`:

```markdown
# Test Maya Response Length

Test if Maya's response is within word limit.

```bash
cd Maya/backend
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about Janet", "history": []}' \
  | python3 -c "import sys, json; data=json.load(sys.stdin); words=len(data['response'].split()); print(f'Word count: {words}')"
```
```

---

## Production Implementation

### What Happens in Production?

**Cursor Rules/Commands**: ❌ **Don't run** - IDE-only

**Maya's Production Guardrails**: ✅ **Do run** - Implemented in code

### Production Guardrails (What Actually Runs)

#### 1. System Prompt (Primary Guardrail)
**File**: `Maya/backend/mcp-client.js`
- Contains response guidelines
- Enforced by AI model
- **This is what runs in production**

#### 2. Token Limits (Hard Limit)
**File**: `Maya/backend/mcp-client.js`
```javascript
max_tokens: 300  // Hard limit enforced by API
```

#### 3. Post-Processing (Safety Net)
**File**: `Maya/backend/mcp-client.js`  
**Implemented**: January 6, 2025 (from QUICK_START_KB.md)

**Truncation Function**:
```javascript
function truncateResponse(content, maxWords = 250) {
  if (!content || typeof content !== 'string') {
    return content;
  }
  
  const words = content.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return content;
  }
  
  // Truncate at sentence boundary
  const truncated = words.slice(0, maxWords).join(' ');
  const lastPeriod = truncated.lastIndexOf('.');
  const lastExclamation = truncated.lastIndexOf('!');
  const lastQuestion = truncated.lastIndexOf('?');
  
  const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
  
  if (lastSentenceEnd > maxWords * 0.7) {
    return truncated.substring(0, lastSentenceEnd + 1) + 
           '\n\n[Response truncated for brevity. Would you like more details on a specific aspect?]';
  }
  
  return truncated + '...\n\n[Response truncated. Feel free to ask for more details!]';
}
```

**Application**:
```javascript
content = cleanResponse(content);
content = truncateResponse(content, 250); // Max 250 words
```

**Configuration** (from QUICK_START_KB.md):
```javascript
temperature: 0.3, // Lower temperature for more focused, consistent responses
max_tokens: 300  // Changed from 1000 (300 tokens ≈ 225 words)
```

#### 4. KB Context (Dynamic Guardrails)
**File**: `Maya/backend/mcp-client.js` (future)
```javascript
const KB_CONTEXT = await loadKBContext(); // Load from knowledge base
```

#### 5. Input Validation (Security Guardrails)
**File**: `Maya/backend/middleware/validation.js`
- Validates user input
- Prevents prompt injection
- Enforces message length limits

#### 6. Response Guardrails (Information Leakage Prevention)
**File**: `Maya/backend/utils/response-guardrails.js`  
**Implemented**: January 9, 2026
- Automatically detects and sanitizes sensitive information in responses
- Prevents leakage of KB KPIs, metrics, cache performance
- Prevents leakage of architecture, design patterns, implementation details
- Prevents leakage of IP and proprietary information
- Pattern matching identifies and blocks sensitive content before sending to users
- **This is what runs in production** - automatic protection against information leakage

#### 7. Timeout Protection (Hang Prevention)
**File**: `Maya/backend/utils/timeout.js`  
**Implemented**: January 9, 2026
- Wraps all async operations with timeout protection
- Prevents server hangs from blocking operations
- Prevents AI assistant hangs during bulk file operations
- Default timeouts: KB_LOAD (30s), FILE_READ (5s), MODULE_IMPORT (10s)
- **This is what runs in production** - prevents hangs and improves reliability

#### 8. KB Cache & Evaluation System
**Files**: `Maya/backend/utils/memory_cache/kb-cache.js`, `kb-monitor.js`  
**Implemented**: January 9, 2026
- In-memory caching with TTL and checksum validation
- 8 KPI evaluation system ensures cache and memory performance
- Memory management with limits and monitoring
- Automatic cache refresh and validation
- **This is what runs in production** - ensures KB accuracy and performance

---

## Workflow: Development → Production

### Step 1: Define Rules in Cursor (Development)

1. **Create `.cursorrules`** with guidelines
2. **Test in Cursor IDE** - See how AI follows rules
3. **Refine rules** based on results

### Step 2: Translate to Production Code

1. **Extract key principles** from `.cursorrules`
2. **Update system prompt** in `mcp-client.js`
3. **Add validation** in middleware
4. **Create KB structure** based on priorities

### Step 3: Test Production Guardrails

1. **Test locally** - `npm start` and test responses
2. **Verify word counts** - Check response lengths
3. **Test edge cases** - Long questions, complex topics
4. **Monitor logs** - Check for violations

### Step 4: Deploy to Production

1. **Deploy backend** - Railway/Render
2. **Deploy KB** - Git (markdown) + Cloud (PDFs)
3. **Monitor production** - Check response lengths
4. **Iterate** - Update rules based on real usage

---

## Example: Complete Translation

### Cursor Rule (Development)
```markdown
# .cursorrules

Maya Response Rules:
- Max 200 words
- Use bullet points for expertise areas
- Always mention Janet's contact form if user asks for more info
- Never include internal reasoning
```

### Production Implementation

#### 1. System Prompt (`mcp-client.js`)
```javascript
const MAYA_SYSTEM_PROMPT = `You are Maya...

RESPONSE GUIDELINES:
- Keep responses under 200 words
- Use bullet points for expertise areas (3-5 items max)
- Always mention Janet's Contact Form if user asks for more information
- Never include internal reasoning or thinking process
...`;
```

#### 2. Token Limit (`mcp-client.js`)
```javascript
max_tokens: 300  // Enforces ~225 words max
```

#### 3. Truncation (`mcp-client.js`)
```javascript
content = truncateResponse(content, 200); // Safety net
```

#### 4. KB Priority (`config/priorities.json`)
```json
{
  "high": [
    "expertise/ai-security.md",
    "expertise/digital-transformation.md"
  ]
}
```

#### 5. Validation (`middleware/validation.js`)
```javascript
if (message.length > 2000) {
  throw new Error('Message too long');
}
```

---

## Best Practices

### ✅ Do This

1. **Use Cursor Rules** to define principles during development
2. **Translate rules** to production code (system prompt, validation)
3. **Test locally** before deploying
4. **Monitor production** and iterate

### ❌ Don't Do This

1. **Don't assume** Cursor Rules run in production
2. **Don't rely** on IDE features for production guardrails
3. **Don't skip** translating rules to production code
4. **Don't forget** to test production guardrails

---

## Recommended Cursor Rules for Maya

### Project Rules (`.cursorrules`)

```markdown
# Maya Digital Twin - Development Rules

## Response Guidelines
When working on Maya's responses:
- Target: 100-150 words for simple questions
- Maximum: 200-250 words for complex topics
- Use bullet points for lists (3-5 items)
- Be conversational and friendly
- Never include internal reasoning

## Knowledge Base
- Documents in `Maya/knowledge/docs/`
- Organize by category: bio, expertise, experience, case-studies
- High-priority docs: bio, main expertise areas
- PDFs in `pdfs/` folder (gitignored)

## Code Standards
- Use ES modules (import/export)
- Follow existing error handling patterns
- Log errors with full context
- Use async/await consistently (never use blocking operations)
- Wrap all async operations with timeout protection
- Use lazy loading to prevent startup hangs
- Implement response guardrails for all AI responses

## Security
- Never expose AI_BUILDER_TOKEN
- Validate all inputs
- Sanitize responses (response guardrails prevent information leakage)
- Rate limit endpoints
- Implement response guardrails to prevent prompt injection and information leakage
- Test for jailbreak attempts and architecture leakage

## Testing
- Test response lengths
- Test security measures (prompt injection, jailbreak, architecture leakage)
- Test KB integration and accuracy
- Test documentation integrity (markdown references)
- Test hang prevention (timeout utilities)
- Test KB cache and memory management
- Run tests before committing
```

### User Commands (`~/.cursor/commands/`)

#### `maya-test-response.md`
```markdown
# Test Maya Response

Test Maya's response length and quality.

```bash
cd Maya/backend
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "{{input:message}}", "history": []}' \
  | python3 -m json.tool
```
```

#### `maya-restart.md`
```markdown
# Restart Maya Server

Stop and restart Maya backend server.

```bash
cd Maya/backend && ./stop.sh && ./start.sh
```
```

#### `maya-test-length.md`
```markdown
# Test Response Length

Check if Maya's response is within word limit.

```bash
cd Maya/backend
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me about Janet", "history": []}' \
  | python3 -c "import sys, json; data=json.load(sys.stdin); words=len(data['response'].split()); print(f'✅ Word count: {words}' if words < 250 else f'❌ Word count: {words} (too long)')"
```
```

---

## Summary

### Cursor Rules/Commands
- ✅ **Use for development** - Guide AI assistance in IDE
- ❌ **Don't run in production** - IDE-only features
- ✅ **Extract principles** - Translate to production code

### Production Guardrails
- ✅ **System prompt** - Primary guardrail (runs in production)
- ✅ **Token limits** - Hard limit enforced by API
- ✅ **Post-processing** - Truncation safety net
- ✅ **KB structure** - Dynamic context injection
- ✅ **Validation** - Security and input checks
- ✅ **Response guardrails** - Automatic information leakage prevention (January 9, 2026)
- ✅ **Timeout protection** - Hang prevention for all async operations (January 9, 2026)
- ✅ **KB cache & evaluation** - Performance and accuracy monitoring (January 9, 2026)

### Workflow
1. **Define** rules in Cursor (`.cursorrules`)
2. **Translate** to production code (`mcp-client.js`, middleware)
3. **Test** locally before deploying
4. **Deploy** and monitor production
5. **Iterate** based on real usage

---

## Next Steps

1. **Create `.cursorrules`** file with Maya guidelines
2. **Create Cursor commands** for testing
3. **Implement production guardrails** (system prompt, truncation)
4. **Test** both development and production
5. **Deploy** and monitor

---

**Key Takeaway**: Cursor Rules help you **develop** Maya, but production guardrails must be **implemented in code** that runs on your server.

---

## Recent Implementations (January 9, 2026)

### Response Guardrails
- **File**: `backend/utils/response-guardrails.js`
- **Purpose**: Prevent information leakage (KB KPIs, architecture, code, IP)
- **Implementation**: Automatic pattern matching and sanitization
- **Testing**: `tests/model_test/prompt-injection.test.js`, `jailbreak.test.js`, `architecture-leakage.test.js`

### Hang Prevention
- **File**: `backend/utils/timeout.js`
- **Purpose**: Prevent server and AI assistant hangs
- **Implementation**: Timeout wrappers for all async operations
- **Testing**: `tests/unit_tests/backend/timeout.test.js`, `tests/performance_tests/timeout-stress.test.js`

### KB Cache & Evaluation System
- **Files**: `backend/utils/memory_cache/kb-cache.js`, `kb-monitor.js`
- **Purpose**: Ensure KB accuracy and performance
- **Implementation**: In-memory caching with 8 KPI evaluation
- **Testing**: `tests/knowledge_tests/kb-cache.test.js`, `tests/knowledge_tests/kb-cache-performance.test.js`, `tests/knowledge_tests/kb-cache-eval.test.js`

### Documentation Integrity
- **File**: `tests/knowledge_tests/markdown-reference-integrity.test.js`
- **Purpose**: Prevent broken links and missing references
- **Implementation**: Automated testing of all markdown references
- **Run**: `npm test tests/knowledge_tests/markdown-reference-integrity.test.js`

### Test Structure Organization
- **Location**: `tests/` directory
- **Structure**: `knowledge_tests/`, `model_test/`, `documentation/`, `performance/`, `security/`, `unit/`, `integration/`
- **Documentation**: `tests/TESTING_GUIDE.md`, `tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md`

---

**Last Updated**: January 9, 2026, 22:00


