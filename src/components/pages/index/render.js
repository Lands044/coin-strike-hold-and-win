import { imageUrl } from '@js/config/assets.js'

// textContent rather than innerText: these are plain labels, and innerText is
// rendering-dependent (it reads back empty inside a hidden element).
const setText = (selector, value) => {
	const element = document.querySelector(selector)
	if (element && typeof value === 'string') element.textContent = value
}

const setImage = (selector, value, fallbackKey) => {
	const element = document.querySelector(selector)
	if (element) element.src = imageUrl(value, fallbackKey)
}

const setBackground = (selector, value, fallbackKey) => {
	const element = document.querySelector(selector)
	if (element) element.style.backgroundImage = `url('${imageUrl(value, fallbackKey)}')`
}

/**
 * Applies the parts of the config that are static DOM (art, labels, jackpots,
 * popup, CTA). Anything tied to game state (balance, bet, spin results) is read
 * directly from `config` by the SlotMachine class in index.js, since it drives
 * its own re-renders on spin/bet-change.
 *
 * Safe to call repeatedly — this is the function the dev watcher re-runs on
 * every config.json edit.
 */
export function renderLanding(config) {
	const { texts, cta, assets, game } = config

	setImage('.logo img', assets.logo, 'logo')
	setBackground('.page', assets.background, 'bg')

	for (const [key, value] of Object.entries(game.jackpots)) {
		setText(`.jackpot--${key} .jackpot__value`, value.toFixed(2))
	}

	setText('.menu__info-block:not(.last-win) .menu__info-label', texts.creditLabel)
	setText('.menu__info-block.last-win .menu__info-label', texts.lastWinLabel)
	setText('.menu__bet-center .menu__info-label', texts.betLabel)

	setText('.popup__title', texts.popupTitle)
	setText('.popup__text', texts.popupText)
	setText('.cta-button', texts.ctaButton)

	const ctaButton = document.querySelector('.cta-button')
	if (ctaButton) {
		ctaButton.href = cta.url
		ctaButton.target = cta.target
	}
}
