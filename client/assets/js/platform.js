(function () {
	'use strict';

	const TOKEN_KEY = 'noxgarSessionToken';
	const PROFILE_KEY = 'noxgarProfile';

	function getApiBase() {
		if (window.NOXGAR_API_BASE) return window.NOXGAR_API_BASE;
		if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
			return `${location.protocol}//${location.hostname}:3001`;
		}
		return location.origin;
	}

	async function postJson(path, payload) {
		const response = await fetch(`${getApiBase()}${path}`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		const data = await response.json();
		if (!response.ok || !data.ok) throw new Error(data.error || 'Request failed.');
		return data;
	}

	async function authenticateTelegram() {
		const webApp = window.Telegram && window.Telegram.WebApp;
		if (!webApp || !webApp.initData) return null;
		if (typeof webApp.ready === 'function') webApp.ready();

		const data = await postJson('/api/auth/telegram', { initData: webApp.initData });
		localStorage.setItem(TOKEN_KEY, data.session.token);
		localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));
		window.dispatchEvent(new CustomEvent('noxgar:profile', { detail: data.profile }));
		return data.profile;
	}

	window.NoxgarPlatform = {
		getApiBase,
		authenticateTelegram,
		getSessionToken: () => localStorage.getItem(TOKEN_KEY),
		getCachedProfile: () => {
			const text = localStorage.getItem(PROFILE_KEY);
			return text ? JSON.parse(text) : null;
		}
	};

	authenticateTelegram().catch(error => {
		console.warn('Telegram authentication skipped:', error.message);
	});
})();
