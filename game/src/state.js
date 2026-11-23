// Round state for Lelang Senja: scores, coin purses, hands, phases.
// One job: hold the whole match state and move it between rounds.
// No DOM here, no sound here — pure state transitions the other files use.

import { buildBidHand, buildHeirloomDeck } from './deck.js';

export const TARGET_POINTS = 30;
export const MAX_ROUNDS = 8;
export const START_COINS = 12;
export const MAX_STAKE = 4;
export const COIN_REFILL = 2;
export const COIN_CAP = 16;

/** A fresh match. `seed` drives every shuffle and AI roll in this match. */
export function createGame(seed) {
  const rng = mulberry32(seed >>> 0);
  const game = {
    seed: seed >>> 0,
    rng,
    round: 0,
    phase: 'title',
    player: freshSide(rng),
    rival: freshSide(rng),
    heirloomDeck: buildHeirloomDeck(rng),
    heirloom: null,
    log: ['Pasar senja dibuka. Delapan pusaka akan dilelang malam ini.'],
    history: [],
    winner: null,
    lastResult: null,
    // True once the player has peeked with a Topeng this round. Switching
    // away after a peek spends that Topeng — the peek is never free.
    peekedThisRound: false,
  };
  // Deal round one eagerly so the title screen already shows a full table
  // behind its overlay — the cover shot never needs an empty table.
  return game;
}

function freshSide(rng) {
  return { score: 0, coins: START_COINS, hand: buildBidHand(rng), chosen: null, stake: 0 };
}

/** Small seeded generator so a seed always replays the same match. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Begin the next round: refill purses, draw the next heirloom, clear bids. */
export function startRound(game) {
  if (game.round >= MAX_ROUNDS) return false;
  game.round += 1;
  game.player.coins = Math.min(COIN_CAP, game.player.coins + COIN_REFILL);
  game.rival.coins = Math.min(COIN_CAP, game.rival.coins + COIN_REFILL);
  game.heirloom = game.heirloomDeck[game.round - 1];
  game.player.chosen = null;
  game.player.stake = 0;
  game.rival.chosen = null;
  game.rival.stake = 0;
  game.lastResult = null;
  game.peekedThisRound = false;
  game.phase = 'pick';
  game.log.push('Ronde ' + game.round + ': ' + game.heirloom.name + ' (' + game.heirloom.points + ' poin) naik ke meja.');
  return true;
}

/** True once somebody has hit the target or the eighth round is done. */
export function matchIsOver(game) {
  return game.player.score >= TARGET_POINTS || game.rival.score >= TARGET_POINTS || game.round >= MAX_ROUNDS;
}

/** Decide the match winner from the final scores. */
export function decideWinner(game) {
  if (game.player.score > game.rival.score) return 'player';
  if (game.rival.score > game.player.score) return 'rival';
  return 'draw';
}

/** Pick a bid card from your hand (index into the hand array). */
export function chooseBidCard(game, side, handIndex) {
  const person = game[side];
  if (game.phase !== 'pick') return false;
  if (handIndex < 0 || handIndex >= person.hand.length) return false;
  const next = person.hand[handIndex];
  if (side === 'player' && game.peekedThisRound && person.chosen && person.chosen.ability === 'topeng' && next.ability !== 'topeng') {
    // The peek was paid for with the Topeng that spied: switching to a
    // different card after peeking spends that Topeng from the hand, so
    // the exact rival bid can never be read for free round after round.
    const at = person.hand.indexOf(person.chosen);
    if (at !== -1) person.hand.splice(at, 1);
    game.peekedThisRound = false;
  }
  person.chosen = next;
  if (side === 'player' && next.ability === 'topeng') game.peekedThisRound = true;
  return true;
}

/** Raise or lower your coin stake for this round, clamped to purse and cap. */
export function setStake(game, side, stake) {
  const person = game[side];
  if (game.phase !== 'pick') return false;
  const clamped = Math.max(0, Math.min(MAX_STAKE, Math.min(person.coins, stake)));
  person.stake = clamped;
  return true;
}

/** Remove the played bid cards from both hands after a reveal. */
export function discardPlayedCards(game) {
  for (const side of ['player', 'rival']) {
    const person = game[side];
    if (!person.chosen) continue;
    const at = person.hand.indexOf(person.chosen);
    if (at !== -1) person.hand.splice(at, 1);
  }
  // A reveal ends the round, so a peek flag must never survive into the
  // next one — startRound resets it too, this is the belt to its braces.
  game.peekedThisRound = false;
}
