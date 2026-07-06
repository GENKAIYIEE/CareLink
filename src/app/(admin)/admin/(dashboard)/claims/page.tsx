import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { SearchBar } from "@/components/admin/SearchBar";
import { MarkClaimedButton } from "./MarkClaimedButton";
import { getSession } from "@/lib/session";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { LiveUpdate } from "@/components/senior/LiveUpdate";

export const dynamic = 'force-dynamic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a server-side Supabase client (service-role key preferred so we can
 * read face_embedding without RLS interference).
 * Falls back to anon key if service-role is not set — adequate for a simple
 * IS NOT NULL check.
 */
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Returns a Set of senior IDs that have a face_embedding stored in Supabase.
 * If Supabase is not configured, returns an empty Set (graceful degradation).
 */
async function getFaceEnrolledSeniorIds(seniorIds: string[]): Promise<Set<string>> {
  if (!seniorIds.length) return new Set();

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) return new Set();

  try {
    const { data, error } = await supabaseAdmin
      .from("Senior")
      .select("id")
      .in("id", seniorIds)
      .not("face_embedding", "is", null);

    if (error || !data) return new Set();
    return new Set(data.map((row: { id: string }) => row.id));
  } catch {
    return new Set();
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q, page } = await searchParams;
  const query = q || "";
  const currentPage = Math.max(1, parseInt(page || '1'));
  const take = 10;
  const skip = (currentPage - 1) * take;

  const whereClause: any = query
    ? {
        senior: {
          OR: [
            { firstName: { contains: query, mode: "insensitive" as const } },
            { lastName: { contains: query, mode: "insensitive" as const } },
            { oscaId: { contains: query, mode: "insensitive" as const } },
          ],
        },
      }
    : undefined;

  // 1. Fetch claims from Prisma
  const [claims, totalCount] = await Promise.all([
    prisma.claim.findMany({
      where: whereClause,
      include: {
        senior: true,
        program: true,
        claimedBy: true,
      },
      orderBy: { claimedAt: "desc" },
      take,
      skip,
    }),
    prisma.claim.count({ where: whereClause })
  ]);

  const totalPages = Math.ceil(totalCount / take);

  // 2. Determine if the logged-in admin is a SuperAdmin
  const session = await getSession();
  let isSuperAdmin = false;
  if (session?.userId) {
    const admin = await prisma.admin.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    isSuperAdmin = admin?.role === "SuperAdmin";
  }

  // 3. Check which seniors have face embedments (Supabase side)
  const unclaimedSeniorIds = claims
    .filter((c) => c.status === "Unclaimed")
    .map((c) => c.senior.id);

  const enrolledIds = await getFaceEnrolledSeniorIds(unclaimedSeniorIds);

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <LiveUpdate interval={30000} />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Claims Ledger</h2>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage benefit claims across all programs.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <SearchBar placeholder="Search claims by OSCA ID or Name..." />
        {query && (
          <p className="text-sm text-gray-500">
            {claims.length === 0
              ? `No claims found for '${query}'`
              : `Showing ${claims.length} claim${claims.length === 1 ? "" : "s"}`}
          </p>
        )}
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                    >
                      Senior
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Program
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Claimed By
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-sm text-gray-500">
                        No claims found in the system.
                      </td>
                    </tr>
                  ) : (
                    claims.map((claim) => (
                      <tr key={claim.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          <div>
                            {claim.senior.lastName}, {claim.senior.firstName}
                          </div>
                          <div className="text-xs text-gray-500">{claim.senior.oscaId}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {claim.program.title}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                              claim.status === "Claimed"
                                ? "bg-green-50 text-green-700 ring-green-600/20"
                                : claim.status === "Unclaimed"
                                ? "bg-yellow-50 text-yellow-800 ring-yellow-600/20"
                                : "bg-red-50 text-red-700 ring-red-600/10"
                            }`}
                          >
                            {claim.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {claim.status === "Claimed" ? (
                            claim.claimedBy ? (
                              <div>
                                <span>{claim.claimedBy.fullName}</span>
                                <span className="text-xs text-gray-500 block">(Proxy)</span>
                              </div>
                            ) : (
                              "Self"
                            )
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          {claim.status === "Unclaimed" && (
                            <MarkClaimedButton
                              claimId={claim.id}
                              seniorId={claim.senior.id}
                              seniorName={`${claim.senior.firstName} ${claim.senior.lastName}`}
                              oscaId={claim.senior.oscaId}
                              hasFaceEnrolled={enrolledIds.has(claim.senior.id)}
                              isSuperAdmin={isSuperAdmin}
                            />
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                  <div className="flex flex-1 justify-between sm:hidden">
                    <Link
                      href={`/admin/claims?${new URLSearchParams({ ...(query ? { q: query } : {}), page: Math.max(1, currentPage - 1).toString() })}`}
                      className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      Previous
                    </Link>
                    <Link
                      href={`/admin/claims?${new URLSearchParams({ ...(query ? { q: query } : {}), page: Math.min(totalPages, currentPage + 1).toString() })}`}
                      className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 ${currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}`}
                    >
                      Next
                    </Link>
                  </div>
                  <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{skip + 1}</span> to <span className="font-medium">{Math.min(skip + take, totalCount)}</span> of{' '}
                        <span className="font-medium">{totalCount}</span> claims
                      </p>
                    </div>
                    <div>
                      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                        <Link
                          href={`/admin/claims?${new URLSearchParams({ ...(query ? { q: query } : {}), page: Math.max(1, currentPage - 1).toString() })}`}
                          className={`relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}`}
                        >
                          <span className="sr-only">Previous</span>
                          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                        </Link>
                        <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Link
                          href={`/admin/claims?${new URLSearchParams({ ...(query ? { q: query } : {}), page: Math.min(totalPages, currentPage + 1).toString() })}`}
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
      </div>
    </div>
  );
}
