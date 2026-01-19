Quest Helper - MCP Learning Project

Educational implementation of Model Context Protocol (MCP) for managing NPCs and quests in tabletop RPG campaigns. Focus on agentic AI patterns, tool-use capabilities, and multi-step reasoning.
Status

Learning Project - Not Production Ready

    MCP Server: Fully implemented
    Simple CLI Client: Complete (testing interface)
    Agentic Client: In development
    Quest Management Tools: Planned

Learning Goals

    MCP Protocol: Understanding tool protocols beyond simple API calls
    Agentic Patterns: How LLMs decide which tools to use and when
    State Management: Structuring persistent state for LLM consumption

Features
MCP Server (Implemented)

NPC Management

    Create/read/update NPCs with descriptions, locations, metadata
    Player disposition tracking (-100 to +100)
    Timestamped append-only notes
    Location and name-based search

Relationship System

    Generic entity relationships (NPC↔NPC, NPC↔Quest, etc.)
    Bidirectional queries
    Relationship strength tracking
    No schema changes for new entity types

Agent Client (In Development)

    Local LLM integration via Ollama
    Multi-step reasoning loop
    Loop detection and recovery
    Conversation history management

Quick Start
Prerequisites
bash

node >= 18.0
npm >= 9.0

MCP Server
bash

cd quest-mcp-server
npm install
npm run build
npm start
```

Expected output (stderr):
```
Quest MCP Server running on stdio
Available tools: create_npc, get_npc, list_npcs, update_npc, create_relationship, query_relationships

Simple CLI Client (Testing)
bash

cd quest-cli-simple
npm install
npm run build
npm start

Agent Client
bash

# Install Ollama: https://ollama.ai
ollama pull qwen3:30b-a3b

cd quest-agent
npm install
npm run build
npm start
```

Model configuration in `src/config.ts`. Adjust based on available hardware.

## Project Structure
```
quest-mcp-server/          # MCP server
├── src/
│   ├── index.ts          # Server entry
│   ├── database.ts       # SQLite init
│   ├── types.ts          # Interfaces
│   └── tools/            # Tool implementations
├── data/
│   └── quest.db          # Auto-created

quest-cli-simple/          # Test client
quest-agent/               # Agentic client (WIP)

Database Schema
sql

CREATE TABLE npcs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  player_disposition INTEGER DEFAULT 0,  -- -100 to +100
  notes TEXT DEFAULT '',                 -- Timestamped log
  metadata TEXT DEFAULT '{}'             -- JSON escape hatch
);

CREATE TABLE relationships (
  id INTEGER PRIMARY KEY,
  entity_type_a TEXT NOT NULL,           -- 'npc', 'quest', 'location'
  entity_id_a INTEGER NOT NULL,
  relationship_type TEXT NOT NULL,
  entity_type_b TEXT NOT NULL,
  entity_id_b INTEGER NOT NULL,
  strength INTEGER DEFAULT 0,
  metadata TEXT DEFAULT '{}'
);

Key Design Decisions
Generic Relationships Table

Chosen: Single relationships table for all entity combinations

Alternative: Separate junction tables (npc_quests, npc_npcs)

Trade-offs:

    Pros: Easy extension, uniform queries
    Cons: Less type safety, requires application-level validation

Use separate tables when type safety is critical or entity-specific properties are needed.
Append-Only Notes vs Event Sourcing

Chosen: Timestamped text log in npc.notes

Alternative: Structured events table

Trade-offs:

    Pros: Simpler LLM consumption, YAGNI principle
    Cons: Can't query historical state, no event replay

Use event sourcing when you need state reconstruction or event pattern analysis.
Local LLM vs Cloud API

Chosen: Ollama with local models

Trade-offs:

    Pros: No API costs, complete privacy
    Cons: Weaker reasoning, requires 12-20GB VRAM

Recommendation: Prototype with Claude/GPT-4 API, deploy locally if cost/privacy matters.
Hardware Requirements

Minimum (Testing only):

    16GB RAM, any modern CPU

Recommended (Full agent):

    32GB RAM
    GPU with 12GB+ VRAM
    AMD RX 7900 XT or NVIDIA RTX 4070+

Simple CLI client runs on any system. Agent requirements depend on model choice.
Troubleshooting

"Cannot read property 'tools' of undefined"

    Verify server is running
    Check path to quest-mcp-server/dist/index.js

"Model not found"

    Run ollama pull <model-name>
    Verify with ollama list

Agent loops on same tool

    Check loop detection in logs
    Adjust maxIterations in config
    Consider stronger model

Open Questions

    How well do local LLMs (Jan 2025) handle multi-step reasoning?
    Which tools get used most frequently?
    Common failure patterns? (forgotten tools, wrong parameters, loops)
    Is simple notes field sufficient, or is structured memory necessary?

Contributing

Contributions that improve clarity or educational value are welcome. Production features are out of scope.
License

MIT
