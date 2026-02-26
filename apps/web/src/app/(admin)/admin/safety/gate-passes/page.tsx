import { redirect } from "next/navigation"

export default function AdminSafetyGatePassesRedirectPage() {
  redirect("/admin/students/gate-passes")
}
