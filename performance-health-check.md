# Performance Health Check Report

**Generated:** 2025-10-22T22:20:11.739Z
**Status:** ❌ FAILED
**Violations:** 3

## Performance Thresholds

| Metric | Threshold | Actual | Status |
|--------|-----------|---------|---------|
| Startup Time | 5000ms | 5734ms | ❌ |
| Hot Reload Time | 1000ms | 2012ms | ❌ |
| DEV Build Time | 10000ms | 800ms | ✅ |
| STAGING Build Time | 10000ms | 800ms | ✅ |
| PROD Build Time | 10000ms | 850ms | ✅ |
| PROD Bundle Size | 1.00MB | 0.64MB | ✅ |
| STAGING Bundle Size | 2.00MB | 3.83MB | ❌ |

## Violations

- Staging bundle size (3.83MB) exceeds threshold (2MB)
- Startup time (5734ms) exceeds threshold (5000ms)
- Hot reload time (2012ms) exceeds threshold (1000ms)

## Recommendations

- Implement code splitting, tree shaking, or remove unused dependencies

## Trend Analysis

*This section would typically include historical data comparison if available.*

---

**Next Steps:**
- Review any violations above
- Consider adjusting thresholds if they're too strict
- Implement performance improvements for failed metrics
- Set up automated monitoring in CI/CD pipeline
