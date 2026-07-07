create or replace function public.create_storefront_order(order_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  customer_payload jsonb := coalesce(order_payload -> 'customer', '{}'::jsonb);
  items_payload jsonb := coalesce(order_payload -> 'items', '[]'::jsonb);
  item_payload jsonb;
  v_customer_id uuid;
  v_address_id uuid;
  v_order_id uuid;
  v_payment_id uuid;
  v_product_id uuid;
  v_variant_id uuid;
  v_product_sku text;
  v_variant_sku text;
  v_customer_name text := nullif(btrim(customer_payload ->> 'name'), '');
  v_customer_email text := nullif(lower(btrim(customer_payload ->> 'email')), '');
  v_customer_phone text := nullif(btrim(customer_payload ->> 'phone'), '');
  v_customer_address text := nullif(btrim(customer_payload ->> 'address'), '');
  v_product_slug text;
  v_product_name text;
  v_color text;
  v_size text;
  v_quantity integer;
  v_unit_price numeric(12,2);
  v_variant_price numeric(12,2);
  v_product_price numeric(12,2);
  v_stock integer;
  v_subtotal numeric(12,2) := 0;
  v_item_count integer := 0;
  v_order_no text;
begin
  if v_customer_name is null then
    raise exception 'customer name is required';
  end if;

  if v_customer_phone is null and v_customer_email is null then
    raise exception 'customer phone or email is required';
  end if;

  if v_customer_address is null then
    raise exception 'delivery address is required';
  end if;

  if jsonb_typeof(items_payload) <> 'array' or jsonb_array_length(items_payload) = 0 then
    raise exception 'order items are required';
  end if;

  select id
    into v_customer_id
  from public.customers
  where (v_customer_phone is not null and phone = v_customer_phone)
     or (v_customer_email is not null and lower(email) = v_customer_email)
  order by updated_at desc
  limit 1;

  if v_customer_id is null then
    insert into public.customers (name, phone, email, default_address)
    values (v_customer_name, v_customer_phone, v_customer_email, v_customer_address)
    returning id into v_customer_id;
  else
    update public.customers
    set name = v_customer_name,
        phone = coalesce(v_customer_phone, phone),
        email = coalesce(v_customer_email, email),
        default_address = v_customer_address,
        updated_at = now()
    where id = v_customer_id;
  end if;

  insert into public.customer_addresses (
    customer_id,
    label,
    full_name,
    phone,
    address_line1,
    is_default
  )
  values (
    v_customer_id,
    'Checkout',
    v_customer_name,
    v_customer_phone,
    v_customer_address,
    true
  )
  returning id into v_address_id;

  update public.customers
  set default_address_id = v_address_id,
      updated_at = now()
  where id = v_customer_id;

  v_order_no := 'SO-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));

  insert into public.orders (
    order_no,
    source,
    customer_id,
    subtotal,
    shipping_fee,
    discount_total,
    total_amount,
    final_amount,
    payment_method,
    payment_status,
    fulfillment_status,
    status,
    shipping_status,
    shipping_address,
    shipping_address_id,
    notes
  )
  values (
    v_order_no,
    'web',
    v_customer_id,
    0,
    0,
    0,
    0,
    0,
    'bank_transfer',
    'waiting_slip',
    'not_ready',
    'awaiting_payment_slip',
    'not_shipped',
    v_customer_address,
    v_address_id,
    nullif(btrim(order_payload ->> 'note'), '')
  )
  returning id into v_order_id;

  for item_payload in select value from jsonb_array_elements(items_payload)
  loop
    v_product_name := coalesce(nullif(btrim(item_payload ->> 'name'), ''), 'SHOW OFF Item');
    v_product_slug := nullif(btrim(lower(regexp_replace(coalesce(item_payload ->> 'slug', ''), '[^a-zA-Z0-9]+', '-', 'g')), '-'), '');
    v_color := coalesce(nullif(btrim(item_payload ->> 'color'), ''), 'Default');
    v_size := coalesce(nullif(btrim(item_payload ->> 'size'), ''), 'One Size');
    v_quantity := greatest(coalesce((item_payload ->> 'quantity')::integer, 1), 1);

    if v_product_slug is null then
      raise exception 'product slug is required for %', v_product_name;
    end if;

    select id, sku, sale_price
      into v_product_id, v_product_sku, v_product_price
    from public.products
    where slug = v_product_slug
      and status = 'active'
    limit 1;

    if v_product_id is null then
      raise exception 'product is not available: %', v_product_name;
    end if;

    select id, sku, sale_price, stock_qty
      into v_variant_id, v_variant_sku, v_variant_price, v_stock
    from public.product_variants
    where product_id = v_product_id
      and lower(coalesce(size_label, '')) = lower(v_size)
      and lower(coalesce(color_name, '')) = lower(v_color)
      and status = 'active'
    limit 1;

    if v_variant_id is null then
      raise exception 'variant is not available: % / % / %', v_product_name, v_color, v_size;
    end if;

    if v_stock < v_quantity then
      raise exception 'not enough stock for % / % / %. Available %, requested %', v_product_name, v_color, v_size, v_stock, v_quantity;
    end if;

    v_unit_price := coalesce(v_variant_price, v_product_price, greatest(coalesce((item_payload ->> 'unit_price')::numeric, 0), 0));

    if v_unit_price = 0 then
      raise exception 'unit price is required for %', v_product_name;
    end if;

    insert into public.order_items (
      order_id,
      product_id,
      product_variant_id,
      sku_snapshot,
      product_name_snapshot,
      variant_label_snapshot,
      quantity,
      unit_price
    )
    values (
      v_order_id,
      v_product_id,
      v_variant_id,
      coalesce(v_variant_sku, v_product_sku),
      v_product_name,
      v_color || ' / Size ' || v_size,
      v_quantity,
      v_unit_price
    );

    v_subtotal := v_subtotal + (v_unit_price * v_quantity);
    v_item_count := v_item_count + v_quantity;
  end loop;

  update public.orders
  set subtotal = v_subtotal,
      total_amount = v_subtotal,
      final_amount = v_subtotal,
      updated_at = now()
  where id = v_order_id;

  insert into public.payments (order_id, amount, payment_method, status)
  values (v_order_id, v_subtotal, 'bank_transfer', 'pending')
  returning id into v_payment_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_no', v_order_no,
    'payment_id', v_payment_id,
    'total_amount', v_subtotal,
    'item_count', v_item_count
  );
end;
$$;

revoke all on function public.create_storefront_order(jsonb) from public;
grant execute on function public.create_storefront_order(jsonb) to anon, authenticated;

create or replace function private.approve_payment_slip(target_order_id uuid, target_slip_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  current_stock integer;
  next_stock integer;
  target_payment_id uuid;
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  for item in
    select product_id, product_variant_id, sku_snapshot, quantity
    from public.order_items
    where order_id = target_order_id
  loop
    if item.product_variant_id is not null then
      select stock_qty
        into current_stock
      from public.product_variants
      where id = item.product_variant_id
      for update;
    else
      select stock_qty
        into current_stock
      from public.products
      where id = item.product_id
      for update;
    end if;

    if current_stock is null then
      raise exception 'stock item not found for %', item.sku_snapshot;
    end if;

    if current_stock < item.quantity then
      raise exception 'not enough stock for %. Available %, requested %', item.sku_snapshot, current_stock, item.quantity;
    end if;
  end loop;

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
    select product_id, product_variant_id, sku_snapshot, quantity
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
