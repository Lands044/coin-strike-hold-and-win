import { setGameNormalizer, toNumber, clampInt } from '@js/config/config.js'
import { DEFAULT_CONFIG } from './game.defaults.js'

const isGrid = (value, cols, rows) => Array.isArray(value) && value.length === cols
	&& value.every(col => Array.isArray(col) && col.length === rows && col.every(n => Number.isInteger(n) && n >= 1 && n <= 10))

// Validates a single scripted spin entry, falling back to the matching default
// entry (by index) when a field is missing or malformed — a partial config.json
// edit (e.g. only tweaking winAmount) should not corrupt the result grid.
function normalizeSpin(spin, fallback) {
	if (typeof spin !== 'object' || spin === null) return fallback

	const type = ['loss', 'smallwin', 'bigwin'].includes(spin.type) ? spin.type : fallback.type
	const winAmount = Math.max(0, toNumber(spin.winAmount, fallback.winAmount))
	const winLine = spin.winLine === null || (Array.isArray(spin.winLine) && spin.winLine.length === 3)
		? spin.winLine
		: fallback.winLine
	const result = isGrid(spin.result, 3, 3) ? spin.result : fallback.result

	return { type, winAmount, winLine, result }
}

function normalizeSpinList(list, fallbackList) {
	if (!Array.isArray(list) || list.length === 0) return fallbackList
	return list.map((spin, i) => normalizeSpin(spin, fallbackList[i % fallbackList.length]))
}

function normalizeGameConfig(config) {
	const game = config.game
	const defaults = DEFAULT_CONFIG.game

	game.balance = Math.max(0, toNumber(game.balance, defaults.balance))

	const bets = (Array.isArray(game.bets) ? game.bets : [])
		.map(value => toNumber(value, NaN))
		.filter(value => value > 0)
	game.bets = bets.length > 0 ? bets : defaults.bets
	game.betIndex = clampInt(game.betIndex, defaults.betIndex, 0, game.bets.length - 1)

	game.jackpots = Object.fromEntries(Object.keys(defaults.jackpots).map(key =>
		[key, Math.max(0, toNumber(game.jackpots?.[key], defaults.jackpots[key]))]
	))

	game.winAnimation = ['line', 'border'].includes(game.winAnimation) ? game.winAnimation : defaults.winAnimation

	game.spins = {
		desktop: normalizeSpinList(game.spins?.desktop, defaults.spins.desktop),
		mobile: normalizeSpinList(game.spins?.mobile, defaults.spins.mobile)
	}

	return config
}

export function registerGameConfig() {
	setGameNormalizer(normalizeGameConfig)
}
