Quest Generator
MCP-powered agentic AI system for managing NPCs, quests, and relationships in tabletop RPG campaigns. Built to explore tool orchestration, multi-step reasoning, and state management with local LLMs.
Quick Start
bash# 1. Install dependencies
cd quest-mcp-server && npm install && npm run build
cd ../quest-agent && npm install && npm run build

# 2. Install Ollama and pull model
# Download from https://ollama.ai
ollama pull qwen2.5:32b

# 3. Run agent
cd quest-agent && npm start
```

## Architecture
```
quest-agent (Ollama client)
    ↕ stdio
quest-mcp-server (TypeScript/SQLite)
    ├─ NPC management (CRUD, disposition, notes)
    ├─ Quest management (create, status, search)
    └─ Generic relationships (bidirectional, any entity type)
What Works

Single-agent architecture with conditional workflows (no multi-agent complexity needed)
Location-aware semantic queries ("quests from the tavern" correctly filters by NPC location)
Automatic entity search before creation (prevents duplicates)
Multi-step execution (search → create → relate → summarize)
Perfect success rate with qwen2.5:32b on complex test cases

Key Design Choices
Generic relationships table: One table for all entity pairs (NPC↔Quest, NPC↔NPC, etc.) instead of separate junction tables. Trade-off: flexibility vs type safety.
Append-only notes: Timestamped text log instead of structured events. Trade-off: simpler LLM consumption vs queryable history.
Local LLM: Ollama with qwen2.5:32b. Trade-off: no API costs/complete privacy vs weaker reasoning than GPT-4.
Requirements

Node.js 18+
32GB RAM recommended
GPU with 12GB+ VRAM for optimal performance (tested on AMD RX 7900XT)
Smaller models work but degrade reasoning quality

Model Comparison
ModelTool UseSpeedNotesqwen2.5:32bExcellentFastRecommendedqwen3:30bPoorFastFrequent tool selection failuresllama3.3:70bGoodVery slowNot practical
Configuration
Edit quest-agent/src/config.ts to change:

Model selection
Max iterations (default: 10)
Context window size
System prompt

License
MIT
