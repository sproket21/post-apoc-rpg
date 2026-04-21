import type { DialogueTree } from '../types';

export const DIALOGUES: Record<string, DialogueTree> = {
  elder: {
    id: 'elder',
    start: 'start',
    nodes: {
      start: {
        id: 'start',
        npcText:
          'Староста Захар тяжело вздыхает: «Ты, значит, тот странник... Видел дым на севере? Рейдеры обосновались там. Житья нам не дают.»',
        options: [
          { text: 'Расскажи подробнее.', next: 'more' },
          {
            text: '[Харизма 6] Я помогу за хорошую плату.',
            requires: { C: 6 },
            next: 'offer',
          },
          { text: 'Я помогу. Что нужно сделать?', next: 'help' },
          { text: 'Не сейчас. Удачи.', next: 'end' },
        ],
      },
      more: {
        id: 'more',
        npcText:
          '«Их главарь — изверг. Говорят, у него ключ от старого бункера семнадцатого. Там, по слухам, припасы. Но нам важнее, чтобы он перестал дышать.»',
        options: [
          { text: 'Ладно, я попробую.', next: 'help' },
          { text: 'Подумаю.', next: 'end' },
        ],
      },
      offer: {
        id: 'offer',
        npcText:
          '«Хорошая плата? Хм. Ладно. Если принесёшь голову главаря — дам вдвое больше. 1000 крышек.»',
        options: [
          {
            text: 'По рукам.',
            action: { startQuest: 'main_raiders', setFlags: { elder_big_reward: true } },
            next: 'end_accepted',
          },
          { text: 'Мало. До свидания.', next: 'end' },
        ],
      },
      help: {
        id: 'help',
        npcText:
          '«Найди их лагерь на севере пустоши и убей главаря. Вернёшься — получишь 500 крышек.»',
        options: [
          {
            text: 'Сделаю.',
            action: { startQuest: 'main_raiders' },
            next: 'end_accepted',
          },
          { text: 'Нет, спасибо.', next: 'end' },
        ],
      },
      end_accepted: {
        id: 'end_accepted',
        npcText: '«Да хранит тебя Бог, странник.»',
        options: [{ text: 'До встречи.', next: 'end' }],
      },
      boss_dead: {
        id: 'boss_dead',
        npcText:
          '«Ты... ты сделал это? Главарь мёртв? Святая Богородица! Деревня обязана тебе жизнью.»',
        options: [
          {
            text: 'Где моя награда?',
            requires: { notFlag: 'elder_big_reward' },
            action: {
              giveCaps: 500,
              giveXp: 300,
              completeQuest: 'main_raiders',
              setFlags: { main_done: true },
            },
            next: 'rewarded',
          },
          {
            text: 'Мы договаривались на 1000.',
            requires: { flag: 'elder_big_reward' },
            action: {
              giveCaps: 1000,
              giveXp: 300,
              completeQuest: 'main_raiders',
              setFlags: { main_done: true },
            },
            next: 'rewarded',
          },
        ],
      },
      rewarded: {
        id: 'rewarded',
        npcText: '«Бери, бери. Заслужил. И помни — Ольховка теперь твой дом.»',
        options: [{ text: 'Спасибо, староста.', next: 'end' }],
      },
      post: {
        id: 'post',
        npcText: '«Дети смеются снова. Спасибо тебе.»',
        options: [{ text: 'Пожалуйста.', next: 'end' }],
      },
    },
  },

  trader: {
    id: 'trader',
    start: 'start',
    nodes: {
      start: {
        id: 'start',
        npcText:
          'Торговец Семён поправляет мешки: «Ух, клиент! Есть бинты, стимпаки, водочка. Что берём?»',
        options: [
          {
            text: 'Купить бинт (15 крышек).',
            action: { takeCaps: 15, giveItems: [{ itemId: 'bandage', count: 1 }] },
            next: 'start',
          },
          {
            text: 'Купить стимпак (80 крышек).',
            action: { takeCaps: 80, giveItems: [{ itemId: 'stimpack', count: 1 }] },
            next: 'start',
          },
          {
            text: 'Купить водку (50 крышек).',
            action: { takeCaps: 50, giveItems: [{ itemId: 'vodka', count: 1 }] },
            next: 'start',
          },
          {
            text: 'Купить патроны 9×18, 10 шт. (20 крышек).',
            action: { takeCaps: 20, giveItems: [{ itemId: 'ammo_9mm', count: 10 }] },
            next: 'start',
          },
          {
            text: 'Купить кожаную куртку (120 крышек).',
            action: { takeCaps: 120, giveItems: [{ itemId: 'leather_jacket', count: 1 }] },
            next: 'start',
          },
          {
            text: '[Речь 50] Скинь цену на куртку до 80.',
            requires: { speech: 50 },
            action: {
              takeCaps: 80,
              giveItems: [{ itemId: 'leather_jacket', count: 1 }],
              setFlags: { trader_haggled: true },
            },
            next: 'haggled',
          },
          { text: 'Просто поболтаем.', next: 'chat' },
          { text: 'До свидания.', next: 'end' },
        ],
      },
      haggled: {
        id: 'haggled',
        npcText: '«Ай, и как ты меня уговорил... Бери, бери.»',
        options: [{ text: 'Ещё что-то?', next: 'start' }, { text: 'Хватит.', next: 'end' }],
      },
      chat: {
        id: 'chat',
        npcText:
          '«Слышал, в баре «Три собаки» кто-то из наёмников сидит. Может, работу тебе найдут.»',
        options: [{ text: 'Спасибо за наводку.', next: 'start' }],
      },
    },
  },

  medic: {
    id: 'medic',
    start: 'start',
    nodes: {
      start: {
        id: 'start',
        npcText:
          'Знахарка Марья перебирает травы: «Ранен? Могу подлатать. А ещё... мне бы металлолома — два куска. Принесёшь?»',
        options: [
          {
            text: 'Подлатай меня (50 крышек).',
            action: { takeCaps: 50, heal: true },
            next: 'healed',
          },
          {
            text: 'Я возьмусь за металлолом.',
            action: { startQuest: 'side_rats' },
            next: 'accepted',
          },
          {
            text: 'Вот твой металлолом.',
            requires: { flag: 'medic_waiting' },
            action: {
              takeItems: [{ itemId: 'scrap_metal', count: 2 }],
              giveCaps: 100,
              giveItems: [{ itemId: 'stimpack', count: 2 }],
              giveXp: 75,
              completeQuest: 'side_rats',
              setFlags: { medic_done: true },
            },
            next: 'paid',
          },
          { text: 'До свидания.', next: 'end' },
        ],
      },
      healed: {
        id: 'healed',
        npcText: '«Ну вот, как новенький.»',
        options: [{ text: 'Спасибо.', next: 'start' }],
      },
      accepted: {
        id: 'accepted',
        npcText: '«Два куска. Жду.»',
        options: [{ text: 'Иду.', next: 'end', action: { setFlags: { medic_waiting: true } } }],
      },
      paid: {
        id: 'paid',
        npcText: '«Вот тебе крышки и пара стимпаков. Пригодятся.»',
        options: [{ text: 'Спасибо.', next: 'start' }],
      },
    },
  },

  drunkard: {
    id: 'drunkard',
    start: 'start',
    nodes: {
      start: {
        id: 'start',
        npcText:
          'Гриша трясётся и смотрит мутными глазами: «Э-э... странник... дай выпить, а? Помираю. Взамен что-то расскажу, слышишь?»',
        options: [
          { text: 'Водку? Сейчас попробую найти.', action: { startQuest: 'side_vodka' }, next: 'quest_accepted' },
          {
            text: 'Вот, возьми водку.',
            requires: { flag: 'drunk_waiting' },
            action: {
              takeItems: [{ itemId: 'vodka', count: 1 }],
              giveXp: 40,
              giveItems: [{ itemId: 'ammo_9mm', count: 8 }],
              completeQuest: 'side_vodka',
              setFlags: { drunk_secret: true },
            },
            next: 'secret',
          },
          {
            text: '[Сила 7] Встряхнуть его и потребовать информацию.',
            requires: { S: 7 },
            action: {
              giveXp: 20,
              setFlags: { drunk_secret: true },
            },
            next: 'secret_forced',
          },
          { text: 'Отвали, алкаш.', next: 'end' },
        ],
      },
      quest_accepted: {
        id: 'quest_accepted',
        npcText: '«Ты золото, странник. Жду.»',
        options: [{ text: 'Пока.', action: { setFlags: { drunk_waiting: true } }, next: 'end' }],
      },
      secret: {
        id: 'secret',
        npcText:
          '«Ы-ых, хорошо пошла... Ну слушай. В развалинах посреди пустоши — под бочкой — ящик патронов. Никто не нашёл. Вот тебе немного, чтоб не думал, что вру.»',
        options: [{ text: 'Спасибо, Гриша.', next: 'end' }],
      },
      secret_forced: {
        id: 'secret_forced',
        npcText:
          '«Да ты дурак-то не будь, руки убери! Ладно-ладно. В развалинах пустоши есть тайник. Там патроны. Только отпусти!»',
        options: [{ text: 'Вот так-то лучше.', next: 'end' }],
      },
    },
  },

  barman: {
    id: 'barman',
    start: 'start',
    nodes: {
      start: {
        id: 'start',
        npcText:
          'Бармен Тихон протирает стакан: «Чего желаешь, странник? У меня скромно, но чисто.»',
        options: [
          {
            text: 'Налей водки (30 крышек).',
            action: { takeCaps: 30, giveItems: [{ itemId: 'vodka', count: 1 }] },
            next: 'start',
          },
          {
            text: 'Что слышно в округе?',
            next: 'gossip',
          },
          { text: 'До свидания.', next: 'end' },
        ],
      },
      gossip: {
        id: 'gossip',
        npcText:
          '«Рейдеры на севере совсем обнаглели. Прямо из-под носа у деревни скот уводят. Вот Вадим — видишь, в углу сидит — он охотится на них. Может, с ним объединишься.»',
        options: [{ text: 'Спасибо.', next: 'start' }],
      },
    },
  },

  mercenary: {
    id: 'mercenary',
    start: 'start',
    nodes: {
      start: {
        id: 'start',
        npcText:
          'Наёмник Вадим скользит по тебе оценивающим взглядом: «Новичок в пустоши? Не помрёшь тут один, смотри.»',
        options: [
          { text: 'Чем занимаешься?', next: 'job' },
          {
            text: 'Мне сказали, ты потерял рацию.',
            action: { startQuest: 'side_radio', setFlags: { radio_waiting: true } },
            next: 'radio_quest',
          },
          {
            text: 'Вот твоя рация.',
            requires: { flag: 'radio_waiting' },
            action: {
              takeItems: [{ itemId: 'radio', count: 1 }],
              giveCaps: 200,
              giveXp: 100,
              completeQuest: 'side_radio',
              setFlags: { radio_done: true },
            },
            next: 'radio_paid',
          },
          {
            text: '[Речь 40] Продай мне патронов подешевле.',
            requires: { speech: 40 },
            action: {
              takeCaps: 30,
              giveItems: [{ itemId: 'ammo_9mm', count: 15 }],
            },
            next: 'start',
          },
          { text: 'Удачи.', next: 'end' },
        ],
      },
      job: {
        id: 'job',
        npcText: '«Работаю на тех, кто платит. Ликвидирую, ищу, сопровождаю. Стандарт.»',
        options: [{ text: 'Понятно.', next: 'start' }],
      },
      radio_quest: {
        id: 'radio_quest',
        npcText:
          '«Обронил в пустоши, когда от банды драпал. Принесёшь — двести крышек твои.»',
        options: [{ text: 'Поищу.', next: 'end' }],
      },
      radio_paid: {
        id: 'radio_paid',
        npcText: '«Благодарю. Вот крышки, как обещал. Ещё увидимся.»',
        options: [{ text: 'До встречи.', next: 'end' }],
      },
    },
  },

  scout: {
    id: 'scout',
    start: 'start',
    nodes: {
      start: {
        id: 'start',
        npcText:
          'Разведчица Катя внимательно смотрит: «Видела, как ты вошёл. Осторожный. Это хорошо.»',
        options: [
          { text: 'Знаешь что-нибудь о лагере рейдеров?', next: 'camp' },
          {
            text: '[Интеллект 7] Расскажи об уязвимостях главаря.',
            requires: { I: 7 },
            next: 'tactics',
            action: { giveXp: 30, setFlags: { boss_weakness: true } },
          },
          { text: 'Пока.', next: 'end' },
        ],
      },
      camp: {
        id: 'camp',
        npcText:
          '«На северо-востоке, за руинами. Подходов несколько, но лобовая атака — самоубийство. Снайперов у них нет, но огневой контакт с трёх сторон.»',
        options: [{ text: 'Спасибо.', next: 'start' }],
      },
      tactics: {
        id: 'tactics',
        npcText:
          '«У главаря плохое зрение — левый глаз не видит. Заходи слева, бей в голову. И осторожно с его автоматом — он дорого стоит, но страшен в упор.»',
        options: [{ text: 'Запомнила... запомнил.', next: 'start' }],
      },
    },
  },
};
