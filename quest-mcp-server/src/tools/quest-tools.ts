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
      description: 'List quests with optional status filter',
      inputSchema: {
        type: 'object',
        properties: {
          status: { 
            type: 'string',
            enum: ['available', 'active', 'completed'],
            description: 'Filter by quest status (optional)' 
          }
        }
      }
    },
    handler: async (args: any) => {
      const { status } = args || {};
      
      let query = 'SELECT * FROM quests';
      const params: any[] = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
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
};