/**
 * Integration tests for the API endpoints
 */

import { beforeAll, describe, expect, it } from "bun:test";
import { Elysia } from "elysia";

// Import the app (we'll need to export it from index.ts for testing)
// For now, we'll create a test instance
import agentsRouter from "../../src/routes/api/v1/agents";
import systemRouter from "../../src/routes/api/v1/system";
import toolsRouter from "../../src/routes/api/v1/tools";
import workflowsRouter from "../../src/routes/api/v1/workflows";

describe("API Integration Tests", () => {
	let app: Elysia;

	beforeAll(() => {
		// Create test app instance
		app = new Elysia()
			.use(agentsRouter)
			.use(workflowsRouter)
			.use(toolsRouter)
			.use(systemRouter);
	});

	describe("System Endpoints", () => {
		it("should return health check", async () => {
			const response = await app
				.handle(new Request("http://localhost:3000/api/system/health"))
				.then((res) => res.json());

			expect(response).toHaveProperty("status", "healthy");
			expect(response).toHaveProperty("timestamp");
			expect(response).toHaveProperty("uptime");
			expect(response).toHaveProperty("version");
			expect(response).toHaveProperty("environment");
		});

		it("should return system status", async () => {
			const response = await app
				.handle(new Request("http://localhost:3000/api/system/status"))
				.then((res) => res.json());

			expect(response).toHaveProperty("status", "operational");
			expect(response).toHaveProperty("services");
			expect(response).toHaveProperty("metrics");
			expect(response.services).toHaveProperty("api", "healthy");
		});

		it("should return system metrics", async () => {
			const response = await app
				.handle(new Request("http://localhost:3000/api/system/metrics"))
				.then((res) => res.json());

			expect(response).toHaveProperty("timestamp");
			expect(response).toHaveProperty("process");
			expect(response).toHaveProperty("system");
			expect(response.process).toHaveProperty("pid");
			expect(response.process).toHaveProperty("uptime");
			expect(response.process).toHaveProperty("memoryUsage");
		});

		it("should return version information", async () => {
			const response = await app
				.handle(new Request("http://localhost:3000/api/system/version"))
				.then((res) => res.json());

			expect(response).toHaveProperty("api");
			expect(response).toHaveProperty("elysia");
			expect(response).toHaveProperty("bun");
			expect(response).toHaveProperty("node");
			expect(response).toHaveProperty("timestamp");
		});
	});

	describe("Agent Endpoints", () => {
		it("should list agents", async () => {
			const response = await app
				.handle(new Request("http://localhost:3000/api/agents/"))
				.then((res) => res.json());

			expect(response).toHaveProperty("agents");
			expect(response).toHaveProperty("total", 0);
			expect(response).toHaveProperty("message");
		});

		it("should create an agent", async () => {
			const agentData = {
				name: "Test Agent",
				type: "developer",
				configuration: {
					capabilities: ["code", "test"],
					parameters: {},
					resourceLimits: {
						maxMemory: 1024,
						maxCpuTime: 300,
						maxExecutionTime: 600,
					},
				},
			};

			const response = await app
				.handle(
					new Request("http://localhost:3000/api/agents/", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(agentData),
					}),
				)
				.then((res) => res.json());

			expect(response).toHaveProperty("message");
			expect(response).toHaveProperty("data");
			expect(response.data).toEqual(agentData);
		});

		it("should get an agent", async () => {
			const response = await app
				.handle(new Request("http://localhost:3000/api/agents/test-id"))
				.then((res) => res.json());

			expect(response).toHaveProperty("message");
			expect(response).toHaveProperty("id", "test-id");
		});
	});

	describe("Workflow Endpoints", () => {
		it("should list workflows", async () => {
			const response = await app
				.handle(new Request("http://localhost:3000/api/workflows/"))
				.then((res) => res.json());

			expect(response).toHaveProperty("workflows");
			expect(response).toHaveProperty("total", 0);
			expect(response).toHaveProperty("message");
		});

		it("should create a workflow", async () => {
			const workflowData = {
				name: "Test Workflow",
				description: "A test workflow",
				steps: [
					{
						name: "Step 1",
						description: "First step",
						dependencies: [],
						parameters: {},
					},
				],
				metadata: {
					author: "test",
					version: "1.0.0",
					tags: ["test"],
				},
			};

			const response = await app
				.handle(
					new Request("http://localhost:3000/api/workflows/", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(workflowData),
					}),
				)
				.then((res) => res.json());

			expect(response).toHaveProperty("message");
			expect(response).toHaveProperty("data");
			expect(response.data).toEqual(workflowData);
		});
	});

	describe("Tool Endpoints", () => {
		it("should list tools", async () => {
			const response = await app
				.handle(new Request("http://localhost:3000/api/tools/"))
				.then((res) => res.json());

			expect(response).toHaveProperty("tools");
			expect(response).toHaveProperty("total", 0);
			expect(response).toHaveProperty("message");
		});

		it("should create a tool", async () => {
			const toolData = {
				name: "Test Tool",
				description: "A test tool",
				inputSchema: {
					type: "object",
					properties: {
						input: { type: "string" },
					},
					required: ["input"],
				},
				outputSchema: {
					type: "object",
					properties: {
						result: { type: "string" },
					},
				},
				adapter: {
					name: "test-adapter",
					type: "custom",
				},
				configuration: {
					timeout: 30000,
					retries: 3,
					retryDelay: 1000,
					cacheEnabled: true,
				},
			};

			const response = await app
				.handle(
					new Request("http://localhost:3000/api/tools/", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(toolData),
					}),
				)
				.then((res) => res.json());

			expect(response).toHaveProperty("message");
			expect(response).toHaveProperty("data");
			expect(response.data).toEqual(toolData);
		});
	});
});
