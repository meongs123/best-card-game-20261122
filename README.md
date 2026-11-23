# Lelang Senja

[![make.fun](https://img.shields.io/badge/make.fun-LIVE-brightgreen)](https://make.fun/bounty/best-card-game-20261122-1826)
[![make.fun bounty](https://img.shields.io/badge/bounty-best--card--game--20261122--1826-gold)](https://make.fun/bounty/best-card-game-20261122-1826)
[![make.fun entry](https://img.shields.io/badge/entry-meongs123%2Fbest--card--game--20261122-blue)](https://github.com/meongs123/best-card-game-20261122)

A sunset-market heirloom auction card game, built for the
[make.fun](https://make.fun/bounty/best-card-game-20261122-1826)
**best card game** bounty. 100% original — new theme, new mechanics, new art.

## The game

At dusk the market opens one heirloom at a time. Each round a single
**Pusaka** (heirloom) card is laid face-up in the middle of the table with a
point value. You and your rival each choose **one Bid card face-down** from
your hand, plus a stake of coins from a limited purse, and both bids are
revealed at the same time. The highest effective bid wins the heirloom and
its points. First to **30 points** — or the most points after **8 rounds** —
takes the market.

## Four bid abilities

Every Bid card carries one ability, and abilities combine:

| Ability | Mark | What it does |
| --- | --- | --- |
| **Topeng** (Mask) | ◆ purple | Peek: you see your rival's chosen bid before the reveal. |
| **Tukar** (Swap) | ▲ teal | Swap the two revealed bids — your rival's strength becomes yours. |
| **Gertak** (Bluff) | ● brick red | Your bid counts double, but if you lose the round you lose 2 extra coins. |
| **Jebakan** (Snare) | ■ gold | Win by 3 or less and you steal 2 coins from your rival. |

Read your rival: the **Dugaan Lawan** (Rival's Tell) panel shows the rival's
likely bid range from their past bids and visible purse, and the round log
keeps every past bid on the table. Bluff, manage your purse, and time your
abilities — a Topeng into a Tukar wins rounds a raw number never could.

Peeking is not free: once a Topeng has shown you the rival's bid, switching
to a different card spends that Topeng from your hand — so the peek is a
real decision, not a free look every round.

## How to play

- **Mouse:** click a Bid card in your hand, adjust your coin stake with
  **− / +**, then click **Buka Tawaran** to reveal.
- **Keyboard:** `1–8` pick a Bid card, `+` / `−` change the stake,
  `Enter` reveal, `R` start a new game, `M` mute.
- **Screens:** title → table → win screen / loss screen. Sound is
  synthesized with WebAudio only — no audio files, no network.

## Play it

Serve `game/` with any static server (for example `node serve.ts`) and open
`http://localhost:8080`. The game runs fully offline from its own files.
Play it with mouse or keyboard — every screen (title, table, win, loss) is
reachable by playing real rounds, nothing is staged for the screenshots.

Deterministic screenshots: `game/index.html?shot=title|play|win&seed=1`
(and `?shot=loss&seed=5` — the careless pilot only truly loses from that
seed once the rival bids its real stakes) plays real rounds from a fresh
world with an autopilot and sets `window.__shotReady` when the frame is
ready (see `shots.json`).

## Layout

- `game/index.html` — page shell
- `game/css/table.css` — sunset-market table, hover lift + selected highlight + gold win glow
- `game/src/state.js` — round state, scores, coin purses
- `game/src/deck.js` — heirloom deck + bid deck, seeded shuffle
- `game/src/bids.js` — the four abilities + simultaneous-reveal resolution
- `game/src/ai.js` — the rival: picks a bid and stake from history + purse
- `game/src/render.js` — table, hands, rival-tell panel, round log
- `game/src/sound.js` — WebAudio synth effects
- `game/src/shots.js` — deterministic screenshot scenes
- `game/src/main.js` — round loop, win/loss, input wiring
- `main.ts` — entrypoint: copies `game/` + `screenshots/` to the output
  directory and writes `dossier.json` (Node 22, standard library only)
