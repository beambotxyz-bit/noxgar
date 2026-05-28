// Prevent mobile browser/WebView page movement while playing Noxgar.
(function () {
	'use strict';

	const isMobileLike = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
	if (!isMobileLike) return;

	const style = document.createElement('style');
	style.textContent = 'html,body,#canvas,#mobileStuff,#touch{overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}input,textarea,select,button,#overlays,#gallery{touch-action:manipulation!important}';
	document.head.appendChild(style);

	function isInteractive(target) {
		return !!(target && target.closest && target.closest('input, textarea, select, label, #overlays, #gallery'));
	}

	function stopPageGesture(event) {
		if (isInteractive(event.target)) return;
		event.preventDefault();
	}

	const options = { capture: true, passive: false };
	document.addEventListener('touchstart', stopPageGesture, options);
	document.addEventListener('touchmove', stopPageGesture, options);
	document.addEventListener('touchend', stopPageGesture, options);
	document.addEventListener('gesturestart', stopPageGesture, options);
	document.addEventListener('gesturechange', stopPageGesture, options);
})();
