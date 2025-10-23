# Performance Report

Generated: 2025-10-22T22:45:14.773Z

## Metrics Summary

- **Startup Time**: 5804.47ms
- **Hot Reload Time**: 2019.96ms

### Build Times (ms)
- DEV: 892.28ms
- STAGING: 814.56ms
- PROD: 869.24ms

### Bundle Sizes (MB)
- DEV: 1.35MB
- STAGING: 2.26MB
- PROD: 0.74MB

### Memory Usage
- RSS: 30.98MB
- Heap Used: 0.74MB
- Heap Total: 1.30MB

## Recommendations

- Consider optimizing application startup time (currently > 5s)
- Staging bundle size exceeds 2MB, optimize source maps
- Hot-reload time is slow (> 1s), consider optimizing watch configuration