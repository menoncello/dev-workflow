# Biome Quality Patterns

## Common Quality Issues and Solutions

### Unused Variables
**Issue**: `noUnusedVariables` warning/error
**Solution**: Prefix unused variables with underscore or remove them

```typescript
// ❌ Bad
const unused = getValue();

// ✅ Good
const _unused = getValue();
```

### Import Protocols
**Issue**: Missing `node:` prefix for Node.js imports
**Solution**: Use explicit import protocols

```typescript
// ❌ Bad
import { readFileSync } from 'fs';

// ✅ Good
import { readFileSync } from 'node:fs';
```

### Floating Promises
**Issue**: Missing `await` or improper Promise handling
**Solution**: Use proper async/await patterns

```typescript
// ❌ Bad
const result = someAsyncFunction();
console.log(result); // This will be undefined

// ✅ Good
const result = await someAsyncFunction();
console.log(result); // Properly awaited
```

### No Extra Semicolons
**Issue**: Extra semicolons in objects or classes
**Solution**: Remove unnecessary semicolons

```typescript
// ❌ Bad
const obj = {
  key: value;
};

// ✅ Good
const obj = {
  key: value
};
```

### Proper Error Handling
**Issue**: Silent failures or unhandled rejections
**Solution**: Always handle errors explicitly

```typescript
// ❌ Bad
async function risky() {
  // No error handling
}

// ✅ Good
async function risky() {
  try {
    await dangerousOperation();
  } catch (error) {
    console.error('Operation failed:', error);
    throw error;
  }
}
```

### Type Safety
**Issue**: Use of `any` type or type assertions
**Solution**: Use proper TypeScript types

```typescript
// ❌ Bad
const result: any = someFunction();

// ✅ Good
interface Result {
  id: string;
  value: number;
}
const result: Result = someFunction();
```

## Quality Standards

- Follow Biome's recommended rules configuration
- Fix all linting errors before committing code
- Use explicit types instead of `any`
- Handle async operations properly with try/catch
- Prefix unused variables with underscore
- Use node: protocol for Node.js builtins
- Write descriptive test names using "should..." pattern