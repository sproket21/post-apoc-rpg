export type StatKey = 'S' | 'P' | 'E' | 'C' | 'I' | 'A' | 'L';

export interface Stats {
  S: number; // Сила
  P: number; // Восприятие
  E: number; // Выносливость
  C: number; // Харизма
  I: number; // Интеллект
  A: number; // Ловкость
  L: number; // Удача
}

export type SkillKey =
  | 'smallGuns'
  | 'melee'
  | 'medicine'
  | 'lockpick'
  | 'speech'
  | 'sneak';

export interface Skills {
  smallGuns: number;
  melee: number;
  medicine: number;
  lockpick: number;
  speech: number;
  sneak: number;
}

export type ItemKind = 'weapon' | 'armor' | 'consumable' | 'misc' | 'ammo' | 'key';

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  description: string;
  weight: number;
  value: number;
  // weapon fields
  damage?: [number, number]; // min, max
  apCost?: number;
  range?: number; // in tiles; 1 = melee
  skill?: SkillKey;
  ammoType?: string;
  clipSize?: number;
  // armor fields
  armor?: number;
  // consumable fields
  heal?: number;
  // stack
  stackable?: boolean;
}

export interface InventoryStack {
  itemId: string;
  count: number;
  loaded?: number; // для оружия: патронов в магазине
}

export interface EquipSlots {
  weapon?: string;
  armor?: string;
}

export interface PlayerState {
  name: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  ap: number;
  maxAp: number;
  stats: Stats;
  skills: Skills;
  skillPoints: number;
  inventory: InventoryStack[];
  equip: EquipSlots;
  caps: number; // валюта (крышки)
  locationId: string;
  tileX: number;
  tileY: number;
  quests: Record<string, QuestState>;
  flags: Record<string, boolean | number | string>;
}

export type QuestStatus = 'unknown' | 'active' | 'completed' | 'failed';

export interface QuestState {
  status: QuestStatus;
  stage: number;
}

export interface QuestDef {
  id: string;
  title: string;
  description: string;
  stages: string[]; // description per stage
}

export interface EnemyDef {
  id: string;
  name: string;
  maxHp: number;
  stats: Stats;
  damage: [number, number];
  apCost: number;
  range: number;
  armor: number;
  xp: number;
  loot?: { itemId: string; chance: number; count?: [number, number] }[];
  color: number;
  sightRange: number;
  apMax: number;
}

export interface EnemyInstance {
  id: string; // instance id
  defId: string;
  hp: number;
  tileX: number;
  tileY: number;
  ap: number;
}

export interface NPC {
  id: string;
  name: string;
  tileX: number;
  tileY: number;
  color: number;
  dialogueId: string;
  hostile?: boolean;
}

export interface LocationExit {
  tileX: number;
  tileY: number;
  toLocationId: string;
  toTileX: number;
  toTileY: number;
  label: string;
}

export interface LootPile {
  tileX: number;
  tileY: number;
  items: InventoryStack[];
  onceFlag?: string; // flag key so loot isn't duplicated
}

export interface LocationDef {
  id: string;
  name: string;
  width: number;
  height: number;
  // tile codes: '.' floor, '#' wall, '~' water/obstacle, ',' grass, 's' sand
  tiles: string[];
  npcs: NPC[];
  enemies: EnemyInstance[];
  exits: LocationExit[];
  loot: LootPile[];
  ambient: number; // background color
}

export interface DialogueOption {
  text: string;
  requires?: Partial<Stats> & Partial<Skills> & { flag?: string; notFlag?: string };
  next?: string; // next node id, or 'end' to close
  action?: DialogueAction;
}

export interface DialogueAction {
  setFlags?: Record<string, boolean | number | string>;
  giveItems?: { itemId: string; count: number }[];
  takeItems?: { itemId: string; count: number }[];
  giveCaps?: number;
  takeCaps?: number;
  giveXp?: number;
  startQuest?: string;
  advanceQuest?: { id: string; stage: number };
  completeQuest?: string;
  heal?: boolean;
  startCombat?: boolean; // turn NPC hostile
  teleport?: { locationId: string; tileX: number; tileY: number };
}

export interface DialogueNode {
  id: string;
  npcText: string;
  options: DialogueOption[];
}

export interface DialogueTree {
  id: string;
  start: string; // start node id
  nodes: Record<string, DialogueNode>;
}
