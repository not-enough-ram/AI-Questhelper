export interface NPC {
  id: number;
  name: string;
  description: string;
  location: string;
  player_disposition: number;
  notes: string;
  metadata: Record<string, any>;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  status: 'available' | 'active' | 'completed';
  metadata: Record<string, any>;
}

export interface Relationship {
  id: number;
  entity_type_a: string;
  entity_id_a: number;
  relationship_type: string;
  entity_type_b: string;
  entity_id_b: number;
  strength: number;
  metadata: Record<string, any>;
}