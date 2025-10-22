# Bun Testing Patterns

## Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test'

describe('Component/Function Name', () => {
  beforeEach(() => {
    // Setup code before each test
  })

  afterEach(() => {
    // Cleanup code after each test
  })

  it('should do X when given Y', async () => {
    // Given
    const input = createTestInput()

    // When
    const result = await functionUnderTest(input)

    // Then
    expect(result).toBe(expectedOutput)
  })

  it('should handle error case Z', () => {
    // Given
    const invalidInput = createInvalidInput()

    // When/Then
    expect(() => functionUnderTest(invalidInput)).toThrow('Expected error message')
  })
})
```

## Quality Requirements

- **100% test pass rate required** - No failing tests allowed
- **Proper TypeScript types** - No 'any' types, infer types correctly
- **Async/await handling** - No floating promises, proper error handling
- **Biome compliance** - Follow all linting rules (no-unused-vars, etc.)
- **Test coverage** - Cover all acceptance criteria and edge cases

## Test Data Patterns

```typescript
// Use factories for test data
const createUser = (overrides?: Partial<User>): User => ({
  id: 'test-id',
  name: 'Test User',
  email: 'test@example.com',
  ...overrides
})

// Use descriptive test names
it('should create agent when valid configuration provided', async () => {
  const agentConfig = createAgentConfig({
    name: 'Test Agent',
    type: 'developer'
  })

  const result = await createAgent(agentConfig)

  expect(result.id).toBeDefined()
  expect(result.name).toBe('Test Agent')
  expect(result.type).toBe('developer')
})
```

## Mocking with Bun

```typescript
import { mock, spyOn } from 'bun:test'

// Mock external dependencies
const mockDatabase = mock(() => ({
  save: async () => ({ id: 'mock-id' }),
  find: async () => ({ name: 'Mock Data' })
}))

// Spy on existing functions
const spy = spyOn(console, 'log')

// Use mocks in tests
it('should save to database', async () => {
  const service = new Service(mockDatabase)

  await service.processData('test-data')

  expect(mockDatabase.save).toHaveBeenCalledWith('test-data')
})
```

## Error Testing

```typescript
it('should throw ValidationError when input is invalid', async () => {
  const invalidInput = { name: '' } // Missing required fields

  const result = await createAgent(invalidInput)

  // Check that error is thrown
  expect(result).toThrow(ValidationError)

  // Check error message
  expect(result).toThrow('Name is required')
})
```

## Integration Tests

```typescript
// Integration tests test component interactions
describe('Agent Service Integration', () => {
  let testDatabase: Database
  let service: AgentService

  beforeEach(async () => {
    testDatabase = createTestDatabase()
    service = new AgentService(testDatabase)
    await testDatabase.migrate()
  })

  it('should create and retrieve agent through service layer', async () => {
    const agentData = createAgentConfig()
    const created = await service.createAgent(agentData)
    const retrieved = await service.getAgent(created.id)

    expect(retrieved).toEqual(created)
  })
})
```

## Quality Gates

All generated tests must:
1. Pass TypeScript compilation with 0 errors
2. Pass Biome linting with 0 errors
3. Use proper typing (no 'any')
4. Handle async correctly
5. Follow naming conventions
6. Cover all acceptance criteria