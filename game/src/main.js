// Main loop for Lelang Senja: wires the table to the player.
// One job: start matches, take mouse + keyboard input, run each round
// through pick → reveal → next, and hand screenshot scenes to shots.js.

import { chooseBidCard, createGame, setStake, startRound } from './state.js';
import { chooseRivalBid } from './ai.js';
import { resolveReveal } from './bids.js';
import { renderAll } from './render.js';
import { isMuted, sounds, toggleMute } from './sound.js';
import { stageShot } from './shots.js';

let game = createGame(1);

function byId(id) {
  return document.getElementById(id);
}

/** Open a new match and deal the first round. */
export function newMatch(seed) {
  game = createGame(typeof seed === 'number' ? seed : Math.floor(Math.random() * 100000));
  startRound(game);
  chooseRivalBid(game);
  renderAll(game);
  return game;
}

/** The live match the table is showing (shots and tests read this). */
export function currentGame() {
  return game;
}

/** Player picks a bid card from their hand by index. */
function pickCard(index) {
  if (game.phase !== 'pick') return;
  if (chooseBidCard(game, 'player', index)) {
    sounds.pick();
    renderAll(game);
  }
}

/** Player changes their coin stake by a step (-1 or +1). */
function changeStake(step) {
  if (game.phase !== 'pick') return;
  setStake(game, 'player', game.player.stake + step);
  renderAll(game);
}

/** Open both bids at once and resolve the round. */
function revealBids() {
  if (game.phase !== 'pick' || !game.player.chosen) return;
  sounds.flip();
  resolveReveal(game);
  if (game.phase === 'over') {
    if (game.winner === 'player') sounds.win();
    else sounds.lose();
  } else {
    sounds.coin();
  }
  renderAll(game);
}

/** Move on to the next round after a reveal. */
function nextRound() {
  if (game.phase !== 'reveal') return;
  if (startRound(game)) {
    chooseRivalBid(game);
    renderAll(game);
  }
}

function startFromTitle() {
  newMatch(Math.floor(Math.random() * 100000));
  sounds.pick();
}

function wireButtons() {
  byId('start-btn').addEventListener('click', startFromTitle);
  byId('again-btn').addEventListener('click', () => newMatch(Math.floor(Math.random() * 100000)));
  byId('again-loss-btn').addEventListener('click', () => newMatch(Math.floor(Math.random() * 100000)));
  byId('reveal-btn').addEventListener('click', revealBids);
  byId('next-btn').addEventListener('click', nextRound);
  byId('stake-minus').addEventListener('click', () => changeStake(-1));
  byId('stake-plus').addEventListener('click', () => changeStake(1));
  byId('mute-btn').addEventListener('click', () => {
    const nowMuted = toggleMute();
    byId('mute-btn').textContent = nowMuted ? '♪ Suara: mati' : '♪ Suara: nyala';
  });
}

function wireKeyboard() {
  document.addEventListener('keydown', (event) => {
    if (event.key >= '1' && event.key <= '8') {
      pickCard(Number(event.key) - 1);
      return;
    }
    if (event.key === '+' || event.key === '=') changeStake(1);
    else if (event.key === '-' || event.key === '_') changeStake(-1);
    else if (event.key === 'Enter') {
      if (game.phase === 'title') startFromTitle();
      else if (game.phase === 'pick') revealBids();
      else if (game.phase === 'reveal') nextRound();
      else if (game.phase === 'over') newMatch(Math.floor(Math.random() * 100000));
    } else if (event.key === 'r' || event.key === 'R') {
      if (game.phase !== 'title') newMatch(Math.floor(Math.random() * 100000));
    } else if (event.key === 'm' || event.key === 'M') {
      const nowMuted = toggleMute();
      byId('mute-btn').textContent = nowMuted ? '♪ Suara: mati' : '♪ Suara: nyala';
    }
  });
}

// The renderer calls back here when a hand card is clicked.
window.__lelangPick = pickCard;
window.__lelangGame = () => game;

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  // Screenshot scenes never wire the live buttons: the staged frame is
  // the whole point, and a stray click must not move it.
  const seed = Number(params.get('seed') || '1') || 1;
  document.body.classList.add('shot');
  stageShot(shotName, seed);
  window.__shotReady = true;
} else {
  wireButtons();
  wireKeyboard();
  renderAll(game);
  void isMuted;
}
