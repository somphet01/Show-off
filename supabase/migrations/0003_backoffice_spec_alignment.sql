create type public.order_status as enum ('pending', 'awaiting_payment_slip', 'awaiting_confirmation', 'paid', 'cancelled');
create type public.payment_record_status as enum ('pending', 'verified', 'rejected');
create type public.shipment_status as enum ('not_shipped', 'shipping', 'delivered');

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  size_label text,
  color_name text,
  color_hex text,
  option_label text,
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  cost_price numeric(12,2) check (cost_price is null or cost_price >= 0),
  stock_qty integer not null default 0,
  min_stock_qty integer not null default 5 check (min_stock_qty >= 0),
  status public.product_status not null default 'active',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  full_name text not null,
  phone text,
  address_line1 text not null,
  address_line2 text,
  district text,
  province text,
  postal_code text,
  country text not null default 'LA',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers
  add column if not exists default_address_id uuid references public.customer_addresses(id) on delete set null,
  add column if not exists vip_flag boolean not null default false;

alter table public.orders
  add column if not exists status public.order_status not null default 'awaiting_payment_slip',
  add column if not exists shipping_status public.shipment_status not null default 'not_shipped',
  add column if not exists order_date timestamptz not null default now(),
  add column if not exists final_amount numeric(12,2) not null default 0,
  add column if not exists shipping_address_id uuid references public.customer_addresses(id) on delete set null;

update public.orders
set final_amount = total_amount
where final_amount = 0 and total_amount > 0;

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  payment_method text not null default 'bank_transfer',
  status public.payment_record_status not null default 'pending',
  paid_at timestamptz,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payment_slips
  add column if not exists payment_id uuid references public.payments(id) on delete cascade;

create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete cascade,
  status public.shipment_status not null default 'not_shipped',
  tracking_number text,
  carrier text,
  shipped_at timestamptz,
  delivered_at timestamptz,
  bucket text,
  path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.login_sessions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete cascade,
  session_token_hash text,
  ip_address inet,
  user_agent text,
  login_at timestamptz not null default now(),
  logout_at timestamptz
);

alter table public.order_items
  add column if not exists product_variant_id uuid references public.product_variants(id) on delete restrict,
  add column if not exists variant_label_snapshot text;

alter table public.purchase_order_items
  add column if not exists product_variant_id uuid references public.product_variants(id) on delete restrict;

alter table public.inventory_movements
  add column if not exists product_variant_id uuid references public.product_variants(id) on delete restrict;

alter table public.expenses
  add column if not exists related_purchase_order_id uuid references public.purchase_orders(id) on delete set null;

alter table public.purchase_orders
  add column if not exists other_cost numeric(12,2) not null default 0,
  add column if not exists note text;

alter table public.store_settings
  add column if not exists contact_email text,
  add column if not exists bank_note text,
  add column if not exists notification_note text,
  add column if not exists backup_note text;

create index product_variants_product_sort_idx on public.product_variants (product_id, sort_order);
create index product_variants_status_stock_idx on public.product_variants (status, stock_qty, min_stock_qty);
create index customer_addresses_customer_idx on public.customer_addresses (customer_id);
create index orders_status_shipping_created_idx on public.orders (status, shipping_status, created_at desc);
create index orders_address_idx on public.orders (shipping_address_id);
create index order_items_variant_idx on public.order_items (product_variant_id);
create index payments_order_status_idx on public.payments (order_id, status);
create index payment_slips_payment_idx on public.payment_slips (payment_id);
create index shipments_order_status_idx on public.shipments (order_id, status);
create index login_sessions_profile_login_idx on public.login_sessions (profile_id, login_at desc);
create index login_sessions_customer_login_idx on public.login_sessions (customer_id, login_at desc);
create index purchase_order_items_variant_idx on public.purchase_order_items (product_variant_id);
create index inventory_movements_variant_created_idx on public.inventory_movements (product_variant_id, created_at desc);
create index expenses_related_po_idx on public.expenses (related_purchase_order_id);
create index expenses_created_by_idx on public.expenses (created_by);
create index inventory_movements_created_by_idx on public.inventory_movements (created_by);
create index orders_created_by_idx on public.orders (created_by);
create index payment_slips_uploaded_by_idx on public.payment_slips (uploaded_by);
create index payment_slips_reviewed_by_idx on public.payment_slips (reviewed_by);
create index products_category_idx on public.products (category_id);
create index purchase_order_items_product_idx on public.purchase_order_items (product_id);
create index purchase_orders_created_by_idx on public.purchase_orders (created_by);

