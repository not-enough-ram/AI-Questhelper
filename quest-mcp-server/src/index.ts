import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initDatabase } from './database.js';
import { npcTools } from './tools/npc-tools.js';
import { relationshipTools } from './tools/relationship-tools.js';
import { questTools } from './tools/quest-tools.js';

// Initialize database
initDatabase();

// Create MCP server
const server = new Server(
  {
    name: 'quest-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool type definition
type ToolDefinition = {
  definition: {
    name: string;
    description: string;
    inputSchema: any;
  };
  handler: (args: any) => Promise<any>;
};

// Collect all tools
const allTools: Record<string, ToolDefinition> = {
  ...npcTools,
  ...relationshipTools
  ...questTools
};

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.values(allTools).map((tool: ToolDefinition) => tool.definition)
  };
});

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const toolName = request.params.name;
  const tool = allTools[toolName];
  
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  
  try {
    return await tool.handler(request.params.arguments);
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          error: `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
        }, null, 2)
      }],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Quest MCP Server running on stdio');
  console.error('Available tools:', Object.keys(allTools).join(', '));
}

main().catch((error) => {
  console.error('Fatal server error:', error);
  process.exit(1);
});