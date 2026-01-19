import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { MCPToolResult } from './types.js';

export class QuestMCPClient {
  private client: Client;
  private transport?: StdioClientTransport;

  constructor() {
    this.client = new Client(
      {
        name: 'quest-cli-simple',
        version: '1.0.0',
      },
      {
        capabilities: {},
      }
    );
  }

  async connect() {
    console.log('Connecting to Quest MCP Server...');
    
    const serverPath = '../quest-mcp-server/dist/index.js';
    
    this.transport = new StdioClientTransport({
      command: 'node',
      args: [serverPath],
    });

    await this.client.connect(this.transport);
    console.log('✅ Connected to Quest MCP Server\n');

    const tools = await this.client.listTools();
    console.log('Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log();

    return tools.tools;
  }

  async callTool(name: string, args: any): Promise<MCPToolResult> {
    console.log(`\n🔧 Calling tool: ${name}`);
    console.log(`   Arguments:`, JSON.stringify(args, null, 2));
    
    const result = await this.client.callTool({ name, arguments: args });
    
    // Type assertion da wir das Format kennen
    const typedResult = result as MCPToolResult;
    
    console.log(`   Result:`, typedResult.content[0].text);
    return typedResult;
  }

  async disconnect() {
    await this.client.close();
    console.log('\n✅ Disconnected');
  }
}