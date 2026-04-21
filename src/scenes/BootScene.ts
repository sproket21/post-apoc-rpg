import Phaser from 'phaser';

// Generate procedural textures to avoid external assets.
// Tiles are 32x32. Entities are circles inside 32x32.
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.makeTileTextures();
    this.makeEntityTextures();
    this.makeUiTextures();
    this.scene.start('MainMenu');
  }

  private makeTileTextures() {
    const size = 32;
    const tile = (key: string, base: number, detail: number, dots = 6) => {
      const g = this.add.graphics();
      g.fillStyle(base, 1);
      g.fillRect(0, 0, size, size);
      g.fillStyle(detail, 1);
      for (let i = 0; i < dots; i++) {
        const x = (i * 7 + 3) % size;
        const y = (i * 13 + 5) % size;
        g.fillRect(x, y, 2, 2);
      }
      g.lineStyle(1, 0x000000, 0.12);
      g.strokeRect(0, 0, size, size);
      g.generateTexture(key, size, size);
      g.destroy();
    };
    tile('tile_floor', 0x6b5a3c, 0x4a3a22, 8);
    tile('tile_wall', 0x4a4038, 0x2f2722, 10);
    tile('tile_grass', 0x3d5a2a, 0x2a4018, 14);
    tile('tile_sand', 0x8a7347, 0x66522f, 10);
    tile('tile_water', 0x264a55, 0x173038, 6);
    tile('tile_road', 0x6e6358, 0x4c443a, 4);

    // exit marker
    const g = this.add.graphics();
    g.fillStyle(0x2a6fdb, 0.35);
    g.fillRect(0, 0, size, size);
    g.lineStyle(2, 0x7fb7ff, 0.9);
    g.strokeRect(2, 2, size - 4, size - 4);
    g.generateTexture('tile_exit', size, size);
    g.destroy();
  }

  private makeEntityTextures() {
    const size = 32;
    const circle = (key: string, color: number, outline = 0x000000) => {
      const g = this.add.graphics();
      g.fillStyle(color, 1);
      g.fillCircle(size / 2, size / 2, size / 2 - 3);
      g.lineStyle(2, outline, 1);
      g.strokeCircle(size / 2, size / 2, size / 2 - 3);
      // small "face" dot
      g.fillStyle(0x000000, 1);
      g.fillRect(size / 2 - 5, size / 2 - 3, 2, 2);
      g.fillRect(size / 2 + 3, size / 2 - 3, 2, 2);
      g.generateTexture(key, size, size);
      g.destroy();
    };
    circle('player', 0xe8d89a);
    circle('npc_generic', 0x88aa88);
    circle('enemy_generic', 0xbb3333);

    // loot pile
    const g = this.add.graphics();
    g.fillStyle(0x3a2a14, 1);
    g.fillRect(6, 10, 20, 16);
    g.lineStyle(1, 0x000000, 1);
    g.strokeRect(6, 10, 20, 16);
    g.fillStyle(0xc0a760, 1);
    g.fillCircle(16, 8, 4);
    g.generateTexture('loot', size, size);
    g.destroy();

    // selection highlight
    const sel = this.add.graphics();
    sel.lineStyle(2, 0xffd966, 1);
    sel.strokeRect(1, 1, size - 2, size - 2);
    sel.generateTexture('hl_select', size, size);
    sel.destroy();

    // target cursor
    const tgt = this.add.graphics();
    tgt.lineStyle(2, 0xff4444, 1);
    tgt.strokeRect(1, 1, size - 2, size - 2);
    tgt.lineStyle(1, 0xff4444, 0.7);
    tgt.lineBetween(size / 2, 0, size / 2, size);
    tgt.lineBetween(0, size / 2, size, size / 2);
    tgt.generateTexture('hl_target', size, size);
    tgt.destroy();

    // movement range
    const mov = this.add.graphics();
    mov.fillStyle(0x3388ff, 0.18);
    mov.fillRect(0, 0, size, size);
    mov.generateTexture('hl_move', size, size);
    mov.destroy();
  }

  private makeUiTextures() {
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.82);
    g.fillRect(0, 0, 8, 8);
    g.generateTexture('ui_panel', 8, 8);
    g.destroy();

    const b = this.add.graphics();
    b.fillStyle(0x2b2117, 1);
    b.fillRoundedRect(0, 0, 200, 40, 6);
    b.lineStyle(2, 0x8c7248, 1);
    b.strokeRoundedRect(0, 0, 200, 40, 6);
    b.generateTexture('ui_button', 200, 40);
    b.destroy();

    const bh = this.add.graphics();
    bh.fillStyle(0x3f3220, 1);
    bh.fillRoundedRect(0, 0, 200, 40, 6);
    bh.lineStyle(2, 0xd4a860, 1);
    bh.strokeRoundedRect(0, 0, 200, 40, 6);
    bh.generateTexture('ui_button_hover', 200, 40);
    bh.destroy();
  }
}
