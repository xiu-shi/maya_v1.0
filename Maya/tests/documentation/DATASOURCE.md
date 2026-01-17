# E2E Dashboard Data Sources & Frontend Mapping

**Date**: January 11, 2026, 19:15 GMT  
**Last Updated**: January 11, 2026, 20:03 GMT  
**Purpose**: Comprehensive mapping of all metrics, their data sources, and frontend display locations

---

## 📊 Data Sources Overview

### Primary Data Sources

1. **`jest-results.json`** (File)
   - **Location**: `Maya/tests/jest-results.json`
   - **Format**: Jest JSON output format
   - **Load Method**: `fetch('./jest-results.json')` → `parseJestOutput()`
   - **Update Trigger**: Page load, after test execution, manual refresh

2. **`localStorage`** (Browser Storage)
   - **Keys**:
     - `'maya_test_history'` - Test history for trend chart
     - `'maya_current_test_results'` - Previous run results for comparison
     - `'testExecutionTimes'` - Execution time history
   - **Update Trigger**: After test completion, dashboard updates

3. **API Endpoint** (Backend)
   - **Endpoint**: `POST http://localhost:3001/api/admin/run-tests`
   - **Purpose**: Trigger test execution
   - **Response**: Test execution status, output, errors

---

## 🎯 Metrics Mapping

### 1. Overview Metrics (6 Cards)

#### 1.1 Total Tests
- **Frontend Element ID**: `#total-tests`
- **Change Indicator ID**: `#total-tests-change` (within `.metric-card`)
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.totalTests`
- **Data Path**: `jest-results.json.numTotalTests`
- **Update Function**: `updateMetricsWithComparison()` or `updateMetricsWithoutComparison()`
- **Display Logic**: Shows number (e.g., "394") or "Loading..." if 0
- **Comparison**: Calculated as `currentTotal - previousTotal` (from `localStorage`)

#### 1.2 Passing Tests
- **Frontend Element ID**: `#passing-tests`
- **Change Indicator ID**: `#passing-tests-change` (within `.metric-card`)
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.passingTests`
- **Data Path**: `jest-results.json.numPassedTests`
- **Update Function**: `updateMetricsWithComparison()` or `updateMetricsWithoutComparison()`
- **Display Logic**: Shows number (e.g., "394") or "Loading..." if 0
- **Comparison**: Calculated as `currentPassing - previousPassing` (from `localStorage`)

#### 1.3 Failing Tests
- **Frontend Element ID**: `#failing-tests`
- **Change Indicator ID**: `#failing-tests-change` (within `.metric-card`)
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.failingTests`
- **Data Path**: `jest-results.json.numFailedTests`
- **Update Function**: `updateMetricsWithComparison()` or `updateMetricsWithoutComparison()`
- **Display Logic**: Shows number (e.g., "0") - always shows, even if 0
- **Comparison**: Calculated as `currentFailing - previousFailing` (from `localStorage`)
- **Special Logic**: Positive change = bad (negative indicator), negative change = good (positive indicator)

#### 1.4 Pass Rate
- **Frontend Element ID**: `#pass-rate`
- **Change Indicator ID**: `#pass-rate-change` (within `.metric-card`)
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.passRate`
- **Data Path**: Calculated as `(numPassedTests / numTotalTests) * 100`
- **Update Function**: `updateMetricsWithComparison()` or `updateMetricsWithoutComparison()`
- **Display Logic**: Shows percentage (e.g., "100.0%") or "Loading..." if totalTests is 0
- **Comparison**: Calculated as `currentPassRate - previousPassRate` (from `localStorage`)

#### 1.5 Test Suites
- **Frontend Element ID**: `#test-suites`
- **Change Indicator ID**: `#test-suites-change` (within `.metric-card`)
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.testSuites`
- **Data Path**: `jest-results.json.numTotalTestSuites`
- **Update Function**: `updateMetricsWithComparison()` or `updateMetricsWithoutComparison()`
- **Display Logic**: Shows number (e.g., "25") or "Loading..." if 0
- **Comparison**: Calculated as `currentSuites - previousSuites` (from `localStorage`)

#### 1.6 Passing Suites
- **Frontend Element ID**: `#passing-suites`
- **Change Indicator ID**: `#passing-suites-change` (within `.metric-card`)
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.passingSuites`
- **Data Path**: `jest-results.json.numPassedTestSuites`
- **Update Function**: `updateMetricsWithComparison()` or `updateMetricsWithoutComparison()`
- **Display Logic**: Shows number (e.g., "25") or "Loading..." if 0
- **Comparison**: Calculated as `currentPassingSuites - previousPassingSuites` (from `localStorage`)

---

### 2. Test Scope Table

#### 2.1 Knowledge Base Tests Count
- **Frontend Element ID**: `#scope-kb-tests`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.categories.knowledgeBase.total`
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'knowledge_tests'`
- **Update Function**: `updateTestScopeTable()`
- **Display Logic**: Shows "X tests" (e.g., "70 tests") or "Loading..." if 0

#### 2.2 Unit Tests Count
- **Frontend Element ID**: `#scope-unit-tests`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.categories.unit.total`
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'unit_tests'`
- **Update Function**: `updateTestScopeTable()`
- **Display Logic**: Shows "X tests" (e.g., "45 tests") or "Loading..." if 0

#### 2.3 Security Tests Count
- **Frontend Element ID**: `#scope-security-tests`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.categories.security.total`
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'security_tests'`
- **Update Function**: `updateTestScopeTable()`
- **Display Logic**: Shows "X tests" (e.g., "6 tests") or "Loading..." if 0

#### 2.4 Performance Tests Count
- **Frontend Element ID**: `#scope-performance-tests`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.categories.performance.total`
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'performance_tests'`
- **Update Function**: `updateTestScopeTable()`
- **Display Logic**: Shows "X tests" (e.g., "24 tests") or "Loading..." if 0

#### 2.5 Integration Tests Count
- **Frontend Element ID**: `#scope-integration-tests`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.categories.integration.total`
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'integration_tests'`
- **Update Function**: `updateTestScopeTable()`
- **Display Logic**: Shows "X tests" (e.g., "15 tests") or "Loading..." if 0

#### 2.6 Model Tests Count
- **Frontend Element ID**: `#scope-model-tests`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.categories.model.total`
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'model_test'`
- **Update Function**: `updateTestScopeTable()`
- **Display Logic**: Shows "X tests" (e.g., "209 tests") or "Loading..." if 0

#### 2.7 Total Tests Count
- **Frontend Element ID**: `#scope-total-tests`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.totalTests`
- **Data Path**: `jest-results.json.numTotalTests`
- **Update Function**: `updateTestScopeTable()`
- **Display Logic**: Shows "X tests" (e.g., "444 tests") or "Loading..." if 0

