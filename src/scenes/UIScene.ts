import Phaser from 'phaser';
import { FONT } from '../ui/uiHelpers';
import { gameState } from '../systems/state';
import { ITEMS } from '../data/items';
import { countItem, weaponOf } from '../systems/player';
import { xpToNextLevel } from '../systems/player';

export class UIScene extends Phaser.Scene {
  private hpText!: Phaser.GameObjects.Text;
  private apText!: Phaser.GameObjects.Text;
  private xpText!: Phaser.GameObjects.Text;
  private capsText!: Phaser.GameObjects.Text;
  private weaponText!: Phaser.GameObjects.Text;
  private locationText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private hintText!: Phaser.GameObjects.Text;
  private logTexts: Phaser.GameObjects.Text[] = [];
  private hpBar!: Phaser.GameObjects.Graphics;
  private apBar!: Phaser.GameObjects.Graphics;

  constructor() {
    super('UI');
  }

  create() {
    const { width, height } = this.scale;

    // Top-left status panel
    const panelTop = this.add.graphics();
    panelTop.fillStyle(0x0a0806, 0.78);
    panelTop.fillRect(0, 0, 380, 96);
    panelTop.lineStyle(2, 0x8c7248, 0.8);
    panelTop.strokeRect(0, 0, 380, 96);

    this.hpText = this.add.text(12, 8, '', { fontFamily: FONT, fontSize: '14px', color: '#ff8888' });
    this.hpBar = this.add.graphics();
    this.apText = this.add.text(12, 32, '', { fontFamily: FONT, fontSize: '14px', color: '#88ccff' });
    this.apBar = this.add.graphics();
    this.xpText = this.add.text(12, 56, '', { fontFamily: FONT, fontSize: '12px', color: '#b5ff8a' });
    this.capsText = this.add.text(200, 56, '', { fontFamily: FONT, fontSize: '12px', color: '#ffd966' });
    this.weaponText = this.add.text(12, 74, '', { fontFamily: FONT, fontSize: '12px', color: '#d4c18a' });

    // Top-right
    this.locationText = this.add.text(width - 12, 10, '', {
      fontFamily: FONT, fontSize: '16px', color: '#d4a860',
    }).setOrigin(1, 0);
    this.modeText = this.add.text(width - 12, 34, '', {
      fontFamily: FONT, fontSize: '13px', color: '#88ccff',
    }).setOrigin(1, 0);

    // Bottom hint
    this.hintText = this.add.text(width / 2, height - 24, '', {
      fontFamily: FONT, fontSize: '12px', color: '#a59070',
    }).setOrigin(0.5);

    // Combat log panel
    const logPanel = this.add.graphics();
    logPanel.fillStyle(0x0a0806, 0.72);
    logPanel.fillRect(width - 340, height - 180, 340, 160);
    logPanel.lineStyle(2, 0x8c7248, 0.6);
    logPanel.strokeRect(width - 340, height - 180, 340, 160);
    this.add.text(width - 330, height - 175, 'Журнал', {
      fontFamily: FONT, fontSize: '12px', color: '#d4a860',
    });

    for (let i = 0; i < 8; i++) {
      const t = this.add.text(width - 330, height - 160 + i * 16, '', {
        fontFamily: FONT, fontSize: '11px', color: '#b5a480',
        wordWrap: { width: 320 },
      });
      this.logTexts.push(t);
    }

    const world = this.scene.get('World') as Phaser.Scene;
    world.events.on('combat-updated', () => this.refresh());
    world.events.on('mode-changed', () => this.refresh());
    world.events.on('location-changed', () => this.refresh());

    this.time.addEvent({ delay: 200, loop: true, callback: () => this.refresh() });
    this.refresh();
  }

  private refresh() {
    const p = gameState.player;
    if (!p) return;
    this.hpText.setText(`HP ${Math.max(0, p.hp)} / ${p.maxHp}`);
    this.apText.setText(`AP ${p.ap} / ${p.maxAp}`);

    this.hpBar.clear();
    this.hpBar.fillStyle(0x330000, 1);
    this.hpBar.fillRect(110, 12, 260, 10);
    this.hpBar.fillStyle(0xcc3333, 1);
    const hpFrac = Math.max(0, p.hp) / p.maxHp;
    this.hpBar.fillRect(110, 12, 260 * hpFrac, 10);
    this.hpBar.lineStyle(1, 0x8c7248, 0.6);
    this.hpBar.strokeRect(110, 12, 260, 10);

    this.apBar.clear();
    this.apBar.fillStyle(0x002a33, 1);
    this.apBar.fillRect(110, 36, 260, 10);
    this.apBar.fillStyle(0x3399cc, 1);
    const apFrac = p.maxAp > 0 ? p.ap / p.maxAp : 0;
    this.apBar.fillRect(110, 36, 260 * apFrac, 10);
    this.apBar.lineStyle(1, 0x8c7248, 0.6);
    this.apBar.strokeRect(110, 36, 260, 10);

    const xpNeed = xpToNextLevel(p.level);
    this.xpText.setText(`Ур. ${p.level}   XP ${p.xp}/${xpNeed}`);
    this.capsText.setText(`Крышки: ${p.caps}`);

    const w = weaponOf(p);
    let weaponLine = `${w.name}`;
    if (w.damage) weaponLine += `  ${w.damage[0]}-${w.damage[1]} урон, AP ${w.apCost}`;
    if (w.ammoType) {
      const ammo = countItem(p, w.ammoType);
      weaponLine += `  [${ITEMS[w.ammoType]?.name ?? ''}: ${ammo}]`;
    }
    this.weaponText.setText(weaponLine);

    const loc = p.locationId;
    const locName = {
      village: 'Деревня Ольховка',
      wasteland: 'Пустошь',
      bar: 'Бар «Три собаки»',
      raider_camp: 'Лагерь рейдеров',
    }[loc] ?? loc;
    this.locationText.setText(locName);

    const world = this.scene.get('World') as { getMode?: () => string };
    const mode = world.getMode?.() ?? 'explore';
    this.modeText.setText(mode === 'combat' ? '⚔ Режим боя' : '• Исследование');
    this.modeText.setColor(mode === 'combat' ? '#ff6666' : '#88cc88');

    this.hintText.setText(mode === 'combat'
      ? '1 — атаковать  |  2 — конец хода  |  WASD — шаг (1 AP)  |  I — инвентарь  |  J — квесты  |  C — персонаж  |  F5/F9 сохранить/загрузить'
      : 'WASD — идти  |  E — взаимодействовать  |  I — инвентарь  |  J — квесты  |  C — персонаж  |  F5/F9 сохранить/загрузить  |  Esc — меню');

    const log = gameState.log.slice(-8);
    for (let i = 0; i < this.logTexts.length; i++) {
      this.logTexts[i].setText(log[i] ?? '');
    }
  }
}
