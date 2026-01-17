# Janet's Documentation Review SOP

**Purpose**: Standard Operating Procedure for reviewing and maintaining documentation quality

**When to Use**: When reviewing, cross-checking, validating, or reviewing documentation, .md files, file naming conventions, or folder structure changes

**Command**: "run Janet's docs review SOP" = execute all 9 steps

---

## The 9-Step Process

### 1. Review Criteria
- **Relevance**: Is it still current or outdated?
- **Overlaps**: Is content duplicated elsewhere?
- **Outdated Info**: References to removed files, old paths, unimplemented features?
- **Status**: Recommendation/plan not implemented? Historical snapshot? One-time task already done?

### 2. Action Decision
- **Remove** if: Outdated recommendations, historical snapshots, completed one-time tasks, temporary analysis files
- **Update** if: Partially outdated but still relevant, has outdated references, needs date/path updates
- **Keep** if: Still relevant and provides unique value

### 3. When Removing
- Capture historical essence in Implementation Timeline (`tests/knowledge_tests/KB_MANAGEMENT_STRATEGY.md`):
  - Date and purpose
  - What was planned/done
  - Why removed
  - Learnings
- Update `markdown-reference-integrity.test.js`:
  - Add to `oldFiles` list
  - Add to `mergedFileMappings` (map to where content went)
  - Add to `excludedFiles` if it's a historical report

### 4. When Updating
- Remove outdated references (e.g., S3, removed files)
- Update dates
- Update paths if structure changed
- Fix broken links
- Reflect current implementation

### 5. Global Updates
- Update all references to removed files
- Update test tracking files
- Ensure no broken links
- Update dates where relevant

### 6. Documentation Consolidation
- Merge overlapping content into consolidated files
- Categorize by topic/implementation timeline
- Remove redundant files
- Update all global references
- **Overlap Detection**: If there are more than 50% overlapping content in 2 or more files, prompt the user:
  - Identify files A, B, C (or more) with >50% overlap
  - Propose consolidation: "We could potentially consolidate file A, B, and C together into D"
  - Ask for user's permission: "Would you like to consolidate these files? This will remove files A, B, and C and create/update file D"
  - **Wait for explicit user confirmation before proceeding**
  - If user confirms: Follow Steps 3-8 (capture historical essence, update tests, consolidate files, verify tests)
  - If user declines: Document why files are kept separately and ensure they're not flagged as redundant in future reviews

### 7. Cross-Reference Check & Test
- **Scope**: This SOP applies to **both files AND folders** naming conventions and structure changes
- Ensure no broken links
- Ensure no broken references
- **Run all relevant tests** (e.g., `markdown-reference-integrity.test.js`)
- **Special Attention for Folder Renaming**:
  - **Folder structure renaming requires EXTRA care** - impacts are broader than file renaming
  - **Comprehensive reference checking**: Update ALL references across the entire codebase:
    - Import/export statements in code files
    - Test file paths and test suite configurations
    - Documentation references (markdown links, code references)
    - Configuration files (package.json, jest.config.js, etc.)
    - Build scripts and deployment configurations
    - Any hardcoded paths or directory references
  - **Verify test coverage**: Ensure tests themselves are updated and still function correctly
  - **Cross-platform compatibility**: Verify paths work on different operating systems if applicable
- **If tests are failing**:
  1. **Document failures**: List all failing tests, error messages, and affected files
  2. **Identify root causes**: Analyze why tests are failing (broken references, missing files, incorrect paths, folder structure changes, etc.)
  3. **Apply fixes**: Fix broken references, update paths, add missing files, update folder references, or update test expectations
  4. **Test fixes**: Run the specific failing tests to verify fixes work
  5. **Run broader test suite**: Run all related tests to ensure no regressions
  6. **Iterate**: Repeat steps 1-5 until all tests pass
  7. **Document bug fixes**: Create a bug fix document with:
     - Root cause analysis
     - Fixes applied (files AND folders)
     - Tests added/modified
     - Test coverage impact
     - Traceability (which fixes address which failures)
  8. **Propose to user**: Present bug fix document for review:
     - Should fixes be added to existing tests or create new test strategies/files?
     - Are new tests increasing test coverage and robustness?
     - Is every step testable and bug fixes traceable?
- **Ensure testability**: Every step must be testable (applies to both file and folder changes)
- **Ensure traceability**: All bug fixes must be traceable to specific test failures (applies to both file and folder changes)
- **Ensure coverage**: New tests must increase test coverage and robustness (applies to both file and folder changes)

### 8. Propose New Tests (If Needed)
- If removal/updates (files OR folders) might affect test coverage, propose new tests
- **For folder renaming**: Consider adding tests to verify folder structure integrity
- Justify why new tests are needed
- Don't assume removal/updates maintain test passing
- Propose before implementing
- **Tests apply to both files and folders**: Ensure test coverage includes path validation, import resolution, and reference integrity checks

### 9. Review Generated Analysis Reports
- **After completing review and execution**, any generated `*_ANALYSIS*.md` or `*_REVIEW*.md` files should also be reviewed using this SOP
- These analysis files are typically temporary and will likely be removed after their purpose is fulfilled
- **Prompt the user**:
  - Inform them that an analysis report has been generated documenting what was implemented
  - Show the file path and brief summary of what it contains
  - Ask: **"Would you like to remove this analysis report?"**
- If user confirms removal:
  - Follow Steps 3-8 (capture historical essence, update tests, remove file, verify tests)
- If user wants to keep it:
  - Document why it's being kept (e.g., for future reference, unique value)
  - Ensure it's not in excludedFiles list if it should be checked by tests

**Example Prompt**:
```
📋 Analysis Report Generated

I've created an analysis report documenting the review and implementation:
- File: `knowledge/[ANALYSIS_REPORT_NAME].md`
- Content: [Brief description of what the report documents]
- Status: Historical essence already captured in KB_MANAGEMENT_STRATEGY.md

Would you like to remove this analysis report?
```

---

## Global Application

**Important**: This SOP is designed to be used across **ALL future projects**, not just the current Maya project. 

**To apply globally**:
1. Copy the "Documentation Review SOP" section from `.cursorrules` to other projects
2. Or configure Cursor's workspace/global settings to apply rules across projects
3. Always follow all 9 steps when reviewing documentation in any project

---

**Last Updated**: January 9, 2026, 01:45
