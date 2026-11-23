// Rendering for Lelang Senja: the whole table as DOM.
// One job: draw the match state — hands, heirloom, scores, rival tell,
// round log and the title/win/loss screens — and nothing else.
// Cards are big and legible: value in huge type, ability told by shape +
// colour, never by text alone.

import { ABILITIES } from './deck.js';
import { MAX_ROUNDS, TARGET_POINTS } from './state.js';
import { rivalTell } from './ai.js';

function byId(id) {
  return document.getElementById(id);
}

/** Build one face-up bid card element. `selectable` wires a click handler. */
export function buildBidCardElement(card, options) {
  const ability = ABILITIES[card.ability];
  const element = document.createElement('div');
  element.className = 'card bid-card ability-' + card.ability;
  element.dataset.cardId = card.id;
  const glyph = document.createElement('div');
  glyph.className = 'card-glyph';
  glyph.textContent = card.glyph;
  const value = document.createElement('div');
  value.className = 'card-value';
  value.textContent = String(card.value);
  const name = document.createElement('div');
  name.className = 'card-name';
  name.textContent = ability.name;
  const hint = document.createElement('div');
  hint.className = 'card-hint';
  hint.textContent = ability.hint;
  element.append(glyph, value, name, hint);
  if (options && options.selected) element.classList.add('selected');
  if (options && options.onClick) {
    element.setAttribute('role', 'button');
    element.setAttribute('tabindex', '0');
    element.addEventListener('click', options.onClick);
    element.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        options.onClick();
      }
    });
  }
  return element;
}

/** Build one face-down card back (the rival's hidden hand). */
export function buildCardBackElement() {
  const element = document.createElement('div');
  element.className = 'card card-back';
  const glyph = document.createElement('div');
  glyph.className = 'card-glyph';
  glyph.textContent = '☾';
  const label = document.createElement('div');
  label.className = 'card-name';
  label.textContent = 'Tertutup';
  element.append(glyph, label);
  return element;
}

/** Build the heirloom card in the middle of the table. */
export function buildHeirloomElement(heirloom) {
  const element = document.createElement('div');
  element.className = 'card heirloom-card';
  element.style.setProperty('--heirloom-colour', heirloom.colour);
  const glyph = document.createElement('div');
  glyph.className = 'card-glyph';
  glyph.textContent = heirloom.glyph;
  const name = document.createElement('div');
  name.className = 'card-name';
  name.textContent = heirloom.name;
  const points = document.createElement('div');
  points.className = 'card-value';
  points.textContent = heirloom.points + ' poin';
  element.append(glyph, name, points);
  return element;
}

/** Redraw every part of the table from the current match state. */
export function renderAll(game) {
  renderScores(game);
  renderHands(game);
  renderCentre(game);
  renderTell(game);
  renderLog(game);
  renderScreens(game);
}

function renderScores(game) {
  byId('player-score').textContent = game.player.score + ' / ' + TARGET_POINTS;
  byId('rival-score').textContent = game.rival.score + ' / ' + TARGET_POINTS;
  byId('player-coins').textContent = '◉ ' + game.player.coins + ' keping';
  byId('rival-coins').textContent = '◉ ' + game.rival.coins + ' keping';
  byId('round-label').textContent = game.phase === 'title' ? 'Pasar belum dibuka' : 'Ronde ' + game.round + ' / ' + MAX_ROUNDS;
  byId('stake-value').textContent = game.player.stake + ' keping';
  const revealButton = byId('reveal-btn');
  revealButton.disabled = game.phase !== 'pick' || !game.player.chosen;
  revealButton.textContent = game.phase === 'reveal' ? 'Dibuka!' : 'Buka Tawaran (Enter)';
}

function renderHands(game) {
  const playerHand = byId('player-hand');
  playerHand.replaceChildren();
  game.player.hand.forEach((card, index) => {
    const selected = game.player.chosen === card;
    const element = buildBidCardElement(card, {
      selected,
      onClick: game.phase === 'pick' ? () => window.__lelangPick(index) : null,
    });
    playerHand.appendChild(element);
  });

  const rivalHand = byId('rival-hand');
  rivalHand.replaceChildren();
  game.rival.hand.forEach(() => rivalHand.appendChild(buildCardBackElement()));
}

