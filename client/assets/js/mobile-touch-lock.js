// Prevent mobile browser/WebView page movement while playing Noxgar.
// Also reduces mobile render/audio bursts that can cause micro-stutters.
(function () {
	'use strict';

	const isMobileLike = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
	if (!isMobileLike) return;

	const style = document.createElement('style');
	style.textContent = 'html,body,#canvas,#mobileStuff,#touch{overflow:hidden!important;overscroll-behavior:none!important;touch-action:none!important;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}#canvas{image-rendering:auto!important;transform:translateZ(0)}input,textarea,select,button,#overlays,#gallery{touch-action:manipulation!important}';
	document.head.appendChild(style);

	function isInteractive(target) {
		return !!(target && target.closest && target.closest('input, textarea, select, label, #overlays, #gallery'));
	}

	function stopPageGesture(event) {
		if (isInteractive(event.target)) return;
		event.preventDefault();
	}

	function patchMobileAudio() {
		const proto = window.HTMLMediaElement && window.HTMLMediaElement.prototype;
		if (!proto || !proto.play || proto.__noxgarMobileAudioPatched) return;

		const originalPlay = proto.play;
		let lastPelletSoundAt = 0;
		let lastEatSoundAt = 0;

		proto.play = function () {
			const src = String(this.currentSrc || this.src || '');
			const now = performance.now ? performance.now() : Date.now();

			if (src.includes('/pellet.') || src.includes('pellet.mp3')) {
				if (now - lastPelletSoundAt < 220) return Promise.resolve();
				lastPelletSoundAt = now;
			}

			if (src.includes('/eat.') || src.includes('eat.mp3')) {
				if (now - lastEatSoundAt < 120) return Promise.resolve();
				lastEatSoundAt = now;
			}

			try {
				return originalPlay.apply(this, arguments);
			} catch (error) {
				return Promise.resolve();
			}
		};

		proto.__noxgarMobileAudioPatched = true;
	}

	function patchCanvasRendering() {
		const proto = window.CanvasRenderingContext2D && window.CanvasRenderingContext2D.prototype;
		if (!proto || proto.__noxgarMobileCanvasPatched) return;

		const originalArc = proto.arc;
		const originalFill = proto.fill;
		const originalStroke = proto.stroke;
		const originalDrawImage = proto.drawImage;
		const originalResetTransform = proto.resetTransform;

		proto.arc = function (x, y, radius) {
			this.__noxgarLastArcRadius = Math.abs(radius || 0);
			return originalArc.apply(this, arguments);
		};

		function shouldSkipTinyFade(ctx) {
			// Main.js keeps eaten pellets alive briefly as fading circles. On mobile,
			// many of those tiny fading pellets can stack up and cause a visible hitch.
			return ctx.globalAlpha > 0 && ctx.globalAlpha < 0.98 && ctx.__noxgarLastArcRadius > 0 && ctx.__noxgarLastArcRadius < 24;
		}

		proto.fill = function () {
			if (shouldSkipTinyFade(this)) return;
			return originalFill.apply(this, arguments);
		};

		proto.stroke = function () {
			if (shouldSkipTinyFade(this)) return;
			return originalStroke.apply(this, arguments);
		};

		proto.drawImage = function () {
			// Keep skins as sharp as the source image allows when scaled/clipped.
			this.imageSmoothingEnabled = true;
			if ('imageSmoothingQuality' in this) this.imageSmoothingQuality = 'high';
			return originalDrawImage.apply(this, arguments);
		};

		if (originalResetTransform) {
			proto.resetTransform = function () {
				this.__noxgarLastArcRadius = 0;
				return originalResetTransform.apply(this, arguments);
			};
		}

		proto.__noxgarMobileCanvasPatched = true;
	}

	function expandTelegramViewport() {
		try {
			if (!window.Telegram || !window.Telegram.WebApp) return;
			window.Telegram.WebApp.expand();
			if (typeof window.Telegram.WebApp.disableVerticalSwipes === 'function') {
				window.Telegram.WebApp.disableVerticalSwipes();
			}
		} catch (error) {
			// Ignore older Telegram clients that do not support every method.
		}
	}

	const options = { capture: true, passive: false };
	document.addEventListener('touchstart', stopPageGesture, options);
	document.addEventListener('touchmove', stopPageGesture, options);
	document.addEventListener('touchend', stopPageGesture, options);
	document.addEventListener('gesturestart', stopPageGesture, options);
	document.addEventListener('gesturechange', stopPageGesture, options);

	patchMobileAudio();
	patchCanvasRendering();
	expandTelegramViewport();
})();
