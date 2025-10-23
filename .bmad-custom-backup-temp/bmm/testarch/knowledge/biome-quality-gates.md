# Biome Quality Gates

## Requirements

- **Zero Biome errors required** - Both linting and formatting must pass
- **Never add biome-disable comments** - Refactor code to satisfy the rule
- **Consistent formatting** - All code must follow project formatting conventions

## Commands

```bash
# Check linting and formatting
bun run lint

# Check formatting only
bun run format:check

# Auto-format code
bun run format

# Check specific files
bunx biome check src/index.ts
bunx biome format src/index.ts
```

## Common Biome Rules

### Import/Export Rules
```typescript
// Good - Use consistent import style
import { describe, it, expect } from 'bun:test'
import type { User } from './types'

// Bad - Mixed import styles
import { describe } from 'bun:test'
import it from 'it' // Use named imports
```

### Naming Conventions
```typescript
// Good - camelCase for variables/functions
const userName = 'john'
function getUserData() {}

// Good - PascalCase for classes/types
class UserService {}
type ApiResponse = {}

// Bad - Inconsistent naming
const UserName = 'john' // Should be camelCase
function getuser_data() {} // Should be camelCase
```

### Unused Variables
```typescript
// Good - All variables used
const result = await fetchData()
console.log(result)

// Bad - Unused variables
const unused = getData() // Remove or use this
const result = await fetchData()
```

### Async/Await Rules
```typescript
// Good - Proper async handling
async function processData() {
  const result = await fetchData()
  return transformData(result)
}

// Bad - Floating promises
async function processData() {
  fetchData() // Missing await
  return transformData()
}
```

## Type Safety

```typescript
// Good - Use proper types
interface User {
  id: string
  name: string
  email: string
}

function createUser(user: User): User {
  return { ...user, id: generateId() }
}

// Bad - Use 'any' type
function createUser(user: any): any {
  return { ...user, id: generateId() }
}
```

## Formatting Rules

### Indentation and Spacing
```typescript
// Good - Consistent indentation
if (condition) {
  doSomething()
} else {
  doSomethingElse()
}

// Bad - Inconsistent spacing
if(condition){
  doSomething()
}else{
  doSomethingElse()
}
```

### Object and Array Formatting
```typescript
// Good - Consistent formatting
const config = {
  host: 'localhost',
  port: 3000,
  timeout: 5000,
}

const items = [
  'item1',
  'item2',
  'item3',
]
```

## Error Messages

When Biome reports errors:
1. **Read the error message carefully** - Biome provides clear descriptions
2. **Fix the underlying issue** - Don't add disable comments
3. **Run format check** - Ensure formatting is correct
4. **Run lint check** - Verify all linting issues are resolved

## Integration with Development Workflow

Biome quality gates are enforced at these points:
- During story implementation (dev-story workflow)
- During code review (review-story workflow)
- During story creation (validate code examples)

## Auto-formatting

Configure your editor to use Biome for automatic formatting:
```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

## Quality Enforcement

BMAD agents will:
1. Run Biome checks automatically
2. Fail stories if Biome errors exist
3. Never add biome-disable comments
4. Require all code to pass Biome validation before completion