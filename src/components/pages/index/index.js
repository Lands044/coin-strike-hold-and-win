import ConfettiAnimation from './confetti.js';

class SlotMachine {
	constructor() {
		// DOM елементи
		this.drumSpinner = document.querySelector('.drum__spinner');
		this.popup = document.querySelector('.popup');
		this.buttonsWrap = document.querySelector('.menu__bottom');

		// Анімація конфеті
		this.confettiAnimation = null;

		// Кнопки
		this.spinButton = document.querySelector('.menu__button-spin');
		this.autoButton = document.querySelector('.menu__button-auto');
		this.autoplayButton = document.querySelector('.menu__button-autoplay');
		this.soundButton = document.querySelector('.menu__sound');
		this.increaseButton = document.querySelector('.menu__button-arrow.increase');
		this.reduceButton = document.querySelector('.menu__button-arrow.reduce');

		// Стан автопрокруту
		this.isAutoplaying = false;

		// Кнопки ставок
		this.betButtons = document.querySelectorAll('.menu__bet-btn');

		// Елементи UI
		this.balanceElement = document.querySelector('.menu__info .number');
		this.winElement = document.querySelector('.menu__info-win .number');
		this.betElement = document.querySelector('.menu__bet-value .number');

		// Стан гри
		this.spinCount = 0;
		this.isSpinning = false;
		this.isSoundEnabled = true;

		// Тип анімації виграшу: 'line' (виграшна лінія) або 'border' (анімована обводка)
		this.winAnimationType = 'line';

		// Фінансові значення
		this.balance = 1000.00;
		this.win = 0;
		this.betValues = this.getBetValuesFromButtons();
		this.currentBetIndex = 0;
		this.bet = this.betValues[this.currentBetIndex];

		// Брейкпоінти: desktop (>767.98px) та mobile (<=767.98px)
		// Desktop iconHeight масштабується тільки на екранах > 1440px
		// На менших екранах залишається фіксованим 180px
		this.breakpoints = {
			desktop: {
				minWidth: 767.98,
				cols: 3,
				rows: 5,
				// Масштабування тільки для екранів > 1440px, інакше фіксовано 155px
				getIconHeight: () => Math.max(110, (110 / 1440) * window.innerWidth)
			},
			mobile: {
				minWidth: 0,
				cols: 3,
				rows: 5,
				getIconHeight: () => 65
			}
		};

		// Поточна конфігурація
		this.config = this.getConfigForCurrentBreakpoint();

		// Базовий URL для ресурсів (коректні шляхи у білді)
		this.baseUrl = import.meta.env.BASE_URL || './';

		// Звуки
		this.sounds = {
			spin: new Audio(`${this.baseUrl}assets/sound/spin.mp3`),
			win: new Audio(`${this.baseUrl}assets/sound/win.mp3`)
		};

		// Іконки (8 типів)
		this.icons = 10;
		this.iconsPerReel = 100;

		// Елементи Lines
		this.linesItems = document.querySelectorAll('.lines__item');
		this.linesContainer = document.querySelector('.drum');

		// Патерни ліній для кожного значення
		// Desktop: 5 колонок, 3 рядки (0-2)
		// Mobile: 3 колонки, 3 рядки (0-2)
		this.linePatterns = {
			100: this.generateRandomLines(20),
			80: this.generateRandomLines(16),
			60: this.generateRandomLines(12),
			40: this.generateRandomLines(8),
			20: this.generateRandomLines(4)
		};

		// Предустановлені результати спінів
		// Desktop: 5 колонок по 3 іконки
		// Mobile: 3 колонки по 3 іконки
		// winLine: масив рядків (0-2 для desktop, 0-2 для mobile) де знаходяться виграшні іконки
		const spin1 = (() => {
			return {
				type: 'loss',
				winAmount: 0,
				winLine: null,
				result: [
					[3, 7, 2],   // col 0
					[9, 1, 6],   // col 1
					[5, 8, 4],   // col 2
					[2, 6, 10],  // col 3 (unused on 3-col)
					[7, 3, 1],   // col 4 (unused on 3-col)
				]
			};
		})();

		// smallwin: winIcon=5, winLine=[1,3,2] — кожна колонка у різному рядку
		const spin2 = (() => {
			const w = 5;
			return {
				type: 'smallwin',
				winAmount: 50,
				winLine: [1, 3, 2],
				result: [
					// col0: row1=w, решта без w
					[3, w, 8, 6, 2],
					// col1: row3=w, решта без w
					[9, 2, 6, w, 1],
					// col2: row2=w, решта без w
					[7, 4, w, 3, 9],
				]
			};
		})();

		// bigwin: winIcon=3, winLine=[0,1,2] — діагональ ↘
		const spin3 = (() => {
			const w = 3;
			return {
				type: 'bigwin',
				winAmount: 150,
				winLine: [0, 1, 2],
				result: [
					// col0: row0=w, решта без w
					[w, 7, 9, 5, 1],
					// col1: row1=w, решта без w
					[6, w, 8, 2, 4],
					// col2: row2=w, решта без w
					[9, 5, w, 6, 2],
				]
			};
		})();

		const spins = [spin1, spin2, spin3];

		this.predefinedResults = {
			desktop: spins,
			mobile: spins,
		};

		this.init();
	}

	getCurrentBreakpoint() {
		const width = window.innerWidth;
		if (width > this.breakpoints.desktop.minWidth) {
			return 'desktop';
		}
		return 'mobile';
	}

	getConfigForCurrentBreakpoint() {
		const breakpoint = this.getCurrentBreakpoint();
		return { ...this.breakpoints[breakpoint], breakpoint };
	}

	getResultsForCurrentBreakpoint() {
		const breakpoint = this.getCurrentBreakpoint();
		return this.predefinedResults[breakpoint];
	}

