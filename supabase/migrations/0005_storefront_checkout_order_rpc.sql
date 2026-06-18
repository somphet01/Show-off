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
  v_image text;
  v_quantity integer;
  v_unit_price numeric(12,2);
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
    v_product_slug := coalesce(
      nullif(btrim(lower(regexp_replace(coalesce(item_payload ->> 'slug', v_product_name), '[^a-zA-Z0-9]+', '-', 'g')), '-'), ''),
      'item-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
    );
    v_color := coalesce(nullif(btrim(item_payload ->> 'color'), ''), 'Default');
    v_size := coalesce(nullif(btrim(item_payload ->> 'size'), ''), 'One Size');
    v_image := nullif(btrim(item_payload ->> 'image'), '');
    v_quantity := greatest(coalesce((item_payload ->> 'quantity')::integer, 1), 1);
    v_unit_price := greatest(coalesce((item_payload ->> 'unit_price')::numeric, 0), 0);

    if v_unit_price = 0 then
      raise exception 'unit price is required for %', v_product_name;
    end if;

    select id, sku
      into v_product_id, v_product_sku
    from public.products
    where slug = v_product_slug
    limit 1;

    if v_product_id is null then
      v_product_sku := 'SO-' || upper(substr(regexp_replace(v_product_slug, '[^a-zA-Z0-9]+', '', 'g'), 1, 18)) || '-' || upper(substr(md5(v_product_slug), 1, 6));

      insert into public.products (
        sku,
        name_en,
        name_lo,
        slug,
        description_en,
        sale_price,
        stock_qty,
        status
      )
      values (
        v_product_sku,
        v_product_name,
        v_product_name,
        v_product_slug,
        'Created from storefront checkout.',
        v_unit_price,
        999,
        'active'
      )
      returning id into v_product_id;

      if v_image is not null then
        insert into public.product_images (product_id, path, alt_text, is_primary)
        values (v_product_id, v_image, v_product_name, true)
        on conflict (bucket, path) do nothing;
      end if;
    else
      update public.products
      set name_en = coalesce(nullif(name_en, ''), v_product_name),
          name_lo = coalesce(nullif(name_lo, ''), v_product_name),
          sale_price = case when sale_price = 0 then v_unit_price else sale_price end,
          updated_at = now()
      where id = v_product_id;
    end if;

    select id
      into v_variant_id
    from public.product_variants
    where product_id = v_product_id
      and coalesce(size_label, '') = v_size
      and coalesce(color_name, '') = v_color
    limit 1;

    if v_variant_id is null then
      v_variant_sku := v_product_sku || '-' || upper(substr(regexp_replace(v_size || '-' || v_color, '[^a-zA-Z0-9]+', '', 'g'), 1, 16)) || '-' || upper(substr(md5(v_size || v_color), 1, 4));

      insert into public.product_variants (
        product_id,
        sku,
        size_label,
        color_name,
        option_label,
        sale_price,
        stock_qty,
        status
      )
      values (
        v_product_id,
        v_variant_sku,
        v_size,
        v_color,
        v_color || ' / ' || v_size,
        v_unit_price,
        999,
        'active'
      )
      returning id into v_variant_id;
    else
      select sku into v_variant_sku
      from public.product_variants
      where id = v_variant_id;
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
