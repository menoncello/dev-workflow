/**
 * Agent lifecycle management service for the dev-plugin system
 */

import {
	type Agent,
	type AgentConfiguration,
	AgentStatus,
	type AgentType,
} from "#types/agent";
import { AgentError } from "#utils/errors";
import { logger } from "#utils/logger";

export class AgentOrchestrator {
	private agents: Map<string, Agent> = new Map();
	private runningAgents: Map<string, any> = new Map(); // TODO: Replace with actual agent processes

	async createAgent(
		name: string,
		type: AgentType,
		configuration: AgentConfiguration,
	): Promise<Agent> {
		try {
			const agent: Agent = {
				id: this.generateAgentId(),
				name,
				type,
				status: AgentStatus.IDLE,
				configuration,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			this.agents.set(agent.id, agent);
			logger.info("Agent created", { agentId: agent.id, name, type });

			return agent;
		} catch (error) {
			logger.error("Failed to create agent", error as Error, {
				name,
				type,
			});
			throw new AgentError("Failed to create agent", undefined, {
				name,
				type,
				error,
			});
		}
	}

	async startAgent(agentId: string): Promise<void> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new AgentError("Agent not found", agentId);
		}

		if (agent.status !== AgentStatus.IDLE) {
			throw new AgentError("Agent is not idle", agentId, {
				currentStatus: agent.status,
			});
		}

		try {
			// TODO: Implement actual agent startup logic
			agent.status = AgentStatus.ACTIVE;
			agent.updatedAt = new Date();
			this.runningAgents.set(agentId, {
				/* agent process info */
			});

			logger.info("Agent started", {
				agentId,
				name: agent.name,
				type: agent.type,
			});
		} catch (error) {
			agent.status = AgentStatus.ERROR;
			agent.updatedAt = new Date();
			logger.error("Failed to start agent", error as Error, { agentId });
			throw new AgentError("Failed to start agent", agentId, { error });
		}
	}

	async stopAgent(agentId: string): Promise<void> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new AgentError("Agent not found", agentId);
		}

		if (agent.status !== AgentStatus.ACTIVE) {
			throw new AgentError("Agent is not active", agentId, {
				currentStatus: agent.status,
			});
		}

		try {
			// TODO: Implement actual agent shutdown logic
			this.runningAgents.delete(agentId);
			agent.status = AgentStatus.IDLE;
			agent.updatedAt = new Date();

			logger.info("Agent stopped", {
				agentId,
				name: agent.name,
				type: agent.type,
			});
		} catch (error) {
			agent.status = AgentStatus.ERROR;
			agent.updatedAt = new Date();
			logger.error("Failed to stop agent", error as Error, { agentId });
			throw new AgentError("Failed to stop agent", agentId, { error });
		}
	}

	async getAgent(agentId: string): Promise<Agent | null> {
		return this.agents.get(agentId) || null;
	}

	async listAgents(): Promise<Agent[]> {
		return Array.from(this.agents.values());
	}

	async updateAgent(
		agentId: string,
		updates: Partial<Agent>,
	): Promise<Agent> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new AgentError("Agent not found", agentId);
		}

		// Only allow certain fields to be updated
		const allowedUpdates = ["name", "configuration"];
		const filteredUpdates = Object.keys(updates)
			.filter((key) => allowedUpdates.includes(key))
			.reduce(
				(obj, key) => ({ ...obj, [key]: updates[key as keyof Agent] }),
				{},
			);

		Object.assign(agent, filteredUpdates);
		agent.updatedAt = new Date();

		logger.info("Agent updated", {
			agentId,
			updates: Object.keys(filteredUpdates),
		});
		return agent;
	}

	async deleteAgent(agentId: string): Promise<void> {
		const agent = this.agents.get(agentId);
		if (!agent) {
			throw new AgentError("Agent not found", agentId);
		}

		if (agent.status === AgentStatus.ACTIVE) {
			await this.stopAgent(agentId);
		}

		this.agents.delete(agentId);
		logger.info("Agent deleted", {
			agentId,
			name: agent.name,
			type: agent.type,
		});
	}

	private generateAgentId(): string {
		return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
	}

	// TODO: Add more orchestrator functionality:
	// - Agent health monitoring
	// - Resource limit enforcement
	// - Agent communication
	// - Agent scheduling and load balancing
	// - Agent version management
}

// Singleton instance
export const agentOrchestrator = new AgentOrchestrator();
