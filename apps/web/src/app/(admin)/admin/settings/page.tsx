import { redirect } from "next/navigation"

export default function AdminSettingsIndexRedirectPage() {
  redirect("/admin/settings/profile")
}
