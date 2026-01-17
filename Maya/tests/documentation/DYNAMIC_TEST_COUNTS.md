# Dynamic Test Counts System

**Date**: January 11, 2026  
**Status**: ✅ **IMPLEMENTED**

---

## Overview

The dynamic test counts system ensures that all test counts displayed in the UI and documentation are automatically calculated from actual test results, eliminating the need for manual updates when tests are added or removed.

---

## Problem Statement

Previously, test counts were hardcoded in multiple places:
- Confirmation dialog: "26 suites, 394 tests"
- Documentation files: Various hardcoded counts
- Dashboard displays: Static values

This required manual updates whenever:
- Tests were added or removed
- Test suites were added or removed
- Tests were reorganized

---

## Solution

### 1. Dynamic Count Function (`getTestCounts()`)

**Location**: `Maya/tests/e2e.html`

A new async function that dynamically retrieves test counts from:
1. **Primary Source**: `jest-results.json` (if available)
2. **Fallback**: `currentTestResults` (if loaded)
3. **Default**: Zero values (if no data available)

```javascript
async function getTestCounts() {
  // Try to load from jest-results.json first
  try {
    const response = await fetch('./jest-results.json');
    if (response.ok) {
      const jestData = await response.json();
      return {
        totalTests: jestData.numTotalTests || 0,
        totalSuites: jestData.numTotalTestSuites || 0,
        passingTests: jestData.numPassedTests || 0,
        passingSuites: jestData.numPassedTestSuites || 0
      };
    }
  } catch (error) {
    // Fallback to currentTestResults
  }
  
  // Fallback logic...
}
```

### 2. Updated Confirmation Dialog

**Before**:
```javascript
const confirmed = confirm(
  `Are you sure you want to run end-to-end tests?\n\n` +
  `This will:\n` +
  `• Run all test suites (26 suites, 394 tests)\n` +  // ❌ Hardcoded
  `• Take approximately 20-30 seconds\n` +
  `• Update dashboard with results\n\n` +
  `Click OK to proceed or Cancel to abort.`
);
```

**After**:
```javascript
// Get dynamic test counts
const counts = await getTestCounts();
const testCountText = counts.totalTests > 0 
  ? `${counts.totalSuites} suite${counts.totalSuites !== 1 ? 's' : ''}, ${counts.totalTests} test${counts.totalTests !== 1 ? 's' : ''}`
  : 'all test suites';

const confirmed = confirm(
  `Are you sure you want to run end-to-end tests?\n\n` +
  `This will:\n` +
  `• Run ${testCountText}\n` +  // ✅ Dynamic
  `• Take approximately 20-30 seconds\n` +
  `• Update dashboard with results\n\n` +
  `Click OK to proceed or Cancel to abort.`
);
```

### 3. Validation Script

**Location**: `Maya/backend/scripts/validate-test-counts.js`

A script that validates:
- Test counts are not hardcoded in UI files
- Documentation uses appropriate format (can have examples, but should note they're dynamic)
- `jest-results.json` exists and contains valid data
- Counts match actual test execution results

**Usage**:
```bash
cd Maya/backend
npm run test:validate-counts
```

**Output**:
```
🔍 Validating Test Counts...

📊 Actual Test Counts (from jest-results.json):
   Total Tests: 394
   Total Suites: 26
   Passed Tests: 394
   Passed Suites: 26
   Failed Tests: 0
   Failed Suites: 0

📋 Validation Results:

✅ TEST_COMMANDS.md: Using dynamic counts or appropriate format
✅ Implementation.md: Using dynamic counts or appropriate format
✅ e2e.html: Using dynamic counts or appropriate format

✅ Validation passed: All files use dynamic counts or appropriate format
```

### 4. Test Suite

**Location**: `Maya/tests/integration_tests/dynamic-test-counts.test.js`

Comprehensive tests covering:
- ✅ Dynamic count function exists and works correctly
- ✅ Confirmation dialog uses dynamic counts
- ✅ Test counts are accurate (match jest-results.json)
- ✅ Dashboard metrics use dynamic counts
- ✅ Counts update when tests change
- ✅ Error handling for missing data

**Test Results**: ✅ **21/21 tests passing**

---

## Data Flow

```
┌─────────────────────┐
│  npm test           │
│  (with --json)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ jest-results.json   │
│ - numTotalTests     │
│ - numTotalTestSuites│
│ - numPassedTests    │
│ - numPassedTestSuites│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ getTestCounts()     │
│ (reads from JSON)   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Confirmation Dialog │
│ (displays counts)   │
└─────────────────────┘
```

---

## Benefits

1. **Automatic Updates**: Counts update automatically when tests change
2. **Accuracy**: Always reflects actual test suite status
3. **Maintainability**: No manual updates required
4. **Validation**: Automated checks ensure counts stay dynamic
5. **User Experience**: Users see accurate, up-to-date information

---

## Files Modified

1. **`Maya/tests/e2e.html`**:
   - Added `getTestCounts()` function
   - Updated confirmation dialog to use dynamic counts
   - Removed hardcoded "26 suites, 394 tests"

2. **`Maya/tests/integration_tests/dynamic-test-counts.test.js`** (NEW):
   - 21 tests verifying dynamic count system

3. **`Maya/backend/scripts/validate-test-counts.js`** (NEW):
   - Validation script for checking hardcoded counts

4. **`Maya/backend/package.json`**:
   - Added `test:validate-counts` script

---

## Usage

### For Developers

1. **Add/Remove Tests**: No action needed - counts update automatically
2. **Verify Counts**: Run validation script:
   ```bash
   npm run test:validate-counts
   ```
3. **Run Tests**: Ensure `jest-results.json` is generated:
   ```bash
   npm test -- --json --outputFile=../tests/jest-results.json
   ```

### For Users

- Confirmation dialog automatically shows current test counts
- Dashboard displays accurate metrics from latest test run
- No manual updates required

---

## Testing

Run the dynamic test counts test suite:
```bash
cd Maya/backend
npm test -- tests/integration_tests/dynamic-test-counts.test.js
```

**Expected**: ✅ All 21 tests passing

---

## Future Enhancements

1. **Documentation Auto-Generation**: Script to auto-update documentation with current counts
2. **CI/CD Integration**: Run validation script in CI pipeline
3. **Count History**: Track test count changes over time
4. **Alerting**: Notify when test counts change significantly

---

## Related Files

- `Maya/tests/e2e.html` - Main dashboard with dynamic counts
- `Maya/tests/integration_tests/dynamic-test-counts.test.js` - Test suite
- `Maya/backend/scripts/validate-test-counts.js` - Validation script
- `Maya/tests/jest-results.json` - Source of truth for test counts

---

## Status

✅ **COMPLETED** - Dynamic test counts system fully implemented and tested
