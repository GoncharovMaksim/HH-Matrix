export const initWebSocket = (
	portfolioAssets: { id: string }[], // Портфель активов
	onDataReceived: (data: {
		id: string;
		newPrice: number;
		change24h: number;
	}) => void
) => {
	const streams =
		Array.isArray(portfolioAssets) && portfolioAssets.length > 0
			? portfolioAssets
					.map(asset => `${asset.id.toLowerCase()}usdt@ticker`)
					.join('/')
			: '';
	if (!streams) {
		console.error('Ошибка: Нет активов для подписки, WebSocket не запущен.');
		return;
	}
	const socket = new WebSocket(
		`wss://stream.binance.com:9443/stream?streams=${streams}`
	);

	socket.onopen = () => {
		console.log('WebSocket подключен');
		console.log(
			'WebSocket URL:',
			`wss://stream.binance.com:9443/stream?streams=${streams}`
		);
	};

	socket.onmessage = event => {
		console.log('Получено сообщение от WebSocket:', event.data);

		try {
			const message = JSON.parse(event.data);
			console.log('Парсинг данных:', message);

		
			portfolioAssets.forEach(asset => {
				if (message.stream === `${asset.id.toLowerCase()}usdt@ticker`) {
					const price = parseFloat(message.data.c); // Цена
					const change24h = parseFloat(message.data.P); // Изменение за 24ч

					// Отправляем данные в onDataReceived для каждого актива
					onDataReceived({ id: asset.id, newPrice: price, change24h });
				}
			});
		} catch (error) {
			console.error('Ошибка при парсинге данных от WebSocket:', error);
		}
	};

	socket.onerror = error => {
		console.error('Ошибка WebSocket:', error);
	};

	socket.onclose = () => {
		console.log('WebSocket отключен');
	};

	return socket; 
};
