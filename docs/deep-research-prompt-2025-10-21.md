# Deep Research Prompt

**Generated:** 2025-10-21
**Created by:** Eduardo Menoncello
**Target Platform:** ChatGPT Deep Research (o3/o1)

---

## Research Prompt (Ready to Use)

### Research Question

**Primary Focus Areas:**
1. **Implementação de MCP Adapter Pattern em TypeScript** - Best practices, patterns, and implementation strategies for Model Context Protocol adapters
2. **Comparação de frameworks de agent orchestration** - Comprehensive analysis including Claude Code as primary focus, with comparisons to alternatives
3. **Vector databases performance and implementation** - Postgres + pgvector vs alternatives, optimization strategies, production deployment patterns

### Research Goal and Context

**Objective:** Tomada de decisões arquiteturais and Desenvolvimento de MVP

**Context:**
I am developing a Claude Code Dev Platform Plugin as a greenfield project using:
- **Runtime:** Bun (for performance)
- **API Framework:** Elysia (TypeScript-first)
- **Database:** PostgreSQL with pgvector extension
- **Architecture:** Distributed agent system with MCP Adapter Pattern
- **Target:** MVP validation with focus on prompt management and agent coordination

The research should help make critical architectural decisions for the MVP while considering long-term scalability and maintainability.

### Scope and Boundaries

**Temporal Scope:** Current state + Recent trends (last 2-3 years) + Future outlook (projections 2025-2027)

**Geographic Scope:** Global (with focus on English-language documentation and open-source communities)

**Thematic Focus:**
**Include:** MCP implementation patterns, TypeScript agent frameworks, vector database optimization, Bun/Elysia ecosystem
**Exclude:** Legacy Node.js patterns, vendor-specific proprietary solutions, academic theoretical discussions without practical applications

### Information Requirements

**Types of Information Needed:**
- [x] Quantitative data and performance benchmarks
- [x] Qualitative insights and expert opinions
- [x] Trends and patterns in agent orchestration
- [x] Case studies and production examples
- [x] Comparative analysis of frameworks
- [x] Technical specifications and API patterns
- [x] Implementation best practices
- [x] Industry reports and developer surveys
- [x] Open-source project health metrics

**Preferred Sources:**
- Peer-reviewed technical blogs and documentation
- Production case studies and post-mortems
- GitHub repository metrics and community health
- Industry conference talks and workshops
- Technical documentation from official projects
- Developer community discussions (Reddit, HackerNews, Discord)
- Performance benchmarks and comparison studies

### Output Structure

**Format:** Executive Summary + Análise Detalhada + Tabela Comparativa das opções + SWOT Analysis

**Required Sections:**

1. **Executive Summary**
   - Key findings and top recommendations
   - Critical decision points for MVP development
   - Risk assessment and mitigation strategies

2. **MCP Adapter Pattern Implementation**
   - Current best practices and patterns
   - TypeScript implementation examples
   - Integration with Bun/Elysia ecosystem
   - Performance considerations and optimization

3. **Agent Orchestration Frameworks Comparison**
   - Claude Code ecosystem (primary focus)
   - Alternative frameworks (LangChain, Mastra AI, Vercel AI SDK, etc.)
   - Feature comparison matrix
   - Community and ecosystem health

4. **Vector Database Deep Dive**
   - PostgreSQL + pgvector implementation patterns
   - Performance optimization techniques
   - Comparison with dedicated vector databases (Pinecone, Weaviate, etc.)
   - Production deployment considerations

5. **Comprehensive Comparison Matrix**
   - Feature-by-feature analysis of all options
   - Performance benchmarks where available
   - Cost analysis (development, operational, scaling)
   - Developer experience and learning curve

6. **SWOT Analysis**
   - Strengths, Weaknesses, Opportunities, Threats for each major option
   - Strategic fit assessment for MVP requirements
   - Long-term viability considerations

7. **Implementation Roadmap**
   - Recommended approach for MVP development
   - Phase-wise implementation strategy
   - Success criteria and validation metrics

**Depth Level:** Comprehensive (3-5 pages per section with concrete examples and code snippets)

### Research Methodology

**Keywords and Technical Terms:**
- MCP Adapter Pattern, Model Context Protocol
- Bun runtime, Elysia framework, TypeScript
- Agent orchestration, distributed systems, prompt management
- pgvector, PostgreSQL, vector databases, semantic search
- Claude Code, Vercel AI SDK, LangChain, Mastra AI
- Performance optimization, hot reload, developer experience
- MVP architecture, scalability patterns, production deployment

**Special Requirements:**
- Include source URLs and citations for all technical claims
- Distinguish between established patterns vs experimental approaches
- Note confidence levels for different findings (High/Medium/Low)
- Prioritize recent (2024-2025) information, but include foundational concepts
- Focus on practical, implementable advice rather than theoretical discussions
- Include code examples and implementation patterns where relevant

**Validation Criteria:**
- Cross-reference multiple sources for key technical claims
- Identify conflicting viewpoints and provide balanced analysis
- Distinguish between facts, expert opinions, and speculation
- Note confidence levels for different findings
- Highlight gaps or areas needing more research
- Consider source credibility and recency

### Follow-up Strategy

**Potential Follow-up Questions:**
- If performance benchmarks are unclear, drill deeper into specific optimization techniques
- If implementation complexity is high, create detailed step-by-step guides
- If multiple frameworks appear viable, create proof-of-concept comparison
- If security considerations are unclear, conduct separate security analysis
- If cost implications are unclear, perform detailed TCO analysis

---

