# Bun Testing Patterns

## Basic Test Structure
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';

describe('Feature', () => {
  beforeAll(async () => {
    // Setup once before all tests
  });

  it('should handle basic case', () => {
    // Test implementation
    expect(result).toBe(expected);
  });

  it('should handle edge case', () => {
    // Test edge case
    expect(result).toBe(expected);
  });

  afterAll(async () => {
    // Cleanup once after all tests
  });
});
```

## Async Testing
```typescript
describe('Async operations', () => {
  it('should handle promises correctly', async () => {
    const result = await someAsyncFunction();
    expect(result).toBeDefined();
  });
});
```

## Error Testing
```typescript
describe('Error handling', () => {
  it('should throw expected error', () => {
    expect(() => someFunction()).toThrow();
  });

  it('should handle error responses', async () => {
    try {
      await someAsyncFunction();
      expect.unreachable();
    } catch (error) {
      expect(error.message).toBe('Expected error message');
    }
  });
});
```

## Quality Standards
- All tests must use Bun Test API (describe, it, expect)
- Tests must pass TypeScript compilation (0 errors)
- Tests must pass Biome linting (0 errors)
- 100% test pass rate required
- Test names should be descriptive and follow "should..." pattern
- Use expect.assert() for complex assertions when needed