# Local Development vs Production KB Setup

**Date**: January 6, 2025  
**Purpose**: Clarify KB setup for local development vs production

---

## Quick Answer: NO Upload Needed for Local Development

### ✅ Local Development
- **Use local filesystem** - Files in `Maya/knowledge/` folder
- **No cloud storage needed** - Just work with files on your computer
- **Backend reads directly from local filesystem**

---

## Local Development Setup

### Step 1: Organize Files Locally

**Create folder structure**:
```bash
cd Maya/knowledge
mkdir -p docs/{bio,expertise,experience,case-studies,context,google-docs}
mkdir -p pdfs/{publications,presentations}
mkdir -p config
```

**Your local structure**:
```
Maya/knowledge/
├── docs/
│   ├── bio/
│   │   └── janet-bio.md          # ← Add your files here
│   ├── expertise/
│   │   ├── ai-security.md        # ← Add your files here
│   │   └── digital-transformation.md
│   ├── experience/
│   │   ├── workday.md
│   │   └── huawei.md
│   └── google-docs/
│       └── doc-001.md            # ← Google Docs references
├── pdfs/                          # ← PDFs go here (gitignored)
│   └── resume.pdf
├── config/
│   └── priorities.json           # ← Create this
└── README.md
```

### Step 2: Add Your Documents

**Just add files locally** - No upload needed!

```bash
# Example: Add a bio document
cd Maya/knowledge/docs/bio
# Create janet-bio.md or copy your file here

# Example: Add PDF
cd Maya/knowledge/pdfs
# Copy your PDF here (will be gitignored)
```

### Step 3: Create Priorities Config

**Create `Maya/knowledge/config/priorities.json`**:
```json
{
  "high": [
    "docs/bio/janet-bio.md",
    "docs/expertise/ai-security.md",
    "docs/expertise/digital-transformation.md"
  ],
  "medium": [
    "docs/experience/workday.md",
    "docs/experience/huawei.md"
  ],
  "low": [
    "docs/context/irish-market.md"
  ]
}
```

### Step 4: Configure Backend for Local KB

**Backend Configuration**:
```bash
# Backend automatically reads from local filesystem
# No special configuration needed for local development
# KB files are loaded from Maya/knowledge/ directory
```

### Step 5: Test Locally

```bash
cd Maya/backend
npm start
# Backend will read from local filesystem
```

---

## How It Works

### Local Development Flow

```
┌─────────────────┐
│  Maya Backend   │
│  (localhost)    │
└────────┬────────┘
         │
         │ Reads from local filesystem
         ▼
┌─────────────────┐
│  knowledge/     │ ← Your local files
│  ├── docs/      │
│  ├── pdfs/      │
│  └── config/    │
└─────────────────┘
```

**KB Loader Logic**:
```javascript
// backend/utils/kb-loader.js
// Reads from local filesystem
const content = await readFile('knowledge/docs/bio/janet-bio.md');
```

---

## Production Deployment

**Note**: Current implementation uses local filesystem for both development and production. KB files are included in the repository and loaded directly from the filesystem.

**For Production**:
- KB files are committed to the repository
- Backend reads from local filesystem (same as development)
- No cloud storage setup required

---

## Development Workflow

### Daily Development

1. **Edit files locally** in `Maya/knowledge/docs/`
2. **Test locally** - Backend reads from local files
3. **Commit to git** - Markdown files are version controlled
4. **No S3 needed** - Everything works locally

### Before Production Deployment

1. **Organize files** - Make sure everything is in right folders
2. **Test locally** - Verify KB loading works
3. **Commit to git** - KB files are version controlled
4. **Deploy** - Backend reads from filesystem (same as development)

### After Production Deployment

1. **Update files locally** - Edit in `Maya/knowledge/docs/`
2. **Test locally** - Verify changes
3. **Commit to git** - Version control
4. **Deploy** - Backend automatically picks up new KB content

---

## File Organization

### What Goes Where?

#### ✅ Commit to Git (Version Controlled)
```
Maya/knowledge/
├── docs/              # ← Markdown files (committed)
│   ├── bio/
│   ├── expertise/
│   └── ...
├── config/            # ← Config files (committed)
│   └── priorities.json
└── README.md          # ← Documentation (committed)
```

#### ❌ Don't Commit (Gitignored)
```
Maya/knowledge/
├── pdfs/              # ← PDFs (gitignored)
└── embeddings/        # ← Embeddings (gitignored)
```

**Update `.gitignore`**:
```
Maya/knowledge/pdfs/
Maya/knowledge/embeddings/*.json
Maya/knowledge/processed/*.pdf
```

---

## Example: Adding a New Document

### Local Development

1. **Create file locally**:
```bash
cd Maya/knowledge/docs/expertise
vim ai-security.md
```

2. **Add content**:
```markdown
# AI Security Expertise

## Summary
Janet specializes in AI security...

## Key Points
- Point 1
- Point 2
```

3. **Update priorities**:
```json
// knowledge/config/priorities.json
{
  "high": [
    "docs/expertise/ai-security.md"  // ← Add here
  ]
}
```

4. **Test locally**:
```bash
cd Maya/backend
npm start
# Backend reads from local file
```

5. **Commit to git**:
```bash
git add Maya/knowledge/docs/expertise/ai-security.md
git commit -m "Add AI security expertise doc"
```

### Production Deployment

1. **Commit to git**:
```bash
git add Maya/knowledge/docs/expertise/ai-security.md
git commit -m "Add AI security expertise doc"
git push
```

2. **Deploy**:
```bash
# Backend will read from filesystem (same as development)
# No additional steps needed
```

---

## Checklist

### Local Development Setup
- [ ] Create folder structure (`docs/`, `pdfs/`, `config/`)
- [ ] Add your documents to `docs/` folders
- [ ] Create `config/priorities.json`
- [ ] Test KB loading locally
- [ ] Commit markdown files to git

### Production Setup
- [ ] Commit KB files to repository
- [ ] Deploy backend (KB files included)
- [ ] Backend reads from filesystem (same as development)
- [ ] No additional cloud storage setup needed

---

## Common Questions

### Q: Do I need cloud storage for local development?
**A**: No! Use local filesystem. Backend reads directly from `Maya/knowledge/` folder.

### Q: What files should I commit to git?
**A**: Markdown files in `docs/` and config files. Don't commit PDFs or embeddings.

### Q: How does production work?
**A**: Same as development - backend reads from filesystem. KB files are included in the repository.

### Q: Can I use cloud storage in the future?
**A**: Yes, cloud storage integration can be added later if needed. Current implementation uses local filesystem for simplicity.

---

## Summary

### ✅ For Local Development
- **Use local filesystem** - Files in `Maya/knowledge/`
- **No cloud storage needed** - Just work with local files
- **Backend reads from local files** - Automatic
- **Commit markdown files** - Version control your KB

### ✅ For Production
- **Same as development** - Backend reads from filesystem
- **KB files in repository** - Included in deployment
- **No additional setup** - Works out of the box

### 🎯 Workflow
1. **Develop locally** - Edit files in `knowledge/` folder
2. **Test locally** - Backend reads from local files
3. **Commit to git** - Version control
4. **Deploy** - Backend reads from filesystem (same as development)

---

**Key Takeaway**: For local development, just add files to `Maya/knowledge/docs/` folder. Backend reads directly from the filesystem - no cloud storage needed!

---

**Status**: ✅ Ready for Local Development  
**Last Updated**: January 9, 2026, 23:55


