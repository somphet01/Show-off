create extension if not exists "pgcrypto";
create schema if not exists private;

create type public.app_role as enum ('owner', 'staff', 'customer');
create type public.product_status as enum ('active', 'hidden', 'archived');
create type public.order_source as enum ('web', 'chat');
create type public.payment_status as enum ('waiting_slip', 'pending_review', 'paid', 'rejected', 'cancelled');
create type public.fulfillment_status as enum ('not_ready', 'ready_to_ship', 'packing', 'shipped', 'delivered');
create type public.slip_status as enum ('pending', 'approved', 'rejected');
create type public.inventory_movement_type as enum ('order_paid', 'po_received', 'manual_adjustment', 'order_cancelled');
create type public.reference_type as enum ('order', 'purchase_order', 'manual');
create type public.purchase_order_status as enum ('draft', 'ordered', 'in_transit', 'received', 'closed');
create type public.customer_type as enum ('normal', 'vip');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'customer',
  display_name text,
  phone text,
  line_id text,
  facebook text,
  instagram text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_lo text,
  slug text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name_en text not null,
  name_lo text,
  slug text not null unique,
  category_id uuid references public.categories(id) on delete set null,
  description_en text,
  description_lo text,
  sale_price numeric(12,2) not null check (sale_price >= 0),
  cost_price numeric(12,2) not null default 0 check (cost_price >= 0),
  stock_qty integer not null default 0,
  min_stock_qty integer not null default 5 check (min_stock_qty >= 0),
  status public.product_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  bucket text not null default 'product-images',
  path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  phone text,
  email text,
  line_id text,
  facebook text,
  instagram text,
  default_address text,
  customer_type public.customer_type not null default 'normal',
  is_vip_manual boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  source public.order_source not null default 'web',
  chat_channel text,
  customer_id uuid not null references public.customers(id) on delete restrict,
  created_by uuid references public.profiles(id) on delete set null,
  subtotal numeric(12,2) not null default 0,
  shipping_fee numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  payment_method text not null default 'bank_transfer',
  payment_status public.payment_status not null default 'waiting_slip',
  fulfillment_status public.fulfillment_status not null default 'not_ready',
  shipping_address text,
  tracking_number text,
  shipped_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  sku_snapshot text not null,
  product_name_snapshot text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price >= 0),
  unit_cost numeric(12,2) not null default 0 check (unit_cost >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_price) stored
);

create table public.payment_slips (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  bucket text not null default 'payment-slips',
  path text not null,
  amount numeric(12,2),
  status public.slip_status not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  reject_reason text,
  created_at timestamptz not null default now(),
  unique (bucket, path)
);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  movement_type public.inventory_movement_type not null,
  quantity_delta integer not null,
  stock_after integer not null,
  reference_type public.reference_type not null,
  reference_id uuid,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  expense_date date not null default current_date,
  ref_no text,
  category text not null,
  description text,
  amount numeric(12,2) not null check (amount >= 0),
  bucket text,
  path text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_no text not null unique,
  supplier_name text not null,
  ordered_at date not null default current_date,
  status public.purchase_order_status not null default 'draft',
  shipping_cost numeric(12,2) not null default 0,
  tax_fee numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12,2) not null check (unit_cost >= 0),
  line_total numeric(12,2) generated always as (quantity * unit_cost) stored
);

create table public.store_settings (
  id text primary key default 'main' check (id = 'main'),
  store_name text not null default 'Show Off',
  logo_path text,
  address text,
  phone text,
  bank_name text,
  bank_account_no text,
  bank_account_name text,
  default_min_stock_qty integer not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.store_settings (id) values ('main') on conflict (id) do nothing;

create index categories_active_sort_idx on public.categories (is_active, sort_order);
create index products_status_category_idx on public.products (status, category_id);
create index products_stock_idx on public.products (stock_qty, min_stock_qty);
create index product_images_product_idx on public.product_images (product_id, sort_order);
create index customers_profile_idx on public.customers (profile_id);
create index customers_phone_idx on public.customers (phone);
create index customers_email_idx on public.customers (email);
create index orders_customer_idx on public.orders (customer_id);
create index orders_status_created_idx on public.orders (payment_status, fulfillment_status, created_at desc);
create index orders_source_created_idx on public.orders (source, created_at desc);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index payment_slips_order_status_idx on public.payment_slips (order_id, status);
create index inventory_movements_product_created_idx on public.inventory_movements (product_id, created_at desc);
create index expenses_date_category_idx on public.expenses (expense_date, category);
create index purchase_orders_status_ordered_idx on public.purchase_orders (status, ordered_at desc);
create index purchase_order_items_po_idx on public.purchase_order_items (purchase_order_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function public.set_updated_at();
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
create trigger expenses_set_updated_at before update on public.expenses for each row execute function public.set_updated_at();
create trigger purchase_orders_set_updated_at before update on public.purchase_orders for each row execute function public.set_updated_at();
create trigger store_settings_set_updated_at before update on public.store_settings for each row execute function public.set_updated_at();

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('owner', 'staff')
  );
$$;

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'owner'
  );
$$;

