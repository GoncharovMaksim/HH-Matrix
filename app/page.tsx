'use client';

import PortfolioOverview from './components/PortfolioOverview';
import Providers from './components/providers';

export default function Home() {
	return (
		<Providers>
			<div className=''>
				<PortfolioOverview />
			</div>
		</Providers>
	);
}
