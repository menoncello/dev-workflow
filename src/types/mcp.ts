/**
 * MCP (Model Context Protocol) type definitions for the dev-plugin system
 */

export interface MCPTool {
  id: string;
  name: string;
  description: string;
  inputSchema: MCPInputSchema;
  outputSchema: MCPOutputSchema;
  adapter: MCPAdapter;
  configuration: MCPConfiguration;
}

export interface MCPInputSchema {
  type: "object";
  properties: Record<string, MCPProperty>;
  required: string[];
}

export interface MCPOutputSchema {
  type: "object";
  properties: Record<string, MCPProperty>;
}

export interface MCPProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: MCPProperty;
  properties?: Record<string, MCPProperty>;
  required?: string[];
}

export interface MCPAdapter {
  name: string;
  type: MCPAdapterType;
  endpoint?: string;
  credentials?: MCPCredentials;
}

export enum MCPAdapterType {
  REST_API = "rest_api",
  WEBHOOK = "webhook",
  DATABASE = "database",
  FILE_SYSTEM = "file_system",
  CUSTOM = "custom",
}

export interface MCPCredentials {
  apiKey?: string;
  token?: string;
  username?: string;
  password?: string;
  headers?: Record<string, string>;
}

export interface MCPConfiguration {
  timeout: number;
  retries: number;
  retryDelay: number;
  cacheEnabled: boolean;
  cacheTTL?: number;
}
