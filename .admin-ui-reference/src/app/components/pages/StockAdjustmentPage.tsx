import { useMemo, useState } from "react";
import { ArrowLeft, AlertTriangle, CheckCircle, PackageCheck } from "lucide-react";
import { useApp } from "../../context";
import { useAdminFeedback } from "../ui/AdminFeedback";
import type { ProductVariant, StockMovement } from "../../types";

const reasons = [
  { value: "new_stock", label: "ສິນຄ້າເຂົ້າໃໝ່" },
  { value: "stock_count", label: "ນັບສະຕັອກໃໝ່" },
  { value: "damaged", label: "ສິນຄ້າເສຍຫາຍ" },
  { value: "lost", label: "ສິນຄ້າຫາຍ" },
  { value: "giveaway", label: "ແຈກ / ໃຊ້ງານພາຍໃນ" },
  { value: "return", label: "ລູກຄ້າສົ່ງຄືນ" },
  { value: "manual", label: "ປັບແກ້ດ້ວຍມື" },
];

const inputCls =
  "w-full rounded-[18px] border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-950 shadow-[inset_0_1px_0_rgba(255,255,255,.75)] transition focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-950/5 disabled:cursor-not-allowed disabled:opacity-50";

type StockAdjustmentResult = {
  variant: ProductVariant;
  productStock: number;
  movement: StockMovement;
};