---

### 3. Category Cards (6 Cards)

#### 3.1 Knowledge Base Category Card
- **Frontend Element ID**: `#category-knowledgeBase`
- **Status Badge**: `.status-badge` (within card)
- **Comparison Label**: `.comparison-label` (within card)
- **Bar Container**: `.bar-container` (within card)
- **Stat Items**: `.stat-item` (3 items: Tests, Pass Rate, Suites)
- **Category Note**: `.category-note` (within card)
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.categories.knowledgeBase`
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'knowledge_tests'`
- **Update Function**: `updateCategoryCards()`
- **Fields Updated**:
  - `total`: `category.total`
  - `passing`: `category.passing`
  - `failing`: `category.failing`
  - `passRate`: Calculated as `(passing / total) * 100`
  - `suites`: `category.suites`
- **Comparison**: Uses `loadPreviousResults()` → `previousResults.categories.knowledgeBase`

#### 3.2 Unit Category Card
- **Frontend Element ID**: `#category-unit`
- **Same structure as Knowledge Base**
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'unit_tests'`

#### 3.3 Security Category Card
- **Frontend Element ID**: `#category-security`
- **Same structure as Knowledge Base**
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'security_tests'`

#### 3.4 Performance Category Card
- **Frontend Element ID**: `#category-performance`
- **Same structure as Knowledge Base**
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'performance_tests'`

#### 3.5 Integration Category Card
- **Frontend Element ID**: `#category-integration`
- **Same structure as Knowledge Base**
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'integration_tests'`

#### 3.6 Model Category Card
- **Frontend Element ID**: `#category-model`
- **Same structure as Knowledge Base**
- **Data Path**: Aggregated from `jest-results.json.testResults[]` where path includes `'model_test'`

---

### 4. Pass Rate Comparison Section

