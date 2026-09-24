import { DEFAULT_CONFIG } from '@js/config/game.defaults.js'

// Game-specific devmenu field groups, concatenated with CORE_FIELDS (texts/CTA/
// sound) in index.js. See src/js/config/devmenu.js in the core kit for the field
// shape ({ path, label, type, min/max/step, hint }).
//
// Only type/winAmount are editable per spin — result/winLine are per-column icon
// grids, so they stay config.json-only. Field count is derived from
// DEFAULT_CONFIG.game.spins so the panel always matches the number of scripted spins.
const spinFields = (breakpoint) => DEFAULT_CONFIG.game.spins[breakpoint].map((spin, i) => [
	{ path: `game.spins.${breakpoint}.${i}.type`, label: `Спін #${i + 1}: тип`, type: 'text',
		hint: i === 0 ? 'loss / smallwin / bigwin' : undefined },
	{ path: `game.spins.${breakpoint}.${i}.winAmount`, label: `Спін #${i + 1}: сума виграшу`, type: 'number', min: 0, step: 1 }
]).flat()

export const GAME_FIELDS = [
	['Баланс і ставки', [
		{ path: 'game.balance', label: 'Баланс', type: 'number', min: 0, step: 1 },
		{ path: 'game.bets', label: 'Ставки', type: 'list', hint: 'через кому, перемикаються стрілками −/+' },
		{ path: 'game.betIndex', label: 'Стартова ставка (індекс)', type: 'number', min: 0, step: 1 }
	]],
	['Джекпоти', [
		{ path: 'game.jackpots.grand', label: 'Grand', type: 'number', min: 0, step: 1 },
		{ path: 'game.jackpots.major', label: 'Major', type: 'number', min: 0, step: 1 },
		{ path: 'game.jackpots.minor', label: 'Minor', type: 'number', min: 0, step: 1 },
		{ path: 'game.jackpots.mini', label: 'Mini', type: 'number', min: 0, step: 1 }
	]],
	['Ефекти виграшу', [
		{ path: 'game.winAnimation', label: 'Анімація', type: 'text', hint: 'line / border' }
	]],
	['Спіни — Desktop', spinFields('desktop')],
	['Спіни — Mobile', spinFields('mobile')],
	['Підписи', [
		{ path: 'texts.creditLabel', label: 'Баланс', type: 'text' },
		{ path: 'texts.lastWinLabel', label: 'Останній виграш', type: 'text' },
		{ path: 'texts.betLabel', label: 'Ставка', type: 'text' },
		{ path: 'texts.winCounterLabel', label: 'Лічильник виграшу', type: 'text' }
	]]
]
