import Phaser from 'phaser';
import { FONT, addText, drawPanel, makeButton } from '../ui/uiHelpers';
import { QUESTS } from '../data/quests';
import { gameState } from '../systems/state';

export class QuestLogScene extends Phaser.Scene {
  private elements: Phaser.GameObjects.GameObject[] = [];
  private selected: string | null = null;

  constructor() { super('QuestLog'); }

  create() {
    this.render();
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    this.input.keyboard?.on('keydown-J', () => this.close());
  }

  private render() {
    for (const el of this.elements) el.destroy();
    this.elements = [];
    const { width, height } = this.scale;

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRect(0, 0, width, height);
    this.elements.push(bg);

    const panelW = Math.min(760, width - 80);
    const panelH = Math.min(520, height - 80);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;
    this.elements.push(drawPanel(this, panelX, panelY, panelW, panelH));

    const title = this.add.text(panelX + panelW / 2, panelY + 16, 'ЖУРНАЛ КВЕСТОВ', {
      fontFamily: FONT, fontSize: '22px', color: '#d4a860',
    }).setOrigin(0.5, 0);
    this.elements.push(title);

    const known = Object.entries(gameState.player.quests).filter(([, q]) => q.status === 'active' || q.status === 'completed');
    if (known.length === 0) {
      const empty = addText(this, panelX + 24, panelY + 60, 'Нет активных квестов.', 14, '#8a7a60');
      this.elements.push(empty);
    }

    known.forEach(([id, q], idx) => {
      const def = QUESTS[id];
      if (!def) return;
      const y = panelY + 60 + idx * 30;
      const selected = this.selected === id || (!this.selected && idx === 0);
      if (selected) this.selected = id;
      const statusText = q.status === 'completed' ? '[✓]' : '[ ]';
      const color = q.status === 'completed' ? '#88cc88' : '#ffd966';
      const t = this.add.text(panelX + 24, y, `${statusText} ${def.title}`, {
        fontFamily: FONT, fontSize: '15px',
        color: selected ? '#ffffff' : color,
      });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { this.selected = id; this.render(); });
      this.elements.push(t);
    });

    // Details
    const detailX = panelX + 320;
    const detailY = panelY + 60;
    if (this.selected && QUESTS[this.selected]) {
      const def = QUESTS[this.selected];
      const q = gameState.player.quests[this.selected];
      const name = addText(this, detailX, detailY, def.title, 20, '#d4a860');
      this.elements.push(name);
      const desc = addText(this, detailX, detailY + 32, def.description, 13, '#d4c18a');
      desc.setWordWrapWidth(panelW - (detailX - panelX) - 24);
      this.elements.push(desc);

      const stageY = detailY + 32 + desc.height + 16;
      const stageLabel = addText(this, detailX, stageY, 'Этапы:', 14, '#d4a860');
      this.elements.push(stageLabel);

      def.stages.forEach((stage, i) => {
        const done = q.status === 'completed' || i < q.stage;
        const current = q.status === 'active' && i === q.stage;
        const mark = done ? '✓' : current ? '►' : '•';
        const color = done ? '#88cc88' : current ? '#ffd966' : '#6a5a40';
        const t = this.add.text(detailX, stageY + 24 + i * 20, `${mark} ${stage}`, {
          fontFamily: FONT, fontSize: '13px', color,
        });
        this.elements.push(t);
      });
    }

    const closeBtn = makeButton(this, panelX + 100, panelY + panelH - 26, 'Закрыть (J/Esc)', {
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
