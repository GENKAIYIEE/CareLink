import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, FileText, CheckCircle, Clock, Users, MapPin, Tag, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { LiveUpdate } from "@/components/senior/LiveUpdate";

export default async function ProgramDetailsPage({ 
  params,
  searchParams,
}: { 
  params: { id: string };
  searchParams: { page?: string };
}) {
  const resolvedParams = await params;
  const currentPage = Math.max(1, parseInt(searchParams.page || '1'));
  const take = 10;
  const skip = (currentPage - 1) * take;
  const program = await prisma.benefitProgram.findUnique({
    where: { id: resolvedParams.id },
    include: {
      claims: {
        include: {
          senior: true,
        },
        orderBy: {
          senior: {
            lastName: 'asc'
          }
        },
        take,
        skip,
      }
    }
  });

  if (!program) {
    notFound();
  }

  // Calculate statistics using database aggregation
  const [totalBeneficiaries, totalClaimed] = await Promise.all([
    prisma.claim.count({ where: { programId: resolvedParams.id } }),
    prisma.claim.count({ where: { programId: resolvedParams.id, status: 'Claimed' } })
  ]);
  
  const totalUnclaimed = totalBeneficiaries - totalClaimed;
  const totalPages = Math.ceil(totalBeneficiaries / take);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <LiveUpdate interval={10000} />
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <Link href="/admin/programs" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-green-700 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Programs
        </Link>
      </div>

      {/* Program Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-green-900 px-6 py-8 sm:p-10 relative overflow-hidden text-white">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-800 rounded-full blur-3xl opacity-50" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{program.title}</h1>
                <div className="flex flex-wrap items-center gap-4 text-green-100 text-sm font-medium">
                  <span className="inline-flex items-center bg-green-800/50 px-2.5 py-1 rounded-md border border-green-700/50">
                    <Tag className="w-4 h-4 mr-1.5 text-green-300" />
                    {program.type}
                  </span>
                  <span className="inline-flex items-center">
                    <Calendar className="w-4 h-4 mr-1.5 text-green-300" />
                    Distribution: {format(new Date(program.distributionDate), "MMMM d, yyyy")}
                  </span>
                </div>
              </div>
            </div>
            
            {program.description && (
              <div className="mt-6 pt-6 border-t border-green-800/50">
                <h3 className="text-green-200 text-sm font-semibold uppercase tracking-wider mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-1.5" /> Description
                </h3>
                <p className="text-green-50 leading-relaxed max-w-3xl">
                  {program.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Beneficiaries</p>
            <p className="text-2xl font-bold text-gray-900">{totalBeneficiaries}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-green-50 text-green-600 mr-4">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Successfully Claimed</p>
            <p className="text-2xl font-bold text-gray-900">{totalClaimed}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 rounded-full bg-orange-50 text-orange-600 mr-4">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Unclaimed Pending</p>
            <p className="text-2xl font-bold text-gray-900">{totalUnclaimed}</p>
          </div>
        </div>
      </div>

      {/* Beneficiaries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-900">Eligible Beneficiaries Roster</h2>
          <p className="text-sm text-gray-500 mt-1">List of all senior citizens registered for this program.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Senior Name</th>
                <th className="px-6 py-4">OSCA ID</th>
                <th className="px-6 py-4">Barangay</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Claimed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {program.claims.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    No beneficiaries found for this program.
                  </td>
                </tr>
              ) : (
                program.claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/admin/seniors/${claim.seniorId}`} className="hover:text-green-600 transition-colors">
                        {claim.senior.lastName}, {claim.senior.firstName} {claim.senior.middleName}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                      {claim.senior.oscaId}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                        {claim.senior.barangay}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        claim.status === 'Claimed' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {claim.claimedAt ? format(new Date(claim.claimedAt), "MMM d, yyyy h:mm a") : "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3">
              <div className="flex flex-1 justify-between sm:hidden">
                <Link
                  href={`/admin/programs/${resolvedParams.id}?${new URLSearchParams({ ...searchParams, page: Math.max(1, currentPage - 1).toString() })}`}
                  className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Previous
                </Link>
                <Link
                  href={`/admin/programs/${resolvedParams.id}?${new URLSearchParams({ ...searchParams, page: Math.min(totalPages, currentPage + 1).toString() })}`}
                  className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                >
                  Next
                </Link>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{skip + 1}</span> to <span className="font-medium">{Math.min(skip + take, totalBeneficiaries)}</span> of{' '}
                    <span className="font-medium">{totalBeneficiaries}</span> beneficiaries
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <Link
                      href={`/admin/programs/${resolvedParams.id}?${new URLSearchParams({ ...searchParams, page: Math.max(1, currentPage - 1).toString() })}`}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </Link>
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Link
                      href={`/admin/programs/${resolvedParams.id}?${new URLSearchParams({ ...searchParams, page: Math.min(totalPages, currentPage + 1).toString() })}`}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
