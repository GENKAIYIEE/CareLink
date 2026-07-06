import React from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import BenefitsTable from '@/components/senior/BenefitsTable';
import { Gift } from 'lucide-react';
import { LiveUpdate } from '@/components/senior/LiveUpdate';

export default async function SeniorBenefitsPage() {
  const session = await getSession();
  if (!session || session.role !== 'SENIOR') return null;

  const senior = await prisma.senior.findUnique({
    where: { id: session.userId },
    include: {
      delegate: true,
      claims: {
        include: {
          program: true,
          claimedBy: true,
        },
        orderBy: {
          program: {
            distributionDate: 'desc',
          },
        },
      },
    },
  });

  if (!senior) return null;

  // Transform data to send to client component
  const claims = senior.claims.map(claim => ({
    id: claim.id,
    benefitName: claim.program.title,
    type: claim.program.type,
    distributionDate: claim.program.distributionDate.toISOString(),
    claimedAt: claim.claimedAt ? claim.claimedAt.toISOString() : null,
    status: claim.status,
    claimant: claim.claimedBy 
      ? claim.claimedBy.fullName 
      : 'Self'
  }));

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <LiveUpdate interval={30000} />
      <div className="flex items-center gap-3">
        <div className="p-3 bg-green-100 text-[#006b2c] rounded-xl">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Benefits</h1>
          <p className="text-gray-500 text-sm mt-1">View your complete claims history and upcoming benefits.</p>
        </div>
      </div>

      <BenefitsTable initialClaims={claims} />
    </div>
  );
}
