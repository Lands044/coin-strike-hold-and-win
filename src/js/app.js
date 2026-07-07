// Підключення функціоналу "Чортоги Фрілансера"
import { addTouchAttr, addLoadedAttr, isMobile, FLS, setViewportHeight, setDesktopScale } from "@js/common/functions.js"

// Фікс для 100vh на мобільних браузерах (iOS Safari/Chrome)
setViewportHeight();

// Масштабування контенту для десктопів (контент в один екран)
setDesktopScale({
	selector: '.game',
	designWidth: 1440,
	designHeight: 800,
	mobileBreakpoint: 768 // все, що менше за це значення - брейкпоінти
});