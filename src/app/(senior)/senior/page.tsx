import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CalendarDays, Gift, AlertCircle, Clock, CheckCircle2, User } from 'lucide-react';

export default async function SeniorDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'SENIOR') {
    redirect('/admin/login');
  }

  const senior = await prisma.senior.findUnique({
    where: { id: session.userId },
    include: {
      claims: {
        include: {
          program: true,
        },
        orderBy: { claimedAt: 'desc' },
      },
    },
  });

  if (!senior) {
    redirect('/admin/login');
  }

  // Fetch announcements for their barangay or general
  const announcements = await prisma.announcement.findMany({
    where: {
      status: 'Published',
      OR: [
        { targetBarangay: null },
        { targetBarangay: senior.barangay },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Calculate available programs (programs they haven't claimed yet)
  // that are still ongoing (distributionDate in the future, or recently)
  const allPrograms = await prisma.benefitProgram.findMany({
    where: {
      distributionDate: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // last 30 days
      }
    },
    orderBy: { distributionDate: 'asc' },
  });

  const claimedProgramIds = new Set(senior.claims.map(c => c.programId));
  const availablePrograms = allPrograms.filter(p => !claimedProgramIds.has(p.id));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Welcome Banner */}
      <section className="bg-gradient-to-br from-rose-600 to-rose-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <User className="w-48 h-48" />
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-2">
            Welcome back, {senior.firstName}!
          </h2>
          <p className="text-rose-100 text-lg sm:text-xl font-medium max-w-2xl">
            Here is your personalized summary of municipal benefits, announcements, and claims.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-1.5 bg-white/20 px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md">
              <span className="opacity-75">OSCA ID:</span> {senior.oscaId}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/20 px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md">
              <span className="opacity-75">Barangay:</span> {senior.barangay}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-green-500/80 px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md">
              <CheckCircle2 className="w-4 h-4" /> Active Status
            </span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Announcements */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Important Announcements</h3>
            </div>
            
            {announcements.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border-2 border-slate-100 text-center shadow-sm">
                <p className="text-slate-500 font-medium text-lg">No new announcements for your area.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div key={announcement.id} className="bg-white rounded-2xl p-6 border-l-8 border-amber-400 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-xl font-bold text-slate-900">{announcement.title}</h4>
                      <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        {new Date(announcement.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-600 text-lg leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Claims History */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-2 rounded-lg text-green-700">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900">Your Recent Claims</h3>
            </div>
            
            {senior.claims.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border-2 border-slate-100 text-center shadow-sm">
                <p className="text-slate-500 font-medium text-lg">You have not claimed any benefits yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
                <div className="divide-y-2 divide-slate-100">
                  {senior.claims.slice(0, 5).map((claim) => (
                    <div key={claim.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">{claim.program.title}</h4>
                        <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
                          <span className="flex items-center gap-1">
                            <Gift className="w-4 h-4" /> {claim.program.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" /> 
                            {claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString() : 'Claimed'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="inline-flex items-center bg-green-100 text-green-800 font-bold px-4 py-2 rounded-xl text-sm">
                          Received
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">
          
          {/* Available Programs Widget */}
          <section className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-700">
                <CalendarDays className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Upcoming Benefits</h3>
            </div>
            
            {availablePrograms.length === 0 ? (
              <p className="text-slate-500 font-medium text-center py-4">No upcoming programs available at this time.</p>
            ) : (
              <div className="space-y-4">
                {availablePrograms.map((program) => (
                  <div key={program.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 transition-colors">
                    <h4 className="font-bold text-slate-900 text-lg mb-1">{program.title}</h4>
                    <p className="text-sm text-slate-600 mb-3">{program.description || program.type}</p>
                    <div className="flex items-center gap-2 text-indigo-700 text-sm font-bold bg-indigo-50 w-fit px-3 py-1.5 rounded-lg">
                      <Clock className="w-4 h-4" />
                      {new Date(program.distributionDate).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Help & Support Widget */}
          <section className="bg-slate-800 rounded-2xl shadow-sm p-6 text-white">
            <h3 className="text-xl font-bold mb-3">Need Help?</h3>
            <p className="text-slate-300 font-medium text-sm mb-4">
              If you have any questions or need assistance with your benefits, please visit your local Barangay hall or contact the OSCA office.
            </p>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-1">OSCA Hotline</p>
              <p className="text-2xl font-extrabold text-rose-400">(02) 8123-4567</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
