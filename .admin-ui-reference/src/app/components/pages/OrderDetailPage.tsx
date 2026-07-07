import { useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CheckCircle,
  Clock3,
  Image as ImageIcon,
  MapPin,
  PackageSearch,
  Truck,
  UploadCloud,
  UserRound,
  X,
  XCircle,
  ZoomIn,
} from "lucide-react";
import { useApp } from "../../context";
import type { Order, ShippingDocument, ShippingStatus } from "../../types";
import { useAdminFeedback } from "../ui/AdminFeedback";

const paymentStatusColor: Record<string, string> = {
  waiting_slip: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  pending_review: "bg-amber-50 text-amber-700 ring-amber-100",
  paid: "bg-green-50 text-green-700 ring-green-100",
  rejected: "bg-red-50 text-red-600 ring-red-100",
  cancelled: "bg-neutral-100 text-neutral-500 ring-neutral-200",
};

const paymentStatusLabel: Record<string, string> = {
  waiting_slip: "ລໍຖ້າສະລິບ",
  pending_review: "ລໍກວດສະລິບ",
  paid: "ຊຳລະແລ້ວ",
  rejected: "ປະຕິເສດ",
  cancelled: "ຍົກເລີກ",
};

const orderStatusColor: Record<string, string> = {
  pending: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  awaiting_payment_slip: "bg-amber-50 text-amber-700 ring-amber-100",
  awaiting_confirmation: "bg-amber-50 text-amber-700 ring-amber-100",
  paid: "bg-green-50 text-green-700 ring-green-100",
  cancelled: "bg-red-50 text-red-600 ring-red-100",
};

const orderStatusLabel: Record<string, string> = {
  pending: "ລໍຖ້າ",
  awaiting_payment_slip: "ລໍຖ້າສະລິບ",
  awaiting_confirmation: "ລໍກວດ",
  paid: "ຈ່າຍແລ້ວ",
  cancelled: "ຍົກເລີກ",
};

const shippingStatusLabel: Record<ShippingStatus, string> = {
  not_shipped: "ຍັງບໍ່ສົ່ງ",
  shipping: "ກຳລັງສົ່ງ",
  delivered: "ສົ່ງແລ້ວ",
};

const shippingStatusColor: Record<ShippingStatus, string> = {
  not_shipped: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  shipping: "bg-blue-50 text-blue-700 ring-blue-100",
  delivered: "bg-green-50 text-green-700 ring-green-100",
};

const channelLabel: Record<string, string> = {
  web: "ໜ້າເວັບ",
  chat: "ແຊັດ",
  "walk-in": "ໜ້າຮ້ານ",
};

const inputCls =
  "w-full rounded-[16px] border border-neutral-200 bg-white px-4 py-3 text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-4 focus:ring-neutral-950/5 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400";

function money(value: number) {
  return `${Math.round(value || 0).toLocaleString("en-US")}K`;
}

function dateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("lo-LA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function addTimeline(order: Order, event: string, detail?: string): Order {
  return {
    ...order,
    timeline: [
      {
        id: `${order.id}-${Date.now()}`,
        event,
        detail,
        createdAt: new Date().toISOString(),
        by: "Admin",
      },
      ...order.timeline,
    ],
  };
}

async function uploadShippingDocuments(orderId: string, files: File[]) {
  const formData = new FormData();
  formData.append("orderId", orderId);
  files.forEach((file) => formData.append("files", file));

  const response = await fetch("/api/admin/shipping-documents/upload", {
    method: "POST",
    body: formData,
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || "Delivery bill upload failed.");
  }

  return (result.documents ?? []) as ShippingDocument[];
}

