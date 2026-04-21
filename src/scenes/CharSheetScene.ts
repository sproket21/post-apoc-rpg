import Phaser from 'phaser';
import { FONT, addText, drawPanel, makeButton } from '../ui/uiHelpers';
import { STAT_NAMES } from '../systems/player';
import type { StatKey } from '../types';
import { gameState } from '../systems/state';
import { xpToNextLevel } from '../systems/player';

const STAT_ORDER: StatKey[] = ['S', 'P', 'E', 'C', 'I', 'A', 'L'];

export class CharSheetScene extends Phaser.Scene {
  private elements: Phaser.GameObjects.GameObject[] = [];

  constructor() { super('CharSheet'); }

  create() {
    this.render();
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    this.input.keyboard?.on('keydown-C', () => this.close());
  }

  private render() {
    for (const el of this.elements) el.destroy();
    this.elements = [];
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRect(0, 0, width, height);
    this.elements.push(bg);

    const panelW = Math.min(720, width - 80);
    const panelH = Math.min(520, height - 80);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;
    this.elements.push(drawPanel(this, panelX, panelY, panelW, panelH));

    const p = gameState.player;
    const title = this.add.text(panelX + panelW / 2, panelY + 16, `${p.name.toUpperCase()} — Уровень ${p.level}`, {
      fontFamily: FONT, fontSize: '22px', color: '#d4a860',
    }).setOrigin(0.5, 0);
    this.elements.push(title);

    this.elements.push(addText(this, panelX + 24, panelY + 60,
      `XP: ${p.xp} / ${xpToNextLevel(p.level)}    HP: ${Math.max(0, p.hp)}/${p.maxHp}    AP: ${p.ap}/${p.maxAp}    Крышки: ${p.caps}`,
      13, '#a59070'));

    const statsY = panelY + 100;
    const statsTitle = addText(this, panelX + 24, statsY, 'S.P.E.C.I.A.L.', 16, '#d4a860');
    this.elements.push(statsTitle);
    STAT_ORDER.forEach((k, i) => {
      const t = addText(this, panelX + 24, statsY + 28 + i * 22, `${STAT_NAMES[k]}: ${p.stats[k]}`, 14, '#d4c18a');
      this.elements.push(t);
    });

    const skillsTitle = addText(this, panelX + 340, statsY, `Навыки (очков: ${p.skillPoints})`, 16, '#d4a860');
    this.elements.push(skillsTitle);
    const labels: Array<[keyof typeof p.skills, string]> = [
      ['smallGuns', 'Лёгкое оружие'],
      ['melee', 'Ближний бой'],
      ['medicine', 'Медицина'],
      ['lockpick', 'Взлом'],
      ['speech', 'Речь'],
      ['sneak', 'Скрытность'],
    ];
    labels.forEach(([k, label], i) => {
      const y = statsY + 28 + i * 34;
      const t = addText(this, panelX + 340, y, `${label}: ${p.skills[k]}%`, 14, '#d4c18a');
      this.elements.push(t);
      if (p.skillPoints > 0) {
        const plusBtn = makeButton(this, panelX + 580, y + 10, '+5 (1 pt)', {
          width: 100, height: 24, fontSize: 12,
          onClick: () => {
            if (p.skillPoints <= 0) return;
            p.skills[k] += 5;
            p.skillPoints -= 1;
            this.render();
          },
        });
        this.elements.push(plusBtn);
      }
    });

    const closeBtn = makeButton(this, panelX + 100, panelY + panelH - 26, 'Закрыть (C/Esc)', {
      width: 160, height: 26, fontSize: 12,
      onClick: () => this.close(),
    });
    this.elements.push(closeBtn);
  }

  private close() {
    this.input.keyboard?.removeAllListeners();
    this.scene.stop();
    this.scene.resume('World');
  }
}