create trigger product_variants_set_updated_at before update on public.product_variants for each row execute function public.set_updated_at();
create trigger customer_addresses_set_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();
create trigger shipments_set_updated_at before update on public.shipments for each row execute function public.set_updated_at();

create or replace function private.approve_payment_slip(target_order_id uuid, target_slip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  next_stock integer;
  target_payment_id uuid;
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  select id into target_payment_id
  from public.payments
  where order_id = target_order_id;

  if target_payment_id is null then
    insert into public.payments (order_id, amount, payment_method, status)
    select id, final_amount, payment_method, 'pending'
    from public.orders
    where id = target_order_id
    returning id into target_payment_id;
  end if;

  update public.payment_slips
  set status = 'approved',
      payment_id = target_payment_id,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reject_reason = null
  where id = target_slip_id
    and order_id = target_order_id
    and status = 'pending';

  if not found then
    raise exception 'payment slip not found or already reviewed';
  end if;

  update public.payments
  set status = 'verified',
      amount = coalesce(nullif(amount, 0), (select final_amount from public.orders where id = target_order_id)),
      paid_at = coalesce(paid_at, now()),
      verified_by = auth.uid(),
      verified_at = now()
  where id = target_payment_id
    and status in ('pending', 'rejected');

  update public.orders
  set status = 'paid',
      payment_status = 'paid',
      fulfillment_status = 'ready_to_ship',
      shipping_status = 'not_shipped'
  where id = target_order_id
    and status in ('pending', 'awaiting_payment_slip', 'awaiting_confirmation');

  if not found then
    raise exception 'order not found or already paid';
  end if;

  insert into public.shipments (order_id, status)
  values (target_order_id, 'not_shipped')
  on conflict (order_id) do nothing;

  for item in
    select product_id, product_variant_id, quantity
    from public.order_items
    where order_id = target_order_id
  loop
    if item.product_variant_id is not null then
      update public.product_variants
      set stock_qty = stock_qty - item.quantity
      where id = item.product_variant_id
      returning stock_qty into next_stock;
    else
      update public.products
      set stock_qty = stock_qty - item.quantity
      where id = item.product_id
      returning stock_qty into next_stock;
    end if;

    insert into public.inventory_movements (
      product_id,
      product_variant_id,
      movement_type,
      quantity_delta,
      stock_after,
      reference_type,
      reference_id,
      note,
      created_by
    ) values (
      item.product_id,
      item.product_variant_id,
      'order_paid',
      -item.quantity,
      next_stock,
      'order',
      target_order_id,
      'Payment slip approved',
      auth.uid()
    );
  end loop;
end;
$$;

create or replace function private.reject_payment_slip(target_order_id uuid, target_slip_id uuid, reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_payment_id uuid;
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  select id into target_payment_id
  from public.payments
  where order_id = target_order_id;

  update public.payment_slips
  set status = 'rejected',
      payment_id = target_payment_id,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reject_reason = reason
  where id = target_slip_id
    and order_id = target_order_id
    and status = 'pending';

  update public.payments
  set status = 'rejected',
      verified_by = auth.uid(),
      verified_at = now(),
      note = reason
  where id = target_payment_id;

  update public.orders
  set status = 'pending',
      payment_status = 'rejected'
  where id = target_order_id
    and status in ('awaiting_payment_slip', 'awaiting_confirmation', 'pending');
end;
$$;

drop function if exists private.receive_purchase_order(uuid);

create or replace function private.receive_purchase_order(target_purchase_order_id uuid, create_expense boolean default true)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  next_stock integer;
  po record;
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  update public.purchase_orders
  set status = 'received'
  where id = target_purchase_order_id
    and status <> 'received'
  returning * into po;

  if not found then
    raise exception 'purchase order not found or already received';
  end if;

  for item in
    select product_id, product_variant_id, quantity
    from public.purchase_order_items
    where purchase_order_id = target_purchase_order_id
  loop
    if item.product_variant_id is not null then
      update public.product_variants
      set stock_qty = stock_qty + item.quantity
      where id = item.product_variant_id
      returning stock_qty into next_stock;
    else
      update public.products
      set stock_qty = stock_qty + item.quantity
      where id = item.product_id
      returning stock_qty into next_stock;
    end if;

    insert into public.inventory_movements (
      product_id,
      product_variant_id,
      movement_type,
      quantity_delta,
      stock_after,
      reference_type,
      reference_id,
      note,
      created_by
    ) values (
      item.product_id,
      item.product_variant_id,
      'po_received',
      item.quantity,
      next_stock,
      'purchase_order',
      target_purchase_order_id,
      'Purchase order received',
      auth.uid()
    );
  end loop;

  if create_expense and po.total_amount > 0 then
    insert into public.expenses (
      expense_date,
      ref_no,
      category,
      description,
      amount,
      related_purchase_order_id,
      created_by
    ) values (
      current_date,
      po.po_no,
      'product_cost',
      'Purchase order received from ' || po.supplier_name,
      po.total_amount + po.shipping_cost + po.tax_fee + po.other_cost,
      po.id,
      auth.uid()
    );
  end if;
end;
$$;

alter table public.product_variants enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.payments enable row level security;
alter table public.shipments enable row level security;
alter table public.login_sessions enable row level security;

grant select on public.product_variants to anon, authenticated;
grant select, insert, update, delete on public.product_variants, public.customer_addresses, public.payments, public.shipments, public.login_sessions to authenticated;

create policy "public can read active product variants"
on public.product_variants for select
using (
  status = 'active'
  and exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.status = 'active'
  )
  or (select private.is_admin())
);

create policy "admins manage product variants"
on public.product_variants for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "addresses visible to admins and owner customer"
on public.customer_addresses for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.profile_id = (select auth.uid())
  )
);

