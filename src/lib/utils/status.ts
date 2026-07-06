export function getEffectiveStatus(senior: { status: string; lastPictureUpdate?: Date | null; createdAt?: Date | null }) {
  // If explicitly marked as Deceased, Inactive, etc., keep it that way.
  if (senior.status !== "Active") {
    return senior.status;
  }

  const now = new Date().getTime();

  // If status is Active but they have never uploaded a picture
  if (!senior.lastPictureUpdate) {
    // Give brand new seniors a 30-day grace period
    if (senior.createdAt) {
      const daysSinceRegistration = (now - new Date(senior.createdAt).getTime()) / (1000 * 3600 * 24);
      if (daysSinceRegistration <= 30) {
        return "Active";
      }
    }
    return "Inactive (Unverified)";
  }

  // Calculate days since last picture update
  const lastUpdate = new Date(senior.lastPictureUpdate).getTime();
  const daysSinceUpdate = (now - lastUpdate) / (1000 * 3600 * 24);

  // If more than 30 days have passed
  if (daysSinceUpdate > 30) {
    return "Inactive (Overdue)";
  }

  // Otherwise, they are legitimately Active
  return "Active";
}
