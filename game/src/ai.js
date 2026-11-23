// The rival for Lelang Senja: an opponent whose choices can be read.
// One job: pick the rival's bid card + stake, and describe what the rival
// is likely to do next, from the visible history and purse.

import { chooseBidCard, setStake } from './state.js';

/**
 * The rival reads the table: the richer the heirloom, the harder they bid;
 * trailing in points makes them push, a thin purse makes them hold back.
 * They spend the smallest card that can plausibly win, keeping big cards
 * for the big heirlooms still to come.
 */
export function chooseRivalBid(game) {
  const rival = game.rival;
  const heirloom = game.heirloom;
  if (!heirloom || rival.hand.length === 0) return;

  const behind = rival.score < game.player.score;
  const ahead = rival.score > game.player.score;
  const want = heirloom.points + (behind ? 2 : 0) - (ahead ? 1 : 0);
  const jitter = game.rng() < 0.35 ? 1 : 0;

  // The stake is decided FIRST: the pick threshold below must test the
  // same number the rival actually spends. Testing value + 2 while only
  // staking 1 (or 0) made the rival underbid its own plan on every
  // heirloom below 7 points.
  let stake = 0;
  if (heirloom.points >= 7) stake = 2;
  else if (heirloom.points >= 5) stake = 1;
  if (behind && heirloom.points >= 5) stake += 1;
  if (rival.coins <= 2) stake = 0;
  stake = Math.min(stake, rival.coins);

  // A Gertak card counts double, so its effective strength — not its bare
  // value — is what the threshold must test.
  const effective = (card) => (card.ability === 'gertak' ? (card.value + stake) * 2 : card.value + stake);

  const sorted = rival.hand.slice().sort((a, b) => a.value - b.value);
  let picked = sorted[sorted.length - 1];
  for (const card of sorted) {
    if (effective(card) >= want + jitter) {
      picked = card;
      break;
    }
  }

  // No blind Tukar preference here: a swap hands the rival the player's
  // unseen bid, so preferring Tukar on rich heirlooms backfired — against
  // a weak player it swapped a winning card for a tiny one. The
  // Gertak-aware threshold above is the ability play the rival can judge
  // from its own hand alone.

  const handIndex = rival.hand.indexOf(picked);
  chooseBidCard(game, 'rival', handIndex);

  setStake(game, 'rival', stake);
}

/**
 * What the player can read about the rival's next move: the range of their
 * past effective bids, plus how many coins they still hold. A rival who
 * has been bidding high and still holds coins is about to push again.
 */
export function rivalTell(game) {
  const past = game.history;
  const coins = game.rival.coins;
  if (past.length === 0) {
    return { low: 2, high: 8, text: 'Lawan belum menunjukkan gaya. Perhatikan tawaran pertamanya.' };
  }
  const bids = past.map((entry) => entry.rivalBid);
  const average = bids.reduce((sum, value) => sum + value, 0) / bids.length;
  const low = Math.max(1, Math.floor(average) - 2);
  const high = Math.min(12, Math.ceil(average) + 2);
  const last = past[past.length - 1];
  let mood = 'Lawan bermain seimbang.';
  if (last.rivalBid >= 9) mood = 'Lawan sedang agresif — tawaran terakhirnya besar.';
  else if (last.rivalBid <= 4) mood = 'Lawan sedang hemat — tawaran terakhirnya kecil.';
  if (coins <= 3) mood += ' Dompetnya hampir kosong.';
  return { low, high, text: mood + ' Dugaan tawaran berikutnya: ' + low + '–' + high + '. Keping lawan: ' + coins + '.' };
}
