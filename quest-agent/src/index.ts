import * as readline from 'readline';
import { QuestMCPClient } from './mcp-client.js';
import { QuestAgent } from './agent.js';

async function main() {
  console.log('Quest Agent Starting...\n');
  
  const mcpClient = new QuestMCPClient();
  const agent = new QuestAgent(mcpClient);

  // Connect to MCP server
  await mcpClient.connect();
  console.log('Connected to Quest MCP Server\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log('='  .repeat(60));
  console.log('Quest Agent Ready!');
  console.log('='  .repeat(60));
  console.log('Commands:');
  console.log('  - Type your request and press Enter');
  console.log('  - Type "exit" to quit');
  console.log('  - Type "reset" to clear conversation history');
  console.log('='  .repeat(60));
  console.log();

  const askQuestion = () => {
    rl.question('You: ', async (input) => {
      const trimmed = input.trim();

      if (trimmed.toLowerCase() === 'exit') {
        console.log('\nGoodbye!');
        await mcpClient.disconnect();
        rl.close();
        return;
      }

      if (trimmed.toLowerCase() === 'reset') {
        agent.resetHistory();
        console.log('\nConversation history cleared\n');
        askQuestion();
        return;
      }

      if (!trimmed) {
        askQuestion();
        return;
      }

      try {
        await agent.run(trimmed);
      } catch (error) {
        console.error('\nError:', error);
      }

      console.log(); // Empty line before next prompt
      askQuestion();
    });
  };

  askQuestion();
}

main().catch(console.error);