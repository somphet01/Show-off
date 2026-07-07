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

  if current_user_id is null or not private.is_admin() then
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
      document_images = clean_documents,
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
