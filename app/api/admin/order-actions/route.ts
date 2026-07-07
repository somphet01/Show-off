import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "../../../lib/admin/auth";
import { createSupabaseServerClient } from "../../../lib/supabase/server";

type Payload = {
  action?: "approve_slip" | "reject_slip" | "update_shipping";
  orderId?: string;
  slipId?: string;
  reason?: string;
  shippingStatus?: "not_shipped" | "shipping" | "delivered";
  carrier?: string;
  trackingNumber?: string;
  shippingDocuments?: Array<{ url?: string; path?: string; name?: string }>;
};

function cleanText(value: unknown) {
  return String(value ?? "").trim();
}

function cleanDocuments(value: Payload["shippingDocuments"]) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => ({
      url: cleanText(item?.url),
      path: cleanText(item?.path),
      name: cleanText(item?.name),
    }))
    .filter((item) => item.url)
    .slice(0, 12);
}

function revalidateAdminAndStorefront() {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/inventory");
  revalidatePath("/en");
  revalidatePath("/lo");
  revalidatePath("/en/collections/[slug]", "page");
  revalidatePath("/lo/collections/[slug]", "page");
  revalidatePath("/en/products/[slug]", "page");
  revalidatePath("/lo/products/[slug]", "page");
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as Payload;
  const action = payload.action;
  const orderId = cleanText(payload.orderId);
  const slipId = cleanText(payload.slipId);
  const supabase = await createSupabaseServerClient();

  if (!action || !orderId) {
    return NextResponse.json({ error: "Missing order action data." }, { status: 400 });
  }

  if (action === "approve_slip") {
    if (!slipId) return NextResponse.json({ error: "Missing payment slip id." }, { status: 400 });

    const { error } = await supabase.rpc("admin_approve_payment_slip", {
      target_order_id: orderId,
      target_slip_id: slipId,
    });

    if (error) return NextResponse.json({ error: error.message || "Approve slip failed." }, { status: 500 });
    revalidateAdminAndStorefront();
    return NextResponse.json({ ok: true });
  }

  if (action === "reject_slip") {
    if (!slipId) return NextResponse.json({ error: "Missing payment slip id." }, { status: 400 });

    const { error } = await supabase.rpc("admin_reject_payment_slip", {
      target_order_id: orderId,
      target_slip_id: slipId,
      reason: cleanText(payload.reason) || "Rejected from admin review",
    });

    if (error) return NextResponse.json({ error: error.message || "Reject slip failed." }, { status: 500 });
    revalidateAdminAndStorefront();
    return NextResponse.json({ ok: true });
  }

  if (action === "update_shipping") {
    const shippingStatus = payload.shippingStatus;
    if (!shippingStatus || !["not_shipped", "shipping", "delivered"].includes(shippingStatus)) {
      return NextResponse.json({ error: "Invalid shipping status." }, { status: 400 });
    }

    const documents = cleanDocuments(payload.shippingDocuments);
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id,source,chat_channel,payment_status")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      return NextResponse.json({ error: orderError.message || "Could not verify the order." }, { status: 500 });
    }

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const isChatOrder = order.source === "chat" && order.chat_channel !== "walk-in";

    if (order.payment_status !== "paid" && !isChatOrder) {
      return NextResponse.json({ error: "The payment must be approved before delivery can be updated." }, { status: 400 });
    }

    const { data: currentShipment, error: shipmentReadError } = await supabase
      .from("shipments")
      .select("shipped_at,delivered_at")
      .eq("order_id", orderId)
      .maybeSingle();

    if (shipmentReadError) {
      return NextResponse.json({ error: shipmentReadError.message || "Could not read delivery details." }, { status: 500 });
    }

    const now = new Date().toISOString();
    const { error: shipmentError } = await supabase.from("shipments").upsert(
      {
        order_id: orderId,
        status: shippingStatus,
        carrier: cleanText(payload.carrier) || null,
        tracking_number: cleanText(payload.trackingNumber) || null,
        document_images: documents,
        shipped_at:
          shippingStatus === "shipping" || shippingStatus === "delivered"
            ? currentShipment?.shipped_at ?? now
            : currentShipment?.shipped_at ?? null,
        delivered_at: shippingStatus === "delivered" ? currentShipment?.delivered_at ?? now : null,
        created_by: session.userId,
        updated_at: now,
      },
      { onConflict: "order_id" },
    );

    if (shipmentError) {
      return NextResponse.json({ error: shipmentError.message || "Saving delivery documents failed." }, { status: 500 });
    }

    const fulfillmentStatus =
      shippingStatus === "delivered" ? "delivered" : shippingStatus === "shipping" ? "shipped" : "ready_to_ship";
    const { error: orderUpdateError } = await supabase
      .from("orders")
      .update({
        shipping_status: shippingStatus,
        fulfillment_status: fulfillmentStatus,
        ...(isChatOrder ? { payment_status: "paid", status: "paid" } : {}),
        updated_at: now,
      })
      .eq("id", orderId);

    if (orderUpdateError) {
      return NextResponse.json({ error: orderUpdateError.message || "Updating the order status failed." }, { status: 500 });
    }

    const { error: activityError } = await supabase.from("activity_logs").insert({
      actor_id: session.userId,
      action: "update_shipping",
      target_type: "order",
      target_id: orderId,
      summary: `Updated shipping to ${shippingStatus}`,
      metadata: {
        status: shippingStatus,
        document_count: documents.length,
      },
    });

    if (activityError) {
      console.error("Failed to record shipping activity", activityError);
    }

    revalidateAdminAndStorefront();
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unsupported order action." }, { status: 400 });
}
