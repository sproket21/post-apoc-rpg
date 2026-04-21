import Phaser from 'phaser';
import { FONT, addText, drawPanel, makeButton } from '../ui/uiHelpers';
import { DIALOGUES } from '../data/dialogues';
import { gameState } from '../systems/state';
import { applyAction, optionAvailable } from '../systems/dialogue_runner';
import type { NPC, DialogueNode, DialogueOption } from '../types';

export class DialogueScene extends Phaser.Scene {
  private npc!: NPC;
  private dialogueId!: string;
  private currentNode!: string;
  private elements: Phaser.GameObjects.GameObject[] = [];

  constructor() { super('Dialogue'); }

  init(data: { npc: NPC }) {
    this.npc = data.npc;
    this.dialogueId = data.npc.dialogueId;
  }

  create() {
    const tree = DIALOGUES[this.dialogueId];
    if (!tree) { this.close(); return; }
    this.currentNode = this.getStartingNode(tree);
    this.render();
    this.input.keyboard?.on('keydown-ESC', () => this.close());
  }

  private getStartingNode(tree: ReturnType<typeof getTree>): string {
    const p = gameState.player;
    // Elder: switch to boss_dead node after killing boss; post after rewarded
    if (this.dialogueId === 'elder') {
      if (p.flags.main_done) return tree.nodes.post ? 'post' : tree.start;
      if (p.quests.main_raiders?.stage === 2) return 'boss_dead';
    }
    return tree.start;
  }

  private render() {
    for (const el of this.elements) el.destroy();
    this.elements = [];

    const { width, height } = this.scale;

    // Darken underneath
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRect(0, 0, width, height);
    this.elements.push(bg);

    const panelW = Math.min(720, width - 80);
    const panelH = Math.min(540, height - 80);
    const panelX = (width - panelW) / 2;
    const panelY = (height - panelH) / 2;
    this.elements.push(drawPanel(this, panelX, panelY, panelW, panelH));

    const title = this.add.text(panelX + panelW / 2, panelY + 16, this.npc.name, {
      fontFamily: FONT, fontSize: '22px', color: '#d4a860',
    }).setOrigin(0.5, 0);
    this.elements.push(title);

    const tree = DIALOGUES[this.dialogueId];
    const node: DialogueNode = tree.nodes[this.currentNode];
    if (!node) { this.close(); return; }

    const npcText = addText(this, panelX + 24, panelY + 56, node.npcText, 16, '#e8d89a');
    npcText.setWordWrapWidth(panelW - 48);
    this.elements.push(npcText);

    const baseY = panelY + 56 + npcText.height + 24;
    node.options.forEach((opt: DialogueOption, idx) => {
      const available = optionAvailable(gameState.player, opt);
      const optY = baseY + idx * 42;
      const btn = addText(this, panelX + 24, optY, `${idx + 1}. ${opt.text}`, 15, available ? '#d4c18a' : '#5a4a32');
      btn.setWordWrapWidth(panelW - 60);
      if (available) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => btn.setColor('#ffd966'));
        btn.on('pointerout', () => btn.setColor('#d4c18a'));
        btn.on('pointerdown', () => this.choose(opt));
      }
      this.elements.push(btn);
    });

    const kb = this.input.keyboard!;
    kb.removeAllListeners('keydown-ONE');
    kb.removeAllListeners('keydown-TWO');
    kb.removeAllListeners('keydown-THREE');
    kb.removeAllListeners('keydown-FOUR');
    kb.removeAllListeners('keydown-FIVE');
    kb.removeAllListeners('keydown-SIX');
    kb.removeAllListeners('keydown-SEVEN');
    kb.removeAllListeners('keydown-EIGHT');
    kb.removeAllListeners('keydown-NINE');
    const keyNames = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    node.options.forEach((opt, idx) => {
      if (idx >= keyNames.length) return;
      kb.on(`keydown-${keyNames[idx]}`, () => {
        if (optionAvailable(gameState.player, opt)) this.choose(opt);
      });
    });

    // Player info bar
    const info = this.add.text(panelX + panelW - 24, panelY + panelH - 26,
      `Крышки: ${gameState.player.caps}   HP: ${gameState.player.hp}/${gameState.player.maxHp}`, {
        fontFamily: FONT, fontSize: '12px', color: '#a59070',
      }).setOrigin(1, 1);
    this.elements.push(info);

    const closeBtn = makeButton(this, panelX + 60, panelY + panelH - 26, 'Esc — выйти', {
      width: 100, height: 26, fontSize: 12,
      onClick: () => this.close(),
    });
    this.elements.push(closeBtn);
  }

  private choose(opt: DialogueOption) {
    const res = applyAction(gameState.player, opt.action);
    if (res.failedForCaps) {
      this.showToast('Недостаточно крышек.');
      return;
    }
    if (res.failedForItems) {
      this.showToast(`Не хватает: ${res.failedForItems.itemId}`);
      return;
    }
    if (res.teleport) {
      this.close();
      const world = this.scene.get('World');
      world.events.emit('teleport', res.teleport);
      return;
    }
    if (!opt.next || opt.next === 'end') {
      this.close();
      return;
    }
    this.currentNode = opt.next;
    this.render();
  }

  private showToast(msg: string) {
    const t = this.add.text(this.scale.width / 2, 40, msg, {
      fontFamily: FONT, fontSize: '14px', color: '#ff8080',
      backgroundColor: '#000000cc', padding: { x: 10, y: 4 },
    }).setOrigin(0.5);
    this.tweens.add({ targets: t, alpha: 0, duration: 1500, onComplete: () => t.destroy() });
  }

  private close() {
    this.input.keyboard?.removeAllListeners();
    this.scene.stop();
    this.scene.resume('World');
  }
}

function getTree(): typeof DIALOGUES[string] { return Object.values(DIALOGUES)[0]; }
