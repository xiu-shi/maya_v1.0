# E2E Dashboard Metrics Structure & Data Flow

**Last Updated:** January 11, 2026, 16:00 GMT

## Overview

This document describes the structure of metrics displayed in the E2E Test Dashboard (`e2e.html`), how they are calculated, and how they flow from Jest test results to the user interface.

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Jest Test Execution                           │
│  npm test -- --json --outputFile=../tests/jest-results.json     │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              jest-results.json (Jest JSON Output)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ {                                                         │  │
│  │   "numTotalTests": 394,                                  │  │
│  │   "numPassedTests": 394,                                 │  │
│  │   "numFailedTests": 0,                                   │  │
│  │   "numTotalTestSuites": 26,                              │  │
│  │   "numPassedTestSuites": 26,                             │  │
│  │   "testResults": [                                       │  │
│  │     {                                                     │  │
│  │       "name": "path/to/test/file.test.js",              │  │
│  │       "assertionResults": [                              │  │
│  │         { "status": "passed", "fullName": "..." },      │  │
│  │         { "status": "failed", "fullName": "..." }       │  │
│  │       ]                                                   │  │
│  │     }                                                     │  │
│  │   ]                                                       │  │
│  │ }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              loadJestResults() Function                          │
│  • Fetches jest-results.json via fetch('./jest-results.json')   │
│  • Calls parseJestOutput() to transform data                    │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              parseJestOutput() Function                          │
│  Transforms Jest JSON into dashboard-friendly format:            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 1. Extract top-level metrics:                             │  │
│  │    • totalTests = numTotalTests                           │  │
│  │    • passingTests = numPassedTests                        │  │
│  │    • failingTests = numFailedTests                        │  │
│  │    • testSuites = numTotalTestSuites                     │  │
│  │    • passRate = (passingTests / totalTests) * 100        │  │
│  │                                                            │  │
│  │ 2. Categorize tests by file path:                         │  │
│  │    • knowledge_tests/ → knowledgeBase                     │  │
│  │    • unit_tests/ → unit                                   │  │
│  │    • security_tests/ → security                           │  │
│  │    • performance_tests/ → performance                     │  │
│  │    • integration_tests/ → integration                     │  │
│  │    • model_test/ → model                                  │  │
│  │                                                            │  │
│  │ 3. Count tests per category:                              │  │
│  │    For each testResult:                                   │  │
│  │      • Count passing assertions                           │  │
│  │      • Count failing assertions                           │  │
│  │      • Update category totals                             │  │
│  │                                                            │  │
│  │ 4. Build categories object:                               │  │
│  │    categories: {                                           │  │
│  │      knowledgeBase: { total, passing, failing, suites }, │  │
│  │      unit: { total, passing, failing, suites },          │  │
│  │      ...                                                   │  │
│  │    }                                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              currentTestResults Object                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ {                                                         │  │
│  │   timestamp: "2026-01-11T16:00:00.000Z",                 │  │
│  │   totalTests: 394,                                        │  │
│  │   passingTests: 394,                                      │  │
│  │   failingTests: 0,                                         │  │
│  │   passRate: 100.0,                                        │  │
│  │   testSuites: 26,                                         │  │
│  │   passingSuites: 26,                                      │  │
│  │   failingSuites: 0,                                       │  │
│  │   executionTime: 27145,                                   │  │
│  │   categories: {                                           │  │
│  │     knowledgeBase: { total: 70, passing: 70, ... },     │  │
│  │     unit: { total: 78, passing: 78, ... },            │  │
│  │     security: { total: 37, passing: 37, ... },          │  │
│  │     performance: { total: 52, passing: 52, ... },       │  │
│  │     integration: { total: 60, passing: 60, ... },        │  │
│  │     model: { total: 72, passing: 72, ... }               │  │
│  │   },                                                      │  │
│  │   failures: [],                                           │  │
│  │   testFiles: [...]                                        │  │
│  │ }                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│              updateDashboard() Function                          │
│  Orchestrates all UI updates:                                    │
│  • updateMetricsWithComparison() / updateMetricsWithoutComparison() │
│  • updateCategoryCards()                                         │
│  • updateTestScopeTable()                                        │
│  • updateCoverageInfo()                                           │
│  • updatePassRateComparison()                                    │
│  • updateTrendChart()                                            │
└────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    UI Components                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ Overview Metrics │  │ Category Cards   │  │ Test Scope   │ │
│  │ • Total Tests    │  │ • Knowledge Base │  │ Table        │ │
│  │ • Passing Tests  │  │ • Unit           │  │              │ │
│  │ • Failing Tests  │  │ • Security       │  │              │ │
│  │ • Pass Rate      │  │ • Performance    │  │              │ │
│  │ • Test Suites    │  │ • Integration    │  │              │ │
│  │ • Passing Suites │  │ • Model          │  │              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│  ┌──────────────────┐  ┌──────────────────┐                  │
│  │ Pass Rate        │  │ Trend Chart       │                  │
│  │ Comparison       │  │ (Last 10 Runs)    │                  │
│  │ (Previous vs     │  │                   │                  │
│  │  Current)        │  │                   │                  │
│  └──────────────────┘  └──────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

