import { db } from '../database.js';

export const relationshipTools = {
  create_relationship: {
    definition: {
      name: 'create_relationship',
      description: 'Create a relationship between two entities (NPC-Quest, NPC-NPC, Quest-Location, etc.)',
      inputSchema: {
        type: 'object',
        properties: {
          entity_type_a: { 
            type: 'string', 
            description: 'Type of first entity',
            enum: ['npc', 'quest', 'location']
          },
          entity_id_a: { 
            type: 'number', 
            description: 'ID of first entity' 
          },
          relationship_type: { 
            type: 'string', 
            description: 'Type of relationship (e.g., gives_quest, enemy_of, ally_of, located_in, knows_about)' 
          },
          entity_type_b: { 
            type: 'string', 
            description: 'Type of second entity',
            enum: ['npc', 'quest', 'location']
          },
          entity_id_b: { 
            type: 'number', 
            description: 'ID of second entity' 
          },
          strength: {
            type: 'number',
            description: 'Strength of relationship (-100 to 100, optional). Use for intensity, closeness, or importance.',
            minimum: -100,
            maximum: 100,
            default: 0
          },
          metadata: {
            type: 'object',
            description: 'Additional relationship data (optional)',
            default: {}
          }
        },
        required: ['entity_type_a', 'entity_id_a', 'relationship_type', 'entity_type_b', 'entity_id_b']
      }
    },
    handler: async (args: any) => {
      const { 
        entity_type_a, 
        entity_id_a, 
        relationship_type, 
        entity_type_b, 
        entity_id_b,
        strength = 0,
        metadata = {}
      } = args;
      
      const stmt = db.prepare(`
        INSERT INTO relationships 
        (entity_type_a, entity_id_a, relationship_type, entity_type_b, entity_id_b, strength, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = stmt.run(
        entity_type_a,
        entity_id_a,
        relationship_type,
        entity_type_b,
        entity_id_b,
        strength,
        JSON.stringify(metadata)
      );
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            relationship_id: result.lastInsertRowid,
            message: `Created relationship: ${entity_type_a}#${entity_id_a} --[${relationship_type}]--> ${entity_type_b}#${entity_id_b}`
          }, null, 2)
        }]
      };
    }
  },

  query_relationships: {
    definition: {
      name: 'query_relationships',
      description: 'Query relationships for an entity. Returns all relationships where the entity appears (bidirectional search).',
      inputSchema: {
        type: 'object',
        properties: {
          entity_type: { 
            type: 'string',
            description: 'Type of entity to query',
            enum: ['npc', 'quest', 'location']
          },
          entity_id: { 
            type: 'number',
            description: 'ID of entity to query'
          },
          relationship_type: {
            type: 'string',
            description: 'Filter by specific relationship type (optional)'
          }
        },
        required: ['entity_type', 'entity_id']
      }
    },
    handler: async (args: any) => {
      const { entity_type, entity_id, relationship_type } = args;
      
      let query = `
        SELECT * FROM relationships 
        WHERE (entity_type_a = ? AND entity_id_a = ?)
           OR (entity_type_b = ? AND entity_id_b = ?)
      `;
      const params = [entity_type, entity_id, entity_type, entity_id];
      
      if (relationship_type) {
        query += ' AND relationship_type = ?';
        params.push(relationship_type);
      }
      
      const relationships = db.prepare(query).all(...params);
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            count: relationships.length,
            relationships: relationships.map((rel: any) => ({
              ...rel,
              metadata: JSON.parse(rel.metadata)
            }))
          }, null, 2)
        }]
      };
    }
  }
};