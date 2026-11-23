// Decks for Lelang Senja: the heirloom deck and the bid-card hands.
// One job: build every card the match uses, from a seeded shuffle.
// All names, shapes and colours here are original to this game.

/** The four bid abilities. Shape + colour tell them apart, never text alone. */
export const ABILITIES = {
  topeng: { key: 'topeng', name: 'Topeng', glyph: '◆', colour: '#a78bfa', dark: '#6d28d9', hint: 'Intip tawaran lawan sebelum dibuka' },
  tukar: { key: 'tukar', name: 'Tukar', glyph: '▲', colour: '#2dd4bf', dark: '#0f766e', hint: 'Tukar kedua tawaran yang terbuka' },
  gertak: { key: 'gertak', name: 'Gertak', glyph: '●', colour: '#f87171', dark: '#b91c1c', hint: 'Tawaran dihitung ganda; kalah = hilang 2 keping ekstra' },
  jebakan: { key: 'jebakan', name: 'Jebakan', glyph: '■', colour: '#fbbf24', dark: '#b45309', hint: 'Menang tipis (selisih ≤ 3) = curi 2 keping lawan' },
};

export const ABILITY_ORDER = ['topeng', 'tukar', 'gertak', 'jebakan'];

/** Twelve heirlooms, one per round slot (only eight are drawn per match). */
export const HEIRLOOMS = [
  { name: 'Keris Senja', points: 8, glyph: '⚔', colour: '#f59e0b' },
  { name: 'Topeng Kuningan', points: 7, glyph: '◆', colour: '#a78bfa' },
  { name: 'Gelang Ombak', points: 6, glyph: '◯', colour: '#38bdf8' },
  { name: 'Kendi Tanah', points: 5, glyph: '▣', colour: '#c65b3c' },
  { name: 'Kalung Mutiara', points: 9, glyph: '✦', colour: '#fde68a' },
  { name: 'Wayang Kulit', points: 6, glyph: '▲', colour: '#2dd4bf' },
  { name: 'Piring Porselen', points: 4, glyph: '◍', colour: '#93c5fd' },
  { name: 'Cincin Zamrud', points: 8, glyph: '⬡', colour: '#34d399' },
  { name: 'Lukisan Kapal', points: 5, glyph: '▤', colour: '#fda4af' },
  { name: 'Tasbih Manik', points: 3, glyph: '●', colour: '#f87171' },
  { name: 'Gong Perunggu', points: 7, glyph: '◎', colour: '#d97706' },
  { name: 'Selendang Sutra', points: 4, glyph: '✧', colour: '#f0abfc' },
];
// Point spread 3–9: a rich heirloom (8–9) is worth burning a big card on,
// a poor one (3–4) is worth letting go — that choice is the whole game.

/** Fisher–Yates shuffle driven by the match's seeded generator. */
export function shuffleDeck(cards, rng) {
  const pile = cards.slice();
  for (let i = pile.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const held = pile[i];
    pile[i] = pile[j];
    pile[j] = held;
  }
  return pile;
}

/** A shuffled heirloom deck; the match draws one per round, in order. */
export function buildHeirloomDeck(rng) {
  return shuffleDeck(HEIRLOOMS, rng);
}

/**
 * One hand of eight bid cards: values 1–8, abilities cycling through the
 * four in order, so every hand holds two of each ability.
 */
export function buildBidHand(rng) {
  const hand = [];
  for (let value = 1; value <= 8; value += 1) {
    const ability = ABILITIES[ABILITY_ORDER[(value - 1) % ABILITY_ORDER.length]];
    hand.push({ id: 'bid-' + value + '-' + ability.key, value, ability: ability.key, name: ability.name, glyph: ability.glyph, colour: ability.colour });
  }
  return shuffleDeck(hand, rng);
}
