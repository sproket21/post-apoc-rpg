import Phaser from 'phaser';

export const FONT = '"Courier New", monospace';

export interface ButtonOptions {
  width?: number;
  height?: number;
  onClick?: () => void;
  fontSize?: number;
  disabled?: boolean;
}

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  opts: ButtonOptions = {},
): Phaser.GameObjects.Container {
  const width = opts.width ?? 220;
  const height = opts.height ?? 40;

  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  const draw = (hover: boolean) => {
    bg.clear();
    const fill = opts.disabled ? 0x1f1812 : hover ? 0x3f3220 : 0x2b2117;
    const stroke = opts.disabled ? 0x4b3a22 : hover ? 0xd4a860 : 0x8c7248;
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.lineStyle(2, stroke, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
  };
  draw(false);

  const text = scene.add.text(0, 0, label, {
    fontFamily: FONT,
    fontSize: `${opts.fontSize ?? 16}px`,
    color: opts.disabled ? '#7a6a4a' : '#e8d89a',
  }).setOrigin(0.5);

  container.add([bg, text]);
  container.setSize(width, height);
  if (!opts.disabled) {
    container.setInteractive({ useHandCursor: true });
    container.on('pointerover', () => draw(true));
    container.on('pointerout', () => draw(false));
    container.on('pointerdown', () => { if (opts.onClick) opts.onClick(); });
  }

  (container as unknown as { label: Phaser.GameObjects.Text }).label = text;
  return container;
}

export function drawPanel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  alpha = 0.85,
): Phaser.GameObjects.Graphics {
  const g = scene.add.graphics();
  g.fillStyle(0x1a140d, alpha);
  g.fillRoundedRect(x, y, width, height, 8);
  g.lineStyle(2, 0x8c7248, 0.9);
  g.strokeRoundedRect(x, y, width, height, 8);
  return g;
}

export function addText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  txt: string,
  size = 14,
  color = '#e8d89a',
): Phaser.GameObjects.Text {
  return scene.add.text(x, y, txt, {
    fontFamily: FONT,
    fontSize: `${size}px`,
    color,
    wordWrap: { width: 760 },
  });
}