export function OrderDetailPage() {
  const { selectedId, navigate, orders, upsertOrder } = useApp();
  const feedback = useAdminFeedback();
  const order = orders.find((item) => item.id === selectedId);
  const [rejectReason, setRejectReason] = useState("");
  const [shippingStatus, setShippingStatus] = useState<ShippingStatus>(order?.shippingStatus ?? "not_shipped");
  const [shippingDocuments, setShippingDocuments] = useState<ShippingDocument[]>(order?.shippingDocuments ?? []);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [saving, setSaving] = useState(false);
  const [slipOpen, setSlipOpen] = useState(false);
  const shippingInputRef = useRef<HTMLInputElement>(null);

  if (!order) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 p-5 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-neutral-50 text-neutral-400">
          <PackageSearch size={24} />
        </div>
        <p className="text-neutral-950" style={{ fontSize: "15px", fontWeight: 760 }}>ບໍ່ພົບອໍເດີ</p>
        <button onClick={() => navigate("orders")} className="rounded-full bg-neutral-950 px-5 py-2.5 text-white" style={{ fontSize: "13px", fontWeight: 740 }} type="button">
          ກັບໄປໜ້າອໍເດີ
        </button>
      </div>
    );
  }

  const isWebOrder = order.channel === "web";
  const isChatOrder = order.channel === "chat";
  const isWalkInOrder = order.channel === "walk-in";
  const canReviewSlip = isWebOrder && order.paymentStatus === "pending_review";
  const canUpdateShipping = !isWalkInOrder && (order.paymentStatus === "paid" || isChatOrder);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const callOrderAction = async (body: Record<string, unknown>) => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/order-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Order action failed.");
      return true;
    } catch (error) {
      feedback.error("ດຳເນີນການບໍ່ສຳເລັດ", error instanceof Error ? error.message : "Order action failed.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const approveSlip = async () => {
    if (!order.paymentSlipId) {
      feedback.error("ບໍ່ພົບສະລິບ", "ອໍເດີນີ້ຍັງບໍ່ມີ slip id ສຳລັບກວດ.");
      return;
    }

    const confirmed = await feedback.confirm({
      title: "ຢືນຢັນອະນຸມັດສະລິບ",
      description: "ຫຼັງອະນຸມັດ ລະບົບຈະຕັດສະຕັອກຂອງອໍເດີນີ້.",
      itemName: order.orderNumber,
      confirmLabel: "ອະນຸມັດ",
      tone: "default",
    });
    if (!confirmed) return;

    const ok = await callOrderAction({ action: "approve_slip", orderId: order.id, slipId: order.paymentSlipId });
    if (!ok) return;

    upsertOrder(addTimeline({ ...order, status: "paid", paymentStatus: "paid", shippingStatus: "not_shipped" }, "ອະນຸມັດສະລິບ", "ລະບົບຕັດສະຕັອກແລ້ວ"));
    feedback.success("ອະນຸມັດສະລິບສຳເລັດ", order.orderNumber);
  };

  const rejectSlip = async () => {
    if (!order.paymentSlipId) {
      feedback.error("ບໍ່ພົບສະລິບ", "ອໍເດີນີ້ຍັງບໍ່ມີ slip id ສຳລັບກວດ.");
      return;
    }
    if (!rejectReason.trim()) {
      feedback.error("ກະລຸນາໃສ່ເຫດຜົນ", "ຕ້ອງມີເຫດຜົນເມື່ອປະຕິເສດສະລິບ.");
      return;
    }

    const confirmed = await feedback.confirm({
      title: "ປະຕິເສດສະລິບນີ້ບໍ?",
      description: "ເຫດຜົນຈະຖືກບັນທຶກໃນອໍເດີ.",
      itemName: rejectReason,
      confirmLabel: "ປະຕິເສດ",
      tone: "danger",
    });
    if (!confirmed) return;

    const ok = await callOrderAction({ action: "reject_slip", orderId: order.id, slipId: order.paymentSlipId, reason: rejectReason });
    if (!ok) return;

    upsertOrder(addTimeline({ ...order, status: "pending", paymentStatus: "rejected", rejectReason }, "ປະຕິເສດສະລິບ", rejectReason));
    feedback.success("ປະຕິເສດສະລິບແລ້ວ", order.orderNumber);
  };

  const updateShipping = async () => {
    const nextShippingStatus: ShippingStatus = shippingDocuments.length > 0 ? "delivered" : shippingStatus;

    if (nextShippingStatus === "delivered" && shippingDocuments.length === 0) {
      feedback.error("ກະລຸນາແນບຮູບບິນ", "ຕ້ອງແນບຮູບບິນຈັດສົ່ງຢ່າງນ້ອຍ 1 ຮູບ.");
      return;
    }

    const ok = await callOrderAction({
      action: "update_shipping",
      orderId: order.id,
      shippingStatus: nextShippingStatus,
      shippingDocuments,
    });
    if (!ok) return;

    setShippingStatus(nextShippingStatus);
    upsertOrder(addTimeline(
      {
        ...order,
        paymentStatus: "paid",
        status: "paid",
        shippingStatus: nextShippingStatus,
        shippingDocuments,
        shippedDate: nextShippingStatus === "delivered" ? new Date().toISOString() : order.shippedDate,
        deliveredDate: nextShippingStatus === "delivered" ? new Date().toISOString() : undefined,
      },
      "ອັບເດດການຈັດສົ່ງ",
      `${shippingStatusLabel[nextShippingStatus]} · ${shippingDocuments.length} image${shippingDocuments.length === 1 ? "" : "s"}`,
    ));
    feedback.success("ອັບເດດການຈັດສົ່ງສຳເລັດ", order.orderNumber);
  };

  const addShippingDocuments = async (files: FileList | null) => {
    const selectedFiles = Array.from(files ?? []);
    if (selectedFiles.length === 0) return;

    setUploadingDocuments(true);
    try {
      const uploaded = await uploadShippingDocuments(order.id, selectedFiles);
      setShippingDocuments((current) => [...current, ...uploaded].slice(0, 12));
      setShippingStatus("delivered");
    } catch (error) {
      feedback.error("ອັບໂຫຼດບໍ່ສຳເລັດ", error instanceof Error ? error.message : "Delivery bill upload failed.");
    } finally {
      setUploadingDocuments(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 p-5">
      <section className="rounded-[26px] bg-white px-5 py-4 shadow-[0_18px_48px_rgba(15,23,42,.06)] ring-1 ring-neutral-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <button onClick={() => navigate("orders")} className="mt-1 rounded-full p-2 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950" type="button" aria-label="Back">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-neutral-950" style={{ fontWeight: 820, fontSize: "24px", letterSpacing: "-0.035em" }}>{order.orderNumber}</h1>
                {isWebOrder ? <StatusPill className={orderStatusColor[order.status]}>{orderStatusLabel[order.status]}</StatusPill> : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-neutral-500" style={{ fontSize: "12.5px" }}>
                <span>{dateTime(order.createdAt)}</span>
                <span className="h-1 w-1 rounded-full bg-neutral-300" />
                <span>{channelLabel[order.channel] ?? order.channel}</span>
                <span className="h-1 w-1 rounded-full bg-neutral-300" />
                <span>{itemCount} ຊິ້ນ</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 text-right">
            <MiniStat label="ຍອດລວມ" value={money(order.totalAmount)} strong />
            {isWebOrder ? <MiniStat label="ຊຳລະ" value={paymentStatusLabel[order.paymentStatus]} /> : null}
            {!isWalkInOrder ? <MiniStat label="ຈັດສົ່ງ" value={shippingStatusLabel[order.shippingStatus]} /> : null}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_360px]">
        <main className="space-y-5">
          <Card title="ລາຍການສິນຄ້າ" icon={<PackageSearch size={16} />}>
            <div className="divide-y divide-neutral-100">
              {order.items.map((item) => (
                <div key={item.id} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-neutral-50 ring-1 ring-neutral-100">
                    {item.productImage ? <img src={item.productImage} alt={item.productName} className="h-full w-full object-contain" /> : <PackageSearch size={17} className="text-neutral-300" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-neutral-950" style={{ fontSize: "13.5px", fontWeight: 760 }}>{item.productName}</p>
                    <p className="mt-0.5 truncate text-neutral-500" style={{ fontSize: "12px" }}>{item.sku} · {item.variant} · x{item.quantity}</p>
                  </div>
                  <p className="text-right text-neutral-950" style={{ fontSize: "14px", fontWeight: 800 }}>{money(item.lineTotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-[18px] bg-neutral-50 p-4">
              <TotalRow label="ລວມສິນຄ້າ" value={money(order.subtotal)} />
              {order.discount > 0 ? <TotalRow label="ສ່ວນຫຼຸດ" value={`-${money(order.discount)}`} accent /> : null}
              {order.shippingFee > 0 ? <TotalRow label="ຄ່າສົ່ງ" value={money(order.shippingFee)} /> : null}
              <div className="mt-3 flex justify-between border-t border-neutral-200 pt-3 text-neutral-950" style={{ fontSize: "17px", fontWeight: 820 }}>
                <span>ຍອດທີ່ຕ້ອງຮັບ</span>
                <span>{money(order.totalAmount)}</span>
              </div>
            </div>
          </Card>

          {isWebOrder ? (
            <Card title="ການຊຳລະເງິນ" icon={<Banknote size={16} />}>
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <button
                  onClick={() => order.slipImage && setSlipOpen(true)}
                  disabled={!order.slipImage}
                  className="group relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-[20px] bg-neutral-50 ring-1 ring-neutral-100 transition hover:ring-neutral-300 disabled:cursor-default"
                  type="button"
                >
                  {order.slipImage ? (
                    <>
                      <img src={order.slipImage} alt="Payment slip" className="h-full max-h-[320px] w-full object-contain p-3" />
                      <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-neutral-950/85 px-3 py-2 text-white opacity-0 shadow-[0_12px_30px_rgba(0,0,0,.18)] transition group-hover:opacity-100" style={{ fontSize: "12px", fontWeight: 760 }}>
                        <ZoomIn size={14} /> ເບິ່ງສະລິບ
                      </span>
                    </>
                  ) : (
                    <div className="text-center text-neutral-400">
                      <ImageIcon size={28} className="mx-auto mb-2" />
                      <p style={{ fontSize: "12.5px" }}>ຍັງບໍ່ມີສະລິບ</p>
                    </div>
                  )}
                </button>

                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <StatusPill className={paymentStatusColor[order.paymentStatus]}>{paymentStatusLabel[order.paymentStatus]}</StatusPill>
                    <span className="text-neutral-500" style={{ fontSize: "12.5px" }}>{order.paymentMethod === "bank_transfer" ? "ໂອນທະນາຄານ" : order.paymentMethod}</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <InfoBlock label="ຈຳນວນໃນສະລິບ" value={money(order.slipAmount ?? order.totalAmount)} />
                    <InfoBlock label="ເວລາສົ່ງສະລິບ" value={order.slipUploadTime ? dateTime(order.slipUploadTime) : "-"} />
                  </div>

                  {order.rejectReason ? <InfoBlock label="ເຫດຜົນປະຕິເສດ" value={order.rejectReason} danger /> : null}

                  {canReviewSlip ? (
                    <div className="space-y-3 rounded-[20px] bg-neutral-50 p-3">
                      <textarea value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} className={inputCls} rows={3} placeholder="ເຫດຜົນຖ້າຕ້ອງການປະຕິເສດສະລິບ" style={{ fontSize: "13px" }} />
                      <div className="flex flex-wrap gap-2">
                        <button onClick={approveSlip} disabled={saving} className="flex items-center gap-2 rounded-full bg-green-600 px-4 py-2.5 text-white transition hover:bg-green-700 disabled:opacity-50" style={{ fontSize: "13px", fontWeight: 760 }} type="button">
                          <CheckCircle size={15} /> ອະນຸມັດ
                        </button>
                        <button onClick={rejectSlip} disabled={saving} className="flex items-center gap-2 rounded-full bg-red-50 px-4 py-2.5 text-red-600 ring-1 ring-red-100 transition hover:bg-red-100 disabled:opacity-50" style={{ fontSize: "13px", fontWeight: 760 }} type="button">
                          <XCircle size={15} /> ປະຕິເສດ
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ) : null}

          <Card title="ປະຫວັດອໍເດີ" icon={<Clock3 size={16} />}>
            <div className="grid gap-3 md:grid-cols-2">
              {order.timeline.length ? order.timeline.map((item) => (
                <div key={item.id} className="rounded-[18px] bg-neutral-50 p-3">
                  <p className="text-neutral-950" style={{ fontSize: "13px", fontWeight: 760 }}>{item.event}</p>
                  {item.detail ? <p className="mt-1 text-neutral-600" style={{ fontSize: "12.5px", lineHeight: 1.45 }}>{item.detail}</p> : null}
                  <p className="mt-2 text-neutral-400" style={{ fontSize: "11.5px" }}>{dateTime(item.createdAt)} · {item.by}</p>
                </div>
              )) : <p className="py-4 text-center text-neutral-400" style={{ fontSize: "13px" }}>ຍັງບໍ່ມີປະຫວັດ</p>}
            </div>
          </Card>
        </main>

        <aside className="space-y-5">
          <Card title="ຂໍ້ມູນລູກຄ້າ" icon={<UserRound size={16} />}>
            <p className="text-neutral-950" style={{ fontWeight: 800 }}>{order.customerName}</p>
            <p className="mt-1 text-neutral-600" style={{ fontSize: "13px" }}>{order.customerPhone}</p>
            {order.customerEmail ? <p className="truncate text-neutral-600" style={{ fontSize: "13px" }}>{order.customerEmail}</p> : null}
            {!isWalkInOrder ? (
              <div className="mt-4 rounded-[18px] bg-neutral-50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-neutral-400" style={{ fontSize: "12px" }}>
                  <MapPin size={13} /> ທີ່ຢູ່ຈັດສົ່ງ
                </div>
                <p className="text-neutral-700" style={{ fontSize: "13px", lineHeight: 1.6 }}>{order.shippingAddress || "-"}</p>
              </div>
            ) : null}
          </Card>

          {!isWalkInOrder ? (
            <Card title="ການຈັດສົ່ງ" icon={<Truck size={16} />}>
              <div className="mb-4">
                <StatusPill className={shippingStatusColor[order.shippingStatus]}>{shippingStatusLabel[order.shippingStatus]}</StatusPill>
              </div>
              <div className="space-y-3">
                <select value={shippingStatus} onChange={(event) => setShippingStatus(event.target.value as ShippingStatus)} className={inputCls} style={{ fontSize: "13px" }} disabled={!canUpdateShipping}>
                  <option value="not_shipped">ຍັງບໍ່ສົ່ງ</option>
                  <option value="delivered">ສົ່ງແລ້ວ</option>
                </select>
                <div
                  className="rounded-[18px] border border-dashed border-neutral-300 bg-neutral-50/80 p-3 transition hover:border-neutral-400"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    if (canUpdateShipping && !uploadingDocuments) void addShippingDocuments(event.dataTransfer.files);
                  }}
                >
                  <input
                    ref={shippingInputRef}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    multiple
                    type="file"
                    onChange={(event) => {
                      void addShippingDocuments(event.target.files);
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    className="flex min-h-[92px] w-full flex-col items-center justify-center gap-2 rounded-[14px] text-neutral-500 transition hover:bg-white hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={!canUpdateShipping || uploadingDocuments}
                    onClick={() => shippingInputRef.current?.click()}
                    type="button"
                  >
                    <UploadCloud size={27} />
                    <span style={{ fontSize: "12.5px", fontWeight: 700 }}>
                      {uploadingDocuments ? "ກຳລັງອັບໂຫຼດ..." : "ເພີ່ມຮູບບິນຈັດສົ່ງ"}
                    </span>
                    <span className="text-neutral-400" style={{ fontSize: "10.5px" }}>JPG, PNG, WEBP · 8MB / ຮູບ</span>
                  </button>
                </div>
                {shippingDocuments.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {shippingDocuments.map((document, index) => (
                      <div className="group relative aspect-square overflow-hidden rounded-[14px] bg-neutral-100 ring-1 ring-neutral-200" key={`${document.url}-${index}`}>
                        <img className="h-full w-full object-cover" src={document.url} alt={document.name || `Delivery bill ${index + 1}`} />
                        <button
                          aria-label="Remove delivery bill image"
                          className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-white/95 text-red-600 shadow-[0_5px_16px_rgba(0,0,0,.14)] transition hover:bg-red-600 hover:text-white"
                          onClick={() => setShippingDocuments((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                          type="button"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                {!canUpdateShipping ? (
                  <div className="flex gap-2 rounded-[16px] bg-amber-50 p-3 text-amber-700">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                    <p style={{ fontSize: "12.5px", lineHeight: 1.5 }}>
                      {isChatOrder ? "ກວດຢືນຢັນການຊຳລະໃນແຊັດກ່ອນ ຈຶ່ງອັບເດດການຈັດສົ່ງໄດ້." : "ອະນຸມັດການຊຳລະກ່ອນ ຈຶ່ງອັບເດດການຈັດສົ່ງໄດ້."}
                    </p>
                  </div>
                ) : (
                  <button onClick={updateShipping} disabled={saving || uploadingDocuments} className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-950 py-3 text-white shadow-[0_12px_30px_rgba(0,0,0,.14)] transition hover:bg-neutral-800 disabled:opacity-50" style={{ fontSize: "13.5px", fontWeight: 760 }} type="button">
                    <Truck size={15} /> ບັນທຶກການຈັດສົ່ງ
                  </button>
                )}
              </div>
            </Card>
          ) : null}

          <Card title="ຂໍ້ມູນອໍເດີ" icon={<Clock3 size={16} />}>
            <div className="space-y-2">
              <MetaRow label="ຊ່ອງທາງ" value={channelLabel[order.channel] ?? order.channel} />
              <MetaRow label="ວັນທີ່ສ້າງ" value={dateTime(order.createdAt)} />
              <MetaRow label="ສ້າງໂດຍ" value={order.createdBy === "web" ? "ລູກຄ້າ (Web)" : order.createdBy} />
            </div>
          </Card>
        </aside>
      </div>

      {isWebOrder && slipOpen && order.slipImage ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 p-4 backdrop-blur-sm" onClick={() => setSlipOpen(false)}>
          <div className="relative max-h-[92vh] w-full max-w-[520px] rounded-[24px] bg-white p-3 shadow-[0_30px_90px_rgba(0,0,0,.35)]" onClick={(event) => event.stopPropagation()}>
            <button onClick={() => setSlipOpen(false)} className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-neutral-700 shadow-[0_8px_22px_rgba(0,0,0,.12)] transition hover:bg-neutral-950 hover:text-white" type="button" aria-label="Close slip">
              <X size={18} />
            </button>
            <img src={order.slipImage} alt="Payment slip large" className="max-h-[86vh] w-full rounded-[18px] object-contain" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Card({ title, icon, children }: { title?: string; icon?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-[0_18px_48px_rgba(15,23,42,.06)] ring-1 ring-neutral-100">
      {title ? (
        <div className="mb-4 flex items-center gap-2">
          {icon ? <span className="flex h-8 w-8 items-center justify-center rounded-[12px] bg-neutral-950 text-white">{icon}</span> : null}
          <h3 className="text-neutral-950" style={{ fontWeight: 800, fontSize: "15px", letterSpacing: "-0.01em" }}>{title}</h3>
        </div>
      ) : null}
      {children}
    </section>
  );
}

function StatusPill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 ring-1 ${className}`} style={{ fontSize: "11.5px", fontWeight: 760 }}>
      {children}
    </span>
  );
}

function MiniStat({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="min-w-[86px] rounded-[18px] bg-neutral-50 px-3 py-2 ring-1 ring-neutral-100">
      <p className="text-neutral-400" style={{ fontSize: "11px", fontWeight: 650 }}>{label}</p>
      <p className={strong ? "text-neutral-950" : "text-neutral-700"} style={{ fontSize: strong ? "15px" : "12.5px", fontWeight: strong ? 820 : 760 }}>{value}</p>
    </div>
  );
}

function TotalRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex justify-between ${accent ? "text-green-600" : "text-neutral-500"}`} style={{ fontSize: "13px" }}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}

function InfoBlock({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-[18px] bg-neutral-50 p-3">
      <p className="mb-1 text-neutral-400" style={{ fontSize: "12px" }}>{label}</p>
      <p className={danger ? "text-red-600" : "text-neutral-950"} style={{ fontSize: "14px", fontWeight: 780 }}>{value}</p>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 rounded-[14px] bg-neutral-50 px-3 py-2">
      <span className="text-neutral-400" style={{ fontSize: "12.5px" }}>{label}</span>
      <span className="max-w-[190px] truncate text-right text-neutral-700" style={{ fontSize: "12.5px", fontWeight: 700 }}>{value}</span>
    </div>
  );
}
