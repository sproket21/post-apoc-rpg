import type { DialogueAction, DialogueOption, PlayerState, StatKey, SkillKey } from '../types';
import { addItem, removeItem, countItem } from './player';
import { gameState } from './state';

const STAT_KEYS: StatKey[] = ['S', 'P', 'E', 'C', 'I', 'A', 'L'];
const SKILL_KEYS: SkillKey[] = ['smallGuns', 'melee', 'medicine', 'lockpick', 'speech', 'sneak'];

export function optionAvailable(player: PlayerState, opt: DialogueOption): boolean {
  const req = opt.requires;
  if (!req) return true;
  for (const k of STAT_KEYS) {
    if (req[k] != null && player.stats[k] < (req[k] as number)) return false;
  }
  for (const k of SKILL_KEYS) {
    if (req[k] != null && player.skills[k] < (req[k] as number)) return false;
  }
  if (req.flag && !player.flags[req.flag]) return false;
  if (req.notFlag && player.flags[req.notFlag]) return false;
  return true;
}

export interface ActionResult {
  teleport?: { locationId: string; tileX: number; tileY: number };
  startCombat?: boolean;
  closed?: boolean;
  failedForCaps?: boolean;
  failedForItems?: { itemId: string; needed: number };
}

export function applyAction(player: PlayerState, action: DialogueAction | undefined): ActionResult {
  if (!action) return {};
  if (action.takeCaps != null && player.caps < action.takeCaps) {
    return { failedForCaps: true };
  }
  if (action.takeItems) {
    for (const { itemId, count } of action.takeItems) {
      if (countItem(player, itemId) < count) {
        return { failedForItems: { itemId, needed: count } };
      }
    }
  }

  if (action.takeCaps != null) player.caps -= action.takeCaps;
  if (action.giveCaps != null) player.caps += action.giveCaps;

  if (action.takeItems) {
    for (const { itemId, count } of action.takeItems) removeItem(player, itemId, count);
  }
  if (action.giveItems) {
    for (const { itemId, count } of action.giveItems) addItem(player, itemId, count);
  }
  if (action.giveXp) {
    player.xp += action.giveXp;
    gameState.addLog(`Получено ${action.giveXp} опыта.`);
  }
  if (action.heal) {
    player.hp = player.maxHp;
    gameState.addLog('Здоровье полностью восстановлено.');
  }
  if (action.startQuest) {
    player.quests[action.startQuest] = { status: 'active', stage: 0 };
    gameState.addLog(`Новый квест: ${action.startQuest}`);
  }
  if (action.advanceQuest) {
    const q = player.quests[action.advanceQuest.id];
    if (q) q.stage = action.advanceQuest.stage;
  }
  if (action.completeQuest) {
    player.quests[action.completeQuest] = { status: 'completed', stage: 99 };
    gameState.addLog(`Квест завершён: ${action.completeQuest}`);
  }
  if (action.setFlags) {
    for (const [k, v] of Object.entries(action.setFlags)) player.flags[k] = v;
  }

  const res: ActionResult = {};
  if (action.teleport) res.teleport = action.teleport;
  if (action.startCombat) res.startCombat = true;
  return res;
}
