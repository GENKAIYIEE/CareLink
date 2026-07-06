import React from 'react';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Gift, Clock, CalendarHeart, UserCheck, ChevronRight, BellRing } from 'lucide-react';
import { LiveUpdate } from '@/components/senior/LiveUpdate';
import { getEffectiveStatus } from '@/lib/utils/status';

export default async function SeniorDashboardPage() {
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

  // Stat Calculations
  const benefitsReceived = senior.claims.filter(c => c.status === 'Claimed').length;
  const pendingClaims = senior.claims.filter(c => c.status === 'Pending' || c.status === 'Unclaimed').length;
  
  // Upcoming Benefits (next program by date that is unclaimed)
  
  // Find the next upcoming BenefitProgram (Community Event)
  const upcomingProgram = await prisma.benefitProgram.findFirst({
    where: {
      distributionDate: {
        gte: new Date(),
      },
    },
    orderBy: {
      distributionDate: 'asc',
    },
  });

  const upcomingProgramsCount = await prisma.benefitProgram.count({
    where: {
      distributionDate: {
        gte: new Date(),
      },
    },
  });

  const memberSince = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(senior.createdAt));

  const recentClaims = senior.claims.slice(0, 5);

  const announcements = await prisma.announcement.findMany({
    where: {
      status: 'Published',
      OR: [
        { targetBarangay: null },
        { targetBarangay: senior.barangay },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  // Get current hour in Philippine Time (PHT)
  const phtDateStr = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', hourCycle: 'h23' }).format(new Date());
  const currentHour = parseInt(phtDateStr, 10);
  
  let greeting = 'Magandang gabi';
  if (currentHour >= 5 && currentHour < 12) {
    greeting = 'Magandang umaga';
  } else if (currentHour >= 12 && currentHour < 18) {
    greeting = 'Magandang hapon';
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <LiveUpdate interval={30000} />
      {/* Hero Banner */}
      <div className="bg-[#006b2c] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Gift className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold mb-2">
            {greeting}, {senior.firstName}!
          </h1>
          <p className="text-lg text-white/90 mb-6">
            Welcome back to your CareLink portal.
          </p>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm border border-white/30">
              OSCA ID: {senior.oscaId}
            </span>
            <span className="px-3 py-1 bg-white/20 rounded-full text-sm backdrop-blur-sm border border-white/30">
              Barangay {senior.barangay}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
              getEffectiveStatus(senior) === 'Active' ? 'bg-green-500/20 text-green-100 border-green-500/30' : 
              getEffectiveStatus(senior).includes('Inactive') ? 'bg-red-500/20 text-red-100 border-red-500/30' : 
              'bg-gray-500/20 text-gray-100 border-gray-500/30'
            }`}>
              {getEffectiveStatus(senior)}
            </span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-lg">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Benefits Received</p>
            <p className="text-2xl font-bold text-gray-900">{benefitsReceived}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Claims</p>
            <p className="text-2xl font-bold text-gray-900">{pendingClaims}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <CalendarHeart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Upcoming Benefits</p>
            <p className="text-2xl font-bold text-gray-900">
              {upcomingProgramsCount}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-lg">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Member Since</p>
            <p className="text-lg font-bold text-gray-900">{memberSince}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Claims */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Claims</h2>
              <Link href="/senior/benefits" className="text-sm text-[#006b2c] hover:underline font-medium flex items-center">
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            {recentClaims.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-600">
                  <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3">Benefit</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Claimant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{claim.program.title}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                            {claim.program.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(claim.program.distributionDate))}
                        </td>
                        <td className="px-6 py-4">
                          {claim.status === 'Claimed' ? (
                            <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                              Claimed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium border border-amber-200">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {claim.claimedBy 
                            ? claim.claimedBy.fullName 
                            : 'Self'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Gift className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No benefit claims found yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Stacked */}
        <div className="space-y-6">
          {/* Upcoming Event Box */}
          {upcomingProgram && (
            <div className="bg-gradient-to-br from-[#006b2c] to-[#004d1f] rounded-xl shadow-sm border border-transparent text-white overflow-hidden">
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <CalendarHeart className="w-5 h-5 text-green-300" /> Next Upcoming Event
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <span className="px-2.5 py-1 bg-white/20 text-white rounded-md text-xs font-medium mb-3 inline-block backdrop-blur-sm">
                    {upcomingProgram.type}
                  </span>
                  <h3 className="font-bold text-xl leading-tight">
                    {upcomingProgram.title}
                  </h3>
                  <p className="text-sm text-green-100 mt-1 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> 
                    {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(upcomingProgram.distributionDate))}
                  </p>
                </div>
                {upcomingProgram.description && (
                  <p className="text-sm text-green-50/90 leading-relaxed border-t border-white/10 pt-4">
                    {upcomingProgram.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Announcements Box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-[#006b2c]" /> Announcements
              </h2>
              <Link href="/senior/announcements" className="text-sm text-[#006b2c] hover:underline font-medium">
                View All
              </Link>
            </div>
            <div className="p-6 space-y-6">
              {announcements.length > 0 ? (
                announcements.map((announcement) => (
                  <div key={announcement.id} className="group cursor-pointer">
                    <p className="text-xs text-gray-400 mb-1">
                      {new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(announcement.createdAt))}
                    </p>
                    <h3 className="font-medium text-gray-900 group-hover:text-[#006b2c] transition-colors line-clamp-1">
                      {announcement.title}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                      {announcement.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No new announcements.</p>
                </div>
              )}
            </div>
          </div>

          {/* Delegate Box */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">My Delegate</h2>
              <Link href="/senior/delegate" className="text-sm text-[#006b2c] hover:underline font-medium">
                View Details
              </Link>
            </div>
            <div className="p-6">
              {senior.delegate ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Full Name</p>
                    <p className="font-medium text-gray-900">{senior.delegate.fullName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Relationship</p>
                    <p className="text-gray-700">{senior.delegate.relationship}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Contact</p>
                    <p className="text-gray-700">{senior.delegate.contactNumber}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <UserCheck className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-sm mb-2">No delegate set</p>
                  <Link href="/senior/delegate" className="text-sm font-medium text-[#006b2c] hover:underline">
                    Learn how to assign one
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
