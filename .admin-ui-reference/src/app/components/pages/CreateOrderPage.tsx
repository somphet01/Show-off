import { useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { useApp } from "../../context";
import { liveValue } from "../../liveData";
import type { Customer, Order, Product, ProductVariant } from "../../types";
import { useAdminFeedback } from "../ui/AdminFeedback";

type OrderLine = {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
};

const inputCls =
  "w-full rounded-[18px] border border-neutral-200 bg-white px-4 py-3 text-neutral-950 outline-none transition placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-4 focus:ring-neutral-900/5";

function money(value: number) {
  return `${Math.round(value || 0).toLocaleString("en-US")}K`;
}

function lineId() {
  return `line-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function primaryImage(product?: Product) {
  return product?.images.find((image) => image.isPrimary)?.url || product?.images[0]?.url || "";
}

function isOrderableProduct(product: Product) {
  return (
    product.status === "active" &&
    /^SO-[A-Z]+-\d{4}$/i.test(product.sku) &&
    product.variants.some((variant) => variant.status === "active")
  );
}

export function CreateOrderPage() {
  const { navigate, products, upsertOrder } = useApp();
  const feedback = useAdminFeedback();
  const customers = liveValue<Customer[]>("customers", []);

  const [source, setSource] = useState<"chat" | "walk-in">("chat");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([{ id: lineId(), productId: "", variantId: "", quantity: 1 }]);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [shippingFee, setShippingFee] = useState(0);
  const [discountTotal, setDiscountTotal] = useState(0);
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedOrder, setSavedOrder] = useState<Order | null>(null);

  const activeProducts = useMemo(() => products.filter(isOrderableProduct), [products]);
  const productsById = useMemo(() => new Map(activeProducts.map((product) => [product.id, product])), [activeProducts]);

  const getProduct = (productId: string) => productsById.get(productId);
  const getVariant = (productId: string, variantId: string) =>
    getProduct(productId)?.variants.find((variant) => variant.id === variantId);

  const subtotal = lines.reduce((sum, line) => {
    const variant = getVariant(line.productId, line.variantId);
    return sum + (variant ? variant.salePrice * line.quantity : 0);
  }, 0);
  const total = Math.max(subtotal - discountTotal + shippingFee, 0);
  const hasStockWarning = lines.some((line) => {
    const variant = getVariant(line.productId, line.variantId);
    return Boolean(variant && line.quantity > variant.stock);
  });
  const hasMissingLine = lines.some((line) => !line.productId || !line.variantId || line.quantity <= 0);
  const canSave = Boolean(customerName.trim()) && !hasMissingLine && !hasStockWarning && !isSaving;

  const selectCustomer = (value: string) => {
    setCustomerId(value);
    const customer = customers.find((item) => item.id === value);
    if (!customer) return;
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone || "");
    setCustomerEmail(customer.email || "");
    setShippingAddress(customer.addresses.find((address) => address.isDefault)?.address || customer.addresses[0]?.address || "");
  };

  const updateLine = (id: string, patch: Partial<OrderLine>) => {
    setLines((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch, ...(patch.productId ? { variantId: "" } : {}) } : item)),
    );
  };

  const removeLine = async (id: string) => {
    if (lines.length === 1) return;
    const line = lines.find((item) => item.id === id);
    const product = line ? getProduct(line.productId) : undefined;
    const ok = await feedback.confirm({
      title: "ລຶບລາຍການນີ້?",
      description: "ລາຍການສິນຄ້ານີ້ຈະຖືກຖອນອອກຈາກອໍເດີ.",
      itemName: product?.nameEn || line?.variantId || "Order item",
      confirmLabel: "ລຶບ",
    });
    if (!ok) return;
    setLines((items) => items.filter((item) => item.id !== id));
  };

  const submitOrder = async () => {
    if (!canSave) {
      feedback.error("ຍັງບັນທຶກບໍ່ໄດ້", "ກະລຸນາໃສ່ລູກຄ້າ, ສິນຄ້າ, variant ແລະຈຳນວນໃຫ້ຄົບ.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          customerName,
          customerPhone,
          customerEmail,
          shippingAddress,
          lines: lines.map((line) => ({ productId: line.productId, variantId: line.variantId, quantity: line.quantity })),
          discountTotal,
          shippingFee,
          paymentMethod,
          note,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as { order?: Order; error?: string };

      if (!response.ok || !result.order) {
        throw new Error(result.error || "Create order failed.");
      }

      upsertOrder(result.order);
      setSavedOrder(result.order);
      feedback.success("ສ້າງອໍເດີສຳເລັດ", result.order.orderNumber);
      window.setTimeout(() => navigate("order-detail", result.order?.id), 900);
    } catch (error) {
      feedback.error("ສ້າງອໍເດີບໍ່ສຳເລັດ", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("orders")}
            className="rounded-full p-2.5 text-neutral-500 transition hover:bg-white hover:text-neutral-950 hover:shadow-[0_8px_22px_rgba(0,0,0,.06)]"
            type="button"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-neutral-950" style={{ fontSize: "28px", fontWeight: 820, letterSpacing: "-0.04em" }}>
              ສ້າງອໍເດີໃໝ່
            </h1>
            <p className="mt-1 text-neutral-500" style={{ fontSize: "13px" }}>
              ເລືອກສິນຄ້າຈາກສະຕັອກຈິງ, ສ້າງອໍເດີແລ້ວລໍກວດສະລິບຕາມ flow ເດີມ.
            </p>
          </div>
        </div>

        {savedOrder ? (
          <div className="flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-green-700 ring-1 ring-green-100" style={{ fontSize: "13px", fontWeight: 700 }}>
            <CheckCircle2 size={16} /> {savedOrder.orderNumber}
          </div>
        ) : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,.05)] ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-neutral-950" style={{ fontSize: "17px", fontWeight: 780 }}>ຊ່ອງທາງ ແລະ ລູກຄ້າ</h2>
                <p className="mt-1 text-neutral-500" style={{ fontSize: "12.5px" }}>ສາມາດເລືອກລູກຄ້າເກົ່າ ຫຼື ພິມລູກຄ້າໃໝ່ໄດ້.</p>
              </div>
              <div className="grid grid-cols-2 rounded-full bg-neutral-100 p-1">
                {(["chat", "walk-in"] as const).map((item) => (
                  <button
                    key={item}
                    onClick={() => setSource(item)}
                    className={`rounded-full px-4 py-2 transition ${source === item ? "bg-neutral-950 text-white shadow-[0_8px_20px_rgba(0,0,0,.16)]" : "text-neutral-500 hover:text-neutral-950"}`}
                    style={{ fontSize: "12.5px", fontWeight: 760 }}
                    type="button"
                  >
                    {item === "chat" ? "Chat" : "Walk-in"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>ເລືອກລູກຄ້າເກົ່າ</span>
                <select className={inputCls} value={customerId} onChange={(event) => selectCustomer(event.target.value)} style={{ fontSize: "13.5px" }}>
                  <option value="">ລູກຄ້າໃໝ່ ຫຼື ພິມເອງ</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} · {customer.phone || "-"}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>ຊື່ລູກຄ້າ *</span>
                <input className={inputCls} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="ຊື່ລູກຄ້າ" style={{ fontSize: "13.5px" }} />
              </label>
              <label className="space-y-1.5">
                <span className="text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>ເບີໂທ</span>
                <input className={inputCls} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="020..." style={{ fontSize: "13.5px" }} />
              </label>
              <label className="space-y-1.5">
                <span className="text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>Email</span>
                <input className={inputCls} value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} placeholder="customer@email.com" style={{ fontSize: "13.5px" }} />
              </label>
              <label className="space-y-1.5">
                <span className="text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>ທີ່ຢູ່ຈັດສົ່ງ</span>
                <input className={inputCls} value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} placeholder="ທີ່ຢູ່ ຫຼື ຈຸດນັດຮັບ" style={{ fontSize: "13.5px" }} />
              </label>
            </div>
          </section>

          <section className="rounded-[24px] bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,.05)] ring-1 ring-black/5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-neutral-950" style={{ fontSize: "17px", fontWeight: 780 }}>ສິນຄ້າໃນອໍເດີ</h2>
                <p className="mt-1 text-neutral-500" style={{ fontSize: "12.5px" }}>ສິນຄ້າຈະອ້າງອີງ variant ແລະ ສະຕັອກຈາກຫຼັງບ້ານ.</p>
              </div>
              <button
                onClick={() => setLines((items) => [...items, { id: lineId(), productId: "", variantId: "", quantity: 1 }])}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-neutral-950 transition hover:bg-neutral-50"
                style={{ fontSize: "13px", fontWeight: 760 }}
                type="button"
              >
                <Plus size={15} className="mr-1.5 inline" /> ເພີ່ມລາຍການ
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, index) => {
                const product = getProduct(line.productId);
                const variant = getVariant(line.productId, line.variantId);
                const variants = product?.variants.filter((item) => item.status === "active") ?? [];
                const stockWarning = Boolean(variant && line.quantity > variant.stock);

                return (
                  <div key={line.id} className={`rounded-[22px] p-3.5 ring-1 transition ${stockWarning ? "bg-red-50 ring-red-100" : "bg-neutral-50 ring-neutral-100"}`}>
                    <div className="grid gap-3 xl:grid-cols-[74px_1.25fr_1fr_100px_44px]">
                      <div className="flex h-[74px] w-[74px] items-center justify-center overflow-hidden rounded-[18px] bg-white ring-1 ring-black/5">
                        {product ? (
                          <img src={primaryImage(product)} alt={product.nameEn} className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-neutral-300" style={{ fontSize: "12px", fontWeight: 800 }}>{index + 1}</span>
                        )}
                      </div>

                      <label className="space-y-1.5">
                        <span className="text-neutral-500" style={{ fontSize: "12px", fontWeight: 650 }}>ສິນຄ້າ</span>
                        <select className={inputCls} value={line.productId} onChange={(event) => updateLine(line.id, { productId: event.target.value })} style={{ fontSize: "13px" }}>
                          <option value="">ເລືອກສິນຄ້າ</option>
                          {activeProducts.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.nameEn} · {item.sku}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-neutral-500" style={{ fontSize: "12px", fontWeight: 650 }}>ສີ / ໄຊສ໌</span>
                        <select
                          className={inputCls}
                          value={line.variantId}
                          onChange={(event) => updateLine(line.id, { variantId: event.target.value })}
                          disabled={!product}
                          style={{ fontSize: "13px" }}
                        >
                          <option value="">ເລືອກ variant</option>
                          {variants.map((item) => (
                            <option key={item.id} value={item.id}>
                              {variantLabel(item)} · ເຫຼືອ {item.stock}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="space-y-1.5">
                        <span className="text-neutral-500" style={{ fontSize: "12px", fontWeight: 650 }}>ຈຳນວນ</span>
                        <input
                          className={inputCls}
                          min={1}
                          type="number"
                          value={line.quantity}
                          onChange={(event) => updateLine(line.id, { quantity: Math.max(Number(event.target.value) || 1, 1) })}
                          style={{ fontSize: "13px" }}
                        />
                      </label>

                      <button
                        onClick={() => void removeLine(line.id)}
                        className="self-end rounded-[16px] p-3 text-red-500 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-30"
                        disabled={lines.length === 1}
                        type="button"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {variant ? (
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-neutral-500" style={{ fontSize: "12px" }}>
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-black/5">{variant.sku}</span>
                        <span className="rounded-full bg-white px-3 py-1 ring-1 ring-black/5">ລາຄາ {money(variant.salePrice)}</span>
                        <span className={`rounded-full px-3 py-1 ring-1 ${variant.stock > 0 ? "bg-white ring-black/5" : "bg-red-50 text-red-600 ring-red-100"}`}>
                          ສະຕັອກ {variant.stock}
                        </span>
                        <span className="ml-auto font-semibold text-neutral-950">{money(variant.salePrice * line.quantity)}</span>
                      </div>
                    ) : null}

                    {stockWarning ? (
                      <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white px-3 py-2 text-red-600 ring-1 ring-red-100" style={{ fontSize: "12.5px", fontWeight: 650 }}>
                        <AlertTriangle size={14} /> ຈຳນວນຫຼາຍກວ່າສະຕັອກທີ່ມີ.
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="sticky top-5 rounded-[26px] bg-neutral-950 p-5 text-white shadow-[0_18px_48px_rgba(0,0,0,.18)]">
            <h2 style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em" }}>ສະຫຼຸບອໍເດີ</h2>
            <p className="mt-1 text-neutral-400" style={{ fontSize: "12.5px" }}>
              ບັນທຶກແລ້ວອໍເດີຈະຢູ່ສະຖານະລໍສະລິບ.
            </p>

            <div className="mt-5 space-y-3">
              <label className="block space-y-1.5">
                <span className="text-neutral-400" style={{ fontSize: "12px", fontWeight: 650 }}>ວິທີຮັບເງິນ</span>
                <select
                  className="w-full rounded-[18px] border border-white/10 bg-white px-4 py-3 text-neutral-950 outline-none transition focus:ring-4 focus:ring-white/15"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  style={{ fontSize: "13.5px" }}
                >
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="cash">Cash</option>
                  <option value="qr_code">QR Code</option>
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="space-y-1.5">
                  <span className="text-neutral-400" style={{ fontSize: "12px", fontWeight: 650 }}>ຄ່າສົ່ງ</span>
                  <input className="w-full rounded-[18px] border border-white/10 bg-white px-4 py-3 text-neutral-950 outline-none focus:ring-4 focus:ring-white/15" inputMode="numeric" value={shippingFee} onChange={(event) => setShippingFee(Math.max(Number(event.target.value) || 0, 0))} style={{ fontSize: "13.5px" }} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-neutral-400" style={{ fontSize: "12px", fontWeight: 650 }}>ສ່ວນຫຼຸດ</span>
                  <input className="w-full rounded-[18px] border border-white/10 bg-white px-4 py-3 text-neutral-950 outline-none focus:ring-4 focus:ring-white/15" inputMode="numeric" value={discountTotal} onChange={(event) => setDiscountTotal(Math.max(Number(event.target.value) || 0, 0))} style={{ fontSize: "13.5px" }} />
                </label>
              </div>

              <label className="block space-y-1.5">
                <span className="text-neutral-400" style={{ fontSize: "12px", fontWeight: 650 }}>ໝາຍເຫດ</span>
                <textarea
                  className="w-full rounded-[18px] border border-white/10 bg-white px-4 py-3 text-neutral-950 outline-none transition placeholder:text-neutral-500 focus:ring-4 focus:ring-white/15"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="ໝາຍເຫດສຳລັບອໍເດີ..."
                  rows={3}
                  style={{ fontSize: "13.5px" }}
                />
              </label>
            </div>

            <div className="mt-5 space-y-2 border-t border-white/10 pt-5">
              <SummaryRow label="ລວມສິນຄ້າ" value={money(subtotal)} />
              <SummaryRow label="ຄ່າສົ່ງ" value={money(shippingFee)} />
              <SummaryRow label="ສ່ວນຫຼຸດ" value={`-${money(discountTotal)}`} muted />
              <div className="flex items-end justify-between pt-3">
                <span className="text-neutral-400" style={{ fontSize: "13px", fontWeight: 650 }}>ຍອດສຸດທິ</span>
                <strong className="text-white" style={{ fontSize: "30px", fontWeight: 860, letterSpacing: "-0.05em" }}>{money(total)}</strong>
              </div>
            </div>

            {hasStockWarning ? (
              <div className="mt-4 rounded-[18px] bg-red-500/10 p-3 text-red-200 ring-1 ring-red-500/20" style={{ fontSize: "12.5px" }}>
                ມີລາຍການທີ່ຈຳນວນເກີນສະຕັອກ.
              </div>
            ) : null}

            <button
              onClick={() => void submitOrder()}
              disabled={!canSave}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3.5 text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-45"
              style={{ fontSize: "14px", fontWeight: 820 }}
              type="button"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : null}
              ສ້າງອໍເດີ
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function variantLabel(variant: ProductVariant) {
  return variant.optionLabel || [variant.colorName, variant.sizeLabel].filter(Boolean).join(" / ") || variant.sku;
}

function SummaryRow({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? "text-neutral-500" : "text-neutral-300"}`} style={{ fontSize: "13px" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
