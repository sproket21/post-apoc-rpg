import Phaser from 'phaser';
import { LOCATIONS } from '../data/locations';
import { ENEMIES } from '../data/enemies';
import { ITEMS } from '../data/items';
import { gameState } from '../systems/state';
import { isPassable } from '../systems/world';
import type { EnemyInstance, NPC } from '../types';
import {
  chebyshev,
  consumeAmmo,
  enemyAttack,
  hasAmmo,
  lootFromEnemy,
  playerAttack,
  weaponApCost,
} from '../systems/combat';
import { addItem, grantXp, weaponOf } from '../systems/player';
import { saveGame } from '../systems/save';

export const TILE_SIZE = 32;

type Mode = 'explore' | 'combat';

interface EnemySprite {
  instance: EnemyInstance;
  sprite: Phaser.GameObjects.Sprite;
  hpText: Phaser.GameObjects.Text;
  nameText: Phaser.GameObjects.Text;
}

interface NpcSprite {
  npc: NPC;
  sprite: Phaser.GameObjects.Sprite;
  nameText: Phaser.GameObjects.Text;
}

interface LootSprite {
  pile: { tileX: number; tileY: number; items: { itemId: string; count: number }[]; onceFlag?: string };
  sprite: Phaser.GameObjects.Sprite;
}

export class WorldScene extends Phaser.Scene {
  private mode: Mode = 'explore';
  private tileLayer?: Phaser.GameObjects.Container;
  private entityLayer?: Phaser.GameObjects.Container;
  private overlayLayer?: Phaser.GameObjects.Container;

  private playerSprite!: Phaser.GameObjects.Sprite;
  private enemies: EnemySprite[] = [];
  private npcs: NpcSprite[] = [];
  private loots: LootSprite[] = [];
  private targetHighlight?: Phaser.GameObjects.Sprite;
  private combatBanner?: Phaser.GameObjects.Text;

  private interactHint?: Phaser.GameObjects.Text;

  constructor() {
    super('World');
  }

  create() {
    this.loadLocation(gameState.player.locationId);

    const kb = this.input.keyboard!;
    kb.on('keydown-W', () => this.tryMove(0, -1));
    kb.on('keydown-UP', () => this.tryMove(0, -1));
    kb.on('keydown-S', () => this.tryMove(0, 1));
    kb.on('keydown-DOWN', () => this.tryMove(0, 1));
    kb.on('keydown-A', () => this.tryMove(-1, 0));
    kb.on('keydown-LEFT', () => this.tryMove(-1, 0));
    kb.on('keydown-D', () => this.tryMove(1, 0));
    kb.on('keydown-RIGHT', () => this.tryMove(1, 0));

    kb.on('keydown-E', () => this.tryInteract());
    kb.on('keydown-SPACE', () => this.tryInteract());

    kb.on('keydown-I', () => this.openModal('Inventory'));
    kb.on('keydown-J', () => this.openModal('QuestLog'));
    kb.on('keydown-C', () => this.openModal('CharSheet'));

    kb.on('keydown-ONE', () => this.attackNearestEnemy());
    kb.on('keydown-TWO', () => {
      if (this.mode === 'combat') this.endPlayerTurn();
    });
    kb.on('keydown-F5', () => this.saveGameNow());
    kb.on('keydown-F9', () => {
      this.events.emit('load-game');
    });
    kb.on('keydown-ESC', () => this.scene.launch('PauseMenu'));

    this.events.on('resume-world', () => this.maybeEnterCombat());
    this.events.on('teleport', (data: { locationId: string; tileX: number; tileY: number }) => {
      gameState.player.locationId = data.locationId;
      gameState.player.tileX = data.tileX;
      gameState.player.tileY = data.tileY;
      this.loadLocation(data.locationId);
    });

    this.maybeEnterCombat();
  }

  private clearLocation() {
    this.tileLayer?.destroy();
    this.entityLayer?.destroy();
    this.overlayLayer?.destroy();
    this.tileLayer = undefined;
    this.entityLayer = undefined;
    this.overlayLayer = undefined;
    this.enemies = [];
    this.npcs = [];
    this.loots = [];
    this.targetHighlight?.destroy();
    this.targetHighlight = undefined;
    this.combatBanner?.destroy();
    this.combatBanner = undefined;
    this.interactHint?.destroy();
    this.interactHint = undefined;
  }

