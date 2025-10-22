import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import env from "#helpers/env";
import authRoutes from "#modules/auth/routes";
import meRoutes from "#modules/me/routes";
import userRoutes from "#modules/user/routes";
import agentsRouter from "#routes/api/v1/agents";
import systemRouter from "#routes/api/v1/system";
import toolsRouter from "#routes/api/v1/tools";
import workflowsRouter from "#routes/api/v1/workflows";

console.time("⌛ Startup Time");

new Elysia()
	.use(swagger())
	.use(serverTiming())
	.use(cors())
	.group("/api", (app) =>
		app
			.use(userRoutes)
			.use(authRoutes)
			.use(meRoutes)
			.use(agentsRouter)
			.use(workflowsRouter)
			.use(toolsRouter)
			.use(systemRouter)
			.onError(({ error, ...ctx }) => {
				console.log({ ctx });
			}),
	)
	.listen(env.SERVER_PORT, (server) => {
		console.timeEnd("⌛ Startup Time");
		console.log(`🌱 NODE_ENV: ${env.NODE_ENV || "development"}`);
		console.log(`🍙 Bun Version: ${Bun.version}`);
		console.log(
			`🦊 Elysia.js Version: ${require("elysia/package.json").version}`,
		);
		console.log(
			`🗃️  Prisma Version: ${require("@prisma/client/package.json").version}`,
		);
		console.log(`🚀 Server is running at ${server.url}`);
		console.log("--------------------------------------------------");
	});
