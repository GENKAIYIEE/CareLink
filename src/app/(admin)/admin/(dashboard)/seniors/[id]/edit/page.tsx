import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { EditSeniorForm } from "./EditSeniorForm";

export default async function EditSeniorPage({ params }: { params: { id: string } }) {
  const resolvedParams = await params;
  const senior = await prisma.senior.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!senior) {
    notFound();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header & Back */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Edit Senior Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update the information for {senior.firstName} {senior.lastName} (OSCA ID: {senior.oscaId}).
          </p>
        </div>
        <Link href={`/admin/seniors/${senior.id}`} className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Profile
        </Link>
      </div>

      <EditSeniorForm senior={senior} />
    </div>
  );
}
