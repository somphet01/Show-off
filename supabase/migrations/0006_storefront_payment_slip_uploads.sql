drop policy if exists "storefront uploads payment slips" on storage.objects;

create policy "storefront uploads payment slips"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'payment-slips'
  and name like 'storefront/%'
);

create or replace function public.attach_storefront_payment_slips(
  target_order_id uuid,
  target_payment_id uuid,
  slip_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  slip_item jsonb;
  v_path text;
  v_name text;
  v_mime_type text;
  v_file_size integer;
  v_order_total numeric(12,2);
  v_inserted_count integer := 0;
begin
  if jsonb_typeof(slip_payload) <> 'array' or jsonb_array_length(slip_payload) = 0 then
    raise exception 'payment slip files are required';
  end if;

  select final_amount
    into v_order_total
  from public.orders
  where id = target_order_id;

  if v_order_total is null then
    raise exception 'order not found';
  end if;

  if not exists (
    select 1
    from public.payments
    where id = target_payment_id
      and order_id = target_order_id
  ) then
    raise exception 'payment record does not match order';
  end if;

  for slip_item in select value from jsonb_array_elements(slip_payload)
  loop
    v_path := nullif(btrim(slip_item ->> 'path'), '');
    v_name := nullif(btrim(slip_item ->> 'name'), '');
    v_mime_type := nullif(btrim(slip_item ->> 'mime_type'), '');
    v_file_size := coalesce((slip_item ->> 'size')::integer, 0);

    if v_path is null or v_path not like 'storefront/%' then
      raise exception 'invalid payment slip path';
    end if;

    insert into public.payment_slips (
      order_id,
      payment_id,
      bucket,
      path,
      amount,
      status,
      reject_reason
    )
    values (
      target_order_id,
      target_payment_id,
      'payment-slips',
      v_path,
      v_order_total,
      'pending',
      jsonb_build_object(
        'file_name', coalesce(v_name, v_path),
        'mime_type', coalesce(v_mime_type, 'image/*'),
        'size', v_file_size,
        'source', 'storefront'
      )::text
    )
    on conflict (bucket, path) do nothing;

    if found then
      v_inserted_count := v_inserted_count + 1;
    end if;
  end loop;

  update public.payments
  set status = 'pending',
      note = 'Transfer slip uploaded from storefront.',
      updated_at = now()
  where id = target_payment_id;

  update public.orders
  set status = 'awaiting_confirmation',
      payment_status = 'pending_review',
      updated_at = now()
  where id = target_order_id;

  return jsonb_build_object(
    'order_id', target_order_id,
    'payment_id', target_payment_id,
    'slip_count', v_inserted_count
  );
end;
$$;

revoke all on function public.attach_storefront_payment_slips(uuid, uuid, jsonb) from public;
grant execute on function public.attach_storefront_payment_slips(uuid, uuid, jsonb) to anon, authenticated;
