alter table public.shipments
  add column if not exists document_images jsonb not null default '[]'::jsonb;

drop function if exists public.admin_update_order_shipping(uuid, public.shipment_status, text, text);

create or replace function public.admin_update_order_shipping(
  target_order_id uuid,
  next_status public.shipment_status,
  next_carrier text default null,
  next_tracking_number text default null,
  next_document_images jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  current_user_id uuid;
  shipment_row public.shipments%rowtype;
  clean_documents jsonb := '[]'::jsonb;
begin
  current_user_id := auth.uid();

  if current_user_id is null or not private.is_admin(current_user_id) then
    raise exception 'Admin access required';
  end if;

  if not exists (select 1 from public.orders where id = target_order_id) then
    raise exception 'Order not found';
  end if;

  if jsonb_typeof(coalesce(next_document_images, '[]'::jsonb)) <> 'array' then
    raise exception 'Shipping document images must be an array';
  end if;

  clean_documents := coalesce(next_document_images, '[]'::jsonb);

  insert into public.shipments (
    order_id,
    status,
    carrier,
    tracking_number,
    document_images,
    shipped_at,
    delivered_at,
    created_by
  )
  values (
    target_order_id,
    next_status,
    nullif(btrim(next_carrier), ''),
    nullif(btrim(next_tracking_number), ''),
    clean_documents,
    case when next_status in ('shipping', 'delivered') then now() else null end,
    case when next_status = 'delivered' then now() else null end,
    current_user_id
  )
  on conflict (order_id) do update
    set
      status = excluded.status,
      carrier = coalesce(excluded.carrier, public.shipments.carrier),
      tracking_number = coalesce(excluded.tracking_number, public.shipments.tracking_number),
      document_images = case
        when jsonb_array_length(clean_documents) > 0 then clean_documents
        else public.shipments.document_images
      end,
      shipped_at = case
        when excluded.status in ('shipping', 'delivered') then coalesce(public.shipments.shipped_at, now())
        else public.shipments.shipped_at
      end,
      delivered_at = case
        when excluded.status = 'delivered' then coalesce(public.shipments.delivered_at, now())
        else public.shipments.delivered_at
      end,
      updated_at = now()
  returning * into shipment_row;

  update public.orders
  set
    shipping_status = next_status,
    fulfillment_status = case
      when next_status = 'delivered' then 'delivered'::public.fulfillment_status
      when next_status = 'shipping' then 'shipped'::public.fulfillment_status
      else fulfillment_status
    end,
    updated_at = now()
  where id = target_order_id;

  insert into public.activity_logs (actor_id, action, target_type, target_id, summary, metadata)
  values (
    current_user_id,
    'update_shipping',
    'order',
    target_order_id,
    concat('Updated shipping to ', next_status),
    jsonb_build_object(
      'status', next_status,
      'carrier', coalesce(nullif(btrim(next_carrier), ''), shipment_row.carrier),
      'tracking_number', coalesce(nullif(btrim(next_tracking_number), ''), shipment_row.tracking_number),
      'document_count', jsonb_array_length(coalesce(shipment_row.document_images, '[]'::jsonb))
    )
  );

  return jsonb_build_object(
    'order_id', target_order_id,
    'shipment_id', shipment_row.id,
    'status', shipment_row.status,
    'carrier', shipment_row.carrier,
    'tracking_number', shipment_row.tracking_number,
    'document_images', coalesce(shipment_row.document_images, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.admin_update_order_shipping(uuid, public.shipment_status, text, text, jsonb) from public;
grant execute on function public.admin_update_order_shipping(uuid, public.shipment_status, text, text, jsonb) to authenticated;

create or replace function private.get_storefront_order_history(target_order_ids uuid[])
returns jsonb
language sql
security definer
set search_path = public, private, pg_temp
as $$
  select coalesce(jsonb_agg(history.order_payload order by history.created_at desc), '[]'::jsonb)
  from (
    select
      orders.created_at,
      jsonb_build_object(
        'id', orders.id,
        'order_no', orders.order_no,
        'final_amount', orders.final_amount,
        'total_amount', orders.total_amount,
        'created_at', orders.created_at,
        'payment_status', orders.payment_status,
        'shipping_status', orders.shipping_status,
        'fulfillment_status', orders.fulfillment_status,
        'shipment_documents', coalesce(shipments.document_images, '[]'::jsonb),
        'order_items', coalesce(
          (
            select jsonb_agg(
              jsonb_build_object(
                'id', order_items.id,
                'product_id', order_items.product_id,
                'product_slug', products.slug,
                'product_image', (
                  select product_images.path
                  from public.product_images
                  where product_images.product_id = order_items.product_id
                  order by
                    case
                      when selected_variant.color_name is not null
                        and lower(coalesce(product_images.alt_text, '')) like lower('[color:' || selected_variant.color_name || ']%')
                        then 0
                      when selected_variant.color_name is not null
                        and lower(coalesce(product_images.alt_text, '')) like lower('%color:' || selected_variant.color_name || '%')
                        then 1
                      when order_items.variant_label_snapshot is not null
                        and lower(coalesce(product_images.alt_text, '')) like lower('[color:' || trim(split_part(order_items.variant_label_snapshot, '/', 1)) || ']%')
                        then 2
                      when product_images.is_primary then 3
                      else 4
                    end,
                    product_images.sort_order asc nulls last,
                    product_images.id asc
                  limit 1
                ),
                'sku_snapshot', order_items.sku_snapshot,
                'product_name_snapshot', order_items.product_name_snapshot,
                'variant_label_snapshot', order_items.variant_label_snapshot,
                'quantity', order_items.quantity,
                'unit_price', order_items.unit_price,
                'line_total', order_items.line_total
              )
              order by order_items.id
            )
            from public.order_items
            left join public.products on products.id = order_items.product_id
            left join public.product_variants as selected_variant
              on selected_variant.product_id = order_items.product_id
             and selected_variant.sku = order_items.sku_snapshot
            where order_items.order_id = orders.id
          ),
          '[]'::jsonb
        )
      ) as order_payload
    from public.orders
    left join public.shipments on shipments.order_id = orders.id
    where orders.id = any(coalesce(target_order_ids, array[]::uuid[]))
      and orders.payment_status in ('paid', 'rejected')
      and cardinality(coalesce(target_order_ids, array[]::uuid[])) between 1 and 50
  ) as history;
$$;

revoke all on function private.get_storefront_order_history(uuid[]) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.get_storefront_order_history(uuid[]) to anon, authenticated;

create or replace function public.get_storefront_order_history(target_order_ids uuid[])
returns jsonb
language sql
security invoker
set search_path = public, private, pg_temp
as $$
  select private.get_storefront_order_history(target_order_ids);
$$;

revoke all on function public.get_storefront_order_history(uuid[]) from public;
grant execute on function public.get_storefront_order_history(uuid[]) to anon, authenticated;
