import Phaser from 'phaser';
import { drawPanel, addText, FONT, makeButton } from '../ui/uiHelpers';
import { gameState } from '../systems/state';

export class LevelUpScene extends Phaser.Scene {
  constructor() { super('LevelUp'); }

  create() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.65);
    bg.fillRect(0, 0, width, height);

    drawPanel(this, width / 2 - 220, height / 2 - 130, 440, 260);

    this.add.text(width / 2, height / 2 - 110, 'НОВЫЙ УРОВЕНЬ!', {
      fontFamily: FONT, fontSize: '28px', color: '#ffd966',
    }).setOrigin(0.5);

    const p = gameState.player;
    addText(this, width / 2 - 200, height / 2 - 60,
      `Твой уровень теперь ${p.level}. Максимальное здоровье увеличено до ${p.maxHp}. Получено 10 очков навыков — потрать их в окне персонажа (кнопка C).`,
      14).setWordWrapWidth(400);

    makeButton(this, width / 2, height / 2 + 70, 'Продолжить', {
      onClick: () => {
        this.scene.stop();
        this.scene.resume('World');
      },
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.stop();
      this.scene.resume('World');
    });
  }
}