## Metrics Structure

### 1. Overview Metrics (Top Cards)

**Source:** `currentTestResults` object
**Display Location:** Overview Metrics section (6 cards)

| Metric | Source Field | Calculation | Display Format |
|--------|-------------|-------------|----------------|
| Total Tests | `totalTests` | Direct from `numTotalTests` | Number (e.g., "394") |
| Passing Tests | `passingTests` | Direct from `numPassedTests` | Number (e.g., "394") |
| Failing Tests | `failingTests` | Direct from `numFailedTests` | Number (e.g., "0") |
| Pass Rate | `passRate` | `(passingTests / totalTests) * 100` | Percentage (e.g., "100.0%") |
| Test Suites | `testSuites` | Direct from `numTotalTestSuites` | Number (e.g., "26") |
| Passing Suites | `passingSuites` | Direct from `numPassedTestSuites` | Number (e.g., "26") |

**Update Functions:**
- `updateMetricsWithComparison(previous, current)` - When previous run data exists
- `updateMetricsWithoutComparison(current)` - When no previous run data

### 2. Category Breakdown

**Source:** `currentTestResults.categories` object
**Display Location:** Category Cards section (6 cards)

Each category contains:
```javascript
{
  total: number,      // Total tests in category
  passing: number,    // Passing tests in category
  failing: number,    // Failing tests in category
  suites: number      // Number of test suites in category
}
```

**Categories:**
1. **Knowledge Base** (`knowledgeBase`)
   - File path pattern: `knowledge_tests/`
   - Current count: 70 tests

2. **Unit** (`unit`)
   - File path pattern: `unit_tests/`
   - Current count: 78 tests

3. **Security** (`security`)
   - File path pattern: `security_tests/`
   - Current count: 37 tests

4. **Performance** (`performance`)
   - File path pattern: `performance_tests/`
   - Current count: 52 tests

5. **Integration** (`integration`)
   - File path pattern: `integration_tests/`
   - Current count: 60 tests

6. **Model** (`model`)
   - File path pattern: `model_test/`
   - Current count: 72 tests

**Update Function:** `updateCategoryCards(results)`

**Displayed Metrics per Category:**
- Status badge (Passing/Failing)
- Comparison dates (Previous vs Current)
- Progress bar (Pass rate visualization)
- Test count, Pass rate %, Suite count
- Category-specific notes

### 3. Test Scope Table

**Source:** `currentTestResults.categories` and `currentTestResults.totalTests`
**Display Location:** Test Scope section

| Category | Focus Areas | Test Count |
|----------|-------------|------------|
| Knowledge Base Tests | KB loading, caching, accuracy, and evaluation | `categories.knowledgeBase.total` |
| Unit Tests | Input sanitization, timeout utilities, import validation | `categories.unit.total` |
| Security Tests | Rate limiting and security measures | `categories.security.total` |
| Performance Tests | API performance, model performance, timeout stress | `categories.performance.total` |
| Integration Tests | Bulk file operations with timeout protection | `categories.integration.total` |
| Model Tests | Prompt injection, jailbreak, and architecture leakage prevention | `categories.model.total` |
| **Total** | Comprehensive backend test coverage | `totalTests` |

**Update Function:** `updateTestScopeTable(results)`

### 4. Overall Pass Rate Comparison

**Source:** `currentTestResults.passRate` and `loadPreviousResults()`
**Display Location:** Overall Pass Rate Comparison section

**Components:**
1. **Progress Rings (Circular Gauges)**
   - Previous Run: `previousResults.passRate`
   - Current Run: `currentTestResults.passRate`
   - Visual: SVG circle with stroke-dashoffset animation

2. **Category Breakdown Lists**
   - Previous Run: `previousResults.categories`
   - Current Run: `currentTestResults.categories`
   - Format: `{passing}/{total} passing`

