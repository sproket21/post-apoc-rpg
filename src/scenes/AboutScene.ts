import Phaser from 'phaser';
import { addText, drawPanel, FONT, makeButton } from '../ui/uiHelpers';

export class AboutScene extends Phaser.Scene {
  constructor() {
    super('About');
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor('#0a0806');

    this.add.text(width / 2, 80, 'ОБ ИГРЕ', {
      fontFamily: FONT,
      fontSize: '40px',
      color: '#d4a860',
    }).setOrigin(0.5);

    drawPanel(this, width / 2 - 360, 140, 720, 430);

    addText(this, width / 2 - 340, 160,
`«Пустошь» — небольшая изометрическая RPG в духе классических Fallout 1-2 и ATOM RPG.

УПРАВЛЕНИЕ:
  WASD / стрелки — передвижение
  E / пробел — взаимодействовать (говорить, подобрать, перейти)
  I — инвентарь
  J — журнал квестов
  C — характеристики и навыки
  F5 — сохранить игру
  F9 — загрузить игру
  Esc — меню / отмена

В БОЮ:
  1 — атаковать (у оружия свой AP и дальность)
  2 — закончить ход
  WASD / стрелки — шаг на клетку (1 AP)
  Враги ходят после окончания хода игрока.

СИСТЕМА S.P.E.C.I.A.L.:
  S — Сила, P — Восприятие, E — Выносливость,
  C — Харизма, I — Интеллект, A — Ловкость, L — Удача.

НАВЫКИ:
  Лёгкое оружие, Ближний бой, Медицина,
  Взлом, Речь, Скрытность.

В пустоши опасно. Будьте осторожны.`,
      14, '#e8d89a');

    makeButton(this, width / 2, height - 60, 'Назад в меню', {
      onClick: () => this.scene.start('MainMenu'),
    });
  }
}
