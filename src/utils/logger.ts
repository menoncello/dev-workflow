/**
 * Structured logging utility for the dev-plugin system
 */

export enum LogLevel {
	DEBUG = "debug",
	INFO = "info",
	WARN = "warn",
	ERROR = "error",
}

export interface LogEntry {
	timestamp: Date;
	level: LogLevel;
	message: string;
	context?: Record<string, any>;
	error?: Error;
	traceId?: string;
}

export class Logger {
	private context: Record<string, any>;

	constructor(context: Record<string, any> = {}) {
		this.context = context;
	}

	private log(
		level: LogLevel,
		message: string,
		additionalContext?: Record<string, any>,
		error?: Error,
	): void {
		const entry: LogEntry = {
			timestamp: new Date(),
			level,
			message,
			context: { ...this.context, ...additionalContext },
			error,
			traceId: this.generateTraceId(),
		};

		// In development, log to console
		if (process.env.NODE_ENV !== "production") {
			this.consoleLog(entry);
		}

		// In production, this could be sent to a logging service
		// TODO: Implement production logging (e.g., to file, external service)
	}

	debug(message: string, context?: Record<string, any>): void {
		this.log(LogLevel.DEBUG, message, context);
	}

	info(message: string, context?: Record<string, any>): void {
		this.log(LogLevel.INFO, message, context);
	}

	warn(message: string, context?: Record<string, any>): void {
		this.log(LogLevel.WARN, message, context);
	}

	error(message: string, error?: Error, context?: Record<string, any>): void {
		this.log(LogLevel.ERROR, message, context, error);
	}

	private consoleLog(entry: LogEntry): void {
		const timestamp = entry.timestamp.toISOString();
		const contextStr = entry.context
			? ` ${JSON.stringify(entry.context)}`
			: "";
		const errorStr = entry.error
			? ` ${entry.error.stack || entry.error.message}`
			: "";

		switch (entry.level) {
			case LogLevel.DEBUG:
				console.debug(
					`[${timestamp}] DEBUG: ${entry.message}${contextStr}${errorStr}`,
				);
				break;
			case LogLevel.INFO:
				console.info(
					`[${timestamp}] INFO: ${entry.message}${contextStr}${errorStr}`,
				);
				break;
			case LogLevel.WARN:
				console.warn(
					`[${timestamp}] WARN: ${entry.message}${contextStr}${errorStr}`,
				);
				break;
			case LogLevel.ERROR:
				console.error(
					`[${timestamp}] ERROR: ${entry.message}${contextStr}${errorStr}`,
				);
				break;
		}
	}

	private generateTraceId(): string {
		return (
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15)
		);
	}

	child(additionalContext: Record<string, any>): Logger {
		return new Logger({ ...this.context, ...additionalContext });
	}
}

export const logger = new Logger();
