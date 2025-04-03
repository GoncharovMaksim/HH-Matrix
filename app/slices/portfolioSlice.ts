// src/redux/assetsSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Asset {
	id: string;
	quantity: number;
	currentPrice: number;
	change24h: number;
	portfolioPercentage: number;
}

interface AssetsState {
	assets: Asset[];
}

const initialState: AssetsState = {
	assets: [],
};

const assetsSlice = createSlice({
	name: 'assets',
	initialState,
	reducers: {
		addAsset(state, action: PayloadAction<Asset>) {
			state.assets.push(action.payload);
		},
		removeAsset(state, action: PayloadAction<string>) {
			state.assets = state.assets.filter(asset => asset.id !== action.payload);
		},
		updateAssetPrice(
			state,
			action: PayloadAction<{
				change24h: number; id: string; newPrice: number 
}>
		) {
			const asset = state.assets.find(a => a.id === action.payload.id);
			if (asset) {
				asset.currentPrice = action.payload.newPrice;
				asset.change24h = action.payload.change24h;
				asset.portfolioPercentage =
					(asset.quantity * asset.currentPrice) /
					state.assets.reduce((sum, a) => sum + a.quantity * a.currentPrice, 0);
			}
		},
		
	},
});

export const { addAsset, removeAsset, updateAssetPrice } = assetsSlice.actions;
export default assetsSlice.reducer;
