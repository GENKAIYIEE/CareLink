import { getActivePrograms, getRecentTransactions } from '@/lib/actions/distribution';
import DistributionClient from './DistributionClient';

export const metadata = {
  title: 'Benefits Distribution Tracker | CareLink Admin',
  description: 'Track and log benefit distribution for senior citizens.',
};

export default async function DistributionPage() {
  const [programs, recentTransactions] = await Promise.all([
    getActivePrograms(),
    getRecentTransactions(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Distribution Tracker</h1>
          <p className="mt-1 text-sm text-gray-500 font-medium">
            Log and monitor assistance distributed to senior citizens in real-time.
          </p>
        </div>
      </div>

      <DistributionClient 
        programs={programs} 
        initialTransactions={recentTransactions} 
      />
    </div>
  );
}