  private loadLocation(locationId: string) {
    this.clearLocation();
    const loc = LOCATIONS[locationId];
    if (!loc) return;

    this.cameras.main.setBackgroundColor(Phaser.Display.Color.IntegerToColor(loc.ambient).rgba);

    this.tileLayer = this.add.container(0, 0);
    this.entityLayer = this.add.container(0, 0);
    this.overlayLayer = this.add.container(0, 0);

    for (let y = 0; y < loc.tiles.length; y++) {
      const row = loc.tiles[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        const key = tileKeyFor(ch);
        const t = this.add.sprite(x * TILE_SIZE, y * TILE_SIZE, key).setOrigin(0, 0);
        this.tileLayer.add(t);
      }
    }
    for (const exit of loc.exits) {
      const t = this.add.sprite(exit.tileX * TILE_SIZE, exit.tileY * TILE_SIZE, 'tile_exit').setOrigin(0, 0);
      this.tileLayer.add(t);
      const lbl = this.add.text(exit.tileX * TILE_SIZE + TILE_SIZE / 2, exit.tileY * TILE_SIZE - 6, exit.label, {
        fontFamily: '"Courier New", monospace',
        fontSize: '11px',
        color: '#7fb7ff',
      }).setOrigin(0.5, 1);
      this.overlayLayer.add(lbl);
    }

    // NPCs
    for (const npc of loc.npcs) {
      const spr = this.add.sprite(npc.tileX * TILE_SIZE, npc.tileY * TILE_SIZE, 'npc_generic').setOrigin(0, 0);
      spr.setTint(npc.color);
      const name = this.add.text(npc.tileX * TILE_SIZE + TILE_SIZE / 2, npc.tileY * TILE_SIZE - 4, npc.name, {
        fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#d6c07a',
      }).setOrigin(0.5, 1);
      this.entityLayer.add(spr);
      this.overlayLayer.add(name);
      this.npcs.push({ npc, sprite: spr, nameText: name });
    }

    // Loot piles (filter already taken)
    for (const pile of loc.loot) {
      if (pile.onceFlag && gameState.lootedPiles.has(pile.onceFlag)) continue;
      const spr = this.add.sprite(pile.tileX * TILE_SIZE, pile.tileY * TILE_SIZE, 'loot').setOrigin(0, 0);
      this.entityLayer.add(spr);
      this.loots.push({ pile, sprite: spr });
    }

    // Enemies
    const live = gameState.liveEnemiesInLocation(locationId);
    for (const enemy of live) {
      const def = ENEMIES[enemy.defId];
      const spr = this.add.sprite(enemy.tileX * TILE_SIZE, enemy.tileY * TILE_SIZE, 'enemy_generic').setOrigin(0, 0);
      spr.setTint(def.color);
      const nameText = this.add.text(enemy.tileX * TILE_SIZE + TILE_SIZE / 2, enemy.tileY * TILE_SIZE - 4, def.name, {
        fontFamily: '"Courier New", monospace', fontSize: '11px', color: '#ff8888',
      }).setOrigin(0.5, 1);
      const hpText = this.add.text(enemy.tileX * TILE_SIZE + TILE_SIZE / 2, enemy.tileY * TILE_SIZE + TILE_SIZE, `${enemy.hp}/${def.maxHp}`, {
        fontFamily: '"Courier New", monospace', fontSize: '10px', color: '#ff8888',
      }).setOrigin(0.5, 0);
      this.entityLayer.add(spr);
      this.overlayLayer.add(nameText);
      this.overlayLayer.add(hpText);
      this.enemies.push({ instance: enemy, sprite: spr, nameText, hpText });
    }

    // Player
    this.playerSprite = this.add.sprite(
      gameState.player.tileX * TILE_SIZE,
      gameState.player.tileY * TILE_SIZE,
      'player',
    ).setOrigin(0, 0);
    this.entityLayer.add(this.playerSprite);

    // Camera
    const worldWidth = (loc.tiles[0]?.length ?? 0) * TILE_SIZE;
    const worldHeight = loc.tiles.length * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.playerSprite, false, 0.15, 0.15);

