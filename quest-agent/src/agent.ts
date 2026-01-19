import { Ollama } from 'ollama';
import { QuestMCPClient } from './mcp-client.js';
import { LLM_CONFIG } from './config.js';
import { Message, ToolCall } from './types.js';

export class QuestAgent {
  private ollama: Ollama;
  private mcpClient: QuestMCPClient;
  private maxIterations = LLM_CONFIG.maxIterations;
  private toolCallHistory: ToolCall[] = [];

  constructor(mcpClient: QuestMCPClient) {
    this.ollama = new Ollama({ host: LLM_CONFIG.endpoint });
    this.mcpClient = mcpClient;
  }

  async run(userMessage: string): Promise<string> {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`USER: ${userMessage}`);
    console.log('='.repeat(60));

    const messages: Message[] = [
      { role: 'system', content: LLM_CONFIG.systemPrompt },
      { role: 'user', content: userMessage }
    ];

    // Get MCP tools
    const toolsResponse = await this.mcpClient.connect();
    const tools = this.convertMCPToolsToOllamaFormat(toolsResponse.tools);

    for (let iteration = 0; iteration < this.maxIterations; iteration++) {
      console.log(`\n--- Iteration ${iteration + 1}/${this.maxIterations} ---`);

      // Call Ollama
      const response = await this.ollama.chat({
        model: LLM_CONFIG.model,
        messages: messages as any,
        tools,
        options: {
          temperature: LLM_CONFIG.temperature
        }
      });

      // Add assistant response to history
      messages.push({
        role: 'assistant',
        content: response.message.content,
        tool_calls: response.message.tool_calls
      });

      // Check if agent wants to use tools
      if (!response.message.tool_calls || response.message.tool_calls.length === 0) {
        console.log(`\nFinal Answer: ${response.message.content}`);
        return response.message.content;
      }

      // Execute tool calls (should be only one per iteration ideally)
      for (const toolCall of response.message.tool_calls) {
        console.log(`\nTool Call: ${toolCall.function.name}`);
        console.log(`   Arguments:`, JSON.stringify(toolCall.function.arguments, null, 2));

        try {
          const result = await this.mcpClient.callTool(
            toolCall.function.name,
            toolCall.function.arguments
          );

          const resultText = result.content[0].text;
          console.log(`   Result:`, resultText);

          // Add tool result to conversation
          messages.push({
            role: 'tool',
            content: resultText
          });

          this.toolCallHistory.push(toolCall);

        } catch (error) {
          const errorMsg = `Tool execution failed: ${error}`;
          console.log(`   Error:`, errorMsg);
          
          messages.push({
            role: 'tool',
            content: JSON.stringify({ error: errorMsg })
          });
        }
      }

      // Safety check: detect loops
      if (this.isStuck()) {
        return "I seem to be stuck in a loop. Could you rephrase your request or be more specific?";
      }
    }

    return `Reached maximum iterations (${this.maxIterations}). The task may be too complex. Try breaking it into smaller requests.`;
  }

  private convertMCPToolsToOllamaFormat(mcpTools: any[]): any[] {
    return mcpTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));
  }

  private logToolSequence: Array<{
  iteration: number;
  tool: string;
  args: any;
  result: string;
  timestamp: number;
}> = [];

  private isStuck(): boolean {
    if (this.toolCallHistory.length < 3) return false;
    
    const last3 = this.toolCallHistory.slice(-3);
    const allSameTool = last3.every(call => 
      call.function.name === last3[0].function.name
    );
    
    if (allSameTool) {
      console.log(`\nWarning: Same tool called 3 times in a row!`);
    }
    
    return allSameTool;
  }

  resetHistory() {
    this.toolCallHistory = [];
  }
}