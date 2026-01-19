import { QuestMCPClient } from './client.js';

async function main() {
  const client = new QuestMCPClient();
  
  try {
    await client.connect();

    // Test 1: Create NPC
    console.log('='.repeat(50));
    console.log('TEST 1: Create NPC');
    console.log('='.repeat(50));
    
    const npcResult = await client.callTool('create_npc', {
      name: 'Bartender Bob',
      description: 'Grumpy old tavern keeper with a grey beard',
      location: 'tavern',
      metadata: { age: 65, mood: 'grumpy' }
    });

    const npcData = JSON.parse(npcResult.content[0].text);
    const npcId = npcData.npc_id;
    console.log(`✅ Created NPC with ID: ${npcId}`);

    // Test 2: List NPCs
    console.log('\n' + '='.repeat(50));
    console.log('TEST 2: List NPCs in tavern');
    console.log('='.repeat(50));
    
    await client.callTool('list_npcs', {
      location: 'tavern'
    });

    // Test 3: Get specific NPC
    console.log('\n' + '='.repeat(50));
    console.log('TEST 3: Get NPC details');
    console.log('='.repeat(50));
    
    await client.callTool('get_npc', {
      npc_id: npcId
    });

    // Test 4: Update NPC
    console.log('\n' + '='.repeat(50));
    console.log('TEST 4: Update NPC disposition');
    console.log('='.repeat(50));
    
    await client.callTool('update_npc', {
      npc_id: npcId,
      player_disposition: -20,
      notes: 'Player spilled ale on his clean floor'
    });

    // Test 5: Create Relationship
    console.log('\n' + '='.repeat(50));
    console.log('TEST 5: Create another NPC + Relationship');
    console.log('='.repeat(50));
    
    const npc2Result = await client.callTool('create_npc', {
      name: 'Suspicious Patron',
      description: 'Hooded figure in the corner',
      location: 'tavern'
    });

    const npc2Data = JSON.parse(npc2Result.content[0].text);
    const npc2Id = npc2Data.npc_id;

    await client.callTool('create_relationship', {
      entity_type_a: 'npc',
      entity_id_a: npcId,
      relationship_type: 'dislikes',
      entity_type_b: 'npc',
      entity_id_b: npc2Id,
      strength: -50
    });

    // Test 6: Query Relationships
    console.log('\n' + '='.repeat(50));
    console.log('TEST 6: Query Bob\'s relationships');
    console.log('='.repeat(50));
    
    await client.callTool('query_relationships', {
      entity_type: 'npc',
      entity_id: npcId
    });

    console.log('\n' + '='.repeat(50));
    console.log('ALL TESTS PASSED!');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('\nError:', error);
    process.exit(1);
  } finally {
    await client.disconnect();
  }
}

main().catch(console.error);