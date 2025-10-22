/**
 * Workflow type definitions for the dev-plugin system
 */

export interface Workflow {
	id: string;
	name: string;
	description: string;
	status: WorkflowStatus;
	steps: WorkflowStep[];
	metadata: WorkflowMetadata;
	createdAt: Date;
	updatedAt: Date;
}

export enum WorkflowStatus {
	PENDING = "pending",
	IN_PROGRESS = "in_progress",
	COMPLETED = "completed",
	FAILED = "failed",
	CANCELLED = "cancelled",
}

export interface WorkflowStep {
	id: string;
	name: string;
	description: string;
	status: StepStatus;
	dependencies: string[];
	parameters: Record<string, any>;
	result?: any;
	startedAt?: Date;
	completedAt?: Date;
	error?: string;
}

export enum StepStatus {
	PENDING = "pending",
	IN_PROGRESS = "in_progress",
	COMPLETED = "completed",
	FAILED = "failed",
	SKIPPED = "skipped",
}

export interface WorkflowMetadata {
	author: string;
	version: string;
	tags: string[];
	estimatedDuration?: number;
	actualDuration?: number;
}
