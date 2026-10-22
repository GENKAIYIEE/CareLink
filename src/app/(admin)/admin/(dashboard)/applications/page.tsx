import { redirect } from "next/navigation";

export default function ApplicationsRedirectPage() {
  redirect("/admin/delegates");
}
