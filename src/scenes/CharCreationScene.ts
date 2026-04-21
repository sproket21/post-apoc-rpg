import Phaser from 'phaser';
import { addText, drawPanel, FONT, makeButton } from '../ui/uiHelpers';
import { defaultStats, STAT_DESC, STAT_NAMES, makePlayer, baseSkills } from '../systems/player';
import type { StatKey, Stats } from '../types';
import { gameState } from '../systems/state';

const STAT_ORDER: StatKey[] = ['S', 'P', 'E', 'C', 'I', 'A', 'L'];
const MIN_STAT = 1;
const MAX_STAT = 10;
const TOTAL_POINTS = 40; // 5*7 base + 5 extra

export class CharCreationScene extends Phaser.Scene {
  private stats!: Stats;
  private points = 5;
  private name = 'Странник';
  private descText!: Phaser.GameObjects.Text;
  private previewText!: Phaser.GameObjects.Text;
  private valueTexts: Partial<Record<StatKey, Phaser.GameObjects.Text>> = {};
  private pointsText!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;

  constructor() {
    super('CharCreation');
  }

  create() {
    this.stats = defaultStats();
    this.points = TOTAL_POINTS - Object.values(this.stats).reduce((a, b) => a + b, 0);

    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0806');

    this.add.text(width / 2, 40, 'СОЗДАНИЕ ПЕРСОНАЖА', {
      fontFamily: FONT,
      fontSize: '32px',
      color: '#d4a860',
    }).setOrigin(0.5);

    drawPanel(this, 40, 90, width - 80, height - 160);

    // Name input
    addText(this, 70, 110, 'Имя:', 18);
    this.nameText = addText(this, 150, 110, this.name, 18, '#ffffff');
    const input = document.createElement('input');
    input.type = 'text';
    input.value = this.name;
    input.maxLength = 16;
    input.style.position = 'fixed';
    input.style.left = '160px';
    input.style.top = '110px';
    input.style.width = '200px';
    input.style.fontFamily = FONT;
    input.style.fontSize = '18px';
    input.style.background = '#1a140d';
    input.style.color = '#e8d89a';
    input.style.border = '1px solid #8c7248';
    input.style.padding = '2px 6px';
    input.style.zIndex = '1000';
    document.body.appendChild(input);
    this.nameText.setAlpha(0);
    input.addEventListener('input', () => {
      this.name = input.value;
    });
    input.focus();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      input.remove();
    });

    // Stats
    const startY = 170;
    STAT_ORDER.forEach((key, i) => {
      const y = startY + i * 42;
      addText(this, 70, y, STAT_NAMES[key], 18);
      const value = addText(this, 260, y, `${this.stats[key]}`, 20, '#ffd966');
      this.valueTexts[key] = value;
      makeButton(this, 320, y + 12, '-', {
        width: 34, height: 28, fontSize: 18,
        onClick: () => this.adjust(key, -1),
      });
      makeButton(this, 360, y + 12, '+', {
        width: 34, height: 28, fontSize: 18,
        onClick: () => this.adjust(key, 1),
      });
      const labelZone = this.add.zone(70, y, 180, 30).setOrigin(0, 0).setInteractive();
      labelZone.on('pointerover', () => this.showDesc(key));
      labelZone.on('pointerout', () => this.showDesc(null));
    });

    this.pointsText = addText(this, 70, startY + STAT_ORDER.length * 42 + 10,
      `Очков осталось: ${this.points}`, 18, '#b5ff8a');

    // Description panel
    drawPanel(this, 420, 170, width - 460, 280);
    this.descText = addText(this, 440, 190, 'Наведи курсор на характеристику.', 14, '#d4c18a');
    this.descText.setWordWrapWidth(width - 500);

    // Skills preview
    drawPanel(this, 420, 470, width - 460, 130);
    addText(this, 440, 482, 'Стартовые навыки:', 16, '#d4a860');
    this.previewText = addText(this, 440, 510, '', 14);
    this.updatePreview();

    makeButton(this, width / 2 - 130, height - 50, 'Назад', {
      onClick: () => this.scene.start('MainMenu'),
    });
    makeButton(this, width / 2 + 130, height - 50, 'В путь →', {
      onClick: () => {
        if (this.points !== 0) {
          this.descText.setText('Распредели все очки характеристик прежде чем начать.');
          this.descText.setColor('#ff8080');
          return;
        }
        const player = makePlayer(this.name || 'Странник', this.stats);
        gameState.player = player;
        gameState.killedEnemies = new Set();
        gameState.lootedPiles = new Set();
        this.scene.start('World');
        this.scene.launch('UI');
      },
    });
  }

  private adjust(key: StatKey, delta: number) {
    const current = this.stats[key];
    const next = current + delta;
    if (next < MIN_STAT || next > MAX_STAT) return;
    if (delta > 0 && this.points <= 0) return;
    this.stats[key] = next;
    this.points -= delta;
    this.valueTexts[key]?.setText(`${next}`);
    this.pointsText.setText(`Очков осталось: ${this.points}`);
    this.pointsText.setColor(this.points === 0 ? '#d4a860' : this.points > 0 ? '#b5ff8a' : '#ff8080');
    this.updatePreview();
    this.descText.setColor('#d4c18a');
  }

  private showDesc(key: StatKey | null) {
    if (!key) {
      this.descText.setText('Наведи курсор на характеристику.');
      return;
    }
    this.descText.setText(`${STAT_NAMES[key]}\n\n${STAT_DESC[key]}`);
  }

  private updatePreview() {
    const s = baseSkills(this.stats);
    const lines = [
      `Лёгкое оружие: ${s.smallGuns}%`,
      `Ближний бой: ${s.melee}%`,
      `Медицина: ${s.medicine}%`,
      `Взлом: ${s.lockpick}%`,
      `Речь: ${s.speech}%`,
      `Скрытность: ${s.sneak}%`,
    ];
    this.previewText.setText(lines.join('    '));
  }
}
