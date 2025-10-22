/**
 * Error handling utilities for the dev-plugin system
 */

export class DevPluginError extends Error {
	public readonly code: string;
	public readonly statusCode: number;
	public readonly context?: Record<string, any>;

	constructor(
		message: string,
		code: string,
		statusCode = 500,
		context?: Record<string, any>,
	) {
		super(message);
		this.name = "DevPluginError";
		this.code = code;
		this.statusCode = statusCode;
		this.context = context;

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, DevPluginError);
		}
	}
}

export class ValidationError extends DevPluginError {
	constructor(message: string, context?: Record<string, any>) {
		super(message, "VALIDATION_ERROR", 400, context);
		this.name = "ValidationError";
	}
}

export class NotFoundError extends DevPluginError {
	constructor(resource: string, id?: string) {
		const message = id
			? `${resource} with id ${id} not found`
			: `${resource} not found`;
		super(message, "NOT_FOUND", 404, { resource, id });
		this.name = "NotFoundError";
	}
}

export class ConflictError extends DevPluginError {
	constructor(message: string, context?: Record<string, any>) {
		super(message, "CONFLICT", 409, context);
		this.name = "ConflictError";
	}
}

export class AgentError extends DevPluginError {
	constructor(
		message: string,
		agentId?: string,
		context?: Record<string, any>,
	) {
		super(message, "AGENT_ERROR", 500, { agentId, ...context });
		this.name = "AgentError";
	}
}

export class WorkflowError extends DevPluginError {
	constructor(
		message: string,
		workflowId?: string,
		stepId?: string,
		context?: Record<string, any>,
	) {
		super(message, "WORKFLOW_ERROR", 500, {
			workflowId,
			stepId,
			...context,
		});
		this.name = "WorkflowError";
	}
}

export class MCPError extends DevPluginError {
	constructor(
		message: string,
		toolId?: string,
		context?: Record<string, any>,
	) {
		super(message, "MCP_ERROR", 500, { toolId, ...context });
		this.name = "MCPError";
	}
}

/**
 * Error handler middleware for Elysia
 */
export function handleError(error: Error): {
	error: string;
	code: string;
	statusCode: number;
	context?: any;
} {
	if (error instanceof DevPluginError) {
		return {
			error: error.message,
			code: error.code,
			statusCode: error.statusCode,
			context: error.context,
		};
	}

	// Handle Prisma errors
	if (error.name === "PrismaClientKnownRequestError") {
		return {
			error: "Database operation failed",
			code: "DATABASE_ERROR",
			statusCode: 500,
			context: { originalError: error.message },
		};
	}

	// Handle JWT errors
	if (error.name === "JWTError") {
		return {
			error: "Authentication failed",
			code: "AUTH_ERROR",
			statusCode: 401,
		};
	}

	// Generic error
	return {
		error:
			process.env.NODE_ENV === "production"
				? "Internal server error"
				: error.message,
		code: "INTERNAL_ERROR",
		statusCode: 500,
		context:
			process.env.NODE_ENV !== "production"
				? { originalError: error.stack }
				: undefined,
	};
}
