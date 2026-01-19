import { db } from '../database.js';

export const questTools = {
  create_quest: {
    definition: {
      name: 'create_quest',
      description: 'Create a new quest in the world',
      inputSchema: {
        type: 'object',
        properties: {
          title: { 
            type: 'string', 
            description: 'Quest title' 
          },
          description: { 
            type: 'string', 
            description: 'Quest description and objectives' 
          },
          status: {
            type: 'string',
            enum: ['available', 'active', 'completed'],
            description: 'Quest status',
            default: 'available'
          },
          metadata: {
            type: 'object',
            description: 'Additional quest data (optional)',
            default: {}
          }
        },
        required: ['title', 'description']
      }
    },
    handler: async (args: any) => {
      const { title, description, status = 'available', metadata = {} } = args;
      
      const stmt = db.prepare(`
        INSERT INTO quests (title, description, status, metadata)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        title,
        description,
        status,
        JSON.stringify(metadata)
      );
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            quest_id: result.lastInsertRowid,
            message: `Created quest: ${title}`
          }, null, 2)
        }]
      };
    }
  },

  get_quest: {
    definition: {
      name: 'get_quest',
      description: 'Get details of a specific quest by ID',
      inputSchema: {
        type: 'object',
        properties: {
          quest_id: { 
            type: 'number', 
            description: 'ID of the quest' 
          }
        },
        required: ['quest_id']
      }
    },
    handler: async (args: any) => {
      const { quest_id } = args;
      
      const quest = db.prepare('SELECT * FROM quests WHERE id = ?').get(quest_id);
      
      if (!quest) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'Quest not found' }, null, 2)
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...(quest as any),
            metadata: JSON.parse((quest as any).metadata)
          }, null, 2)
        }]
      };
    }
  },

  list_quests: {
  definition: {
    name: 'list_quests',
    description: 'List quests with optional filters. Can filter by status or find all quests involving a specific NPC.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { 
          type: 'string',
          enum: ['available', 'active', 'completed'],
          description: 'Filter by quest status (optional)' 
        },
        npc_id: {
          type: 'number',
          description: 'Find all quests where this NPC is involved (as quest giver, affected party, etc.). Optional.'
        }
      }
    }
  },
  handler: async (args: any) => {
    const { status, npc_id } = args || {};
    
    let query: string;
    const params: any[] = [];
    
    if (npc_id) {
      // JOIN with relationships to find quests involving this NPC
      query = `
        SELECT DISTINCT q.* 
        FROM quests q
        JOIN relationships r ON (
          (r.entity_type_a = 'npc' AND r.entity_id_a = ? AND r.entity_type_b = 'quest' AND r.entity_id_b = q.id)
          OR
          (r.entity_type_b = 'npc' AND r.entity_id_b = ? AND r.entity_type_a = 'quest' AND r.entity_id_a = q.id)
        )
      `;
      params.push(npc_id, npc_id);
      
      if (status) {
        query += ' WHERE q.status = ?';
        params.push(status);
      }
    } else {
      query = 'SELECT * FROM quests';
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }
    }
    
    const quests = db.prepare(query).all(...params);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          count: quests.length,
          quests: quests.map((q: any) => ({
            ...q,
            metadata: JSON.parse(q.metadata)
          }))
        }, null, 2)
      }]
    };
  },

  list_quests_by_npc_name: {
  definition: {
    name: 'list_quests_by_npc_name',
    description: 'Find all quests involving an NPC by searching for the NPC name',
    inputSchema: {
      type: 'object',
      properties: {
        npc_name_search: { 
          type: 'string', 
          description: 'Search term for NPC name (e.g., "han" for Han the Hunter)' 
        }
      },
      required: ['npc_name_search']
    }
  },
  handler: async (args: any) => {
    const { npc_name_search } = args;
    
    // First find the NPC
    const npcs = db.prepare(
      'SELECT * FROM npcs WHERE name LIKE ?'
    ).all(`%${npc_name_search}%`);
    
    if (npcs.length === 0) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({ 
            error: `No NPC found matching "${npc_name_search}"`,
            count: 0,
            quests: []
          }, null, 2)
        }]
      };
    }
    
    // Use first matching NPC
    const npc = npcs[0] as any;
    
    // Then find quests
    const query = `
      SELECT DISTINCT q.* 
      FROM quests q
      JOIN relationships r ON (
        (r.entity_type_a = 'npc' AND r.entity_id_a = ? AND r.entity_type_b = 'quest' AND r.entity_id_b = q.id)
        OR
        (r.entity_type_b = 'npc' AND r.entity_id_b = ? AND r.entity_type_a = 'quest' AND r.entity_id_a = q.id)
      )
    `;
    
    const quests = db.prepare(query).all(npc.id, npc.id);
    
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          npc_found: { id: npc.id, name: npc.name },
          count: quests.length,
          quests: quests.map((q: any) => ({
            ...q,
            metadata: JSON.parse(q.metadata)
          }))
        }, null, 2)
      }]
    };
  }
},

  update_quest_status: {
    definition: {
      name: 'update_quest_status',
      description: 'Update the status of a quest',
      inputSchema: {
        type: 'object',
        properties: {
          quest_id: { 
            type: 'number',
            description: 'ID of the quest'
          },
          status: {
            type: 'string',
            enum: ['available', 'active', 'completed'],
            description: 'New status for the quest'
          }
        },
        required: ['quest_id', 'status']
      }
    },
    handler: async (args: any) => {
      const { quest_id, status } = args;
      
      const existing = db.prepare('SELECT id FROM quests WHERE id = ?').get(quest_id);
      if (!existing) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'Quest not found' }, null, 2)
          }]
        };
      }
      
      db.prepare('UPDATE quests SET status = ? WHERE id = ?').run(status, quest_id);
      
      const updated = db.prepare('SELECT * FROM quests WHERE id = ?').get(quest_id);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            quest: {
              ...(updated as any),
              metadata: JSON.parse((updated as any).metadata)
            }
          }, null, 2)
        }]
      };
    }
  }
}};