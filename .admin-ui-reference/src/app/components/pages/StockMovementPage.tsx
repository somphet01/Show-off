import { useMemo, useState } from "react";
import { ArrowLeft, History, PackageSearch, TrendingDown, TrendingUp } from "lucide-react";
import { useApp } from "../../context";
import type { StockMovementType } from "../../types";

const typeLabel: Record<StockMovementType, string> = {
  order_paid: "ອໍເດີຊຳລະແລ້ວ",
  po_received: "ຮັບສິນຄ້າ PO",
  manual_adjustment: "ປັບສະຕັອກ",
  order_cancelled: "ຍົກເລີກອໍເດີ",
};

const typeColor: Record<StockMovementType, string> = {
  order_paid: "bg-red-50 text-red-700 ring-red-100",
  po_received: "bg-green-50 text-green-700 ring-green-100",
  manual_adjustment: "bg-amber-50 text-amber-700 ring-amber-100",
  order_cancelled: "bg-blue-50 text-blue-700 ring-blue-100",
};

const filters = [
  { v: "all" as const, l: "ທັງໝົດ" },
  { v: "manual_adjustment" as const, l: "ປັບສະຕັອກ" },
  { v: "order_paid" as const, l: "ອໍເດີຊຳລະ" },
  { v: "po_received" as const, l: "ຮັບ PO" },
  { v: "order_cancelled" as const, l: "ຍົກເລີກ" },
];

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("lo-LA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StockMovementPage() {
  const { navigate, stockMovements } = useApp();
  const [filterType, setFilterType] = useState<StockMovementType | "all">("all");
  const filtered = useMemo(() => stockMovements.filter((item) => filterType === "all" || item.type === filterType), [filterType, stockMovements]);
  const totalIncrease = stockMovements.filter((item) => item.quantityDelta > 0).reduce((sum, item) => sum + item.quantityDelta, 0);
  const totalDecrease = Math.abs(stockMovements.filter((item) => item.quantityDelta < 0).reduce((sum, item) => sum + item.quantityDelta, 0));

  return (
    <div className="mx-auto max-w-[1180px] space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("inventory")} className="rounded-full p-2 text-neutral-500 transition hover:bg-white hover:text-neutral-950 hover:shadow-[0_6px_18px_rgba(0,0,0,.06)]" type="button">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-neutral-950" style={{ fontWeight: 780, fontSize: "24px", letterSpacing: "-0.025em" }}>
              ປະຫວັດສະຕັອກ
            </h1>
            <p className="mt-0.5 text-neutral-500" style={{ fontSize: "13px" }}>
              ຕິດຕາມການເພີ່ມ, ຫຼຸດ, ຕັ້ງຄ່າ ແລະການຕັດສະຕັອກຈາກອໍເດີ.
            </p>
          </div>
        </div>
        <button onClick={() => navigate("stock-adjustment")} className="rounded-full bg-neutral-950 px-5 py-3 text-white shadow-[0_12px_30px_rgba(0,0,0,.14)] transition hover:bg-neutral-800" style={{ fontSize: "13.5px", fontWeight: 760 }} type="button">
          ປັບສະຕັອກ
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-[24px] bg-neutral-950 p-5 text-white shadow-[0_18px_45px_rgba(0,0,0,.16)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-white/10">
            <History size={20} />
          </div>
          <p className="mt-6 text-neutral-400" style={{ fontSize: "12.5px", fontWeight: 650 }}>
            ລາຍການທັງໝົດ
          </p>
          <p className="mt-1" style={{ fontSize: "34px", fontWeight: 820, letterSpacing: "-0.04em" }}>
            {stockMovements.length}
          </p>
        </div>
        <div className="rounded-[24px] border border-neutral-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-green-50 text-green-600">
            <TrendingUp size={20} />
          </div>
          <p className="mt-6 text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>
            ເພີ່ມເຂົ້າ
          </p>
          <p className="mt-1 text-neutral-950" style={{ fontSize: "34px", fontWeight: 820, letterSpacing: "-0.04em" }}>
            {totalIncrease}
          </p>
        </div>
        <div className="rounded-[24px] border border-neutral-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
          <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-red-50 text-red-600">
            <TrendingDown size={20} />
          </div>
          <p className="mt-6 text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>
            ອອກຈາກສະຕັອກ
          </p>
          <p className="mt-1 text-neutral-950" style={{ fontSize: "34px", fontWeight: 820, letterSpacing: "-0.04em" }}>
            {totalDecrease}
          </p>
        </div>
      </div>

      <div className="rounded-[24px] border border-neutral-100 bg-white p-3 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button key={filter.v} onClick={() => setFilterType(filter.v)} className={`rounded-full px-4 py-2.5 transition ${filterType === filter.v ? "bg-neutral-950 text-white shadow-[0_8px_20px_rgba(0,0,0,.12)]" : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-950"}`} style={{ fontSize: "12.5px", fontWeight: 720 }} type="button">
              {filter.l}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-neutral-100 bg-white shadow-[0_18px_55px_rgba(15,23,42,.06)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80">
                {["ປະເພດ", "ສິນຄ້າ / SKU", "ສີ / ໄຊສ໌", "ຈຳນວນ", "ສະຕັອກຫຼັງ", "ອ້າງອີງ", "ໝາຍເຫດ", "ໂດຍ", "ເວລາ"].map((head) => (
                  <th key={head} className="px-5 py-3 text-left text-neutral-400" style={{ fontSize: "11.5px", fontWeight: 680 }}>
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {filtered.map((movement) => (
                <tr key={movement.id} className="transition hover:bg-neutral-50/70">
                  <td className="px-5 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 ring-1 ${typeColor[movement.type]}`} style={{ fontSize: "11.5px", fontWeight: 740 }}>
                      {typeLabel[movement.type]}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="max-w-[220px] truncate text-neutral-900" style={{ fontSize: "13px", fontWeight: 720 }}>
                      {movement.productName}
                    </p>
                    <p className="mt-0.5 font-mono text-neutral-400" style={{ fontSize: "11.5px" }}>
                      {movement.sku}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-neutral-700" style={{ fontSize: "13px", fontWeight: 650 }}>
                      {movement.variant}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      {movement.quantityDelta >= 0 ? <TrendingUp size={14} className="text-green-500" /> : <TrendingDown size={14} className="text-red-500" />}
                      <span className={movement.quantityDelta >= 0 ? "text-green-600" : "text-red-600"} style={{ fontSize: "14px", fontWeight: 800 }}>
                        {movement.quantityDelta > 0 ? "+" : ""}
                        {movement.quantityDelta}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-neutral-950" style={{ fontSize: "13px", fontWeight: 760 }}>
                      {movement.stockAfter}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-neutral-500" style={{ fontSize: "12px" }}>
                      {movement.referenceId || "MANUAL"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="line-clamp-1 max-w-[180px] text-neutral-500" style={{ fontSize: "12.5px" }}>
                      {movement.note ?? "—"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-neutral-600" style={{ fontSize: "12.5px", fontWeight: 650 }}>
                      {movement.createdBy}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="whitespace-nowrap text-neutral-400" style={{ fontSize: "12px" }}>
                      {formatDate(movement.createdAt)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-neutral-50 text-neutral-400">
              <PackageSearch size={24} />
            </div>
            <p className="mt-4 text-neutral-950" style={{ fontSize: "14px", fontWeight: 760 }}>
              ຍັງບໍ່ມີປະຫວັດສະຕັອກ
            </p>
            <p className="mt-1 text-neutral-500" style={{ fontSize: "13px" }}>
              ເມື່ອມີການປັບສະຕັອກ ຫຼືມີອໍເດີ, ປະຫວັດຈະສະແດງຢູ່ນີ້.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
