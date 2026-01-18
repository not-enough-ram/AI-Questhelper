import { db } from '../database.js';
import { NPC } from '../types.js';

export const npcTools = {
  create_npc: {
    definition: {
      name: 'create_npc',
      description: 'Create a new NPC in the world',
      inputSchema: {
        type: 'object',
        properties: {
          name: { 
            type: 'string', 
            description: 'Name of the NPC' 
          },
          description: { 
            type: 'string', 
            description: 'Physical description and personality traits' 
          },
          location: { 
            type: 'string', 
            description: 'Current location of the NPC' 
          },
          metadata: {
            type: 'object',
            description: 'Additional custom fields (optional)',
            default: {}
          }
        },
        required: ['name', 'description', 'location']
      }
    },
    handler: async (args: any) => {
      const { name, description, location, metadata = {} } = args;
      
      const stmt = db.prepare(`
        INSERT INTO npcs (name, description, location, metadata)
        VALUES (?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        name, 
        description, 
        location, 
        JSON.stringify(metadata)
      );
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            npc_id: result.lastInsertRowid,
            message: `Created NPC: ${name} at ${location}`
          }, null, 2)
        }]
      };
    }
  },

  get_npc: {
    definition: {
      name: 'get_npc',
      description: 'Get details of a specific NPC by ID including disposition and notes',
      inputSchema: {
        type: 'object',
        properties: {
          npc_id: { 
            type: 'number', 
            description: 'ID of the NPC' 
          }
        },
        required: ['npc_id']
      }
    },
    handler: async (args: any) => {
      const { npc_id } = args;
      
      const npc = db.prepare('SELECT * FROM npcs WHERE id = ?').get(npc_id);
      
      if (!npc) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'NPC not found' }, null, 2)
          }]
        };
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            ...(npc as any),
            metadata: JSON.parse((npc as any).metadata)
          }, null, 2)
        }]
      };
    }
  },

  list_npcs: {
    definition: {
      name: 'list_npcs',
      description: 'List NPCs with optional filters for location and name search',
      inputSchema: {
        type: 'object',
        properties: {
          location: { 
            type: 'string', 
            description: 'Filter by location (optional)' 
          },
          name_search: { 
            type: 'string', 
            description: 'Search in NPC names (optional, case-insensitive)' 
          }
        }
      }
    },
    handler: async (args: any) => {
      const { location, name_search } = args || {};
      
      let query = 'SELECT * FROM npcs WHERE 1=1';
      const params: any[] = [];
      
      if (location) {
        query += ' AND location = ?';
        params.push(location);
      }
      
      if (name_search) {
        query += ' AND name LIKE ?';
        params.push(`%${name_search}%`);
      }
      
      const npcs = db.prepare(query).all(...params);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            count: npcs.length,
            npcs: npcs.map((npc: any) => ({
              ...npc,
              metadata: JSON.parse(npc.metadata)
            }))
          }, null, 2)
        }]
      };
    }
  },

  update_npc: {
    definition: {
      name: 'update_npc',
      description: 'Update NPC properties including disposition and notes. Notes are append-only with timestamps.',
      inputSchema: {
        type: 'object',
        properties: {
          npc_id: { 
            type: 'number',
            description: 'ID of the NPC to update'
          },
          player_disposition: { 
            type: 'number',
            description: 'New disposition value towards player (-100=hostile, 0=neutral, +100=friendly). Replaces current value.',
            minimum: -100,
            maximum: 100
          },
          notes: {
            type: 'string',
            description: 'Important information or events to remember. Gets appended with timestamp.'
          },
          location: { 
            type: 'string',
            description: 'New location of the NPC'
          }
        },
        required: ['npc_id']
      }
    },
    handler: async (args: any) => {
      const { npc_id, player_disposition, notes, location } = args;
      
      // Check if NPC exists
      const existing = db.prepare('SELECT id FROM npcs WHERE id = ?').get(npc_id);
      if (!existing) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ error: 'NPC not found' }, null, 2)
          }]
        };
      }
      
      const updates: string[] = [];
      const params: any[] = [];
      
      if (player_disposition !== undefined) {
        updates.push('player_disposition = ?');
        params.push(player_disposition);
      }
      
      if (notes !== undefined && notes.trim() !== '') {
        // Append with timestamp
        const timestamp = new Date().toISOString();
        const entry = `\n[${timestamp}] ${notes}`;
        updates.push('notes = notes || ?');
        params.push(entry);
      }
      
      if (location !== undefined) {
        updates.push('location = ?');
        params.push(location);
      }
      
      if (updates.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({ 
              error: 'No updates provided. Specify at least one of: player_disposition, notes, location' 
            }, null, 2)
          }]
        };
      }
      
      params.push(npc_id);
      db.prepare(`UPDATE npcs SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      
      // Return updated NPC
      const updated = db.prepare('SELECT * FROM npcs WHERE id = ?').get(npc_id);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            npc: {
              ...(updated as any),
              metadata: JSON.parse((updated as any).metadata)
            }
          }, null, 2)
        }]
      };
    }
  }
};