## Complete Research Prompt (Copy and Paste)

```
I need comprehensive research on three interconnected topics for my Claude Code Dev Platform Plugin development:

**PRIMARY RESEARCH TOPICS:**

1. **MCP Adapter Pattern Implementation in TypeScript**
   - Current best practices and implementation patterns
   - Integration with Bun runtime and Elysia framework
   - Performance optimization techniques
   - Real-world production examples and case studies
   - Common pitfalls and how to avoid them

2. **Agent Orchestration Frameworks Comparison**
   - Claude Code ecosystem (primary focus - current capabilities, roadmap, best practices)
   - Alternative frameworks: LangChain, Vercel AI SDK, Mastra AI, custom implementations
   - Feature comparison including prompt management, versioning, hot reload
   - Developer experience, learning curves, community support
   - Performance benchmarks and scalability characteristics

3. **Vector Databases for Prompt Management**
   - PostgreSQL + pgvector implementation patterns and optimizations
   - Comparison with dedicated vector databases (Pinecone, Weaviate, Chroma, etc.)
   - Performance characteristics for semantic search and prompt retrieval
   - Production deployment and scaling considerations
   - Cost analysis and operational complexity

**RESEARCH REQUIREMENTS:**

**Scope:** Current state (2024-2025) with forward-looking trends (2025-2027)

**Information Types Needed:**
- Performance benchmarks and quantitative data
- Production case studies and real-world implementations
- Code examples and architectural patterns
- Developer community health and metrics
- Cost analysis (development, operational, scaling)
- Security and reliability considerations

**Output Format:**
1. Executive Summary with top 3 recommendations
2. Detailed technical analysis per topic
3. Comprehensive comparison matrix of all options
4. SWOT analysis for major recommendations
5. Implementation roadmap for MVP development

**Context:**
I'm building a greenfield project using Bun + Elysia + PostgreSQL + pgvector. The goal is MVP validation of a distributed agent system with MCP pattern integration. Focus on practical, implementable solutions for expert-level development team.

**Validation Requirements:**
- Include source citations and URLs
- Distinguish between established patterns vs experimental approaches
- Note confidence levels for different findings
- Highlight conflicting viewpoints where they exist
- Prioritize recent sources but include foundational concepts

**Key Technical Terms:** MCP Adapter Pattern, Bun runtime, Elysia framework, agent orchestration, vector databases, pgvector, prompt management, TypeScript optimization, distributed architecture, MVP development patterns.
```

---

## Platform-Specific Usage Tips

### ChatGPT Deep Research Tips

**Pre-Execution:**
- Review the research plan carefully before it starts searching
- The prompt is quite comprehensive - expect 15-25 queries to be used
- Be prepared to answer clarifying questions thoroughly
- Consider setting aside 20-30 minutes for the research session

**During Research:**
- If ChatGPT asks for clarification on MCP vs other patterns, emphasize the Model Context Protocol specification
- For framework comparisons, highlight your specific stack (Bun + Elysia + TypeScript)
- When performance data is requested, specify your use case (distributed agents, prompt management)
- Focus on practical implementation advice over theoretical discussions

**Post-Research:**
- Immediately export/save the research before query limit resets
- Review citations and verify key technical claims
- Note areas where more specific research might be needed
- Consider doing follow-up research on the most promising approaches

**Query Management:**
- You have 25-250 queries/month depending on your ChatGPT tier
- This comprehensive research might use 15-25 queries
- Plan follow-up questions carefully to maximize value

---

## Research Execution Checklist

### Before Running Research

- [x] Prompt clearly states all three research topics
- [x] Scope and boundaries are well-defined (2024-2027, practical focus)
- [x] Output format specified (Executive Summary + Detailed Analysis + Comparison + SWOT)
- [x] Technical keywords included (MCP, Bun, Elysia, pgvector, etc.)
- [x] Source guidance provided (citations, recent sources, practical focus)
- [x] Validation criteria clear (distinguish fact vs opinion, note confidence levels)

### During Research

- [ ] Review research plan before execution starts
- [ ] Answer any clarifying questions about your specific stack
- [ ] Monitor progress if platform shows reasoning process
- [ ] Take notes on unexpected findings or gaps

### After Research Completion

- [ ] Export/save research immediately
- [ ] Verify key technical claims from multiple sources
- [ ] Check citation credibility and recency
- [ ] Identify conflicting information and note reasoning
- [ ] Note confidence levels for different recommendations
- [ ] Identify gaps requiring follow-up research
- [ ] Plan follow-up questions for deeper analysis

---

## Quick Follow-up Prompts

After the initial research, you might want to ask:

**If MCP Implementation is Complex:**
"Based on your research, provide a step-by-step implementation guide for MCP Adapter Pattern in TypeScript with Bun, including code examples and common pitfalls to avoid."

**If Framework Comparison is Inconclusive:**
"Create a detailed proof-of-concept plan comparing the top 2 agent orchestration frameworks for my specific use case, including implementation timeline and success criteria."

**If Vector Database Performance is Unclear:**
"Provide detailed performance optimization strategies for PostgreSQL + pgvector in a prompt management system, including indexing strategies and query optimization techniques."

---

## Metadata

**Workflow:** BMad Research Workflow - Deep Research Prompt Generator v2.0
**Generated:** 2025-10-21
**Research Type:** Deep Research Prompt
**Platform:** ChatGPT Deep Research (o3/o1)

---

_This research prompt was generated using BMad Method Research Workflow, incorporating best practices from ChatGPT Deep Research, Gemini Deep Research, Grok DeepSearch, and Claude Projects (2025)._