	init() {
		// Створюємо структуру барабанів зі стрічками
		this.createReels();

		// Обробник buy bonus
		const buyBonusBtn = document.querySelector('.buy-bonus');
		if (buyBonusBtn) {
			buyBonusBtn.addEventListener('click', (e) => {
				e.preventDefault();
				this.handleBuyBonus(buyBonusBtn);
			});
		}

		// Обробники кнопок спіну
		this.spinButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.handleSpin();
		});

		this.autoButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.handleSpin();
		});

		// Обробник кнопки автопрокруту
		if (this.autoplayButton) {
			this.autoplayButton.addEventListener('click', (e) => {
				e.preventDefault();
				this.handleAutoplay();
			});
		}

		// Обробник кнопки звуку
		this.soundButton.addEventListener('click', (e) => {
			e.preventDefault();
			this.toggleSound();
		});

		// Обробники стрілок для зміни ставки
		if (this.increaseButton) {
			this.increaseButton.addEventListener('click', (e) => {
				e.preventDefault();
				this.increaseBet();
			});
		}

		if (this.reduceButton) {
			this.reduceButton.addEventListener('click', (e) => {
				e.preventDefault();
				this.decreaseBet();
			});
		}

		// Обробники кнопок ставок
		this.betButtons.forEach((button, index) => {
			button.addEventListener('click', () => {
				this.selectBet(index);
			});
		});

		// Оновлення при зміні розміру вікна
		window.addEventListener('resize', () => {
			this.handleResize();
		});

		// Обробники кнопок Lines
		this.linesItems.forEach((item) => {
			item.addEventListener('click', () => {
				this.handleLinesClick(item);
			});
		});

		// Кнопки що відкривають попап одразу (без затримки)
		document.querySelectorAll('.bonus-btn, .menu__action-btn').forEach((btn) => {
			btn.addEventListener('click', (e) => {
				e.preventDefault();
				this.openPopup();
			});
		});

		// Оновлюємо UI
		this.updateUI();
	}

	// Створює структуру барабанів зі стрічками для анімації
	createReels() {
		// Очищаємо існуючу розмітку
		this.drumSpinner.innerHTML = '';

		const cols = this.config.cols;
		const rows = this.config.rows;
		const iconHeight = this.config.getIconHeight();

		// Створюємо колонки
		for (let colIndex = 0; colIndex < cols; colIndex++) {
			const column = document.createElement('div');
			column.className = 'drum__column';
			column.dataset.column = colIndex;

			// Створюємо стрічку (strip) з іконками
			const strip = document.createElement('div');
			strip.className = 'drum__strip';

			// Випадкове зміщення для кожної колонки
			const randomOffset = Math.floor(Math.random() * this.icons);

			// Генеруємо випадкові іконки для стрічки
			for (let i = 0; i < this.iconsPerReel; i++) {
				const iconNum = ((i + randomOffset) % this.icons) + 1;
				const icon = document.createElement('div');
				icon.className = 'drum__image';
				icon.innerHTML = `<img src="${this.baseUrl}assets/img/icon/icon-${iconNum}.webp" alt="Icon ${iconNum}">`;
				strip.appendChild(icon);
			}

			// Додаємо predefined комбінації в кінець стрічки
			const results = this.getResultsForCurrentBreakpoint();
			results.forEach((result) => {
				const columnIcons = result.result[colIndex];
				if (columnIcons) {
					columnIcons.forEach((iconNum) => {
						const icon = document.createElement('div');
						icon.className = 'drum__image';
						icon.innerHTML = `<img src="${this.baseUrl}assets/img/icon/icon-${iconNum}.webp" alt="Icon ${iconNum}">`;
						strip.appendChild(icon);
					});
				}
			});

			// Буфер після останньої комбінації — щоб стрічка не закінчувалась посередині видимої зони
			for (let i = 0; i < rows; i++) {
				const iconNum = (i % this.icons) + 1;
				const icon = document.createElement('div');
				icon.className = 'drum__image';
				icon.innerHTML = `<img src="${this.baseUrl}assets/img/icon/icon-${iconNum}.webp" alt="Icon ${iconNum}">`;
				strip.appendChild(icon);
			}

			column.appendChild(strip);
			this.drumSpinner.appendChild(column);
		}

		// Встановлюємо початкові позиції
		this.initializePositions();
	}

	// Встановлює початкові позиції стрічок
	initializePositions() {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const iconHeight = this.config.getIconHeight();

		columns.forEach((column) => {
			const strip = column.querySelector('.drum__strip');
			// Початкова позиція - показуємо перші іконки
			const randomOffset = Math.floor(Math.random() * this.icons) * iconHeight;
			strip.style.transform = `translateY(-${randomOffset}px)`;
		});

		this.updateCenterClass();
	}

	// Додає клас .is-center до іконок центрального рядка
	updateCenterClass() {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const iconHeight = this.config.getIconHeight();

		columns.forEach((column) => {
			const strip = column.querySelector('.drum__strip');
			const icons = strip.querySelectorAll('.drum__image');

			icons.forEach(icon => icon.classList.remove('is-center'));

			const match = strip.style.transform.match(/translateY\(-?(\d+(?:\.\d+)?)px\)/);
			const offset = match ? parseFloat(match[1]) : 0;
			const centerIndex = Math.round(offset / iconHeight) + 1;

			if (icons[centerIndex]) {
				icons[centerIndex].classList.add('is-center');
			}
		});
	}

	// Обробка зміни розміру вікна
	handleResize() {
		const newConfig = this.getConfigForCurrentBreakpoint();
		if (newConfig.breakpoint !== this.config.breakpoint) {
			this.config = newConfig;
			this.spinCount = 0;
			this.createReels();
			// Перегенеровуємо патерни ліній для нового брейкпоінта
			this.regenerateLinePatterns();
			// Видаляємо відображені лінії
			this.removePaylines();
		}
	}

	// Обробка спіну
	async handleSpin() {
		if (this.isSpinning) return;

		if (this.balance < this.bet) {
			console.log('Недостатньо коштів');
			return;
		}

		const results = this.getResultsForCurrentBreakpoint();

		if (this.spinCount >= results.length) {
			console.log('Всі спіни використано');
			return;
		}

		this.isSpinning = true;

		// Віднімаємо ставку
		this.balance -= this.bet;
		this.updateUI();

		// Блокуємо кнопки
		this.disableSpinButtons();

		// Звук спіну
		this.playSound('spin');

		const currentResult = results[this.spinCount];

		// Запускаємо анімацію обертання
		await this.spin(currentResult);

		// Додаємо виграш до Win
		if (currentResult.winAmount > 0) {
			this.win = (this.win || 0) + currentResult.winAmount;
			this.updateUI();
		}

		this.spinCount++;

		const isLastSpin = this.spinCount >= results.length;

		if (isLastSpin) {
			// Останній спін — не чекаємо анімацію, одразу показуємо CTA
			this.showResult(currentResult);
			this.isSpinning = false;
			this.showCTA();
		} else {
			// Чекаємо завершення анімації виграшу перед наступним спіном
			await this.showResult(currentResult);
			this.isSpinning = false;
		}
	}

	// Анімація обертання всіх колонок
	async spin(result) {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const duration = 3000;

		// Запускаємо анімацію кожної колонки з затримкою
		const spinPromises = Array.from(columns).map((column, colIndex) => {
			return new Promise((resolve) => {
				setTimeout(() => {
					this.spinColumn(column, result.result[colIndex], duration, colIndex);
					setTimeout(resolve, duration + (colIndex * 100));
				}, colIndex * 100);
			});
		});

		await Promise.all(spinPromises);
	}

	// Анімація обертання однієї колонки
	spinColumn(column, targetIcons, duration, colIndex) {
		const strip = column.querySelector('.drum__strip');
		const iconHeight = this.config.getIconHeight();
		const rows = this.config.rows;

		// Знаходимо позицію потрібної послідовності в стрічці
		const targetPosition = this.findSequencePosition(strip, targetIcons);

		if (targetPosition === -1) {
			console.log('Послідовність не знайдена');
			return;
		}

		// Скидаємо до початкової позиції
		strip.style.transition = 'none';
		strip.style.transform = 'translateY(0)';

		// Примусовий reflow
		strip.offsetHeight;

		// Додаємо blur ефект на початку обертання
		strip.classList.add('active');

		// Фінальна позиція - показати потрібні іконки
		const finalOffset = targetPosition * iconHeight;

		// Запускаємо анімацію з плавним сповільненням
		strip.style.transition = `transform ${duration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
		strip.style.transform = `translateY(-${finalOffset}px)`;

		// Видаляємо blur ефект перед зупинкою (за 500ms до кінця)
		setTimeout(() => {
			strip.classList.remove('active');
		}, duration - 250);

		// Оновлюємо .is-center після зупинки колонки
		setTimeout(() => {
			this.updateCenterClass();
		}, duration + (colIndex * 100) + 50);
	}

	// Знаходить позицію послідовності іконок у стрічці
	findSequencePosition(strip, targetIcons) {
		const icons = strip.querySelectorAll('.drum__image img');

		// Шукаємо з кінця стрічки (там predefined комбінації)
		for (let i = icons.length - targetIcons.length; i >= 0; i--) {
			let found = true;

			for (let j = 0; j < targetIcons.length; j++) {
				const img = icons[i + j];
				if (!img) {
					found = false;
					break;
				}

				const iconNum = this.getIconNumber(img);
				if (iconNum !== targetIcons[j]) {
					found = false;
					break;
				}
			}

			if (found) {
				return i;
			}
		}

		return -1;
	}

	// Отримує номер іконки з src
	getIconNumber(img) {
		const src = img.getAttribute('src');
		const match = src.match(/icon-(\d+)\.webp/);
		return match ? parseInt(match[1]) : 1;
	}

	// Показ результату — повертає Promise що резолвиться після завершення анімації
	showResult(result) {
		return new Promise((resolve) => {
			if (result.type === 'bigwin') {
				const dur = 2500;
				this.playSound('win');
				this.drumSpinner.classList.add('bigwin-animation');
				this.createWinEffects();
				this.launchCoinsToLogo(18);
				this.showWinCounter(result.winAmount, dur);

				if (result.winLine) {
					this.drawWinAnimation(result.winLine);
				}

				setTimeout(() => {
					this.drumSpinner.classList.remove('bigwin-animation');
					this.removeWinAnimation();
					this.enableSpinButtons();
					resolve();
				}, dur);

			} else if (result.type === 'smallwin') {
				const dur = 2000;
				this.playSound('win');
				this.drumSpinner.classList.add('smallwin-animation');
				this.launchCoinsToLogo(10);
				this.showWinCounter(result.winAmount, dur);

				if (result.winLine) {
					this.drawWinAnimation(result.winLine);
				}

				setTimeout(() => {
					this.drumSpinner.classList.remove('smallwin-animation');
					this.removeWinAnimation();
					this.enableSpinButtons();
					resolve();
				}, dur);

			} else {
				this.enableSpinButtons();
				resolve();
			}
		});
	}

	// Малює анімацію виграшу в залежності від типу
	drawWinAnimation(winLine) {
		if (this.winAnimationType === 'border') {
			this.drawWinBorder(winLine);
		} else {
			this.drawWinLine(winLine);
		}
	}

	// Видаляє анімацію виграшу
	removeWinAnimation() {
		if (this.winAnimationType === 'border') {
			this.removeWinBorder();
		} else {
			this.removeWinLine();
		}
	}

	// Встановлює тип анімації виграшу ('line' або 'border')
	setWinAnimationType(type) {
		if (type === 'line' || type === 'border') {
			this.winAnimationType = type;
		}
	}

	// Малює анімовану обводку навколо виграшних іконок
	drawWinBorder(winLine) {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const iconHeight = this.config.getIconHeight();
		const rows = this.config.rows;

		columns.forEach((column, colIndex) => {
			const winRowIndex = winLine[colIndex];
			if (winRowIndex === null || colIndex >= columns.length) return;

			const strip = column.querySelector('.drum__strip');
			const icons = strip.querySelectorAll('.drum__image');

			// Визначаємо видимі іконки на основі поточної позиції strip
			const transform = strip.style.transform;
			const match = transform.match(/translateY\(-?([\d.]+)px\)/);
			const currentOffset = match ? parseInt(match[1]) : 0;
			const visibleStartIndex = Math.round(currentOffset / iconHeight);

			// Застосовуємо ефекти до всіх видимих іконок
			for (let i = 0; i < rows; i++) {
				const iconIndex = visibleStartIndex + i;
				const icon = icons[iconIndex];
				if (!icon) continue;

				if (i === winRowIndex) {
					// Виграшна іконка - додаємо анімовану обводку
					icon.classList.add('win-border-animation');
					this.createAnimatedBorder(icon);
				} else {
					// Невиграшна іконка - затемнюємо
					icon.classList.add('dimmed');
				}
			}
		});
	}

	// Масштабує значення пропорційно viewport (тільки для екранів > 1440px)
	scaleValue(px) {
		const baseWidth = 1440;
		return Math.max(px, (px / baseWidth) * window.innerWidth);
	}

	// Створює SVG анімовану обводку для іконки
	createAnimatedBorder(iconElement) {
		const width = iconElement.offsetWidth;
		const height = iconElement.offsetHeight;

		// Масштабовані значення для екранів > 1440px
		const padding = this.scaleValue(8);
		const borderRadius = this.scaleValue(12);
		const strokeWidthMain = this.scaleValue(6);
		const strokeWidthGlow = this.scaleValue(2);
		const blurStdDeviation = this.scaleValue(6);

		// Створюємо SVG контейнер
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'win-border-svg');
		svg.setAttribute('width', width);
		svg.setAttribute('height', height);
		svg.style.position = 'absolute';
		svg.style.top = '0';
		svg.style.left = '0';
		svg.style.pointerEvents = 'none';
		svg.style.zIndex = '50';
		svg.style.overflow = 'visible';

		// Розміри прямокутника з відступом
		const rectX = padding;
		const rectY = padding;
		const rectWidth = width - padding * 2;
		const rectHeight = height - padding * 2;

		// Периметр прямокутника (для анімації)
		const perimeter = 2 * (rectWidth + rectHeight);

		// Defs для фільтрів
		const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

		// Фільтр для blur/glow ефекту
		const filterId = `glow-${Date.now()}-${Math.random()}`;
		const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
		filter.setAttribute('id', filterId);
		filter.setAttribute('x', '-50%');
		filter.setAttribute('y', '-50%');
		filter.setAttribute('width', '200%');
		filter.setAttribute('height', '200%');

		const feGaussianBlur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
		feGaussianBlur.setAttribute('stdDeviation', blurStdDeviation);
		feGaussianBlur.setAttribute('result', 'coloredBlur');

		const feMerge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
		const feMergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
		feMergeNode1.setAttribute('in', 'coloredBlur');
		const feMergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
		feMergeNode2.setAttribute('in', 'SourceGraphic');

		feMerge.appendChild(feMergeNode1);
		feMerge.appendChild(feMergeNode2);
		filter.appendChild(feGaussianBlur);
		filter.appendChild(feMerge);
		defs.appendChild(filter);
		svg.appendChild(defs);

		// Налаштування dash для анімації "біжучого" світла
		const dashLength = perimeter * 0.2; // 20% периметра світиться

		// Унікальне ім'я для keyframes (на основі периметра)
		const animationName1 = `borderRotate-${Math.round(perimeter)}`;
		const animationName2 = `borderRotate2-${Math.round(perimeter)}`;

		// Додаємо динамічні keyframes в style тег
		const styleId = `border-anim-style-${Math.round(perimeter)}`;
		if (!document.getElementById(styleId)) {
			const style = document.createElement('style');
			style.id = styleId;
			style.textContent = `
				@keyframes ${animationName1} {
					0% { stroke-dashoffset: 0; }
					100% { stroke-dashoffset: ${-perimeter}; }
				}
				@keyframes ${animationName2} {
					0% { stroke-dashoffset: ${-perimeter * 0.5}; }
					100% { stroke-dashoffset: ${-perimeter * 1.5}; }
				}
			`;
			document.head.appendChild(style);
		}

		// Перша анімована лінія (починає з верхнього лівого кута)
		const animRect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		animRect1.setAttribute('x', rectX);
		animRect1.setAttribute('y', rectY);
		animRect1.setAttribute('width', rectWidth);
		animRect1.setAttribute('height', rectHeight);
		animRect1.setAttribute('rx', borderRadius);
		animRect1.setAttribute('ry', borderRadius);
		animRect1.setAttribute('fill', 'none');
		animRect1.setAttribute('stroke', '#ffb921');
		animRect1.setAttribute('stroke-width', strokeWidthMain);
		animRect1.setAttribute('stroke-linecap', 'round');
		animRect1.setAttribute('filter', `url(#${filterId})`);
		animRect1.setAttribute('stroke-dasharray', `${dashLength} ${perimeter - dashLength}`);
		animRect1.setAttribute('stroke-dashoffset', '0');
		animRect1.style.animation = `${animationName1} 3s linear infinite`;
		svg.appendChild(animRect1);

		// Білий центр для першої лінії
		const glowRect1 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		glowRect1.setAttribute('x', rectX);
		glowRect1.setAttribute('y', rectY);
		glowRect1.setAttribute('width', rectWidth);
		glowRect1.setAttribute('height', rectHeight);
		glowRect1.setAttribute('rx', borderRadius);
		glowRect1.setAttribute('ry', borderRadius);
		glowRect1.setAttribute('fill', 'none');
		glowRect1.setAttribute('stroke', '#fff');
		glowRect1.setAttribute('stroke-width', strokeWidthGlow);
		glowRect1.setAttribute('stroke-linecap', 'round');
		glowRect1.setAttribute('stroke-dasharray', `${dashLength * 0.5} ${perimeter - dashLength * 0.5}`);
		glowRect1.setAttribute('stroke-dashoffset', '0');
		glowRect1.style.animation = `${animationName1} 3s linear infinite`;
		svg.appendChild(glowRect1);

		// Друга анімована лінія (починає з діагонально протилежного кута - 50% зміщення)
		const animRect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		animRect2.setAttribute('x', rectX);
		animRect2.setAttribute('y', rectY);
		animRect2.setAttribute('width', rectWidth);
		animRect2.setAttribute('height', rectHeight);
		animRect2.setAttribute('rx', borderRadius);
		animRect2.setAttribute('ry', borderRadius);
		animRect2.setAttribute('fill', 'none');
		animRect2.setAttribute('stroke', '#ffb921');
		animRect2.setAttribute('stroke-width', strokeWidthMain);
		animRect2.setAttribute('stroke-linecap', 'round');
		animRect2.setAttribute('filter', `url(#${filterId})`);
		animRect2.setAttribute('stroke-dasharray', `${dashLength} ${perimeter - dashLength}`);
		animRect2.setAttribute('stroke-dashoffset', `${-perimeter * 0.5}`);
		animRect2.style.animation = `${animationName2} 3s linear infinite`;
		svg.appendChild(animRect2);

		// Білий центр для другої лінії
		const glowRect2 = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		glowRect2.setAttribute('x', rectX);
		glowRect2.setAttribute('y', rectY);
		glowRect2.setAttribute('width', rectWidth);
		glowRect2.setAttribute('height', rectHeight);
		glowRect2.setAttribute('rx', borderRadius);
		glowRect2.setAttribute('ry', borderRadius);
		glowRect2.setAttribute('fill', 'none');
		glowRect2.setAttribute('stroke', '#fff');
		glowRect2.setAttribute('stroke-width', strokeWidthGlow);
		glowRect2.setAttribute('stroke-linecap', 'round');
		glowRect2.setAttribute('stroke-dasharray', `${dashLength * 0.5} ${perimeter - dashLength * 0.5}`);
		glowRect2.setAttribute('stroke-dashoffset', `${-perimeter * 0.5}`);
		glowRect2.style.animation = `${animationName2} 3s linear infinite`;
		svg.appendChild(glowRect2);

		// Додаємо SVG до іконки
		iconElement.style.position = 'relative';
		iconElement.appendChild(svg);

		// Запускаємо CSS анімацію через клас
		setTimeout(() => {
			svg.classList.add('active');
		}, 50);
	}

	// Видаляє анімовану обводку
	removeWinBorder() {
		// Видаляємо всі SVG обводки
		const svgs = this.drumSpinner.querySelectorAll('.win-border-svg');
		svgs.forEach(svg => {
			svg.classList.remove('active');
			setTimeout(() => svg.remove(), 300);
		});

		// Видаляємо класи з іконок
		const icons = this.drumSpinner.querySelectorAll('.drum__image');
		icons.forEach(icon => {
			icon.classList.remove('win-border-animation', 'dimmed');
		});
	}

	// Малює виграшну лінію через SVG
	drawWinLine(winLine) {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const iconHeight = this.config.getIconHeight();
		const spinnerRect = this.drumSpinner.getBoundingClientRect();

		// Створюємо SVG елемент
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'win-line-svg');
		svg.setAttribute('width', '100%');
		svg.setAttribute('height', '100%');
		svg.style.position = 'absolute';
		svg.style.top = '0';
		svg.style.left = '0';
		svg.style.pointerEvents = 'none';
		svg.style.zIndex = '50';
		svg.style.overflow = 'visible';

		// Збираємо точки для лінії
		const points = [];

		winLine.forEach((rowIndex, colIndex) => {
			if (rowIndex === null || colIndex >= columns.length) return;

			const column = columns[colIndex];
			const colRect = column.getBoundingClientRect();

			// Центр іконки
			const x = colRect.left - spinnerRect.left + colRect.width / 2;
			const y = (rowIndex + 0.5) * iconHeight;

			points.push({ x, y });
		});

		if (points.length < 2) return;

		// Створюємо polyline для лінії
		const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
		const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
		polyline.setAttribute('points', pointsStr);
		polyline.setAttribute('class', 'win-line');

		svg.appendChild(polyline);

		// Додаємо кола на кожній точці
		points.forEach((point) => {
			const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
			circle.setAttribute('cx', point.x);
			circle.setAttribute('cy', point.y);
			circle.setAttribute('r', '8');
			circle.setAttribute('class', 'win-line-dot');
			svg.appendChild(circle);
		});

		this.drumSpinner.appendChild(svg);

		// Застосовуємо ефекти до іконок (затемнення та хитання)
		this.applyWinIconEffects(winLine);

		// Анімація появи
		setTimeout(() => {
			svg.classList.add('visible');
		}, 50);
	}

	// Застосовує ефекти до іконок: затемнення невиграшних та хитання виграшних
	applyWinIconEffects(winLine) {
		const columns = this.drumSpinner.querySelectorAll('.drum__column');
		const rows = this.config.rows;
		const iconHeight = this.config.getIconHeight();

		columns.forEach((column, colIndex) => {
			const strip = column.querySelector('.drum__strip');
			const icons = strip.querySelectorAll('.drum__image');
			const winRowIndex = winLine[colIndex];

			// Визначаємо видимі іконки на основі поточної позиції strip
			const transform = strip.style.transform;
			const match = transform.match(/translateY\(-?([\d.]+)px\)/);
			const currentOffset = match ? parseInt(match[1]) : 0;
			const visibleStartIndex = Math.round(currentOffset / iconHeight);

			for (let i = 0; i < rows; i++) {
				const iconIndex = visibleStartIndex + i;
				const icon = icons[iconIndex];

				if (!icon) continue;

				if (winRowIndex !== null && i === winRowIndex) {
					// Виграшна іконка - додаємо хитання
					icon.classList.add('winning');
				} else {
					// Невиграшна іконка - затемнюємо
					icon.classList.add('dimmed');
				}
			}
		});
	}

	// Видаляє ефекти з іконок
	removeWinIconEffects() {
		const icons = this.drumSpinner.querySelectorAll('.drum__image');
		icons.forEach((icon) => {
			icon.classList.remove('winning', 'dimmed');
		});
	}

	// Видаляє виграшну лінію
	removeWinLine() {
		const svg = this.drumSpinner.querySelector('.win-line-svg');
		if (svg) {
			svg.classList.remove('visible');
			setTimeout(() => svg.remove(), 300);
		}
		// Видаляємо ефекти з іконок
		this.removeWinIconEffects();
	}

	// Ефекти виграшу
	createWinEffects() {
		for (let i = 0; i < 12; i++) {
			setTimeout(() => {
				const flash = document.createElement('div');
				flash.className = 'win-flash';
				flash.style.left = `${Math.random() * 100}%`;
				flash.style.top = `${Math.random() * 100}%`;
				this.drumSpinner.appendChild(flash);

				setTimeout(() => flash.remove(), 600);
			}, i * 120);
		}
	}

	// Монетки летять з барабана до лого при виграші
	launchCoinsToLogo(count = 14) {
		const drumRect = this.linesContainer.getBoundingClientRect();
		const logoImg = document.querySelector('.logo img');
		if (!logoImg) return;
		const logoRect = logoImg.getBoundingClientRect();

		const targetX = logoRect.left + logoRect.width / 2;
		const targetY = logoRect.top + logoRect.height / 2;

		let landed = 0;

		for (let i = 0; i < count; i++) {
			setTimeout(() => {
				const coin = document.createElement('div');
				coin.className = 'win-coin';

				// старт — рандомна точка всередині барабана
				const startX = drumRect.left + drumRect.width * 0.2 + Math.random() * drumRect.width * 0.6;
				const startY = drumRect.top  + drumRect.height * 0.2 + Math.random() * drumRect.height * 0.6;

				coin.style.left = `${startX}px`;
				coin.style.top  = `${startY}px`;

				const tx = targetX - startX;
				const ty = targetY - startY;
				coin.style.setProperty('--tx', `${tx}px`);
				coin.style.setProperty('--ty', `${ty}px`);
				coin.style.setProperty('--rot', `${(Math.random() - 0.5) * 720}deg`);

				// невелика дуга вгору через midpoint
				const arcY = Math.min(ty * 0.4, -60) - Math.random() * 80;
				coin.style.setProperty('--arc', `${arcY}px`);

				document.body.appendChild(coin);

				const flyDuration = 700 + Math.random() * 300;
				coin.style.animationDuration = `${flyDuration}ms`;

				setTimeout(() => {
					coin.remove();
					landed++;
					// коли всі монети долетіли — лого підстрибує
					if (landed === count) {
						if (logoImg) {
							logoImg.classList.add('logo-bounce');
							setTimeout(() => logoImg.classList.remove('logo-bounce'), 700);
						}
					}
				}, flyDuration);
			}, i * 80);
		}
	}

	// WIN лічильник — з'являється знизу барабана, рахує від 0 до winAmount
	showWinCounter(winAmount, duration) {
		const field = this.linesContainer.closest('.game__field') || this.linesContainer;

		const counter = document.createElement('div');
		counter.className = 'win-counter';
		counter.innerHTML = `<span class="win-counter__label">WIN</span><span class="win-counter__value">0.00</span>`;
		field.appendChild(counter);

		requestAnimationFrame(() => counter.classList.add('visible'));

		const valueEl = counter.querySelector('.win-counter__value');
		const countDuration = Math.min(duration * 0.7, 1200);
		const startTime = performance.now();

		function tick(now) {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / countDuration, 1);
			const eased = 1 - Math.pow(1 - progress, 3);
			valueEl.textContent = (winAmount * eased).toFixed(2);
			if (progress < 1) {
				requestAnimationFrame(tick);
			} else {
				valueEl.textContent = winAmount.toFixed(2);
			}
		}
		requestAnimationFrame(tick);

		setTimeout(() => {
			counter.classList.remove('visible');
			setTimeout(() => counter.remove(), 300);
		}, duration);
	}

	// Показ CTA popup
	handleBuyBonus(btn) {
		if (btn.classList.contains('buy-bonus--used')) return;
		if (this.isSpinning) return;

		const bonusAmount = 30;
		const coinCount = 10;
		const coinDuration = 800; // ms кожна монета летить

		// Дізейблимо одразу
		btn.classList.add('buy-bonus--used');

		const btnRect = btn.getBoundingClientRect();
		const balanceEl = document.querySelector('.menu__info .number');
		const balanceRect = balanceEl.getBoundingClientRect();

		// Ціль — центр елемента балансу
		const targetX = balanceRect.left + balanceRect.width / 2;
		const targetY = balanceRect.top + balanceRect.height / 2;

		// Запускаємо монети з невеликою затримкою між ними
		for (let i = 0; i < coinCount; i++) {
			setTimeout(() => {
				const coin = document.createElement('div');
				coin.className = 'bonus-coin';

				// Старт — центр кнопки з невеликим розкидом
				const startX = btnRect.left + btnRect.width / 2 + (Math.random() - 0.5) * 30;
				const startY = btnRect.top + btnRect.height / 2 + (Math.random() - 0.5) * 20;

				coin.style.left = `${startX}px`;
				coin.style.top = `${startY}px`;

				// Вектор до балансу
				coin.style.setProperty('--tx', `${targetX - startX}px`);
				coin.style.setProperty('--ty', `${targetY - startY}px`);
				coin.style.setProperty('--rotate', `${Math.random() * 540 - 270}deg`);

				document.body.appendChild(coin);

				// Спалах на балансі коли монета долітає
				setTimeout(() => {
					coin.remove();
					balanceEl.closest('.menu__info-value').classList.add('balance-flash');
					setTimeout(() => {
						balanceEl.closest('.menu__info-value').classList.remove('balance-flash');
					}, 300);
				}, coinDuration);
			}, i * 60);
		}

		// Оновлюємо баланс після того як перші монети долетіли
		setTimeout(() => {
			this.balance += bonusAmount;
			this.updateUI();
		}, coinDuration);
	}

	showCTA() {
		this.buttonsWrap.classList.add('hidden');

		setTimeout(() => {
			this.openPopup();
		}, 1500);
	}

	openPopup() {
		this.popup.classList.add('show');

		if (!this.confettiAnimation) {
			this.confettiAnimation = new ConfettiAnimation(this.popup);
		}
	}

	// Перемикання звуку
	toggleSound() {
		this.isSoundEnabled = !this.isSoundEnabled;

		if (this.isSoundEnabled) {
			this.soundButton.classList.remove('sound-off');
		} else {
			this.soundButton.classList.add('sound-off');
			this.stopAllSounds();
		}
	}

	// Відтворення звуку
	playSound(soundName) {
		if (!this.isSoundEnabled) return;

		const sound = this.sounds[soundName];
		if (sound) {
			sound.currentTime = 0;
			sound.play().catch(error => {
				console.log('Помилка відтворення звуку:', error);
			});
		}
	}

	// Зупинка всіх звуків
	stopAllSounds() {
		Object.values(this.sounds).forEach(sound => {
			sound.pause();
			sound.currentTime = 0;
		});
	}

	// Блокує кнопки спіну
	disableSpinButtons() {
		this.spinButton.classList.add('disabled');
		this.autoButton.classList.add('disabled');
		// Блокуємо buy bonus під час спіну
		const buyBtn = document.querySelector('.buy-bonus:not(.buy-bonus--used)');
		if (buyBtn) buyBtn.classList.add('buy-bonus--spinning');
	}

	// Розблоковує кнопки спіну
	enableSpinButtons() {
		// Не розблоковуємо якщо всі спіни використано
		const results = this.getResultsForCurrentBreakpoint();
		if (this.spinCount >= results.length) return;

		// Не розблоковуємо під час автопрокруту
		if (this.isAutoplaying) return;

		this.spinButton.classList.remove('disabled');
		this.autoButton.classList.remove('disabled');
		// Розблоковуємо buy bonus після спіну
		const buyBtn = document.querySelector('.buy-bonus:not(.buy-bonus--used)');
		if (buyBtn) buyBtn.classList.remove('buy-bonus--spinning');
	}

	// Запускає всі спіни підряд, чекаючи кожен включно з анімацією виграшу
	async handleAutoplay() {
		if (this.isSpinning || this.isAutoplaying) return;

		const results = this.getResultsForCurrentBreakpoint();
		if (this.spinCount >= results.length) return;

		this.isAutoplaying = true;
		if (this.autoplayButton) this.autoplayButton.classList.add('active', 'disabled');

		while (this.spinCount < results.length) {
			await this.handleSpin();
		}

		this.isAutoplaying = false;
		if (this.autoplayButton) this.autoplayButton.classList.remove('active', 'disabled');
	}

	// Отримує значення ставок з кнопок
	getBetValuesFromButtons() {
		const values = [];
		this.betButtons.forEach((button) => {
			const value = parseInt(button.textContent, 10);
			if (!isNaN(value)) {
				values.push(value);
			}
		});
		return values.length > 0 ? values : [1, 5, 10, 20, 30];
	}

	// Вибір ставки по індексу
	selectBet(index) {
		if (this.isSpinning) return;
		if (index < 0 || index >= this.betValues.length) return;

		this.currentBetIndex = index;
		this.bet = this.betValues[index];
		this.updateBetButtonsUI();
		this.updateUI();
	}

	// Збільшення ставки (перехід до наступної кнопки)
	increaseBet() {
		if (this.isSpinning) return;

		if (this.currentBetIndex < this.betValues.length - 1) {
			this.currentBetIndex++;
			this.bet = this.betValues[this.currentBetIndex];
			this.updateBetButtonsUI();
			this.updateUI();
		}
	}

	// Зменшення ставки (перехід до попередньої кнопки)
	decreaseBet() {
		if (this.isSpinning) return;

		if (this.currentBetIndex > 0) {
			this.currentBetIndex--;
			this.bet = this.betValues[this.currentBetIndex];
			this.updateBetButtonsUI();
			this.updateUI();
		}
	}

	// Оновлення UI кнопок ставок (клас active)
	updateBetButtonsUI() {
		this.betButtons.forEach((button, index) => {
			if (index === this.currentBetIndex) {
				button.classList.add('active');
			} else {
				button.classList.remove('active');
			}
		});
	}

	// Оновлення UI
	updateUI() {
		if (this.balanceElement) {
			this.balanceElement.textContent = this.balance.toFixed(2);
		}
		if (this.winElement) {
			this.winElement.textContent = this.win.toFixed(2);
		}
		if (this.betElement) {
			this.betElement.textContent = this.bet;
		}
	}

	// Генерує випадкові лінії для поточного брейкпоінта
	generateRandomLines(count) {
		const lines = [];
		const rows = this.config.rows;
		const cols = this.config.cols;

		for (let i = 0; i < count; i++) {
			const line = [];
			for (let col = 0; col < cols; col++) {
				line.push(Math.floor(Math.random() * rows));
			}
			lines.push(line);
		}
		return lines;
	}

	// Перегенеровує патерни ліній для поточного брейкпоінта
	regenerateLinePatterns() {
		this.linePatterns = {
			100: this.generateRandomLines(20),
			80: this.generateRandomLines(16),
			60: this.generateRandomLines(12),
			40: this.generateRandomLines(8),
			20: this.generateRandomLines(4)
		};
	}

	// Обробка кліку на Lines
	handleLinesClick(item) {
		// Знімаємо active з усіх
		this.linesItems.forEach(li => li.classList.remove('active'));
		// Додаємо active на поточний
		item.classList.add('active');

		// Отримуємо значення
		const value = parseInt(item.querySelector('button').textContent);
		this.showLines(value);
	}

	// Показує лінії для вибраного значення
	showLines(value) {
		// Видаляємо попередні лінії
		this.removePaylines();

		// Скасовуємо попередній таймер зникнення
		if (this.paylinesTimeout) {
			clearTimeout(this.paylinesTimeout);
		}

		const lines = this.linePatterns[value];
		if (!lines) return;

		const iconHeight = this.config.getIconHeight();
		const spinnerRect = this.drumSpinner.getBoundingClientRect();
		const columns = this.drumSpinner.querySelectorAll('.drum__column');

		// Створюємо SVG контейнер
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('class', 'paylines-svg');
		svg.setAttribute('width', '100%');
		svg.setAttribute('height', '100%');
		svg.style.position = 'absolute';
		svg.style.top = '0';
		svg.style.left = '0';
		svg.style.pointerEvents = 'none';
		svg.style.zIndex = '40';
		svg.style.overflow = 'visible';

		// Малюємо кожну лінію
		lines.forEach((line) => {
			const points = [];

			line.forEach((rowIndex, colIndex) => {
				if (colIndex >= columns.length) return;

				const column = columns[colIndex];
				const colRect = column.getBoundingClientRect();

				const x = colRect.left - spinnerRect.left + colRect.width / 2;
				const y = (rowIndex + 0.5) * iconHeight;

				points.push({ x, y });
			});

			if (points.length < 2) return;

			const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');

			// Створюємо червону обводку (нижній шар)
			const strokeLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
			strokeLine.setAttribute('points', pointsStr);
			strokeLine.setAttribute('class', 'payline-stroke');
			svg.appendChild(strokeLine);

			// Створюємо золоту лінію (верхній шар)
			const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
			polyline.setAttribute('points', pointsStr);
			polyline.setAttribute('class', 'payline');
			svg.appendChild(polyline);
		});

		this.drumSpinner.appendChild(svg);

		// Плавна поява
		setTimeout(() => {
			svg.classList.add('visible');
		}, 50);

		// Автоматичне зникнення через 2 секунди
		this.paylinesTimeout = setTimeout(() => {
			this.hidePaylines();
		}, 2000);
	}

	// Плавно приховує лінії
	hidePaylines() {
		const svg = this.drumSpinner.querySelector('.paylines-svg');
		if (svg) {
			svg.classList.remove('visible');
			setTimeout(() => svg.remove(), 300);
		}
	}

	// Видаляє лінії paylines
	removePaylines() {
		const svg = this.drumSpinner.querySelector('.paylines-svg');
		if (svg) {
			svg.remove();
		}
	}
}

