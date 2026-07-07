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
  return `₭${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value)}`;
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
      .select("id,order_no,source,chat_channel,status,shipping_status,final_amount,total_amount,created_at,customers(name)")
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
    .select("id,sku,name_en,name_lo,slug,sale_price,cost_price,stock_qty,min_stock_qty,status,description_en,description_lo,created_at,categories(name_en),product_images(id,bucket,path,alt_text,sort_order,is_primary),product_variants(id,sku,size_label,color_name,color_hex,option_label,sale_price,cost_price,stock_qty,min_stock_qty,status)")
    .order("created_at", { ascending: false })
    .limit(50);

  return {
    products: error ? [] : data ?? [],
  };
}

export async function getAdminInventoryMovements() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("inventory_movements")
    .select("id,product_id,product_variant_id,movement_type,quantity_delta,stock_after,reference_type,reference_id,note,created_by,created_at")
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    console.error("Admin inventory movements failed", error);
    return { movements: [] };
  }

  const movements = data ?? [];
  const productIds = [...new Set(movements.map((item) => item.product_id).filter(Boolean))];
  const variantIds = [...new Set(movements.map((item) => item.product_variant_id).filter(Boolean))];
  const profileIds = [...new Set(movements.map((item) => item.created_by).filter(Boolean))];

  const [productsResult, variantsResult, profilesResult] = await Promise.all([
    productIds.length
      ? supabase.from("products").select("id,sku,name_en,name_lo").in("id", productIds)
      : Promise.resolve({ data: [], error: null }),
    variantIds.length
      ? supabase.from("product_variants").select("id,sku,color_name,size_label,option_label").in("id", variantIds)
      : Promise.resolve({ data: [], error: null }),
    profileIds.length
      ? supabase.from("profiles").select("id,display_name,email").in("id", profileIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsResult.error) console.error("Admin inventory movement products failed", productsResult.error);
  if (variantsResult.error) console.error("Admin inventory movement variants failed", variantsResult.error);
  if (profilesResult.error) console.error("Admin inventory movement profiles failed", profilesResult.error);

  const productsById = new Map((productsResult.data ?? []).map((item: any) => [item.id, item]));
  const variantsById = new Map((variantsResult.data ?? []).map((item: any) => [item.id, item]));
  const profilesById = new Map((profilesResult.data ?? []).map((item: any) => [item.id, item]));

  return {
    movements: movements.map((item: any) => ({
      ...item,
      products: productsById.get(item.product_id) ?? null,
      product_variants: item.product_variant_id ? variantsById.get(item.product_variant_id) ?? null : null,
      profiles: item.created_by ? profilesById.get(item.created_by) ?? null : null,
    })),
  };
}

export async function getAdminOrders() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id,order_no,source,chat_channel,status,shipping_status,payment_status,fulfillment_status,shipping_address,final_amount,total_amount,created_at,customers(name,phone,email),payments(id,status,amount,payment_method),shipments(tracking_number,carrier,status,document_images),order_items(id,sku_snapshot,product_name_snapshot,variant_label_snapshot,quantity,unit_price,line_total),payment_slips(id,bucket,path,amount,status,created_at,reject_reason)",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return { orders: [] };
  }

  const ordersWithSignedSlips = await Promise.all(
    (data ?? []).map(async (order) => {
      const slips = Array.isArray(order.payment_slips) ? order.payment_slips : [];
      const signedSlips = await Promise.all(
        slips.map(async (slip) => {
          const { data: signedUrl } = await supabase.storage.from(slip.bucket || "payment-slips").createSignedUrl(slip.path, 60 * 10);

          return {
            ...slip,
            signedUrl: signedUrl?.signedUrl ?? null,
          };
        }),
      );

      return {
        ...order,
        payment_slips: signedSlips,
      };
    }),
  );

  return {
    orders: ordersWithSignedSlips,
  };
}

export async function getAdminCustomers() {
  const supabase = await createSupabaseServerClient();

  const { data: customers, error } = await supabase
    .from("customers")
    .select("id,name,phone,email,default_address,customer_type,is_vip_manual,vip_flag,created_at")
    .order("created_at", { ascending: false })
    .limit(80);

  if (error || !customers?.length) {
    return { customers: [] };
  }

  const customerIds = customers.map((customer) => customer.id);
  const { data: orders } = await supabase
    .from("orders")
    .select("id,customer_id,status,final_amount,total_amount,created_at")
    .in("customer_id", customerIds)
    .order("created_at", { ascending: false });

  const ordersByCustomer = new Map<string, typeof orders>();
  for (const order of orders ?? []) {
    const key = order.customer_id;
    ordersByCustomer.set(key, [...(ordersByCustomer.get(key) ?? []), order]);
  }

  return {
    customers: customers.map((customer) => ({
      ...customer,
      orders: ordersByCustomer.get(customer.id) ?? [],
    })),
  };
}