    this.events.emit('location-changed', { locationId, name: loc.name });
    gameState.addLog(`Вход: ${loc.name}`);
  }

  private tryMove(dx: number, dy: number) {
    if (this.isModalOpen()) return;
    const p = gameState.player;
    const nx = p.tileX + dx;
    const ny = p.tileY + dy;
    if (!isPassable(p.locationId, nx, ny)) return;

    // Entity blocking
    if (this.enemies.some((e) => e.instance.tileX === nx && e.instance.tileY === ny)) return;
    if (this.npcs.some((n) => n.npc.tileX === nx && n.npc.tileY === ny)) return;

    if (this.mode === 'combat') {
      if (p.ap < 1) {
        this.flashBanner('Не хватает очков действия!');
        return;
      }
      p.ap -= 1;
    }
    p.tileX = nx;
    p.tileY = ny;
    this.playerSprite.setPosition(nx * TILE_SIZE, ny * TILE_SIZE);

    // Exit check
    const loc = LOCATIONS[p.locationId];
    for (const exit of loc.exits) {
      if (exit.tileX === nx && exit.tileY === ny && this.mode === 'explore') {
        gameState.player.locationId = exit.toLocationId;
        gameState.player.tileX = exit.toTileX;
        gameState.player.tileY = exit.toTileY;
        this.loadLocation(exit.toLocationId);
        return;
      }
    }

    if (this.mode === 'explore') {
      this.maybeEnterCombat();
    } else {
      this.events.emit('combat-updated');
      if (p.ap <= 0) this.endPlayerTurn();
    }
  }

  private isModalOpen(): boolean {
    return ['Dialogue', 'Inventory', 'QuestLog', 'CharSheet', 'PauseMenu', 'LevelUp', 'GameOver'].some(
      (k) => this.scene.isActive(k),
    );
  }

  private tryInteract() {
    if (this.isModalOpen()) return;
    const p = gameState.player;

    // NPC adjacent?
    for (const npc of this.npcs) {
      if (chebyshev(p.tileX, p.tileY, npc.npc.tileX, npc.npc.tileY) <= 1) {
        this.scene.launch('Dialogue', { npc: npc.npc });
        this.scene.pause();
        return;
      }
    }

    // Loot adjacent or on tile?
    for (let i = this.loots.length - 1; i >= 0; i--) {
      const pile = this.loots[i];
      if (chebyshev(p.tileX, p.tileY, pile.pile.tileX, pile.pile.tileY) <= 1) {
        let collected: string[] = [];
        for (const stack of pile.pile.items) {
          addItem(p, stack.itemId, stack.count);
          const def = ITEMS[stack.itemId];
          collected.push(`${def?.name ?? stack.itemId} ×${stack.count}`);
        }
        if (pile.pile.onceFlag) gameState.lootedPiles.add(pile.pile.onceFlag);
        pile.sprite.destroy();
        this.loots.splice(i, 1);
        gameState.addLog(`Подобрано: ${collected.join(', ')}`);
        this.showFloatingText(p.tileX, p.tileY, `+ ${collected.join(', ')}`, '#ffd966');
        return;
      }
    }

    // Exit adjacent?
    const loc = LOCATIONS[p.locationId];
    for (const exit of loc.exits) {
      if (chebyshev(p.tileX, p.tileY, exit.tileX, exit.tileY) <= 1) {
        gameState.player.locationId = exit.toLocationId;
        gameState.player.tileX = exit.toTileX;
        gameState.player.tileY = exit.toTileY;
        this.loadLocation(exit.toLocationId);
        return;
      }
    }
  }

  update() {
    // Idle interact hint
    if (this.isModalOpen()) return;
    const p = gameState.player;
    let hint: string | null = null;
    for (const npc of this.npcs) {
      if (chebyshev(p.tileX, p.tileY, npc.npc.tileX, npc.npc.tileY) <= 1) {
        hint = `E — говорить с ${npc.npc.name}`;
        break;
      }
    }
    if (!hint) {
      for (const pile of this.loots) {
        if (chebyshev(p.tileX, p.tileY, pile.pile.tileX, pile.pile.tileY) <= 1) {
          hint = 'E — подобрать';
          break;
        }
      }
    }
    if (!hint) {
      const loc = LOCATIONS[p.locationId];
      for (const exit of loc.exits) {
        if (chebyshev(p.tileX, p.tileY, exit.tileX, exit.tileY) <= 1) {
          hint = `E — ${exit.label}`;
          break;
        }
      }
    }
    if (hint && !this.interactHint) {
      this.interactHint = this.add.text(0, 0, hint, {
        fontFamily: '"Courier New", monospace', fontSize: '12px',
        color: '#ffd966', backgroundColor: '#000000aa', padding: { x: 4, y: 2 },
      });
    }
    if (this.interactHint) {
      if (!hint) {
        this.interactHint.destroy();
        this.interactHint = undefined;
      } else {
        this.interactHint.setText(hint);
        this.interactHint.setPosition(p.tileX * TILE_SIZE + TILE_SIZE + 8, p.tileY * TILE_SIZE);
      }
    }
  }

  private openModal(key: string) {
    if (this.isModalOpen()) return;
    this.scene.launch(key);
    this.scene.pause();
  }

  // ------ Combat --------
  private maybeEnterCombat() {
    const p = gameState.player;
    let hostile = false;
    for (const e of this.enemies) {
      const def = ENEMIES[e.instance.defId];
      if (chebyshev(p.tileX, p.tileY, e.instance.tileX, e.instance.tileY) <= def.sightRange) {
        hostile = true;
        break;
      }
    }
    if (hostile && this.mode !== 'combat') this.enterCombat();
    if (!hostile && this.mode === 'combat') this.exitCombat();
  }

  private enterCombat() {
    this.mode = 'combat';
    gameState.player.ap = gameState.player.maxAp;
    for (const e of this.enemies) e.instance.ap = ENEMIES[e.instance.defId].apMax;
    this.showBanner('⚔ БОЙ ⚔');
    this.events.emit('mode-changed', 'combat');
    gameState.addLog('Начался бой!');
  }

  private exitCombat() {
    this.mode = 'explore';
    this.combatBanner?.destroy();
    this.combatBanner = undefined;
    this.targetHighlight?.destroy();
    this.targetHighlight = undefined;
    this.events.emit('mode-changed', 'explore');
    gameState.addLog('Бой окончен.');
  }

  private showBanner(text: string) {
    this.combatBanner?.destroy();
    this.combatBanner = this.add.text(this.scale.width / 2, 60, text, {
      fontFamily: '"Courier New", monospace', fontSize: '32px',
      color: '#ff6666', backgroundColor: '#000000bb', padding: { x: 16, y: 6 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(999);
  }

  private flashBanner(text: string) {
    const t = this.add.text(this.scale.width / 2, 140, text, {
      fontFamily: '"Courier New", monospace', fontSize: '18px',
      color: '#ffcc66', backgroundColor: '#000000cc', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(999);
    this.tweens.add({ targets: t, alpha: 0, duration: 1400, onComplete: () => t.destroy() });
  }

  private showFloatingText(tx: number, ty: number, text: string, color: string) {
    const t = this.add.text(tx * TILE_SIZE + TILE_SIZE / 2, ty * TILE_SIZE, text, {
      fontFamily: '"Courier New", monospace', fontSize: '14px', color,
      stroke: '#000000', strokeThickness: 2,
    }).setOrigin(0.5, 1).setDepth(500);
    this.tweens.add({ targets: t, y: t.y - 24, alpha: 0, duration: 1200, onComplete: () => t.destroy() });
  }

  private attackNearestEnemy() {
    if (this.getMode() !== 'combat') {
      this.maybeEnterCombat();
      if (this.getMode() !== 'combat') return;
    }
    const p = gameState.player;
    const w = weaponOf(p);
    const cost = weaponApCost(p);
    if (p.ap < cost) { this.flashBanner(`Не хватает AP (нужно ${cost}).`); return; }

    const range = w.range ?? 1;
    const candidates = this.enemies
      .map((e) => ({ e, d: chebyshev(p.tileX, p.tileY, e.instance.tileX, e.instance.tileY) }))
      .filter((x) => x.d <= range)
      .sort((a, b) => a.d - b.d);
    if (candidates.length === 0) { this.flashBanner('Нет целей в зоне поражения.'); return; }
    const target = candidates[0];

    if (w.ammoType && !hasAmmo(p)) { this.flashBanner('Кончились патроны.'); return; }
    if (w.ammoType) consumeAmmo(p);

    p.ap -= cost;
    const res = playerAttack(p, target.e.instance, target.d);
    if (!res.hit) {
      this.showFloatingText(target.e.instance.tileX, target.e.instance.tileY, 'Мимо', '#aaaaaa');
      gameState.addLog(`Промах по ${ENEMIES[target.e.instance.defId].name}.`);
    } else {
      const tag = res.crit ? `КРИТ! -${res.damage}` : `-${res.damage}`;
      this.showFloatingText(target.e.instance.tileX, target.e.instance.tileY, tag, res.crit ? '#ff3333' : '#ff8866');
      gameState.addLog(`${ENEMIES[target.e.instance.defId].name} получает ${res.damage} урона.`);
      target.e.hpText.setText(`${Math.max(0, target.e.instance.hp)}/${ENEMIES[target.e.instance.defId].maxHp}`);
      if (res.targetDead) this.killEnemy(target.e);
    }
    this.events.emit('combat-updated');
    if (p.ap <= 0) this.endPlayerTurn();
    else if (this.enemies.length === 0) this.exitCombat();
  }

  private killEnemy(es: EnemySprite) {
    const def = ENEMIES[es.instance.defId];
    gameState.killedEnemies.add(es.instance.id);
    // drop loot as a pile
    const drops = lootFromEnemy(def);
    if (drops.length > 0) {
      this.loots.push({
        pile: { tileX: es.instance.tileX, tileY: es.instance.tileY, items: drops },
        sprite: this.add.sprite(es.instance.tileX * TILE_SIZE, es.instance.tileY * TILE_SIZE, 'loot').setOrigin(0, 0),
      });
    }
    const leveled = grantXp(gameState.player, def.xp);
    gameState.addLog(`Убит: ${def.name}. +${def.xp} опыта.`);
    this.showFloatingText(es.instance.tileX, es.instance.tileY, `+${def.xp} XP`, '#b5ff8a');
    if (leveled) {
      this.scene.launch('LevelUp');
      this.scene.pause();
    }

    // Check boss kill quest advance
    if (def.id === 'raider_boss') {
      const q = gameState.player.quests.main_raiders;
      if (q && q.status === 'active') {
        q.stage = 2;
      }
    }

    es.sprite.destroy();
    es.nameText.destroy();
    es.hpText.destroy();
    const idx = this.enemies.indexOf(es);
    if (idx >= 0) this.enemies.splice(idx, 1);
  }

  private endPlayerTurn() {
    this.enemyTurn().then(() => {
      if (gameState.player.hp <= 0) {
        this.scene.launch('GameOver');
        this.scene.pause();
        return;
      }
      gameState.player.ap = gameState.player.maxAp;
      for (const e of this.enemies) e.instance.ap = ENEMIES[e.instance.defId].apMax;
      this.events.emit('combat-updated');
      this.maybeEnterCombat();
    });
  }

  private async enemyTurn() {
    for (const e of [...this.enemies]) {
      if (!this.enemies.includes(e)) continue;
      await this.actEnemy(e);
      if (gameState.player.hp <= 0) return;
    }
  }

  private async actEnemy(e: EnemySprite) {
    const def = ENEMIES[e.instance.defId];
    const p = gameState.player;
    while (e.instance.ap > 0) {
      const dist = chebyshev(e.instance.tileX, e.instance.tileY, p.tileX, p.tileY);
      if (dist <= def.range && e.instance.ap >= def.apCost) {
        e.instance.ap -= def.apCost;
        const res = enemyAttack(p, e.instance, dist);
        if (!res.hit) {
          this.showFloatingText(p.tileX, p.tileY, 'Мимо', '#aaaaaa');
          gameState.addLog(`${def.name} промахивается.`);
        } else {
          const tag = res.crit ? `КРИТ -${res.damage}` : `-${res.damage}`;
          this.showFloatingText(p.tileX, p.tileY, tag, '#ff5555');
          gameState.addLog(`${def.name} ранит тебя на ${res.damage}.`);
        }
        this.events.emit('combat-updated');
        if (res.targetDead) return;
        await this.delay(220);
        continue;
      }
      // move towards player one tile
      const dx = Math.sign(p.tileX - e.instance.tileX);
      const dy = Math.sign(p.tileY - e.instance.tileY);
      const options: Array<[number, number]> = [];
      if (dx !== 0 && dy !== 0) options.push([dx, dy]);
      if (dx !== 0) options.push([dx, 0]);
      if (dy !== 0) options.push([0, dy]);
      let moved = false;
      for (const [mx, my] of options) {
        const nx = e.instance.tileX + mx;
        const ny = e.instance.tileY + my;
        if (!isPassable(p.locationId, nx, ny)) continue;
        if (p.tileX === nx && p.tileY === ny) continue;
        if (this.enemies.some((x) => x !== e && x.instance.tileX === nx && x.instance.tileY === ny)) continue;
        e.instance.tileX = nx;
        e.instance.tileY = ny;
        e.sprite.setPosition(nx * TILE_SIZE, ny * TILE_SIZE);
        e.nameText.setPosition(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE - 4);
        e.hpText.setPosition(nx * TILE_SIZE + TILE_SIZE / 2, ny * TILE_SIZE + TILE_SIZE);
        e.instance.ap -= 1;
        moved = true;
        await this.delay(90);
        break;
      }
      if (!moved) break;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((res) => this.time.delayedCall(ms, res));
  }

  private saveGameNow() {
    saveGame(gameState.player, gameState.killedEnemies, gameState.lootedPiles);
    this.flashBanner('Игра сохранена');
  }

  getMode(): Mode { return this.mode; }
}

function tileKeyFor(ch: string): string {
  switch (ch) {
    case '.': return 'tile_floor';
    case '#': return 'tile_wall';
    case ',': return 'tile_grass';
    case 's': return 'tile_sand';
    case '~': return 'tile_water';
    case '=': return 'tile_road';
    default: return 'tile_floor';
  }
}