// Ініціалізація при завантаженні сторінки
document.addEventListener('DOMContentLoaded', () => {
	new SlotMachine();
	initBackgroundLightning();
});

function initBackgroundLightning() {
	const page = document.querySelector('.page');
	if (!page) return;

	const canvas = document.createElement('canvas');
	canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:1;';
	page.prepend(canvas);

	const ctx = canvas.getContext('2d');
	const bolts = [];

	function resize() {
		canvas.width  = page.offsetWidth;
		canvas.height = page.offsetHeight;
	}
	resize();
	window.addEventListener('resize', resize);

	// Реалістичний зигзаг: рекурсивний поділ відрізку з відхиленням
	function makeBolt(ox, oy, tx, ty, spread, depth) {
		if (depth === 0) return [{ x: ox, y: oy }, { x: tx, y: ty }];

		const mx = (ox + tx) / 2;
		const my = (oy + ty) / 2;

		// Перпендикулярне відхилення
		const dx = tx - ox;
		const dy = ty - oy;
		const len = Math.sqrt(dx * dx + dy * dy) || 1;
		const px = -dy / len;
		const py =  dx / len;
		const offset = (Math.random() - 0.5) * spread;

		const midX = mx + px * offset;
		const midY = my + py * offset;

		const left  = makeBolt(ox, oy, midX, midY, spread * 0.55, depth - 1);
		const right = makeBolt(midX, midY, tx, ty, spread * 0.55, depth - 1);

		// об'єднуємо без дублювання midpoint
		return [...left, ...right.slice(1)];
	}

	function spawnBolt() {
		const w = canvas.width;
		const h = canvas.height;

		// Хаотичний старт — будь-який край або кут екрану
		const side = Math.floor(Math.random() * 4); // 0=top,1=bottom,2=left,3=right
		let ox, oy;
		if (side === 0)      { ox = Math.random() * w; oy = 0; }
		else if (side === 1) { ox = Math.random() * w; oy = h; }
		else if (side === 2) { ox = 0;                 oy = Math.random() * h; }
		else                 { ox = w;                 oy = Math.random() * h; }

		// Ціль — хаотична точка по всьому екрану (не тільки центр)
		const tx = Math.random() * w;
		const ty = Math.random() * h;

		const dist = Math.sqrt((tx - ox) ** 2 + (ty - oy) ** 2);
		// Spread пропорційний довжині, але невеликий — блискавки вузькі
		const spread = dist * (0.15 + Math.random() * 0.2);

		const pts = makeBolt(ox, oy, tx, ty, spread, 6);

		// 1-3 гілки від різних точок
		const branches = [];
		const branchCount = Math.floor(Math.random() * 3) + 1;
		for (let b = 0; b < branchCount; b++) {
			const idx = Math.floor(pts.length * (0.2 + Math.random() * 0.5));
			const mp = pts[idx];
			const bDist = dist * (0.1 + Math.random() * 0.2);
			const angle = Math.random() * Math.PI * 2;
			const bPts = makeBolt(
				mp.x, mp.y,
				mp.x + Math.cos(angle) * bDist,
				mp.y + Math.sin(angle) * bDist,
				bDist * 0.25, 4
			);
			branches.push(bPts);
		}

		bolts.push({
			pts,
			branches,
			alpha:    0,
			phase:    'in',
			fadeIn:   0.04 + Math.random() * 0.03,
			holdFor:  6 + Math.floor(Math.random() * 8),
			holdLeft: 0,
			decay:    0.008 + Math.random() * 0.008,
			width:    0.4 + Math.random() * 0.8,
			color:    Math.random() > 0.3
				? { glow: 'rgba(180,160,255,0.5)', mid: 'rgba(210,190,255,0.8)', core: '#fff' }
				: { glow: 'rgba(255,240,120,0.4)', mid: 'rgba(255,250,180,0.7)', core: '#fff' },
		});
	}

	function drawBoltPts(pts, alpha, width, color) {
		if (pts.length < 2) return;
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.lineCap = 'round';
		ctx.lineJoin = 'miter';

		ctx.beginPath();
		ctx.moveTo(pts[0].x, pts[0].y);
		for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);

		// Зовнішнє glow
		ctx.shadowColor = color.glow;
		ctx.shadowBlur  = 10;
		ctx.strokeStyle = color.glow;
		ctx.lineWidth   = width * 3.5;
		ctx.stroke();

		// Середній шар
		ctx.shadowBlur  = 5;
		ctx.strokeStyle = color.mid;
		ctx.lineWidth   = width * 1.2;
		ctx.stroke();

		// Білий core — найтонший
		ctx.shadowBlur  = 2;
		ctx.shadowColor = '#fff';
		ctx.strokeStyle = color.core;
		ctx.lineWidth   = width * 0.35;
		ctx.stroke();

		ctx.restore();
	}

	// До 8 блискавок одночасно, нова кожні 150-500ms
	const MAX_BOLTS = 8;
	let nextSpawn = 0;

	function loop(ts) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (ts > nextSpawn && bolts.length < MAX_BOLTS) {
			spawnBolt();
			nextSpawn = ts + 150 + Math.random() * 350;
		}

		for (let i = bolts.length - 1; i >= 0; i--) {
			const b = bolts[i];

			if (b.phase === 'in') {
				b.alpha += b.fadeIn;
				if (b.alpha >= 1) { b.alpha = 1; b.phase = 'hold'; b.holdLeft = b.holdFor; }
			} else if (b.phase === 'hold') {
				if (--b.holdLeft <= 0) b.phase = 'out';
			} else {
				b.alpha -= b.decay;
			}

			drawBoltPts(b.pts, b.alpha, b.width, b.color);
			b.branches.forEach(br => drawBoltPts(br, b.alpha * 0.5, b.width * 0.6, b.color));

			if (b.alpha <= 0) bolts.splice(i, 1);
		}

		requestAnimationFrame(loop);
	}

	requestAnimationFrame(loop);
}
