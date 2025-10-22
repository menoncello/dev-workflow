/**
 * Agent type definitions for the dev-plugin system
 */

export interface Agent {
	id: string;
	name: string;
	type: AgentType;
	status: AgentStatus;
	configuration: AgentConfiguration;
	createdAt: Date;
	updatedAt: Date;
}

export enum AgentType {
	DEVELOPER = "developer",
	ANALYST = "analyst",
	ARCHITECT = "architect",
	TESTER = "tester",
}

export enum AgentStatus {
	IDLE = "idle",
	ACTIVE = "active",
	PAUSED = "paused",
	ERROR = "error",
	COMPLETED = "completed",
}

export interface AgentConfiguration {
	capabilities: string[];
	parameters: Record<string, any>;
	resourceLimits: ResourceLimits;
}

export interface ResourceLimits {
	maxMemory: number;
	maxCpuTime: number;
	maxExecutionTime: number;
}
