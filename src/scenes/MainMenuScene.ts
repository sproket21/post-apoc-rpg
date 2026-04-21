import Phaser from 'phaser';
import { addText, drawPanel, FONT, makeButton } from '../ui/uiHelpers';
import { clearSave, hasSave, loadGame } from '../systems/save';
import { gameState } from '../systems/state';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0806');

    // title
    this.add.text(width / 2, height / 3 - 60, 'ПУСТОШЬ', {
      fontFamily: FONT,
      fontSize: '72px',
      color: '#d4a860',
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 3 + 10, 'Постапокалиптическая RPG', {
      fontFamily: FONT,
      fontSize: '20px',
      color: '#a59070',
    }).setOrigin(0.5);

    drawPanel(this, width / 2 - 140, height / 2 + 20, 280, 230, 0.7);

    makeButton(this, width / 2, height / 2 + 60, 'Новая игра', {
      onClick: () => this.scene.start('CharCreation'),
    });

    const canLoad = hasSave();
    const loadBtn = makeButton(this, width / 2, height / 2 + 110, 'Загрузить', {
      disabled: !canLoad,
      onClick: () => {
        const data = loadGame();
        if (!data) return;
        gameState.player = data.player;
        gameState.killedEnemies = new Set(data.killedEnemies);
        gameState.lootedPiles = new Set(data.lootedPiles);
        this.scene.start('World');
        this.scene.launch('UI');
      },
    });

    makeButton(this, width / 2, height / 2 + 160, 'Удалить сохранение', {
      disabled: !canLoad,
      onClick: () => {
        clearSave();
        (loadBtn as unknown as { label: Phaser.GameObjects.Text }).label.setColor('#7a6a4a');
        this.scene.restart();
      },
    });

    makeButton(this, width / 2, height / 2 + 210, 'Об игре', {
      onClick: () => this.scene.start('About'),
    });

    addText(this, width / 2 - 260, height - 40,
      'Вдохновлено Fallout 1-2 и ATOM RPG. Все персонажи вымышлены.',
      12, '#6a5a40').setOrigin(0, 0);
  }
}
