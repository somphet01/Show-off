import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "../supabase/server";

export type AdminRole = "owner" | "staff";

export type AdminSession = {
  userId: string;
  email: string | null;
  role: AdminRole;
  displayName: string | null;
};

type ProfileRow = {
  role: string | null;
  display_name: string | null;
};

export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase.from("profiles").select("role, display_name").eq("id", user.id).maybeSingle<ProfileRow>();

  if (error || !data || (data.role !== "owner" && data.role !== "staff")) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    role: data.role,
    displayName: data.display_name,
  };
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
