"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "../lib/admin/auth";
import { createSupabaseServerClient } from "../lib/supabase/server";

export type AdminLoginState = {
  error?: string;
};

const ordersPath = "/admin/orders";

export async function signInAdmin(_state: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "ກະລຸນາໃສ່ອີເມວ ແລະລະຫັດຜ່ານ." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "ເຂົ້າລະບົບບໍ່ສຳເລັດ. ກວດອີເມວ ແລະລະຫັດຜ່ານອີກຄັ້ງ." };
  }

  redirect("/admin");
}

export async function signOutAdmin() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function approvePaymentSlip(formData: FormData) {
  await requireAdminSession();

  const orderId = String(formData.get("orderId") ?? "");
  const slipId = String(formData.get("slipId") ?? "");

  if (!orderId || !slipId) {
    throw new Error("Missing order or slip id.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_approve_payment_slip", {
    target_order_id: orderId,
    target_slip_id: slipId,
  });

  if (error) {
    redirect(`${ordersPath}?review=already-reviewed`);
  }

  revalidatePath("/admin");
  revalidatePath(ordersPath);
  redirect(`${ordersPath}?review=approved`);
}

export async function rejectPaymentSlip(formData: FormData) {
  await requireAdminSession();

  const orderId = String(formData.get("orderId") ?? "");
  const slipId = String(formData.get("slipId") ?? "");
  const reason = String(formData.get("reason") ?? "Rejected from admin review");

  if (!orderId || !slipId) {
    throw new Error("Missing order or slip id.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_reject_payment_slip", {
    target_order_id: orderId,
    target_slip_id: slipId,
    reason,
  });

  if (error) {
    redirect(`${ordersPath}?review=already-reviewed`);
  }

  revalidatePath("/admin");
  revalidatePath(ordersPath);
  redirect(`${ordersPath}?review=rejected`);
}

export async function updateOrderShipping(formData: FormData) {
  await requireAdminSession();

  const orderId = String(formData.get("orderId") ?? "");
  const status = String(formData.get("status") ?? "");
  const carrier = String(formData.get("carrier") ?? "");
  const trackingNumber = String(formData.get("trackingNumber") ?? "");

  if (!orderId || !["not_shipped", "shipping", "delivered"].includes(status)) {
    throw new Error("Missing order id or invalid shipping status.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("admin_update_order_shipping", {
    target_order_id: orderId,
    next_status: status,
    next_carrier: carrier,
    next_tracking_number: trackingNumber,
  });

  if (error) {
    redirect(`${ordersPath}?shipping=failed`);
  }

  revalidatePath("/admin");
  revalidatePath(ordersPath);
  redirect(`${ordersPath}?shipping=updated`);
}
