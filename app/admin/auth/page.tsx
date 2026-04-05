import { redirect } from "next/navigation"

export default function AdminAuthRedirect() {
  redirect("/auth/login")
}
