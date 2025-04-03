import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { updateAssetPrice, removeAsset } from '../slices/portfolioSlice';
import { initWebSocket } from '../services/websocket';
import AddAssetForm from './AddAssetForm';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
} from 'recharts'; // 📊 Импорт для графика

interface Asset {
	id: string;
	quantity: number;
	currentPrice: number;
	change24h: number;
	portfolioPercentage: number;
}

const LOCAL_STORAGE_KEY = 'portfolioAssets';

const PortfolioOverview: React.FC = () => {
	const assets = useSelector((state: RootState) => state.portfolio.assets);
	const dispatch = useDispatch<AppDispatch>();

	useEffect(() => {
		const socket = initWebSocket(assets, data => {
			dispatch(updateAssetPrice(data));
		});

		return () => {
			if (socket) socket.close();
		};
	}, [assets, dispatch]);

	const handleRemoveAsset = (id: string) => {
		dispatch(removeAsset(id));

		const savedAssets = localStorage.getItem(LOCAL_STORAGE_KEY);
		if (savedAssets) {
			const updatedAssets = JSON.parse(savedAssets).filter(
				(asset: Asset) => asset.id !== id
			);
			localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedAssets));
		}
	};

	const totalValue = assets.reduce(
		(sum, asset) => sum + asset.currentPrice * asset.quantity,
		0
	);

	const listRef = React.useRef<HTMLDivElement | null>(null);
	const rowVirtualizer = useWindowVirtualizer({
		count: assets.length,
		estimateSize: () => 180,
		overscan: 5,
		scrollMargin: listRef.current?.offsetTop ?? 0,
		gap: 7,
	});

	// 📈 Формируем данные для графика (с учетом стоимости всех единиц актива)
	const chartData = assets.map(asset => ({
		name: asset.id,
		totalValue: asset.currentPrice * asset.quantity,
	}));

	return (
		<div className='container mx-auto p-8 max-w-lg'>
			<h1 className='text-2xl font-bold mb-6 text-center'>Мой Портфель</h1>
			<AddAssetForm />
			<div ref={listRef}>
				<div
					style={{
						height: `${rowVirtualizer.getTotalSize()}px`,
						position: 'relative',
					}}
				>
					{rowVirtualizer.getVirtualItems().map(virtualRow => {
						const asset = assets[virtualRow.index];
						return (
							<div
								key={`${asset.id}-${virtualRow.index}`}
								ref={rowVirtualizer.measureElement}
								data-index={virtualRow.index}
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									transform: `translateY(${
										virtualRow.start - rowVirtualizer.options.scrollMargin
									}px)`,
								}}
								className='mb-4 border p-4 rounded-lg shadow-md bg-white cursor-pointer hover:bg-gray-100 transition duration-200'
								onClick={() => handleRemoveAsset(asset.id)}
							>
								<h2 className='text-lg font-semibold text-gray-800'>
									{asset.id}
								</h2>
								<p className='text-sm text-gray-600'>
									Количество: {asset.quantity}
								</p>
								<p className='text-sm text-gray-600'>
									Цена: ${asset.currentPrice.toFixed(2)}
								</p>
								<p className='text-sm text-gray-600'>
									Общая стоимость: $
									{(asset.currentPrice * asset.quantity).toFixed(2)}
								</p>
								<p
									className={`text-sm ${
										asset.change24h >= 0 ? 'text-green-600' : 'text-red-600'
									}`}
								>
									Изменение за 24ч: {asset.change24h}%
								</p>
								<p className='text-sm text-gray-600'>
									Доля в портфеле:{' '}
									{(
										((asset.currentPrice * asset.quantity) / totalValue) *
										100
									).toFixed(2)}
									%
								</p>
							</div>
						);
					})}
				</div>
			</div>

			{/* 📈 ГРАФИК */}
			<h2 className='text-xl font-bold mt-6 text-center'>
				График стоимости активов
			</h2>
			<div className='mt-4'>
				<ResponsiveContainer width='100%' height={300}>
					<LineChart data={chartData}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis dataKey='name' />
						<YAxis />
						<Tooltip />
						<Line type='monotone' dataKey='totalValue' stroke='#8884d8' />
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
};

export default PortfolioOverview;