create policy "customers manage own addresses"
on public.customer_addresses for all
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.profile_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.customers
    where customers.id = customer_addresses.customer_id
      and customers.profile_id = (select auth.uid())
  )
);

create policy "admins manage customer addresses"
on public.customer_addresses for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "payments visible through order"
on public.payments for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = payments.order_id
      and customers.profile_id = (select auth.uid())
  )
);

create policy "admins manage payments"
on public.payments for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "customers create payment for own order"
on public.payments for insert
to authenticated
with check (
  exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = payments.order_id
      and customers.profile_id = (select auth.uid())
  )
);

create policy "shipments visible through order"
on public.shipments for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = shipments.order_id
      and customers.profile_id = (select auth.uid())
  )
);

create policy "admins manage shipments"
on public.shipments for all
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "login sessions visible to own user or admins"
on public.login_sessions for select
to authenticated
using (
  (select private.is_admin())
  or profile_id = (select auth.uid())
  or exists (
    select 1
    from public.customers
    where customers.id = login_sessions.customer_id
      and customers.profile_id = (select auth.uid())
  )
);

create policy "authenticated users create own login sessions"
on public.login_sessions for insert
to authenticated
with check (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.customers
    where customers.id = login_sessions.customer_id
      and customers.profile_id = (select auth.uid())
  )
);
