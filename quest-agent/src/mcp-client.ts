import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MCPToolResult } from './types.js';

export class QuestMCPClient {
  private client: Client;
  private transport?: StdioClientTransport;

  constructor() {
    this.client = new Client(
      {
        name: 'quest-agent',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  async connect() {
    const serverPath = '../quest-mcp-server/dist/index.js';
    
    this.transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
    });

    await this.client.connect(this.transport);
    return this.client.listTools();
  }

  async callTool(name: string, args: any): Promise<MCPToolResult> {
    const result = await this.client.callTool({ name, arguments: args });
    return result as MCPToolResult;
  }

  async disconnect() {
    await this.client.close();
  }
}