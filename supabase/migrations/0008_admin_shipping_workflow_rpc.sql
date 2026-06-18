create or replace function public.admin_update_order_shipping(
  target_order_id uuid,
  next_status public.shipment_status,
  next_carrier text default null,
  next_tracking_number text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  shipment_row public.shipments%rowtype;
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  if next_status not in ('not_shipped', 'shipping', 'delivered') then
    raise exception 'invalid shipment status';
  end if;

  if not exists (
    select 1
    from public.orders
    left join public.payments on payments.order_id = orders.id
    where orders.id = target_order_id
      and (
        orders.status = 'paid'
        or orders.payment_status = 'paid'
        or payments.status = 'verified'
      )
  ) then
    raise exception 'order must be paid before shipping can be updated';
  end if;

  insert into public.shipments (
    order_id,
    status,
    carrier,
    tracking_number,
    shipped_at,
    delivered_at,
    created_by
  )
  values (
    target_order_id,
    next_status,
    nullif(btrim(next_carrier), ''),
    nullif(btrim(next_tracking_number), ''),
    case when next_status in ('shipping', 'delivered') then now() else null end,
    case when next_status = 'delivered' then now() else null end,
    auth.uid()
  )
  on conflict (order_id) do update
  set status = excluded.status,
      carrier = coalesce(excluded.carrier, public.shipments.carrier),
      tracking_number = coalesce(excluded.tracking_number, public.shipments.tracking_number),
      shipped_at = case
        when excluded.status in ('shipping', 'delivered') then coalesce(public.shipments.shipped_at, now())
        else public.shipments.shipped_at
      end,
      delivered_at = case
        when excluded.status = 'delivered' then coalesce(public.shipments.delivered_at, now())
        else null
      end,
      updated_at = now()
  returning * into shipment_row;

  update public.orders
  set status = case when status = 'paid' then status else 'paid'::public.order_status end,
      payment_status = 'paid',
      shipping_status = next_status,
      fulfillment_status = case
        when next_status = 'not_shipped' then 'ready_to_ship'::public.fulfillment_status
        when next_status = 'shipping' then 'shipped'::public.fulfillment_status
        when next_status = 'delivered' then 'delivered'::public.fulfillment_status
      end,
      tracking_number = coalesce(nullif(btrim(next_tracking_number), ''), tracking_number),
      shipped_at = case when next_status in ('shipping', 'delivered') then coalesce(shipped_at, now()) else shipped_at end,
      updated_at = now()
  where id = target_order_id;

  return jsonb_build_object(
    'order_id', target_order_id,
    'shipment_id', shipment_row.id,
    'status', shipment_row.status,
    'carrier', shipment_row.carrier,
    'tracking_number', shipment_row.tracking_number
  );
end;
$$;

revoke all on function public.admin_update_order_shipping(uuid, public.shipment_status, text, text) from public;
grant execute on function public.admin_update_order_shipping(uuid, public.shipment_status, text, text) to authenticated;
