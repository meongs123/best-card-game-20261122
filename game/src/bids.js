// Bid resolution for Lelang Senja: the simultaneous reveal.
// One job: turn two hidden bids + stakes into a winner, points and coins.
// Abilities combine here — Topeng peeks, Tukar swaps, Gertak doubles,
// Jebakan steals — and every combination is spelled out in the log.

import { ABILITIES } from './deck.js';
import { decideWinner, discardPlayedCards, matchIsOver } from './state.js';

/** Raw strength of one side's bid before abilities: card value + coins. */
export function rawBid(card, stake) {
  return card.value + stake;
}

/**
 * Apply the abilities to the two raw bids and return the effective bids
 * plus a list of what happened, in plain words for the round log.
 */
export function effectiveBids(playerCard, playerStake, rivalCard, rivalStake) {
  let playerEff = rawBid(playerCard, playerStake);
  let rivalEff = rawBid(rivalCard, rivalStake);
  const events = [];

  const playerSwaps = playerCard.ability === 'tukar';
  const rivalSwaps = rivalCard.ability === 'tukar';
  if (playerSwaps && rivalSwaps) {
    events.push('Dua Tukar saling meniadakan — tawaran tetap seperti semula.');
  } else if (playerSwaps || rivalSwaps) {
    const held = playerEff;
    playerEff = rivalEff;
    rivalEff = held;
    events.push((playerSwaps ? 'Tukar Anda' : 'Tukar lawan') + ' menukar kedua tawaran!');
  }

  if (playerCard.ability === 'gertak') {
    playerEff *= 2;
    events.push('Gertak Anda menggandakan tawaran menjadi ' + playerEff + '.');
  }
  if (rivalCard.ability === 'gertak') {
    rivalEff *= 2;
    events.push('Gertak lawan menggandakan tawarannya menjadi ' + rivalEff + '.');
  }
  return { playerEff, rivalEff, events };
}

/**
 * Reveal both bids, pay the stakes, award the heirloom, apply Jebakan and
 * Gertak penalties, and close the round. Returns the round result.
 */
export function resolveReveal(game) {
  const player = game.player;
  const rival = game.rival;
  if (!player.chosen || !rival.chosen) return null;

  const { playerEff, rivalEff, events } = effectiveBids(player.chosen, player.stake, rival.chosen, rival.stake);

  let winner = null;
  if (playerEff > rivalEff) winner = 'player';
  else if (rivalEff > playerEff) winner = 'rival';
  // Exact tie on strength: the bigger coin stake takes it — spending more
  // must mean something, and it keeps a tie from wasting the heirloom.
  else if (player.stake !== rival.stake) winner = player.stake > rival.stake ? 'player' : 'rival';

  player.coins -= player.stake;
  rival.coins -= rival.stake;

  const result = {
    round: game.round,
    heirloom: game.heirloom.name,
    points: game.heirloom.points,
    playerCard: player.chosen,
    rivalCard: rival.chosen,
    playerStake: player.stake,
    rivalStake: rival.stake,
    playerEff,
    rivalEff,
    winner,
    events: events.slice(),
  };

  if (winner) {
    const side = game[winner];
    side.score += game.heirloom.points;
    const margin = Math.abs(playerEff - rivalEff);
    const winnerCard = winner === 'player' ? player.chosen : rival.chosen;
    const loser = winner === 'player' ? rival : player;
    if (winnerCard.ability === 'jebakan' && margin <= 3 && loser.coins > 0) {
      const stolen = Math.min(2, loser.coins);
      loser.coins -= stolen;
      side.coins += stolen;
      result.events.push('Jebakan ' + (winner === 'player' ? 'Anda' : 'lawan') + ' mencuri ' + stolen + ' keping!');
    }
    const loserCard = winner === 'player' ? rival.chosen : player.chosen;
    if (loserCard.ability === 'gertak') {
      const fine = Math.min(2, loser.coins);
      loser.coins -= fine;
      result.events.push('Gertak ' + (winner === 'player' ? 'lawan' : 'Anda') + ' gagal — hilang ' + fine + ' keping ekstra.');
    }
  }

  game.history.push({
    round: game.round,
    playerBid: playerEff,
    rivalBid: rivalEff,
    playerStake: player.stake,
    rivalStake: rival.stake,
    winner,
  });
  game.lastResult = result;
  game.phase = 'reveal';
  discardPlayedCards(game);
  game.log.push(roundSummary(result));
  for (const line of result.events) game.log.push(line);

  if (matchIsOver(game)) {
    game.winner = decideWinner(game);
    game.phase = 'over';
    game.log.push(game.winner === 'player' ? 'Anda memenangkan pasar senja!' : game.winner === 'rival' ? 'Lawan memenangkan pasar senja.' : 'Pasar berakhir imbang.');
  }
  return result;
}

/** One readable sentence for the log, naming cards, stakes and the winner. */
export function roundSummary(result) {
  const who = result.winner === 'player' ? 'Anda menang' : result.winner === 'rival' ? 'Lawan menang' : 'Seri';
  const playerBit = ABILITIES[result.playerCard.ability].name + ' ' + result.playerCard.value + '+' + result.playerStake + ' keping';
  const rivalBit = ABILITIES[result.rivalCard.ability].name + ' ' + result.rivalCard.value + '+' + result.rivalStake + ' keping';
  return (
    'Ronde ' + result.round + ': ' + who + ' ' + result.heirloom + ' (' + result.points + ' poin) — Anda ' + playerBit + ' = ' + result.playerEff + ' vs lawan ' + rivalBit + ' = ' + result.rivalEff + '.'
  );
}
