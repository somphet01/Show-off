import { useMemo, useState } from "react";
import { CheckCircle, ChevronRight, Clock, PackageSearch, Plus, Search, Truck } from "lucide-react";
import { useApp } from "../../context";
import type { OrderChannel, PaymentStatus, ShippingStatus } from "../../types";

const paymentStatusLabel: Record<PaymentStatus, string> = {
  waiting_slip: "ລໍຖ້າສະລິບ",
  pending_review: "ລໍກວດສະລິບ",
  paid: "ຊຳລະແລ້ວ",
  rejected: "ປະຕິເສດ",
  cancelled: "ຍົກເລີກ",
};

const paymentStatusColor: Record<PaymentStatus, string> = {
  waiting_slip: "bg-neutral-100 text-neutral-600 ring-neutral-200",
  pending_review: "bg-amber-50 text-amber-700 ring-amber-100",
  paid: "bg-green-50 text-green-700 ring-green-100",
  rejected: "bg-red-50 text-red-600 ring-red-100",
  cancelled: "bg-neutral-100 text-neutral-500 ring-neutral-200",
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

const channelColor: Record<OrderChannel, string> = {
  web: "bg-blue-50 text-blue-700 ring-blue-100",
  chat: "bg-purple-50 text-purple-700 ring-purple-100",
  "walk-in": "bg-neutral-100 text-neutral-700 ring-neutral-200",
};

function money(value: number) {
  return `${Math.round(value || 0).toLocaleString("en-US")}K`;
}

function dateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("lo-LA", { day: "2-digit", month: "short", year: "numeric" });
}