#### 4.1 Previous Run Progress Ring
- **Frontend Element**: `.progress-ring:first-child`
- **Progress Value**: `.progress-value` (within first ring)
- **Progress Label**: `.progress-label` (within first ring)
- **Progress Bar**: `.progress-ring-progress` (within first ring)
- **Data Source**: `localStorage` → `loadPreviousResults()` → `previousResults.passRate`
- **Data Path**: `localStorage['maya_current_test_results'].passRate`
- **Update Function**: `updatePassRateComparison()`
- **Display Logic**: Shows percentage (e.g., "100.0%") or "--" if no previous data

#### 4.2 Current Run Progress Ring
- **Frontend Element**: `.progress-ring:last-child`
- **Progress Value**: `.progress-value` (within second ring)
- **Progress Label**: `.progress-label` (within second ring)
- **Progress Bar**: `.progress-ring-progress` (within second ring)
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.passRate`
- **Data Path**: Calculated as `(numPassedTests / numTotalTests) * 100`
- **Update Function**: `updatePassRateComparison()`
- **Display Logic**: Shows percentage (e.g., "100.0%")

#### 4.3 Previous Run Date Badge
- **Frontend Element ID**: `#previous-date`
- **Data Source**: `localStorage` → `loadPreviousResults()` → `previousResults.timestamp`
- **Data Path**: `localStorage['maya_current_test_results'].timestamp`
- **Update Function**: `updateDashboard()`
- **Display Logic**: Shows formatted date/time or "No previous data"

#### 4.4 Current Run Date Badge
- **Frontend Element ID**: `#current-date`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.timestamp`
- **Data Path**: `jest-results.json.startTime` (converted to ISO string)
- **Update Function**: `updateDashboard()`
- **Display Logic**: Shows formatted date/time

#### 4.5 Previous Run Category Breakdown
- **Frontend Element ID**: `#previous-breakdown`
- **Data Source**: `localStorage` → `loadPreviousResults()` → `previousResults.categories`
- **Data Path**: `localStorage['maya_current_test_results'].categories`
- **Update Function**: `updateCategoryBreakdown('previous-breakdown', previousResults)`
- **Display Logic**: Shows list of categories with pass/fail counts

#### 4.6 Current Run Category Breakdown
- **Frontend Element ID**: `#current-breakdown`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.categories`
- **Data Path**: Aggregated from `jest-results.json.testResults[]`
- **Update Function**: `updateCategoryBreakdown('current-breakdown', currentTestResults)`
- **Display Logic**: Shows list of categories with pass/fail counts

---

### 5. Trend Chart

#### 5.1 Trend Chart Canvas
- **Frontend Element ID**: `#trend-chart`
- **Data Source**: `localStorage` → `loadTestHistory()` → `history[]`
- **Data Path**: `localStorage['maya_test_history']` (array of test run objects)
- **Update Function**: `updateTrendChart()`
- **Data Structure**: Array of objects with:
  - `timestamp`: ISO string
  - `passRate`: Number (percentage)
  - `totalTests`: Number
  - `passingTests`: Number
- **Display Logic**: Draws line chart with data points, baseline at 95%, labels, and axes
- **Note**: Chart only renders if `history.length > 0` (exits early if empty)

---

### 6. Detailed Test Results Tabs

#### 6.1 Passing Tests Tab
- **Tab Button ID**: `#tab-passing`
- **Tab Content ID**: `#tab-content-passing`
- **List Container ID**: `#passing-tests-list`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.testFiles[]`
- **Data Path**: `jest-results.json.testResults[]` → aggregated into `testFiles` array
- **Update Function**: `updatePassingTestsList()`
- **Display Logic**: Shows list of test files with:
  - File name
  - Link to test file
  - Passing/total counts
  - List of test names (first 10, then "... and X more tests")

#### 6.2 Failing Tests Tab
- **Tab Button ID**: `#tab-failing`
- **Tab Content ID**: `#tab-content-failing`
- **Failing Count Badge**: `#failing-count` (within tab button)
- **List Container ID**: `#failure-list`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults.failures[]`
- **Data Path**: `jest-results.json.testResults[].assertionResults[]` where `status === 'failed'`
- **Update Function**: `updateFailureList()`
- **Display Logic**: Shows list of failures with:
  - Generic test identifier (e.g., "Test #1")
  - Generic category (e.g., "Failed Tests")
  - Truncated error message (max 100 chars, sanitized)

#### 6.3 Test Summary Tab
- **Tab Button ID**: `#tab-summary`
- **Tab Content ID**: `#tab-content-summary`
- **Summary Container ID**: `#test-summary-content`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults`
- **Data Path**: Multiple fields from `jest-results.json`:
  - `numTotalTests` → `totalTests`
  - `numPassedTests` → `passingTests`
  - `numFailedTests` → `failingTests`
  - `numTotalTestSuites` → `testSuites`
  - `testResults[]` → `testFiles[]`
  - `startTime` → `executionTime` (calculated)
- **Update Function**: `updateTestSummary()`
- **Display Logic**: Shows:
  - Overall statistics (total, passing, failing, pass rate, suites, execution time)
  - Test coverage (if available)
  - Test files grouped by category
  - Evidence section with file paths and execution details

#### 6.4 Evidence & Prevention Tab
- **Tab Button ID**: `#tab-evidence`
- **Tab Content ID**: `#tab-content-evidence`
- **Evidence Container ID**: `#evidence-content`
- **Data Source**: `localStorage` + `currentTestResults`
- **Data Path**: Multiple sources:
  - `localStorage['testExecutionTimes']` → Average execution time
  - `currentTestResults` → Test counts, pass rates
  - Hardcoded evidence text
