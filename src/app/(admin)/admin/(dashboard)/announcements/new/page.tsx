import { Megaphone } from "lucide-react";
import CreateAnnouncementForm from "./CreateAnnouncementForm";

export default function NewAnnouncementPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
          <Megaphone className="mr-2 h-6 w-6 text-blue-600" />
          Create Announcement
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Draft a new announcement for the senior portal.
        </p>
      </div>

      <div className="rounded-xl border bg-white shadow p-6">
        <CreateAnnouncementForm />
      </div>
    </div>
  );
}
