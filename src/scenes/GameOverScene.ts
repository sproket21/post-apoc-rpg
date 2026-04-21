import Phaser from 'phaser';
import { FONT, drawPanel, makeButton } from '../ui/uiHelpers';
import { hasSave, loadGame } from '../systems/save';
import { gameState } from '../systems/state';

export class GameOverScene extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.85);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 120, 'ТЫ ПОГИБ', {
      fontFamily: FONT, fontSize: '48px', color: '#ff4444',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 60, 'Пустошь поглотила ещё одну душу.', {
      fontFamily: FONT, fontSize: '16px', color: '#d4c18a',
    }).setOrigin(0.5);

    drawPanel(this, width / 2 - 160, height / 2 - 20, 320, 180);

    const canLoad = hasSave();
    makeButton(this, width / 2, height / 2 + 20, 'Загрузить последнее сохранение', {
      disabled: !canLoad, width: 300,
      onClick: () => {
        const data = loadGame();
        if (!data) return;
        gameState.player = data.player;
        gameState.killedEnemies = new Set(data.killedEnemies);
        gameState.lootedPiles = new Set(data.lootedPiles);
        this.scene.stop();
        this.scene.stop('World');
        this.scene.stop('UI');
        this.scene.start('World');
        this.scene.launch('UI');
      },
    });

    makeButton(this, width / 2, height / 2 + 70, 'В главное меню', {
      width: 300,
      onClick: () => {
        this.scene.stop();
        this.scene.stop('World');
        this.scene.stop('UI');
        this.scene.start('MainMenu');
      },
    });

    makeButton(this, width / 2, height / 2 + 120, 'Начать заново', {
      width: 300,
      onClick: () => {
        this.scene.stop();
        this.scene.stop('World');
        this.scene.stop('UI');
        this.scene.start('CharCreation');
      },
    });
  }
}