- **Update Function**: `updateEvidence()`
- **Display Logic**: Shows evidence of:
  - CPU usage prevention
  - Test re-runnability
  - No recursive execution
  - Test isolation
  - Preserved functionality

---

### 7. Execution Metrics

#### 7.1 Average Execution Time
- **Frontend Element ID**: `#avg-execution-time`
- **Data Source**: `localStorage` → `loadAverageExecutionTime()`
- **Data Path**: `localStorage['testExecutionTimes']` → Average of last 10 runs
- **Update Function**: `loadAverageExecutionTime()` → `updateAverageExecutionTime()`
- **Display Logic**: Shows formatted time (e.g., "27.5s") or "Calculating..." if no data
- **Update Trigger**: After test execution completes, stored in `localStorage`

#### 7.2 Coverage Info
- **Frontend Element ID**: `#coverage-info`
- **Data Source**: `jest-results.json` → `parseJestOutput()` → `currentTestResults`
- **Data Path**: `currentTestResults.totalTests` and `currentTestResults.testSuites`
- **Update Function**: `updateCoverageInfo()`
- **Display Logic**: Shows "X test cases across Y test suites" or "Test coverage data not available"
- **Note**: Currently shows test counts, not actual code coverage percentage

---

### 8. Test Execution Modal

#### 8.1 Progress Bar
- **Frontend Element**: `.test-progress-bar-fill` (within `#test-modal-body`)
- **Progress Text**: `.progress-text` (within modal)
- **Current Test Name**: `.current-test-name` (within modal)
- **Data Source**: Real-time updates during test execution
- **Update Function**: `runTests()` → Progress interval updates
- **Display Logic**: Shows percentage (0-100%) and current test suite name

#### 8.2 Test Execution Status
- **Modal Body ID**: `#test-modal-body`
- **Data Source**: API endpoint response (`POST /api/admin/run-tests`)
- **Update Function**: `runTests()` → Updates modal content based on API response
- **Display Logic**: Shows success/error messages, test output, warnings

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    jest-results.json                        │
│  (File: Maya/tests/jest-results.json)                      │
│  - numTotalTests                                            │
│  - numPassedTests                                            │
│  - numFailedTests                                            │
│  - numTotalTestSuites                                        │
│  - numPassedTestSuites                                       │
│  - testResults[] (with assertionResults[])                   │
│  - startTime                                                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ fetch('./jest-results.json')
                       ▼
              ┌────────────────────┐
              │ parseJestOutput() │
              └─────────┬──────────┘
                       │
                       │ Creates currentTestResults object
                       ▼
        ┌──────────────────────────────────────┐
        │     currentTestResults Object         │
        │  - totalTests                         │
        │  - passingTests                       │
        │  - failingTests                       │
        │  - passRate                           │
        │  - testSuites                         │
        │  - passingSuites                      │
        │  - categories: {                     │
        │      knowledgeBase: {...}             │
        │      unit: {...}                       │
        │      security: {...}                  │
        │      performance: {...}               │
        │      integration: {...}                │
        │      model: {...}                     │
        │    }                                   │
        │  - testFiles: [...]                   │
        │  - failures: [...]                    │
        │  - timestamp                          │
        └──────────────┬─────────────────────────┘
                       │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│  localStorage    │          │  Update Functions │
