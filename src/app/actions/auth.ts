"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminPass = process.env.ADMIN_PASS ?? "admin123";
const adminToken = process.env.ADMIN_TOKEN ?? "change-me";

export async function adminLogin(formData: FormData) {
  const pass = String(formData.get("pass") || "").trim();

  if (pass !== adminPass) {
    redirect("/admin/login?error=1");
  }

  const store = await cookies();
  store.set("al_admin", adminToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  redirect("/admin");
}

export async function adminLogout() {
  const store = await cookies();
  store.delete("al_admin");
  redirect("/admin/login");
}
