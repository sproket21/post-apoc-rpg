# Test Plan — Пустошь MVP (PR #1)

## What changed
Brand-new repo with a playable browser RPG prototype. Nothing existed before; all systems (character creation, world, combat, dialogue, inventory, quests, save/load) are new.

## Primary flow under test
A single end-to-end playthrough that exercises every core system on a running dev build (`npm run dev` at http://localhost:5173/). The purpose is to prove the game actually works — not just that the build compiles.

Each step states **what I will do** and **what MUST be true for it to pass**. Anything ambiguous is marked inconclusive; anything missing is failed.

---

### 1. Main menu renders in Russian
- **Action:** Open http://localhost:5173/.
- **Pass if:** The title **«ПУСТОШЬ»** is visible, subtitle **«Постапокалиптическая RPG»** underneath, four buttons — «Новая игра», «Загрузить», «Удалить сохранение», «Об игре». «Загрузить» and «Удалить сохранение» look disabled (muted color) because there's no save yet.
- **Fail if:** Any button missing, text not in Russian, or the canvas is blank.
- *Would a broken build look the same?* No — a broken scene registration would show a black screen or crash.

### 2. Character creation enforces the point budget
- **Action:** Click **«Новая игра»**. In `CharCreationScene`, find the «Очков осталось: 5» counter. Click the `+` button next to «Сила» (S) five times; the counter should drop to 0. Try clicking `+` on another stat.
- **Pass if:** After 5 clicks, `Сила` = 10 and `Очков осталось: 0`. The additional `+` click must NOT change any value (budget enforced). Clicking `-` on Сила returns a point to the pool.
- **Fail if:** Counter goes negative, or stats exceed 10, or minimum drops below 1.
- *Would a broken build look the same?* No — without the point check, clicking `+` would keep incrementing past 0.

### 3. Starting the game spawns the player in Ольховка with working HUD
- **Action:** Distribute all 5 points (verify «Очков осталось: 0»), click **«В путь →»**.
- **Pass if:** The world renders with tile map, player (gold sprite) visible near center. Top-left HUD shows HP bar full, AP bar full, level 1, «Крышки: 50», weapon line shows **«Охотничий нож»** with `2-6 урон, AP 3`. Top-right shows location **«Деревня Ольховка»** and mode **«• Исследование»** in green.
- **Fail if:** HUD is missing, weapon says something other than knife, caps != 50, mode is not explore.

### 4. Movement + interact prompt work
- **Action:** Press `W` several times to walk north toward the elder (Староста Захар, tile 11,9). As the player gets within 1 tile of the elder, an interact hint should appear next to the player reading **«E — говорить с Староста Захар»**.
- **Pass if:** Player sprite moves one tile per keypress. Interact hint appears when adjacent and disappears when walking away. Wall tiles (the NPC tile itself, any `#` wall) block movement.
- **Fail if:** Player moves through the elder, or hint never appears, or movement drifts pixels instead of tile-snapping.

### 5. Dialogue system runs a stat check
- **Action:** With «Староста Захар» adjacent, press `E`. Read the dialogue. Choose the option about raiders to get the main quest **«Угроза рейдеров»**. Close with the numeric shortcut.
- **Pass if:** A modal opens titled «Староста Захар», NPC text and numbered options render. Options requiring stats the player doesn't have appear greyed out. Choosing a valid option advances the tree. On closing after accepting the quest, the world resumes and the quest appears in `J` journal.
- **Fail if:** Dialogue modal blank, no greying of unmet requirements, quest does not register.

### 6. Quest log reflects the taken quest
- **Action:** Press `J`. The quest log should open.
- **Pass if:** An entry **«Угроза рейдеров»** appears with status `[ ]` (active). Right panel shows the description and at least one `►` stage marker on stage 0.
- **Fail if:** No quests shown, or wrong state flag.

### 7. Character sheet shows S.P.E.C.I.A.L. and skills
- **Action:** Press `Esc` to close the quest log, then press `C`.
- **Pass if:** Sheet shows level 1, XP 0/1000, all 7 S.P.E.C.I.A.L. stats in Russian, and 6 skills with the exact values computed by `baseSkills` (e.g. for Сила=10, Ловкость=5 → Ближний бой = 20 + 2*(10+5) = 50%). The skill points counter is 0, so no `+5 (1 pt)` buttons render.
- **Fail if:** Numbers don't match the formula in `src/systems/player.ts:8-17`.

### 8. Combat triggers + attack consumes AP + deals damage
- **Action:** Close the sheet, walk south-east to the wasteland exit (bottom-right corner of village, tile 27,18, labeled «В пустошь»). Step onto it. In the wasteland, walk forward until a rat or bandit becomes visible within 5 tiles — mode should flip to **«⚔ Режим боя»** (red in HUD), a red banner «⚔ БОЙ ⚔» appears briefly, and the combat log says «Начался бой!». Press `1` to attack the nearest enemy (fist/knife melee, range 1 — so walk adjacent first using WASD if needed; each step costs 1 AP).
- **Pass if:** Entering range sets mode to combat, banner and log line appear, AP reset to max. Attacking decrements AP by weapon cost (3 for knife), and either shows «Мимо» (miss) or a red «-N» floating number that reduces the enemy's HP display.
- **Fail if:** Mode stays «Исследование» when enemy is clearly visible, or AP never decreases, or no damage/miss text appears.

### 9. End-turn gives enemies a turn
- **Action:** Press `2` to end your turn.
- **Pass if:** Log lines appear for enemy actions (e.g. «Радкрыса ранит тебя на N.» or «Радкрыса промахивается.»), OR enemies step toward you visibly. After, AP resets to max.
- **Fail if:** Nothing happens on end-turn, or HP never changes despite enemy actions.

### 10. Inventory use heals
- **Action:** Take some damage first (steps 8-9 should have given you at least one hit). Press `I`, click «Стимпак», press **«Использовать»**.
- **Pass if:** The stimpak is consumed (count drops or item removed), HP increases by 30 (capped at maxHp), and a log entry «Использовано: Стимпак (+30 HP)» appears. Close with Esc.
- **Fail if:** HP doesn't change, item isn't consumed, or panel doesn't update.

### 11. Save and load persist state
- **Action:** Press `F5` (a yellow toast «Игра сохранена» appears). Reload the browser tab. On main menu, click **«Загрузить»**.
- **Pass if:** Game resumes at the same location with the same HP, AP, inventory (minus the used stimpak), caps, and active quest. The specific location name in the HUD matches where you saved.
- **Fail if:** Loading dumps you back at village start with full stimpaks (would mean save never wrote, or load ignored).

---

## Explicitly not covered (to keep scope tight)
- Level-up scene (requires 1000+ XP — too slow for a short recording; system is wired and compiled)
- Killing the raider boss to complete the main quest (long)
- Every dialogue tree branch

## How I'll record
One continuous Chrome recording at 1280×720 window, annotated with `setup` → `test_start` → `assertion` markers per step above. Final artefact: `.mp4` attached to the test report and a single GitHub comment on PR #1 with a collapsed `<details>` summary.
