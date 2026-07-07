"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./AdminCustomersConsole.module.css";

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
  return `₭${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
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
    const activeCount = customers.filter((customer) => (customer.orders?.length ?? 0) > 0).length;
    const averageOrder = orderCount > 0 ? totalRevenue / orderCount : 0;

    return { vipCount, newCount, totalRevenue, averageOrder, activeCount };
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

  const filterOptions: Array<{ value: CustomerFilter; label: string; count: number }> = [
    { value: "all", label: "ທັງໝົດ", count: customers.length },
    { value: "vip", label: "VIP", count: stats.vipCount },
    { value: "new", label: "ລູກຄ້າໃໝ່", count: stats.newCount },
    { value: "active", label: "ມີອໍເດີ", count: stats.activeCount },
  ];

  return (
    <section className={styles.page}>
      <section className={styles.statGrid}>
        <article className={`${styles.statCard} ${styles.statCardLilac}`}>
          <span className={styles.statLabel}>ລູກຄ້າ VIP</span>
          <strong className={styles.statValue}>{stats.vipCount}</strong>
          <p className={styles.statNote}>ລູກຄ້າມູນຄ່າສູງ ຫຼື ຖືກຕັ້ງສະຖານະພິເສດ</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardPeach}`}>
          <span className={styles.statLabel}>ລູກຄ້າໃໝ່</span>
          <strong className={styles.statValue}>{stats.newCount}</strong>
          <p className={styles.statNote}>ນັບຈາກ 30 ມື້ຫຼ້າສຸດ</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardGreen}`}>
          <span className={styles.statLabel}>ລາຍຮັບລວມ</span>
          <strong className={styles.statValue}>{formatLak(stats.totalRevenue)}</strong>
          <p className={styles.statNote}>ຍອດຈາກລູກຄ້າທີ່ມີປະຫວັດການສັ່ງຊື້</p>
        </article>

        <article className={`${styles.statCard} ${styles.statCardSoft}`}>
          <span className={styles.statLabel}>ຄ່າສະເລ່ຍຕໍ່ອໍເດີ</span>
          <strong className={styles.statValue}>{formatLak(stats.averageOrder)}</strong>
          <p className={styles.statNote}>ໃຊ້ເບິ່ງກຳລັງຊື້ຂອງຖານລູກຄ້າ</p>
        </article>
      </section>

      <section className={styles.toolbar}>
        <label className={styles.searchBox}>
          <span>⌕</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ຄົ້ນຫາຊື່, ເບີໂທ, ອີເມວ..." />
        </label>

        <div className={styles.filters}>
          {filterOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={filter === option.value ? styles.filterActive : ""}
              onClick={() => setFilter(option.value)}
            >
              <span>{option.label}</span>
              <strong>{option.count}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.tableWrap}>
        <div className={`${styles.row} ${styles.headRow}`}>
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
            const customerState = vip ? "VIP" : isNewCustomer(customer) ? "ໃໝ່" : "ປົກກະຕິ";
            const badgeClass = vip ? styles.statusVip : isNewCustomer(customer) ? styles.statusNew : styles.statusNormal;

            return (
              <div className={styles.row} key={customer.id}>
                <div className={styles.personCell}>
                  <div className={styles.avatar}>{initials(customer.name)}</div>
                  <div className={styles.personCopy}>
                    <strong>{customer.name}</strong>
                    <small>ເຂົ້າລະບົບຕັ້ງແຕ່ {formatDate(customer.created_at)}</small>
                  </div>
                </div>

                <div className={styles.contactCell}>
                  <strong>{customer.phone ?? "-"}</strong>
                  <span>{customer.email ?? "ບໍ່ມີອີເມວ"}</span>
                  <small>{customer.default_address ?? "ຍັງບໍ່ມີທີ່ຢູ່"}</small>
                </div>

                <strong className={styles.money}>{formatLak(total)}</strong>
                <span className={styles.orderCount}>{orderCount}</span>
                <Link className={`${styles.statusBadge} ${badgeClass}`} href={`/admin/customers/${customer.id}`}>
                  {customerState}
                </Link>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <span className={styles.emptyBadge}>Customers</span>
            <strong>ບໍ່ພົບຂໍ້ມູນລູກຄ້າ</strong>
            <p>ລອງປ່ຽນຄຳຄົ້ນຫາ ຫຼື ສະຫຼັບຕົວກອງດ້ານເທິງ.</p>
          </div>
        )}
      </section>
    </section>
  );
}