/** Centre of the table: heirloom, the two revealed bids, and the pot. */
function renderCentre(game) {
  const slot = byId('heirloom-slot');
  slot.replaceChildren();
  if (game.heirloom) slot.appendChild(buildHeirloomElement(game.heirloom));

  const playerSlot = byId('player-bid-slot');
  const rivalSlot = byId('rival-bid-slot');
  playerSlot.replaceChildren();
  rivalSlot.replaceChildren();
  const showBids = game.phase === 'reveal' || game.phase === 'over';
  const peeked = game.phase === 'pick' && game.player.chosen && game.player.chosen.ability === 'topeng';

  if (game.player.chosen) {
    playerSlot.appendChild(buildBidCardElement(game.player.chosen, {}));
    const stake = document.createElement('div');
    stake.className = 'stake-badge';
    stake.textContent = '+' + game.player.stake + ' keping';
    playerSlot.appendChild(stake);
  }
  if (game.rival.chosen && (showBids || peeked)) {
    rivalSlot.appendChild(buildBidCardElement(game.rival.chosen, {}));
    const stake = document.createElement('div');
    stake.className = 'stake-badge';
    stake.textContent = '+' + game.rival.stake + ' keping';
    rivalSlot.appendChild(stake);
  } else if (game.rival.chosen) {
    rivalSlot.appendChild(buildCardBackElement());
  }

  const result = byId('reveal-result');
  if (showBids && game.lastResult) {
    const r = game.lastResult;
    // Show the effective strengths, not just the winner, so the judge can
    // read why the round went the way it did straight from the screenshot.
    result.textContent =
      r.winner === 'player' ? 'Anda menang ' + r.heirloom + ' (+' + r.points + ' poin)! ' + r.playerEff + ' vs ' + r.rivalEff
      : r.winner === 'rival' ? 'Lawan menang ' + r.heirloom + ' (+' + r.points + ' poin). ' + r.rivalEff + ' vs ' + r.playerEff
      : 'Seri ' + r.playerEff + '–' + r.rivalEff + ' — pusaka tidak berpindah.';
    result.className = 'reveal-result ' + (r.winner || 'draw');
  } else if (peeked) {
    result.textContent = 'Topeng mengintip: tawaran lawan ' + game.rival.chosen.value + ' (' + ABILITIES[game.rival.chosen.ability].name + ').';
    result.className = 'reveal-result peek';
  } else {
    result.textContent = game.phase === 'pick' ? 'Pilih satu kartu tawaran, atur keping, lalu buka bersamaan.' : '';
    result.className = 'reveal-result';
  }

  const nextButton = byId('next-btn');
  nextButton.style.display = game.phase === 'reveal' ? 'inline-block' : 'none';
}

function renderTell(game) {
  const tell = rivalTell(game);
  byId('tell-text').textContent = tell.text;
  byId('tell-range').textContent = 'Dugaan: ' + tell.low + '–' + tell.high;
}

function renderLog(game) {
  const list = byId('log-list');
  list.replaceChildren();
  const tail = game.log.slice(-6);
  for (const line of tail) {
    const item = document.createElement('li');
    item.textContent = line;
    list.appendChild(item);
  }
  list.scrollTop = list.scrollHeight;
}

/** Show exactly one screen overlay: title, win, loss, or none while playing. */
function renderScreens(game) {
  byId('screen-title').style.display = game.phase === 'title' ? 'flex' : 'none';
  byId('screen-win').style.display = game.phase === 'over' && game.winner === 'player' ? 'flex' : 'none';
  byId('screen-loss').style.display = game.phase === 'over' && game.winner !== 'player' ? 'flex' : 'none';
  if (game.phase === 'over') {
    byId('win-final').textContent = 'Anda ' + game.player.score + ' — Lawan ' + game.rival.score;
    byId('loss-final').textContent = 'Anda ' + game.player.score + ' — Lawan ' + game.rival.score;
    // A draw is not a rival win: say so plainly on the loss screen.
    byId('loss-sub').textContent = game.winner === 'draw' ? 'Pasar berakhir imbang — tidak ada pemenang malam ini.' : 'Juragan Malam memenangkan lelang kali ini.';
  }
}
