import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { addAsset } from '../slices/portfolioSlice';

interface Asset {
	id: string;
	quantity: number;
	currentPrice: number;
	change24h: number;
	portfolioPercentage: number;
}

interface AssetOption {
	label: string;
	value: string;
}

const LOCAL_STORAGE_KEY = 'portfolioAssets';

const AddAssetForm: React.FC = () => {
	const [availableAssets, setAvailableAssets] = useState<AssetOption[]>([]);
	const [selectedAsset, setSelectedAsset] = useState<string>('');
	const [quantity, setQuantity] = useState<number>(0);
	const dispatch = useDispatch<AppDispatch>();

	// Загрузка сохраненных активов при монтировании
	useEffect(() => {
		const savedAssets = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (savedAssets) {
			const assets = JSON.parse(savedAssets);
			assets.forEach((asset: Asset) => dispatch(addAsset(asset)));
		}
	}, [dispatch]);

	// Загрузка списка доступных активов с Binance API
	useEffect(() => {
		const fetchAvailableAssets = async () => {
			try {
				const response = await fetch(
					'https://api.binance.com/api/v3/exchangeInfo'
				);
				const data = await response.json();

				// Фильтруем валютные пары с USDT
				const symbols: AssetOption[] = data.symbols
					.filter((symbol: { symbol: string }) =>
						symbol.symbol.endsWith('USDT')
					)
					.map((symbol: { baseAsset: string }) => ({
						label: symbol.baseAsset,
						value: symbol.baseAsset,
					}));

				setAvailableAssets(symbols);
				if (symbols.length > 0) setSelectedAsset(symbols[0].value);
			} catch (error) {
				console.error('Ошибка загрузки активов:', error);
			}
		};

		fetchAvailableAssets();
	}, []);

	// Добавление актива в портфель и сохранение в localStorage
	const handleAddAsset = () => {
		if (!selectedAsset || quantity <= 0) return;

		const newAsset = {
			id: selectedAsset,
			quantity,
			currentPrice: 0,
			change24h: 0,
			portfolioPercentage: 0,
		};

		// Добавляем в Redux
		dispatch(addAsset(newAsset));

		// Сохраняем в localStorage
		const savedAssets = localStorage.getItem(LOCAL_STORAGE_KEY);
		const assets = savedAssets ? JSON.parse(savedAssets) : [];
		localStorage.setItem(
			LOCAL_STORAGE_KEY,
			JSON.stringify([...assets, newAsset])
		);

		setQuantity(0);
	};

	return (
		<div className='bg-white p-6 rounded-lg shadow-md max-w-md mx-auto'>
			<h2 className='text-lg font-semibold mb-4'>Добавить актив</h2>
			{availableAssets.length > 0 ? (
				<>
					<label className='block text-gray-700 text-sm font-medium mb-2'>
						Выберите актив:
					</label>
					<select
						value={selectedAsset}
						onChange={e => setSelectedAsset(e.target.value)}
						className='w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
					>
						{availableAssets.map(asset => (
							<option key={asset.value} value={asset.value}>
								{asset.label}
							</option>
						))}
					</select>

					<label className='block text-gray-700 text-sm font-medium mt-4 mb-2'>
						Количество:
					</label>
					<input
						type='number'
						value={quantity}
						onChange={e => setQuantity(Math.max(0, Number(e.target.value)))}
						placeholder='Введите количество'
						className='w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
					/>

					<button
						onClick={handleAddAsset}
						className='w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 mt-4 rounded-lg transition duration-200'
					>
						Добавить актив
					</button>
				</>
			) : (
				<p className='text-gray-500 text-sm'>Загрузка списка активов...</p>
			)}
		</div>
	);
};

export default AddAssetForm;
