import { DEFAULT_CONFIG as CORE_DEFAULTS } from '@js/config/defaults.js'

// Game-specific defaults for the Coin Strike slot machine, merged on top of the
// core shape (texts/cta/sound/dev). Structural values tied to the CSS grid
// (columns/rows per breakpoint, icon height, icon count) stay hardcoded in
// index.js — only values that don't affect layout are config-driven.
export const DEFAULT_CONFIG = {
	...CORE_DEFAULTS,

	game: {
		balance: 1000.00,

		// Available bet values, switched with the −/+ arrows. `bet` is the index
		// of the starting one.
		bets: [1, 5, 10, 20, 30],
		betIndex: 0,

		jackpots: {
			grand: 1000.00,
			major: 150.00,
			minor: 50.00,
			mini: 25.00
		},

		// Win highlight: 'line' (payline across the reels) or 'border' (animated
		// outline around each winning icon).
		winAnimation: 'line',

		// Scripted spin outcomes, in order. Each entry's `result` is a per-column
		// array of icon numbers (1-10) — the grid is 3x3 on both breakpoints, so
		// `result` must have 3 columns of 3 icons. winLine is the winning row
		// (0-2) for each column, or null for a loss.
		spins: {
			desktop: [
				{
					type: 'loss',
					winAmount: 0,
					winLine: null,
					result: [
						[2, 4, 1],
						[3, 5, 2],
						[1, 7, 4]
					]
				},
				{
					type: 'smallwin',
					winAmount: 50,
					winLine: [1, 1, 1],
					result: [
						[4, 5, 2],
						[3, 5, 6],
						[8, 5, 1]
					]
				},
				{
					type: 'bigwin',
					winAmount: 150,
					winLine: [0, 1, 2],
					result: [
						[1, 2, 4],
						[5, 1, 3],
						[6, 8, 1]
					]
				}
			],
			mobile: [
				{
					type: 'loss',
					winAmount: 0,
					winLine: null,
					result: [
						[4, 1, 7],
						[5, 2, 8],
						[7, 4, 3]
					]
				},
				{
					type: 'smallwin',
					winAmount: 50,
					winLine: [1, 1, 1],
					result: [
						[4, 5, 2],
						[3, 5, 6],
						[8, 5, 1]
					]
				},
				{
					type: 'bigwin',
					winAmount: 150,
					winLine: [0, 1, 2],
					result: [
						[1, 5, 4],
						[2, 1, 3],
						[6, 8, 1]
					]
				}
			]
		}
	},

	// actionButton/rotateNotice from CORE_DEFAULTS.texts are dropped — this game
	// has no single action button and no rotate-to-portrait overlay, so neither
	// field would be read anywhere (see docs/config.md, "No dead or hidden fields").
	texts: (({ actionButton, rotateNotice, ...rest }) => ({
		...rest,
		popupTitle: "Congratulations!",
		popupText: "Ready to continue playing?",
		ctaButton: "Download Now",
		creditLabel: "CREDIT",
		lastWinLabel: "LAST WIN",
		betLabel: "BET",
		winCounterLabel: "WIN"
	}))(CORE_DEFAULTS.texts),

	cta: {
		...CORE_DEFAULTS.cta,
		url: "#"
	},

	assets: {
		...CORE_DEFAULTS.assets,
		logo: "logo",
		background: "bg",
		sounds: {
			spin: "spin",
			win: "win",
			music: "play-music"
		}
	}
}
