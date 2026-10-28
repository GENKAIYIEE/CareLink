"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateSeniorMilestoneAction } from "@/lib/actions/seniors";
import { getMilestoneInfo } from "@/lib/utils/milestone";

interface MilestoneStatusEditorProps {
  seniorId: string;
  initialMilestoneAge: number | null;
  dateOfBirth: string | Date | null;
}

export function MilestoneStatusEditor({
  seniorId,
  initialMilestoneAge,
  dateOfBirth,
}: MilestoneStatusEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<number | null>(initialMilestoneAge ?? null);
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(initialMilestoneAge ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const milestoneInfo = getMilestoneInfo({
    dateOfBirth,
    milestoneAge: currentMilestone,
  });

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await updateSeniorMilestoneAction(seniorId, selectedMilestone);
      if (!res.success) {
        toast.error(res.error || "Failed to update milestone.");
        return;
      }

      setCurrentMilestone(selectedMilestone);
      setIsEditing(false);
      toast.success("Milestone updated.");
    } catch (err: unknown) {
      console.error("Error updating milestone:", err);
      toast.error("Failed to update milestone.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setSelectedMilestone(currentMilestone);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="col-span-1 sm:col-span-2">
        <dt className="text-gray-500 font-medium">Milestone Age</dt>
        <dd className="mt-1 flex flex-wrap items-center gap-2">
          <select
            value={selectedMilestone === null ? "" : String(selectedMilestone)}
            onChange={(e) =>
              setSelectedMilestone(e.target.value === "" ? null : parseInt(e.target.value, 10))
            }
            className="text-sm rounded-md border border-gray-300 bg-white px-2.5 py-1 text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">None / Auto (from birthdate)</option>
            <option value="80">80 Years Old</option>
            <option value="85">85 Years Old</option>
            <option value="90">90 Years Old</option>
            <option value="95">95 Years Old</option>
            <option value="100">100 Years Old (Centenarian)</option>
          </select>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSave}
            className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleCancel}
            className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </dd>
      </div>
    );
  }

  return (
    <div>
      <dt className="text-gray-500 font-medium flex items-center justify-between">
        <span>Milestone Age</span>
        <button
          type="button"
          onClick={() => {
            setSelectedMilestone(currentMilestone);
            setIsEditing(true);
          }}
          className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
        >
          Edit
        </button>
      </dt>
      <dd className="text-gray-900 mt-1 flex items-center gap-1.5 flex-wrap">
        {currentMilestone !== null ? (
          <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
            {currentMilestone} Years Old (Specified)
          </span>
        ) : milestoneInfo.effectiveMilestone ? (
          <span className="text-gray-900">
            {milestoneInfo.effectiveMilestone} Years Old{" "}
            {milestoneInfo.isTurningThisYear && (
              <span className="text-xs text-blue-600 font-normal">
                (Turning this year)
              </span>
            )}
          </span>
        ) : (
          <span className="text-gray-500">
            None{" "}
            {milestoneInfo.nextMilestone && (
              <span className="text-xs text-gray-400">
                (Next: {milestoneInfo.nextMilestone.age})
              </span>
            )}
          </span>
        )}
      </dd>
    </div>
  );
}
