import Phaser from 'phaser';
import { drawPanel, makeButton, FONT } from '../ui/uiHelpers';
import { gameState } from '../systems/state';
import { saveGame, loadGame } from '../systems/save';

export class PauseMenuScene extends Phaser.Scene {
  constructor() { super('PauseMenu'); }

  create() {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.65);
    bg.fillRect(0, 0, width, height);

    drawPanel(this, width / 2 - 160, height / 2 - 160, 320, 320);

    this.add.text(width / 2, height / 2 - 140, 'ПАУЗА', {
      fontFamily: FONT, fontSize: '28px', color: '#d4a860',
    }).setOrigin(0.5);

    makeButton(this, width / 2, height / 2 - 80, 'Продолжить', {
      onClick: () => this.close(),
    });
    makeButton(this, width / 2, height / 2 - 30, 'Сохранить', {
      onClick: () => {
        saveGame(gameState.player, gameState.killedEnemies, gameState.lootedPiles);
        gameState.addLog('Игра сохранена.');
        this.close();
      },
    });
    makeButton(this, width / 2, height / 2 + 20, 'Загрузить', {
      onClick: () => {
        const data = loadGame();
        if (!data) { gameState.addLog('Нет сохранения.'); return; }
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
      onClick: () => {
        this.scene.stop();
        this.scene.stop('World');
        this.scene.stop('UI');
        this.scene.start('MainMenu');
      },
    });

    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  private close() {
    this.input.keyboard?.removeAllListeners();
    this.scene.stop();
    this.scene.resume('World');
  }
}
