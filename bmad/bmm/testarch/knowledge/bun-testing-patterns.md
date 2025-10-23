# Bun Testing Patterns

## Test Structure

```typescript
import { describe, expect, test } from "bun:test";

describe("Feature name", () => {
  test("should do something", () => {
    // Test implementation
    expect(result).toBe(expected);
  });

  test("should handle edge case", async () => {
    // Async test example
    const result = await someAsyncFunction();
    expect(result).toBeDefined();
  });
});
```

## Best Practices

### Test Organization
- Use `describe` for test suites that group related tests
- Use `test` (or `it`) for individual test cases
- Use descriptive test names that explain what should happen
- Group tests by feature or functionality

### Assertions
- Use `expect` for assertions
- Prefer specific matchers over generic ones
- Test both positive and negative cases
- Include boundary value testing

### TypeScript Types
- Use proper TypeScript types (no `any`)
- Infer types correctly from test data
- Type test fixtures and mocks properly

### Async Testing
- Handle async/await correctly
- No floating promises - always await or handle promise rejection
- Use proper error handling for async operations

### Biome Compliance
- Follow Biome formatting rules
- No unused variables (prefix with underscore if intentionally unused)
- Use node: protocol for Node.js imports
- Proper import organization

### Test Data
- Use factories or builders for complex test objects
- Keep test data minimal and focused
- Use meaningful test data that covers realistic scenarios

## Example Patterns

### Service Testing
```typescript
describe("UserService", () => {
  test("should create user with valid data", async () => {
    const userData = {
      name: "John Doe",
      email: "john@example.com"
    };

    const user = await userService.create(userData);

    expect(user.id).toBeDefined();
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
  });
});
```

### API Endpoint Testing
```typescript
describe("POST /api/users", () => {
  test("should return 201 for valid user creation", async () => {
    const response = await app
      .handle(new Request("http://localhost/api/users", {
        method: "POST",
        body: JSON.stringify({ name: "John", email: "john@example.com" })
      }));

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });
});
```

## Integration with BMAD

This project enforces zero-tolerance quality gates:
- All tests must pass with 100% success rate
- TypeScript must compile with 0 errors
- Biome must pass with 0 errors
- No biome-disable or @ts-ignore comments allowed

Tests are automatically validated during story implementation and review workflows.