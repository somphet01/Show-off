import { createSupabaseServerClient } from "../supabase/server";

type CountResult = {
  count: number | null;
  error: unknown;
};

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

export function formatLak(value: number) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)} LAK`;
}

function sumAmount(rows: Array<Record<string, unknown>>, keys: string[]) {
  return rows.reduce((total, row) => {
    const value = keys.map((key) => row[key]).find((item) => typeof item === "number");
    return total + (typeof value === "number" ? value : 0);
  }, 0);
}

async function safeCount(query: PromiseLike<CountResult>) {
  const result = await query;
  return result.error ? 0 : result.count ?? 0;
}

export async function getDashboardData() {
  const supabase = await createSupabaseServerClient();
  const { start, end } = todayRange();

  const [
    paidOrdersResult,
    expensesResult,
    newOrdersToday,
    pendingSlipCount,
    newCustomersToday,
    lowStockVariantsResult,
    latestOrdersResult,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("final_amount,total_amount")
      .eq("status", "paid")
      .gte("created_at", start)
      .lt("created_at", end),
    supabase.from("expenses").select("amount").gte("expense_date", start.slice(0, 10)).lt("expense_date", end.slice(0, 10)),
    safeCount(
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lt("created_at", end),
    ),
    safeCount(supabase.from("payment_slips").select("id", { count: "exact", head: true }).eq("status", "pending")),
    safeCount(
      supabase
        .from("customers")
        .select("id", { count: "exact", head: true })
        .gte("created_at", start)
        .lt("created_at", end),
    ),
    supabase.from("product_variants").select("id,stock_qty,min_stock_qty,status").eq("status", "active"),
    supabase
      .from("orders")
      .select("order_no,source,status,shipping_status,final_amount,total_amount,created_at,customers(name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const revenueToday = paidOrdersResult.error ? 0 : sumAmount(paidOrdersResult.data ?? [], ["final_amount", "total_amount"]);
  const expensesToday = expensesResult.error ? 0 : sumAmount(expensesResult.data ?? [], ["amount"]);
  const lowStockCount = lowStockVariantsResult.error
    ? 0
    : (lowStockVariantsResult.data ?? []).filter((variant) => variant.stock_qty <= variant.min_stock_qty).length;

  return {
    summary: {
      revenueToday,
      expensesToday,
      profitToday: revenueToday - expensesToday,
      newOrdersToday,
    },
    alerts: {
      lowStockCount,
      pendingSlipCount,
      newCustomersToday,
    },
    latestOrders: latestOrdersResult.error ? [] : latestOrdersResult.data ?? [],
  };
}

export async function getAdminProducts() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("products")
    .select("id,sku,name_en,name_lo,slug,sale_price,cost_price,stock_qty,status,created_at,categories(name_en),product_variants(id,sku,size_label,color_name,stock_qty,status)")
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    products: error ? [] : data ?? [],
  };
}

export async function getAdminOrders() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id,order_no,source,status,shipping_status,final_amount,total_amount,created_at,customers(name,phone),payments(status),shipments(tracking_number,carrier,status)")
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    orders: error ? [] : data ?? [],
  };
}
