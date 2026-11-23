// Deterministic screenshot scenes for Lelang Senja.
// One job: stage ?shot=title|play|win|loss from a fresh world with a fixed
// seed, by playing real rounds with a real autopilot — never by posing
// cards by hand. Sets window.__shotReady when the frame is ready.

import { chooseBidCard, createGame, setStake, startRound } from './state.js';
import { chooseRivalBid } from './ai.js';
import { resolveReveal } from './bids.js';
import { renderAll } from './render.js';

/** Strong pilot: spend wisely, not loudly. Cheap heirlooms are conceded
 * with the lowest card and no coins; rich ones are fought with the
 * smallest card that can beat the rival's likely bid — and a Gertak card
 * counts double, so it is the cheapest way to win a rich round. */
function strongMove(game) {
  const hand = game.player.hand;
  const points = game.heirloom.points;
  const behind = game.player.score < game.rival.score;
  if (points <= 4 && !behind) {
    carelessMove(game);
    return;
  }
  const target = points + (behind ? 3 : 2);
  let bestIndex = -1;
  let bestStake = 0;
  let bestEff = Infinity;
  for (let i = 0; i < hand.length; i += 1) {
    const card = hand[i];
    for (let stake = 0; stake <= 2; stake += 1) {
      const eff = card.ability === 'gertak' ? (card.value + stake) * 2 : card.value + stake;
      if (eff >= target && eff < bestEff) {
        bestEff = eff;
        bestIndex = i;
        bestStake = stake;
      }
    }
  }
  if (bestIndex === -1) {
    // Nothing reaches the target: throw the biggest punch anyway.
    let top = 0;
    for (let i = 1; i < hand.length; i += 1) {
      const a = hand[i];
      const b = hand[top];
      const effA = a.ability === 'gertak' ? a.value * 2 : a.value;
      const effB = b.ability === 'gertak' ? b.value * 2 : b.value;
      if (effA > effB) top = i;
    }
    bestIndex = top;
    bestStake = Math.min(2, game.player.coins);
  }
  chooseBidCard(game, 'player', bestIndex);
  setStake(game, 'player', Math.min(bestStake, game.player.coins));
}

/** Careless pilot: smallest remaining card, no coins at all. */
function carelessMove(game) {
  const hand = game.player.hand;
  let worst = 0;
  for (let i = 1; i < hand.length; i += 1) {
    if (hand[i].value < hand[worst].value) worst = i;
  }
  chooseBidCard(game, 'player', worst);
  setStake(game, 'player', 0);
}

/** Play one full round with the given pilot, then open the next round. */
function playRound(game, pilot) {
  chooseRivalBid(game);
  pilot(game);
  resolveReveal(game);
  if (game.phase === 'over') return false;
  return startRound(game);
}

/**
 * Stage the named scene and render it. Returns the staged game so a
 * screenshot runner can read the final scores off window.__lelangGame.
 */
export function stageShot(name, seed) {
  const game = createGame(seed);
  window.__lelangGame = () => game;

  if (name === 'title') {
    renderAll(game);
    return game;
  }

  startRound(game);
  if (name === 'play') {
    // Four full rounds, then stage round five with a bid already chosen:
    // the cover must show a table mid-decision, not an empty opening.
    for (let round = 0; round < 4; round += 1) {
      if (!playRound(game, strongMove)) break;
    }
    if (game.phase === 'pick') {
      chooseRivalBid(game);
      strongMove(game);
    }
    renderAll(game);
    return game;
  }

  if (name === 'win') {
    while (game.phase !== 'over') {
      if (!playRound(game, strongMove)) break;
    }
    renderAll(game);
    return game;
  }

  if (name === 'loss') {
    while (game.phase !== 'over') {
      if (!playRound(game, carelessMove)) break;
    }
    renderAll(game);
    return game;
  }

  renderAll(game);
  return game;
}