export function OrdersListPage() {
  const { navigate, orders } = useApp();
  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState<OrderChannel | "all">("all");
  const [filterPayment, setFilterPayment] = useState<PaymentStatus | "all">("all");
  const [filterShipping, setFilterShipping] = useState<ShippingStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesSearch =
        !q ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.customerName.toLowerCase().includes(q) ||
        order.customerPhone.includes(q);

      return (
        matchesSearch &&
        (filterChannel === "all" || order.channel === filterChannel) &&
        (filterPayment === "all" || order.paymentStatus === filterPayment) &&
        (filterShipping === "all" || order.shippingStatus === filterShipping)
      );
    });
  }, [filterChannel, filterPayment, filterShipping, orders, search]);

  const pendingSlips = orders.filter((order) => order.paymentStatus === "pending_review").length;
  const pendingShip = orders.filter((order) => order.paymentStatus === "paid" && order.shippingStatus === "not_shipped").length;
  const todayOrders = orders.filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString()).length;

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-neutral-950" style={{ fontWeight: 820, fontSize: "26px", letterSpacing: "-0.035em" }}>
            ອໍເດີ
          </h1>
          <p className="mt-1 text-neutral-500" style={{ fontSize: "13px" }}>
            ກວດສະລິບ, ຕິດຕາມການຈັດສົ່ງ ແລະ ສ້າງອໍເດີຈາກຫຼັງບ້ານ.
          </p>
        </div>
        <button
          onClick={() => navigate("create-order")}
          className="flex items-center gap-2 rounded-full bg-neutral-950 px-5 py-3 text-white shadow-[0_12px_30px_rgba(0,0,0,.14)] transition hover:bg-neutral-800"
          style={{ fontSize: "13.5px", fontWeight: 760 }}
          type="button"
        >
          <Plus size={15} /> ສ້າງອໍເດີ
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryCard dark label="ອໍເດີທັງໝົດ" value={orders.length} sub={`ມື້ນີ້ ${todayOrders} ອໍເດີ`} />
        <SummaryCard icon={<Clock size={20} />} label="ລໍກວດສະລິບ" value={pendingSlips} iconClass="bg-amber-50 text-amber-600" />
        <SummaryCard icon={<Truck size={20} />} label="ລໍຈັດສົ່ງ" value={pendingShip} iconClass="bg-blue-50 text-blue-600" />
      </div>

      <div className="rounded-[24px] border border-neutral-100 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
        <div className="relative">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ຄົ້ນຫາເລກອໍເດີ, ຊື່ລູກຄ້າ ຫຼື ເບີໂທ..."
            className="w-full rounded-full border border-neutral-200 bg-neutral-50 py-3 pl-11 pr-4 text-neutral-950 transition placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-neutral-950/5"
            style={{ fontSize: "13.5px" }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterSelect
            value={filterChannel}
            onChange={(value) => setFilterChannel(value as OrderChannel | "all")}
            options={[
              ["all", "ທຸກຊ່ອງທາງ"],
              ["web", "Web"],
              ["chat", "Chat"],
              ["walk-in", "Walk-in"],
            ]}
          />
          <FilterSelect
            value={filterPayment}
            onChange={(value) => setFilterPayment(value as PaymentStatus | "all")}
            options={[
              ["all", "ສະຖານະຊຳລະ"],
              ["waiting_slip", "ລໍຖ້າສະລິບ"],
              ["pending_review", "ລໍກວດ"],
              ["paid", "ຊຳລະແລ້ວ"],
              ["rejected", "ປະຕິເສດ"],
            ]}
          />
          <FilterSelect
            value={filterShipping}
            onChange={(value) => setFilterShipping(value as ShippingStatus | "all")}
            options={[
              ["all", "ສະຖານະສົ່ງ"],
              ["not_shipped", "ຍັງບໍ່ສົ່ງ"],
              ["shipping", "ກຳລັງສົ່ງ"],
              ["delivered", "ສົ່ງແລ້ວ"],
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-neutral-100 bg-white shadow-[0_18px_55px_rgba(15,23,42,.06)]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-neutral-50 text-neutral-400"><PackageSearch size={24} /></div>
            <p className="mt-4 text-neutral-950" style={{ fontSize: "14px", fontWeight: 760 }}>ບໍ່ພົບອໍເດີ</p>
            <p className="mt-1 text-neutral-500" style={{ fontSize: "13px" }}>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ຕົວກອງ.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/80">
                  {["ເລກອໍເດີ", "ລູກຄ້າ", "ຊ່ອງທາງ", "ຍອດລວມ", "ຊຳລະ", "ຈັດສົ່ງ", "ວັນທີ", ""].map((head) => (
                    <th key={head} className="px-5 py-3 text-left text-neutral-400" style={{ fontSize: "11.5px", fontWeight: 680 }}>
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map((order) => (
                  <tr key={order.id} className="cursor-pointer transition hover:bg-neutral-50/70" onClick={() => navigate("order-detail", order.id)}>
                    <td className="px-5 py-4"><span className="font-mono text-neutral-950" style={{ fontSize: "13px", fontWeight: 700 }}>{order.orderNumber}</span></td>
                    <td className="px-5 py-4"><p className="max-w-[180px] truncate text-neutral-900" style={{ fontSize: "13px", fontWeight: 720 }}>{order.customerName}</p><p className="text-neutral-400" style={{ fontSize: "11.5px" }}>{order.customerPhone}</p></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 ring-1 ${channelColor[order.channel]}`} style={{ fontSize: "11.5px", fontWeight: 720 }}>{order.channel}</span></td>
                    <td className="px-5 py-4"><p className="text-neutral-950" style={{ fontSize: "13px", fontWeight: 760 }}>{money(order.totalAmount)}</p>{order.paymentCurrency === "THB" ? <p className="text-neutral-400" style={{ fontSize: "11px" }}>≈ {order.paymentAmount?.toLocaleString()} THB</p> : null}</td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 ring-1 ${paymentStatusColor[order.paymentStatus]}`} style={{ fontSize: "11.5px", fontWeight: 720 }}>{paymentStatusLabel[order.paymentStatus]}</span></td>
                    <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 ring-1 ${shippingStatusColor[order.shippingStatus]}`} style={{ fontSize: "11.5px", fontWeight: 720 }}>{shippingStatusLabel[order.shippingStatus]}</span></td>
                    <td className="px-5 py-4"><p className="text-neutral-400" style={{ fontSize: "12px" }}>{dateLabel(order.createdAt)}</p></td>
                    <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {order.paymentStatus === "pending_review" ? <CheckCircle size={15} className="text-green-600" /> : null}
                        {order.paymentStatus === "paid" && order.shippingStatus === "not_shipped" ? <Truck size={15} className="text-blue-500" /> : null}
                        <ChevronRight size={15} className="text-neutral-300" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-right text-neutral-400" style={{ fontSize: "12px" }}>ສະແດງ {filtered.length} ຈາກ {orders.length} ອໍເດີ</p>
    </div>
  );
}

function SummaryCard({
  dark = false,
  label,
  value,
  sub,
  icon,
  iconClass,
}: {
  dark?: boolean;
  label: string;
  value: number;
  sub?: string;
  icon?: React.ReactNode;
  iconClass?: string;
}) {
  if (dark) {
    return (
      <div className="rounded-[24px] bg-neutral-950 p-5 text-white shadow-[0_18px_45px_rgba(0,0,0,.16)]">
        <p className="text-neutral-400" style={{ fontSize: "12.5px", fontWeight: 650 }}>{label}</p>
        <p className="mt-3" style={{ fontSize: "34px", fontWeight: 820, letterSpacing: "-0.04em" }}>{value}</p>
        {sub ? <p className="mt-1 text-neutral-400" style={{ fontSize: "12px" }}>{sub}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-[24px] border border-neutral-100 bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,.06)]">
      <div className={`flex h-11 w-11 items-center justify-center rounded-[18px] ${iconClass}`}>{icon}</div>
      <p className="mt-6 text-neutral-500" style={{ fontSize: "12.5px", fontWeight: 650 }}>{label}</p>
      <p className="mt-1 text-neutral-950" style={{ fontSize: "34px", fontWeight: 820, letterSpacing: "-0.04em" }}>{value}</p>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-neutral-700 transition focus:outline-none focus:ring-4 focus:ring-neutral-950/5"
      style={{ fontSize: "12.5px", fontWeight: 650 }}
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>{label}</option>
      ))}
    </select>
  );
}
