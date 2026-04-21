import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { AboutScene } from './scenes/AboutScene';
import { CharCreationScene } from './scenes/CharCreationScene';
import { WorldScene } from './scenes/WorldScene';
import { UIScene } from './scenes/UIScene';
import { DialogueScene } from './scenes/DialogueScene';
import { InventoryScene } from './scenes/InventoryScene';
import { QuestLogScene } from './scenes/QuestLogScene';
import { CharSheetScene } from './scenes/CharSheetScene';
import { PauseMenuScene } from './scenes/PauseMenuScene';
import { LevelUpScene } from './scenes/LevelUpScene';
import { GameOverScene } from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#0a0806',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720,
  },
  pixelArt: true,
  roundPixels: true,
  scene: [
    BootScene,
    MainMenuScene,
    AboutScene,
    CharCreationScene,
    WorldScene,
    UIScene,
    DialogueScene,
    InventoryScene,
    QuestLogScene,
    CharSheetScene,
    PauseMenuScene,
    LevelUpScene,
    GameOverScene,
  ],
};

new Phaser.Game(config);
