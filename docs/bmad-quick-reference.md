# BMAD Quick Reference

## Project Setup

This project uses personalized BMAD agents with zero-tolerance quality gates:
- **TypeScript**: 0 errors required
- **Biome**: 0 errors required (linting + formatting)
- **Tests**: 100% pass rate required
- **Never disable rules** - Fix underlying code issues

## Story Loop

```bash
# 1. Plan story
/bmad:bmm:agents:sm
*create-story               # Create story (validates code examples)

# 2. Approve story
/bmad:bmm:agents:pm
*story-ready                # Approve for development

# 3. Implementation
/bmad:bmm:agents:dev
*develop                    # Implement story (enforces quality gates)
```

## Quality Checks

```bash
# 4. Quality Checks (automatically enforced in dev-story)
/bmad:bmm:agents:tea
*test-review                # Review test quality

/bmad:bmm:agents:dev
*review                     # Code review (validates quality gates)
```

## Quality Gates (MANDATORY)

All BMAD agents enforce these quality standards:

### TypeScript
```bash
bun run typecheck           # Must pass with 0 errors
```
- Strict mode required
- No @ts-ignore or @ts-expect-error allowed
- Fix underlying type issues

### Biome
```bash
bun run lint               # Must pass with 0 errors
bun run format:check       # Must be properly formatted
```
- Zero linting errors required
- Zero formatting errors required
- No biome-disable comments allowed

### Testing
```bash
bun test                    # Must pass with 100% success rate
```
- All tests must pass
- Use Bun Test API (describe, it, expect)
- Proper TypeScript types required

## Tips

- **Quality gates are mandatory** - BMAD agents will not complete stories unless all quality gates pass
- **Never disable rules** - Always fix the underlying code issues
- **All code examples** in documentation must meet production quality standards
- **Generated tests** must use proper TypeScript types and follow Biome conventions

## Agent Customizations

This project has personalized BMAD agents with:
- DEV agent: Enforces quality gates in implementation
- Architect agent: Validates code examples in ADRs
- SM agent: Ensures story templates meet quality standards
- TEA agent: Generates high-quality test code with Bun Test patterns

## Commands

```bash
# Check status
/bmad:bmm:agents:architect
*workflow-status

# Validate solutioning gate
/bmad:bmm:agents:architect
*solutioning-gate-check
```

---

*This quick reference is personalized for the Claude Code Dev Platform Plugin project*