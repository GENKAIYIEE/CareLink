import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Edit2, User, Phone, MapPin, HeartPulse, Activity } from "lucide-react";
import { format } from "date-fns";

export default async function SeniorViewPage({ params }: { params: { id: string } }) {
  // Await the params to satisfy the Next.js standard for App Router dynamic segments
  const resolvedParams = await params;
  const senior = await prisma.senior.findUnique({
    where: { id: resolvedParams.id },
    include: {
      delegate: true,
      claims: {
        include: { program: true },
        orderBy: { claimedAt: 'desc' },
        take: 5
      }
    }
  });

  if (!senior) {
    notFound();
  }

  // Calculate age safely
  const age = senior.dateOfBirth ? new Date().getFullYear() - new Date(senior.dateOfBirth).getFullYear() : 'N/A';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <Link href="/admin/seniors" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Seniors
        </Link>
        <Link 
          href={`/admin/seniors/${senior.id}/edit`}
          className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
        >
          <Edit2 className="w-4 h-4 mr-1.5" /> Edit Profile
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Header */}
        <div className="bg-indigo-900 px-6 py-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative overflow-hidden">
          {/* Background decorative blob */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-800 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 bg-white/10 rounded-full flex items-center justify-center border-4 border-white/20 shrink-0">
            {senior.photoUrl ? (
              <img src={senior.photoUrl} alt="Senior Photo" className="w-full h-full object-cover rounded-full" />
            ) : (
              <User className="w-12 h-12 text-indigo-200" />
            )}
          </div>
          
          <div className="relative z-10 text-center sm:text-left flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">
              {senior.lastName}, {senior.firstName} {senior.middleName}
            </h1>
            <p className="text-indigo-200 font-medium text-lg mb-4">
              OSCA ID: <span className="text-yellow-400 font-mono tracking-wide">{senior.oscaId}</span>
            </p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                senior.status === 'Active' ? 'bg-green-400/10 text-green-400 border border-green-400/20' : 
                senior.status === 'Bedridden' ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' : 
                'bg-gray-400/10 text-gray-400 border border-gray-400/20'
              }`}>
                {senior.status}
              </span>
              <span className="inline-flex items-center text-sm text-indigo-100">
                <MapPin className="w-4 h-4 mr-1" /> {senior.barangay}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Left Column: Personal Info */}
          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center border-b pb-2">
                <User className="w-4 h-4 mr-2 text-indigo-600" /> Personal Information
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <dt className="text-gray-500 font-medium">Date of Birth</dt>
                  <dd className="text-gray-900 mt-1">{senior.dateOfBirth ? format(new Date(senior.dateOfBirth), 'MMMM d, yyyy') : 'N/A'} (Age: {age})</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Gender</dt>
                  <dd className="text-gray-900 mt-1">{senior.gender || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Civil Status</dt>
                  <dd className="text-gray-900 mt-1">{senior.civilStatus || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-gray-500 font-medium">Contact Number</dt>
                  <dd className="text-gray-900 mt-1">{senior.contactNumber || 'N/A'}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center border-b pb-2">
                <HeartPulse className="w-4 h-4 mr-2 text-indigo-600" /> Health Information
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6 text-sm">
                <div>
                  <dt className="text-gray-500 font-medium">Blood Type</dt>
                  <dd className="text-red-600 font-semibold mt-1">{senior.bloodType || 'Unknown'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-500 font-medium">Known Conditions</dt>
                  <dd className="text-gray-900 mt-1">{senior.healthConditions || 'None reported'}</dd>
                </div>
              </dl>
            </section>
          </div>

          {/* Right Column: Emergency & Recent */}
          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center border-b pb-2">
                <Phone className="w-4 h-4 mr-2 text-indigo-600" /> Emergency Contact
              </h3>
              <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-red-800/70 font-medium">Contact Name</dt>
                    <dd className="text-red-900 font-semibold mt-0.5">{senior.emergencyContactName || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-red-800/70 font-medium">Contact Number</dt>
                    <dd className="text-red-900 font-semibold mt-0.5">{senior.emergencyContactNum || 'N/A'}</dd>
                  </div>
                </dl>
              </div>
            </section>
            
            <section>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4 flex items-center border-b pb-2">
                <Activity className="w-4 h-4 mr-2 text-indigo-600" /> Recent Claims
              </h3>
              {senior.claims.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No recent claims history.</p>
              ) : (
                <ul className="space-y-3">
                  {senior.claims.map(claim => (
                    <li key={claim.id} className="flex justify-between items-center text-sm border border-gray-100 rounded-md p-3 hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900">{claim.program.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5">
                          {claim.claimedAt ? format(new Date(claim.claimedAt), 'MMM d, yyyy') : 'Pending'}
                        </p>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        claim.status === 'Claimed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {claim.status}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
