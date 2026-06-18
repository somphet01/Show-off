create or replace function public.admin_approve_payment_slip(target_order_id uuid, target_slip_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  perform private.approve_payment_slip(target_order_id, target_slip_id);

  return jsonb_build_object(
    'order_id', target_order_id,
    'slip_id', target_slip_id,
    'status', 'approved'
  );
end;
$$;

create or replace function public.admin_reject_payment_slip(target_order_id uuid, target_slip_id uuid, reason text default 'Rejected from admin review')
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  if not private.is_admin() then
    raise exception 'admin access required';
  end if;

  perform private.reject_payment_slip(target_order_id, target_slip_id, coalesce(nullif(btrim(reason), ''), 'Rejected from admin review'));

  return jsonb_build_object(
    'order_id', target_order_id,
    'slip_id', target_slip_id,
    'status', 'rejected'
  );
end;
$$;

revoke all on function public.admin_approve_payment_slip(uuid, uuid) from public;
revoke all on function public.admin_reject_payment_slip(uuid, uuid, text) from public;
grant execute on function public.admin_approve_payment_slip(uuid, uuid) to authenticated;
grant execute on function public.admin_reject_payment_slip(uuid, uuid, text) to authenticated;
