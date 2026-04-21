import Phaser from 'phaser';
import { FONT, addText, drawPanel, makeButton } from '../ui/uiHelpers';
import { ITEMS } from '../data/items';
import { gameState } from '../systems/state';
import { equipArmor, equipWeapon, removeItem, totalInventoryWeight, maxCarryWeight } from '../systems/player';

export class InventoryScene extends Phaser.Scene {
  private elements: Phaser.GameObjects.GameObject[] = [];
  private selectedIdx = 0;

  constructor() { super('Inventory'); }

  create() {
    this.render();
    this.input.keyboard?.on('keydown-ESC', () => this.close());
    this.input.keyboard?.on('keydown-I', () => this.close());
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
    const panelH = Math.min(540, height - 80);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;
    this.elements.push(drawPanel(this, panelX, panelY, panelW, panelH));

    const title = this.add.text(panelX + panelW / 2, panelY + 16, 'ИНВЕНТАРЬ', {
      fontFamily: FONT, fontSize: '22px', color: '#d4a860',
    }).setOrigin(0.5, 0);
    this.elements.push(title);

    const p = gameState.player;
    const weight = totalInventoryWeight(p.inventory);
    const maxW = maxCarryWeight(p);
    const info = addText(this, panelX + 24, panelY + 52,
      `Крышки: ${p.caps}   Вес: ${weight} / ${maxW}   Оружие: ${p.equip.weapon ? ITEMS[p.equip.weapon]?.name : '—'}   Броня: ${p.equip.armor ? ITEMS[p.equip.armor]?.name : '—'}`,
      13, '#a59070');
    this.elements.push(info);

    if (p.inventory.length === 0) {
      const empty = addText(this, panelX + 24, panelY + 90, 'Пусто.', 14, '#7a6a4a');
      this.elements.push(empty);
    }

    const listX = panelX + 24;
    const listY = panelY + 90;
    const rowH = 24;
    p.inventory.forEach((stack, idx) => {
      const def = ITEMS[stack.itemId];
      if (!def) return;
      const selected = idx === this.selectedIdx;
      const bgRow = this.add.graphics();
      if (selected) {
        bgRow.fillStyle(0x3a2a14, 0.8);
        bgRow.fillRect(listX - 4, listY + idx * rowH - 2, 360, rowH);
      }
      this.elements.push(bgRow);

      const equippedTag = p.equip.weapon === stack.itemId ? ' [надето]' : p.equip.armor === stack.itemId ? ' [надето]' : '';
      const line = `${def.name}${def.stackable ? ` ×${stack.count}` : ''}${equippedTag}`;
      const t = this.add.text(listX, listY + idx * rowH, line, {
        fontFamily: FONT, fontSize: '14px', color: selected ? '#ffd966' : '#d4c18a',
      });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerdown', () => { this.selectedIdx = idx; this.render(); });
      this.elements.push(t);
    });

    // Right pane: details + actions
    const detailX = panelX + 400;
    const detailY = panelY + 90;
    const stack = p.inventory[this.selectedIdx];
    if (stack) {
      const def = ITEMS[stack.itemId];
      if (def) {
        const nameText = addText(this, detailX, detailY, def.name, 18, '#d4a860');
        this.elements.push(nameText);
        const metaParts: string[] = [];
        metaParts.push({
          weapon: 'Оружие', armor: 'Броня', consumable: 'Расходник', misc: 'Разное', ammo: 'Патроны', key: 'Ключ',
        }[def.kind]);
        metaParts.push(`Вес: ${def.weight}`);
        metaParts.push(`Цена: ${def.value} крышек`);
        if (def.damage) metaParts.push(`Урон ${def.damage[0]}-${def.damage[1]}, AP ${def.apCost}, дист. ${def.range}`);
        if (def.armor != null) metaParts.push(`Броня ${def.armor}`);
        if (def.heal) metaParts.push(`Лечит ${def.heal} HP`);
        if (def.ammoType) metaParts.push(`Патроны: ${ITEMS[def.ammoType]?.name ?? def.ammoType}`);
        const meta = addText(this, detailX, detailY + 28, metaParts.join('\n'), 12, '#b5a480');
        this.elements.push(meta);
        const desc = addText(this, detailX, detailY + 28 + meta.height + 12, def.description, 12, '#8a7a60');
        desc.setWordWrapWidth(panelW - (detailX - panelX) - 24);
        this.elements.push(desc);

        // Actions
        let bx = detailX + 70;
        const by = panelY + panelH - 60;
        if (def.kind === 'weapon') {
          const equipped = p.equip.weapon === def.id;
          this.elements.push(makeButton(this, bx, by, equipped ? 'Снять' : 'Надеть', {
            width: 120, height: 30, fontSize: 13,
            onClick: () => { equipWeapon(p, equipped ? undefined : def.id); this.render(); },
          }));
          bx += 130;
        }
        if (def.kind === 'armor') {
          const equipped = p.equip.armor === def.id;
          this.elements.push(makeButton(this, bx, by, equipped ? 'Снять' : 'Надеть', {
            width: 120, height: 30, fontSize: 13,
            onClick: () => { equipArmor(p, equipped ? undefined : def.id); this.render(); },
          }));
          bx += 130;
        }
        if (def.kind === 'consumable' && def.heal) {
          this.elements.push(makeButton(this, bx, by, 'Использовать', {
            width: 140, height: 30, fontSize: 13,
            onClick: () => {
              p.hp = Math.min(p.maxHp, p.hp + (def.heal ?? 0));
              removeItem(p, def.id, 1);
              if (this.selectedIdx >= p.inventory.length) this.selectedIdx = Math.max(0, p.inventory.length - 1);
              gameState.addLog(`Использовано: ${def.name} (+${def.heal} HP)`);
              this.render();
            },
          }));
          bx += 150;
        }
        this.elements.push(makeButton(this, bx, by, 'Выбросить', {
          width: 120, height: 30, fontSize: 13,
          onClick: () => {
            if (p.equip.weapon === def.id) p.equip.weapon = undefined;
            if (p.equip.armor === def.id) p.equip.armor = undefined;
            removeItem(p, def.id, def.stackable ? stack.count : 1);
            if (this.selectedIdx >= p.inventory.length) this.selectedIdx = Math.max(0, p.inventory.length - 1);
            this.render();
          },
        }));
      }
    }

    const closeBtn = makeButton(this, panelX + 80, panelY + panelH - 26, 'Закрыть (I/Esc)', {
      width: 140, height: 26, fontSize: 12,
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