**Update Function:** `updatePassRateComparison()`

### 5. Pass Rate Trend Chart

**Source:** `loadTestHistory()` from `localStorage`
**Display Location:** Pass Rate Trend section

**Data Structure:**
```javascript
[
  { timestamp: "2026-01-11T15:00:00Z", passRate: 100.0 },
  { timestamp: "2026-01-11T15:30:00Z", passRate: 100.0 },
  ...
]
```

**Update Function:** `updateTrendChart()`

**Visual Elements:**
- X-axis: Last 10 test runs
- Y-axis: Pass rate (0-100%)
- Data points: Green circles
- Baseline: Red dashed line at 95%

## Calculation Details

### Pass Rate Calculation

```javascript
passRate = (passingTests / totalTests) * 100
```

**Example:**
- `passingTests = 394`
- `totalTests = 394`
- `passRate = (394 / 394) * 100 = 100.0`

### Category Test Counting

For each test file in `testResults`:
1. Determine category from file path
2. Count assertions in `assertionResults` array
3. Count passing: `assertion.status === 'passed'`
4. Count failing: `assertion.status === 'failed'`
5. Update category totals:
   ```javascript
   categories[category].total += total
   categories[category].passing += passing
   categories[category].failing += failing
   if (total > 0) categories[category].suites += 1
   ```

### Change Indicators

When comparing with previous run:
- **Positive change (↑):** Current > Previous (green)
- **Negative change (↓):** Current < Previous (red)
- **No change (→):** Current === Previous (gray)

**Special handling for failing tests:**
- Positive change is bad (more failures)
- Negative change is good (fewer failures)

## Data Persistence

### localStorage Keys

1. **`maya_test_results`** - Last test run results
   - Used for comparison with current run
   - Updated after each test run

2. **`maya_test_history`** - Last 20 test runs
   - Used for trend chart
   - Array of `{ timestamp, passRate, ... }`

3. **`testExecutionTimes`** - Execution time history
   - Used for average execution time calculation
   - Array of execution times in milliseconds

## Error Handling

### Missing Data Scenarios

1. **jest-results.json not found:**
   - Shows "Loading..." for all metrics
   - Uses default values (zeros)
   - Logs warning to console

2. **Invalid JSON:**
   - `parseJestOutput()` returns `null`
   - Dashboard uses default values
   - Error logged to console

3. **Missing Categories:**
   - `updateCategoryCards()` checks for `results.categories`
   - Shows "Loading..." if missing
   - Logs warning to console

4. **No Previous Run:**
   - `loadPreviousResults()` returns `null`
   - Uses `updateMetricsWithoutComparison()`
   - Shows "No previous data" in comparison sections

## Testing

### Verification Commands

```bash
# Run tests and generate jest-results.json
cd Maya/backend && npm test -- --json --outputFile=../tests/jest-results.json

# Verify JSON structure
cd Maya/tests && node -e "const data = require('./jest-results.json'); console.log('Total:', data.numTotalTests);"

# Verify category breakdown
cd Maya/tests && node -e "const data = require('./jest-results.json'); /* category counting logic */"
```

### Expected Values (Current)

- **Total Tests:** 394
- **Passing Tests:** 394
- **Failing Tests:** 0
- **Pass Rate:** 100.0%
- **Test Suites:** 26
- **Passing Suites:** 25

**Category Breakdown:**
- Knowledge Base: 70 tests
- Unit: 78 tests
- Security: 37 tests
- Performance: 52 tests
- Integration: 60 tests
- Model: 72 tests

## Related Files

- `Maya/tests/e2e.html` - Main dashboard file
- `Maya/tests/jest-results.json` - Jest test output (generated)
- `Maya/backend/package.json` - Test scripts
- `Maya/tests/documentation/DYNAMIC_METRICS_AUDIT.md` - Audit documentation

## Maintenance

### When Adding New Test Categories

1. Update `parseJestOutput()` category detection logic
2. Add category to `currentTestResults.categories` initialization
3. Add category card HTML in `e2e.html`
4. Update `updateCategoryCards()` function
5. Update `updateTestScopeTable()` function
6. Update `updateCategoryBreakdown()` function
7. Update this documentation

### When Modifying Metrics

1. Update calculation logic in `parseJestOutput()`
2. Update display functions (`updateMetrics*`, `updateCategoryCards`, etc.)
3. Update this documentation
4. Test with actual test runs
5. Verify metrics display correctly
