import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function requireAdmin() {
  const token = (await cookies()).get("al_admin")?.value;
  if (!token || token !== (process.env.ADMIN_TOKEN ?? "change-me"))
    redirect("/login");
}
