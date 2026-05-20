import React from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import SeniorSidebar from '@/components/senior/SeniorSidebar';

export const metadata = {
  title: 'CareLink - Senior Portal',
  description: 'Senior Citizen Portal for CareLink',
};

export default async function SeniorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session || session.role !== 'SENIOR') {
    redirect('/login');
  }

  // Fetch senior details for the sidebar
  const senior = await prisma.senior.findUnique({
    where: { id: session.userId },
    select: {
      firstName: true,
      lastName: true,
      oscaId: true,
      photoUrl: true,
    },
  });

  if (!senior) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SeniorSidebar senior={senior} />
      <main className="flex-1 ml-[240px]">
        {children}
      </main>
    </div>
  );
}
