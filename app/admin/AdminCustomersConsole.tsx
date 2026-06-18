"use client";

import { useMemo, useState } from "react";

type CustomerOrder = {
  id: string;
  status?: string | null;
  final_amount?: number | null;
  total_amount?: number | null;
  created_at?: string | null;
};

type AdminCustomer = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  default_address?: string | null;
  customer_type?: string | null;
  is_vip_manual?: boolean | null;
  vip_flag?: boolean | null;
  created_at: string;
  orders?: CustomerOrder[] | null;
};

type CustomerFilter = "all" | "vip" | "new" | "active";

function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return (words[0]?.[0] ?? "S").concat(words[1]?.[0] ?? "O").toUpperCase();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("lo-LA", { dateStyle: "medium" }).format(new Date(value));
}

function formatLak(value: number) {
  return `฿${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
}

function getCustomerTotal(customer: AdminCustomer) {
  return (customer.orders ?? []).reduce((total, order) => total + (order.final_amount || order.total_amount || 0), 0);
}

function isVip(customer: AdminCustomer) {
  return customer.customer_type === "vip" || Boolean(customer.is_vip_manual || customer.vip_flag) || getCustomerTotal(customer) >= 5_000_000;
}

function isNewCustomer(customer: AdminCustomer) {
  const created = new Date(customer.created_at).getTime();
  const thirtyDays = 1000 * 60 * 60 * 24 * 30;
  return Date.now() - created <= thirtyDays;
}

export function AdminCustomersConsole({ customers }: { customers: AdminCustomer[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");

  const stats = useMemo(() => {
    const vipCount = customers.filter(isVip).length;
    const newCount = customers.filter(isNewCustomer).length;
    const totalRevenue = customers.reduce((total, customer) => total + getCustomerTotal(customer), 0);
    const orderCount = customers.reduce((total, customer) => total + (customer.orders?.length ?? 0), 0);
    const averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

    return { vipCount, newCount, totalRevenue, averageOrder };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return customers.filter((customer) => {
      const haystack = [customer.name, customer.phone, customer.email, customer.default_address].filter(Boolean).join(" ").toLowerCase();
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery);
      const matchesFilter =
        filter === "all" ||
        (filter === "vip" && isVip(customer)) ||
        (filter === "new" && isNewCustomer(customer)) ||
        (filter === "active" && (customer.orders?.length ?? 0) > 0);

      return matchesQuery && matchesFilter;
    });
  }, [customers, filter, query]);

  return (
    <section className="admin-customers-v2">
      <div className="admin-customers-toolbar">
        <label className="admin-customers-search">
          <span aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ຄົ້ນຫາຊື່, ເບີໂທ, ອີເມວ" />
        </label>
        <div className="admin-customers-filter" aria-label="ກອງລູກຄ້າ">
          {[
            ["all", "ທັງໝົດ", customers.length],
            ["vip", "VIP", stats.vipCount],
            ["new", "ລູກຄ້າໃໝ່", stats.newCount],
            ["active", "ມີອໍເດີ", customers.filter((customer) => (customer.orders?.length ?? 0) > 0).length],
          ].map(([value, label, count]) => (
            <button className={filter === value ? "is-active" : ""} key={value} type="button" onClick={() => setFilter(value as CustomerFilter)}>
              {label}
              <strong>{count}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="admin-customers-table-card">
        <div className="admin-customers-row is-head">
          <span>ລູກຄ້າ</span>
          <span>ຕິດຕໍ່</span>
          <span>ຍອດຊື້</span>
          <span>ອໍເດີ</span>
          <span>ສະຖານະ</span>
        </div>
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => {
            const orderCount = customer.orders?.length ?? 0;
            const total = getCustomerTotal(customer);
            const vip = isVip(customer);

            return (
              <div className="admin-customers-row" key={customer.id}>
                <div className="admin-customers-person">
                  <span>{initials(customer.name)}</span>
                  <div>
                    <strong>{customer.name}</strong>
                    <small>ເປັນລູກຄ້າຕັ້ງແຕ່ {formatDate(customer.created_at)}</small>
                  </div>
                </div>
                <div className="admin-customers-contact">
                  <strong>{customer.phone ?? "-"}</strong>
                  <span>{customer.email ?? "ບໍ່ມີອີເມວ"}</span>
                  <small>{customer.default_address ?? "ຍັງບໍ່ມີທີ່ຢູ່"}</small>
                </div>
                <strong className="admin-customers-money">{formatLak(total)}</strong>
                <span className="admin-customers-order-count">{orderCount}</span>
                <span className={`admin-customers-status${vip ? " is-vip" : ""}`}>{vip ? "VIP" : isNewCustomer(customer) ? "ໃໝ່" : "ປົກກະຕິ"}</span>
              </div>
            );
          })
        ) : (
          <div className="admin-customers-empty">
            <strong>ບໍ່ພົບລູກຄ້າ</strong>
            <p>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ຕົວກອງດ້ານເທິງ.</p>
          </div>
        )}
      </div>

      <div className="admin-customers-stats">
        <article>
          <span>ຍອດຈາກລູກຄ້າ</span>
          <strong>{formatLak(stats.totalRevenue)}</strong>
          <em>ຈາກລູກຄ້າທີ່ມີອໍເດີ</em>
        </article>
        <article>
          <span>VIP</span>
          <strong>{stats.vipCount}</strong>
          <em>ລູກຄ້າມູນຄ່າສູງ</em>
        </article>
        <article>
          <span>ລູກຄ້າໃໝ່</span>
          <strong>{stats.newCount}</strong>
          <em>30 ມື້ຫຼ້າສຸດ</em>
        </article>
        <article>
          <span>ມູນຄ່າສະເລ່ຍ</span>
          <strong>{formatLak(stats.averageOrder)}</strong>
          <em>ຕໍ່ອໍເດີ</em>
        </article>
      </div>
    </section>
  );
}