create or replace function private.approve_payment_slip(target_order_id uuid, target_slip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  next_stock integer;
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  update public.payment_slips
  set status = 'approved',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reject_reason = null
  where id = target_slip_id
    and order_id = target_order_id
    and status = 'pending';

  if not found then
    raise exception 'payment slip not found or already reviewed';
  end if;

  update public.orders
  set payment_status = 'paid',
      fulfillment_status = 'ready_to_ship'
  where id = target_order_id
    and payment_status in ('waiting_slip', 'pending_review');

  if not found then
    raise exception 'order not found or already paid';
  end if;

  for item in
    select product_id, quantity
    from public.order_items
    where order_id = target_order_id
  loop
    update public.products
    set stock_qty = stock_qty - item.quantity
    where id = item.product_id
    returning stock_qty into next_stock;

    insert into public.inventory_movements (
      product_id,
      movement_type,
      quantity_delta,
      stock_after,
      reference_type,
      reference_id,
      note,
      created_by
    ) values (
      item.product_id,
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
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  update public.payment_slips
  set status = 'rejected',
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      reject_reason = reason
  where id = target_slip_id
    and order_id = target_order_id
    and status = 'pending';

  update public.orders
  set payment_status = 'rejected'
  where id = target_order_id
    and payment_status in ('waiting_slip', 'pending_review');
end;
$$;

create or replace function private.receive_purchase_order(target_purchase_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  next_stock integer;
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  update public.purchase_orders
  set status = 'received'
  where id = target_purchase_order_id
    and status <> 'received';

  if not found then
    raise exception 'purchase order not found or already received';
  end if;

  for item in
    select product_id, quantity
    from public.purchase_order_items
    where purchase_order_id = target_purchase_order_id
  loop
    update public.products
    set stock_qty = stock_qty + item.quantity
    where id = item.product_id
    returning stock_qty into next_stock;

    insert into public.inventory_movements (
      product_id,
      movement_type,
      quantity_delta,
      stock_after,
      reference_type,
      reference_id,
      note,
      created_by
    ) values (
      item.product_id,
      'po_received',
      item.quantity,
      next_stock,
      'purchase_order',
      target_purchase_order_id,
      'Purchase order received',
      auth.uid()
    );
  end loop;
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_slips enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.expenses enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.store_settings enable row level security;

grant usage on schema public to anon, authenticated;
grant usage on schema private to anon, authenticated;
grant select on public.categories, public.products, public.product_images to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on all sequences in schema public to authenticated;
grant execute on all functions in schema private to anon, authenticated;

create policy "public can read active categories"
on public.categories for select
using (is_active = true or private.is_admin());

create policy "admins manage categories"
on public.categories for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "public can read active products"
on public.products for select
using (status = 'active' or private.is_admin());

create policy "admins manage products"
on public.products for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "public can read images for active products"
on public.product_images for select
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and (products.status = 'active' or private.is_admin())
  )
);

create policy "admins manage product images"
on public.product_images for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "profiles can read own profile or admins read all"
on public.profiles for select
to authenticated
using (id = auth.uid() or private.is_admin());

create policy "profiles can update own basic profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "owners manage profiles"
on public.profiles for all
to authenticated
using (private.is_owner())
with check (private.is_owner());

create policy "customers visible to owner staff and linked customer"
on public.customers for select
to authenticated
using (private.is_admin() or profile_id = auth.uid());

create policy "admins manage customers"
on public.customers for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "orders visible to admins and owner customer"
on public.orders for select
to authenticated
using (
  private.is_admin()
  or exists (
    select 1
    from public.customers
    where customers.id = orders.customer_id
      and customers.profile_id = auth.uid()
  )
);

create policy "admins manage orders"
on public.orders for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "order items visible through order"
on public.order_items for select
to authenticated
using (
  private.is_admin()
  or exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = order_items.order_id
      and customers.profile_id = auth.uid()
  )
);

create policy "admins manage order items"
on public.order_items for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "payment slips visible through order"
on public.payment_slips for select
to authenticated
using (
  private.is_admin()
  or exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = payment_slips.order_id
      and customers.profile_id = auth.uid()
  )
);

create policy "customers insert slip for own order"
on public.payment_slips for insert
to authenticated
with check (
  uploaded_by = auth.uid()
  and exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = payment_slips.order_id
      and customers.profile_id = auth.uid()
  )
);

create policy "admins manage payment slips"
on public.payment_slips for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admins read inventory movements"
on public.inventory_movements for select
to authenticated
using (private.is_admin());

create policy "admins insert inventory movements"
on public.inventory_movements for insert
to authenticated
with check (private.is_admin());

create policy "admins manage expenses"
on public.expenses for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admins manage purchase orders"
on public.purchase_orders for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admins manage purchase order items"
on public.purchase_order_items for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "admins read settings"
on public.store_settings for select
to authenticated
using (private.is_admin());

create policy "owners update settings"
on public.store_settings for update
to authenticated
using (private.is_owner())
with check (private.is_owner());

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('payment-slips', 'payment-slips', false),
  ('shipping-documents', 'shipping-documents', false),
  ('expense-receipts', 'expense-receipts', false)
on conflict (id) do nothing;

create policy "admins manage product image files"
on storage.objects for all
to authenticated
using (bucket_id = 'product-images' and private.is_admin())
with check (bucket_id = 'product-images' and private.is_admin());

create policy "admins read private commerce files"
on storage.objects for select
to authenticated
using (bucket_id in ('payment-slips', 'shipping-documents', 'expense-receipts') and private.is_admin());

create policy "authenticated users upload payment slips"
on storage.objects for insert
to authenticated
with check (bucket_id = 'payment-slips');

create policy "admins manage private commerce files"
on storage.objects for all
to authenticated
using (bucket_id in ('payment-slips', 'shipping-documents', 'expense-receipts') and private.is_admin())
with check (bucket_id in ('payment-slips', 'shipping-documents', 'expense-receipts') and private.is_admin());