export function StockAdjustmentPage() {
  const { navigate, products, selectedId, upsertProduct, addStockMovement } = useApp();
  const feedback = useAdminFeedback();
  const [initialProductId = "", initialVariantId = ""] = (selectedId ?? "").split("::");
  const [productId, setProductId] = useState(initialProductId);
  const [variantId, setVariantId] = useState(initialVariantId);
  const [adjustType, setAdjustType] = useState<"increase" | "decrease" | "set">("increase");
  const [qty, setQty] = useState(0);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const product = products.find((item) => item.id === productId);
  const variant = product?.variants.find((item) => item.id === variantId);
  const currentStock = variant?.stock ?? 0;
  const stockAfter = adjustType === "increase" ? currentStock + qty : adjustType === "decrease" ? currentStock - qty : qty;
  const stockDelta = stockAfter - currentStock;
  const isNegative = stockAfter < 0;
  const canSubmit = Boolean(product && variant && qty > 0 && reason && !isNegative && !saving);

  const reasonLabel = useMemo(() => reasons.find((item) => item.value === reason)?.label ?? reason, [reason]);

  const applyAdjustment = async () => {
    if (!product || !variant || !canSubmit) {
      feedback.error("ປັບສະຕັອກບໍ່ສຳເລັດ", "ກະລຸນາເລືອກສິນຄ້າ, ສີ / ໄຊສ໌, ຈຳນວນ ແລະ ເຫດຜົນໃຫ້ຄົບ.");
      return;
    }

    const confirmed = await feedback.confirm({
      title: "ຢືນຢັນການປັບສະຕັອກ",
      description: `ຈາກ ${currentStock} ຊິ້ນ ເປັນ ${stockAfter} ຊິ້ນ (${stockDelta > 0 ? "+" : ""}${stockDelta})`,
      itemName: `${product.nameEn} · ${variant.colorName} / ${variant.sizeLabel}`,
      confirmLabel: "ບັນທຶກ",
      tone: "default",
    });

    if (!confirmed) return;

    setSaving(true);

    try {
      const response = await fetch("/api/admin/stock-adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id,
          adjustmentType: adjustType,
          quantity: qty,
          reason: reasonLabel,
        }),
      });
      const result = (await response.json().catch(() => ({}))) as Partial<StockAdjustmentResult> & { error?: string };

      if (!response.ok || !result.variant || !result.movement) {
        throw new Error(result.error || "Stock adjustment failed.");
      }

      const updatedVariants = product.variants.map((item) => (item.id === variant.id ? result.variant! : item));
      upsertProduct({
        ...product,
        variants: updatedVariants,
        stock: result.productStock ?? updatedVariants.reduce((sum, item) => sum + item.stock, 0),
      });
      addStockMovement(result.movement);
      setSaved(true);
      feedback.success("ປັບສະຕັອກສຳເລັດ", `${product.nameEn} · ${variant.colorName} / ${variant.sizeLabel}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stock adjustment failed.";
      feedback.error("ປັບສະຕັອກບໍ່ສຳເລັດ", message);
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-green-50 text-green-600 shadow-[0_10px_30px_rgba(34,197,94,.16)]">
          <CheckCircle size={28} />
        </div>
        <p className="text-neutral-950" style={{ fontWeight: 780, fontSize: "17px" }}>
          ປັບສະຕັອກສຳເລັດ
        </p>
        <div className="flex gap-2">
          <button className="rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-neutral-700 transition hover:bg-neutral-50" onClick={() => navigate("inventory")} style={{ fontSize: "13.5px", fontWeight: 700 }} type="button">
            ກັບໄປໜ້າສະຕັອກ
          </button>
          <button className="rounded-full bg-neutral-950 px-5 py-2.5 text-white transition hover:bg-neutral-800" onClick={() => navigate("stock-movement")} style={{ fontSize: "13.5px", fontWeight: 740 }} type="button">
            ເບິ່ງປະຫວັດ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] space-y-5 p-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("inventory")} className="rounded-full p-2 text-neutral-500 transition hover:bg-white hover:text-neutral-950 hover:shadow-[0_6px_18px_rgba(0,0,0,.06)]" type="button">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-neutral-950" style={{ fontWeight: 780, fontSize: "24px", letterSpacing: "-0.025em" }}>
            ປັບສະຕັອກ
          </h1>
          <p className="mt-0.5 text-neutral-500" style={{ fontSize: "13px" }}>
            ເລືອກສິນຄ້າ, ສີ / ໄຊສ໌ ແລະຈຳນວນທີ່ຕ້ອງການປັບ.
          </p>
        </div>
      </div>

      <div className="space-y-5 rounded-[24px] border border-neutral-100 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,.06)]">
        <div>
          <label className="mb-1.5 block text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 680 }}>
            ສິນຄ້າ <span className="text-red-500">*</span>
          </label>
          <select value={productId} onChange={(event) => { setProductId(event.target.value); setVariantId(""); }} className={inputCls} style={{ fontSize: "13.5px", fontWeight: 550 }}>
            <option value="">ເລືອກສິນຄ້າ</option>
            {products.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nameEn} ({item.sku})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 680 }}>
            ສີ / ໄຊສ໌ <span className="text-red-500">*</span>
          </label>
          <select value={variantId} onChange={(event) => setVariantId(event.target.value)} disabled={!productId} className={inputCls} style={{ fontSize: "13.5px", fontWeight: 550 }}>
            <option value="">ເລືອກສີ ແລະໄຊສ໌</option>
            {product?.variants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.colorName} / {item.sizeLabel} · {item.sku} · ສະຕັອກ {item.stock}
              </option>
            ))}
          </select>
        </div>

        {variant ? (
          <div className="flex items-center justify-between rounded-[24px] bg-neutral-950 p-5 text-white shadow-[0_18px_42px_rgba(0,0,0,.16)]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/10">
                <PackageCheck size={20} />
              </div>
              <div>
                <p className="text-neutral-400" style={{ fontSize: "12px" }}>
                  ສະຕັອກປັດຈຸບັນ
                </p>
                <p className="text-white" style={{ fontWeight: 800, fontSize: "34px", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  {currentStock}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-neutral-400" style={{ fontSize: "12px" }}>
                SKU
              </p>
              <p className="text-neutral-200" style={{ fontSize: "13px", fontWeight: 740 }}>
                {variant.sku}
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <label className="mb-2 block text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 680 }}>
            ປະເພດການປັບ
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: "increase" as const, l: "ເພີ່ມ", act: "border-green-500 bg-green-50 text-green-700" },
              { v: "decrease" as const, l: "ຫຼຸດ", act: "border-red-500 bg-red-50 text-red-700" },
              { v: "set" as const, l: "ຕັ້ງຄ່າ", act: "border-neutral-950 bg-neutral-950 text-white" },
            ].map((item) => (
              <button key={item.v} onClick={() => setAdjustType(item.v)} className={`rounded-full border py-3 transition ${adjustType === item.v ? item.act : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"}`} style={{ fontSize: "13.5px", fontWeight: 740 }} type="button">
                {item.l}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 680 }}>
            ຈຳນວນ <span className="text-red-500">*</span>
          </label>
          <input type="number" min={0} value={qty} onChange={(event) => setQty(parseInt(event.target.value) || 0)} className={inputCls} style={{ fontSize: "28px", fontWeight: 780 }} />
        </div>

        {variant && qty > 0 ? (
          <div className={`rounded-[22px] border p-4 ${isNegative ? "border-red-100 bg-red-50" : "border-green-100 bg-green-50"}`}>
            <p className="text-neutral-500" style={{ fontSize: "12px", fontWeight: 680 }}>
              ສະຕັອກຫຼັງປັບ
            </p>
            <p className={isNegative ? "text-red-600" : "text-green-700"} style={{ fontWeight: 800, fontSize: "32px", letterSpacing: "-0.03em" }}>
              {stockAfter}
            </p>
            {isNegative ? (
              <div className="mt-1 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-red-500" />
                <p className="text-red-600" style={{ fontSize: "12.5px" }}>
                  ບໍ່ສາມາດປັບໃຫ້ສະຕັອກຕິດລົບໄດ້
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        <div>
          <label className="mb-1.5 block text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 680 }}>
            ເຫດຜົນ <span className="text-red-500">*</span>
          </label>
          <select value={reason} onChange={(event) => setReason(event.target.value)} className={inputCls} style={{ fontSize: "13.5px", fontWeight: 550 }}>
            <option value="">ເລືອກເຫດຜົນ</option>
            {reasons.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate("inventory")} className="flex-1 rounded-full border border-neutral-200 bg-white py-3 text-neutral-700 transition hover:bg-neutral-50" style={{ fontSize: "14px", fontWeight: 700 }} type="button">
            ຍົກເລີກ
          </button>
          <button onClick={applyAdjustment} disabled={!canSubmit} className="flex-1 rounded-full bg-neutral-950 py-3 text-white shadow-[0_12px_30px_rgba(0,0,0,.14)] transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-45" style={{ fontSize: "14px", fontWeight: 780 }} type="button">
            {saving ? "ກຳລັງບັນທຶກ..." : "ປັບສະຕັອກ"}
          </button>
        </div>
      </div>
    </div>
  );
}