│  - Test History  │          │  - updateDashboard│
│  - Previous Run  │          │  - updateMetrics  │
│  - Exec Times    │          │  - updateCategory │
└──────────────────┘          │  - updateTrend    │
                              │  - updateFailure  │
                              │  - updateSummary  │
                              └─────────┬─────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Frontend UI     │
                              │  - Metric Cards  │
                              │  - Category Cards │
                              │  - Trend Chart   │
                              │  - Test Lists    │
                              └──────────────────┘
```

---

## 📝 Update Function Call Chain

### On Page Load:
```
loadJestResults()
  ↓
parseJestOutput(jestData)
  ↓
currentTestResults = parsed
  ↓
updateDashboard()
  ├─→ updateMetricsWithComparison() OR updateMetricsWithoutComparison()
  ├─→ updateCategoryCards()
  ├─→ updateTestScopeTable()
  ├─→ updateCoverageInfo()
  ├─→ updateTrendChart()
  ├─→ updateFailureList()
  ├─→ updatePassingTestsList()
  ├─→ updateTestSummary()
  ├─→ updateEvidence()
  └─→ updatePassRateComparison()
```

### After Test Execution:
```
runTests() (API call)
  ↓
Test execution completes
  ↓
jest-results.json updated
  ↓
loadJestResults() (reload)
  ↓
Same update chain as above
```

---

## 🔍 Key Data Transformations

### 1. Jest JSON → currentTestResults
- **Location**: `parseJestOutput()` function
- **Input**: Jest JSON object
- **Output**: Normalized `currentTestResults` object
- **Key Transformations**:
  - `numTotalTests` → `totalTests`
  - `numPassedTests` → `passingTests`
  - `numFailedTests` → `failingTests`
  - `numTotalTestSuites` → `testSuites`
  - `numPassedTestSuites` → `passingSuites`
  - `testResults[]` → Aggregated into `categories` and `testFiles`
  - `startTime` → `timestamp` (ISO string)
  - `passRate` calculated as `(passingTests / totalTests) * 100`

### 2. Test Results → Categories
- **Location**: `parseJestOutput()` function
- **Logic**: Iterates through `testResults[]`, categorizes by file path:
  - `knowledge_tests` → `knowledgeBase`
  - `unit_tests` → `unit`
  - `security_tests` → `security`
  - `performance_tests` → `performance`
  - `integration_tests` → `integration`
  - `model_test` → `model`
- **Aggregation**: Counts total, passing, failing tests per category

### 3. Assertion Results → Failures
- **Location**: `parseJestOutput()` function
- **Logic**: Iterates through `testResults[].assertionResults[]`, finds `status === 'failed'`
- **Transformation**:
  - `failureMessages[0]` → `error` (truncated to 100 chars, sanitized)
  - Generic test identifier → `testName` (e.g., "Test #1")
  - Generic category → `category` (e.g., "Failed Tests")
  - File path removed → `file: 'N/A'`

---

## 🚨 Known Issues & Missing Functions

### Issue #1: Missing `updateMetricCards()` Function
- **Status**: ❌ **CRITICAL** - Function called but doesn't exist
- **Impact**: Overview metrics stuck on "Loading..."
- **Fix Required**: Create function that calls `updateMetricsWithComparison()` or `updateMetricsWithoutComparison()`

### Issue #2: Trend Chart Requires History
- **Status**: ⚠️ **IMPORTANT** - Chart doesn't render on first load
- **Impact**: Trend chart missing when no history exists
- **Fix Required**: Initialize chart with current run data if history is empty

### Issue #3: Coverage Info Shows Test Counts, Not Coverage
- **Status**: ℹ️ **INFORMATIONAL** - Misleading label
- **Impact**: Shows test counts instead of code coverage percentage
- **Note**: Actual coverage would require `coverage-summary.json` from Jest coverage report

---

## 📚 Related Files

- **Frontend**: `Maya/tests/e2e.html`
- **Data File**: `Maya/tests/jest-results.json`
- **Backend API**: `Maya/backend/server.js` → `/api/admin/run-tests`
- **Test Runner**: `Maya/backend/package.json` → `npm test`
- **Documentation**: `Maya/tests/documentation/JAN_11_2026_E2E_DASHBOARD_METRICS_LOADING_FIX.md` (consolidated)

---

**Last Updated**: January 11, 2026, 20:03 GMT
