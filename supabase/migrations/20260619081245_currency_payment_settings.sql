create table if not exists public.storefront_payment_settings (
  id text primary key default 'main' check (id = 'main'),
  thb_to_lak_rate numeric(12,4) not null default 650 check (thb_to_lak_rate > 0),
  qr_thb_url text,
  qr_lak_url text,
  updated_at timestamptz not null default now()
);

insert into public.storefront_payment_settings (id)
values ('main')
on conflict (id) do nothing;

alter table public.storefront_payment_settings enable row level security;

drop policy if exists "storefront reads payment settings" on public.storefront_payment_settings;
create policy "storefront reads payment settings"
on public.storefront_payment_settings for select
to anon, authenticated
using (true);

drop policy if exists "owners update payment settings" on public.storefront_payment_settings;
create policy "owners update payment settings"
on public.storefront_payment_settings for update
to authenticated
using (private.is_owner())
with check (private.is_owner());

grant select on public.storefront_payment_settings to anon, authenticated;
grant update on public.storefront_payment_settings to authenticated;

drop trigger if exists storefront_payment_settings_set_updated_at on public.storefront_payment_settings;
create trigger storefront_payment_settings_set_updated_at
before update on public.storefront_payment_settings
for each row execute function public.set_updated_at();

alter table public.orders
  add column if not exists payment_currency text not null default 'THB' check (payment_currency in ('THB', 'LAK')),
  add column if not exists exchange_rate numeric(12,4) not null default 1 check (exchange_rate > 0),
  add column if not exists payment_amount numeric(14,2) not null default 0 check (payment_amount >= 0);

alter table public.payments
  add column if not exists currency text not null default 'THB' check (currency in ('THB', 'LAK')),
  add column if not exists exchange_rate numeric(12,4) not null default 1 check (exchange_rate > 0),
  add column if not exists settlement_amount numeric(14,2) not null default 0 check (settlement_amount >= 0);

alter table public.payment_slips
  add column if not exists currency text not null default 'THB' check (currency in ('THB', 'LAK')),
  add column if not exists exchange_rate numeric(12,4) not null default 1 check (exchange_rate > 0);

update public.orders
set payment_amount = final_amount
where payment_amount = 0 and final_amount > 0;

update public.payments
set settlement_amount = amount
where settlement_amount = 0 and amount > 0;

create or replace function public.set_payment_slip_currency()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  select coalesce(payment_amount, final_amount), payment_currency, exchange_rate
    into new.amount, new.currency, new.exchange_rate
  from public.orders
  where id = new.order_id;

  return new;
end;
$$;

drop trigger if exists payment_slips_set_currency on public.payment_slips;
create trigger payment_slips_set_currency
before insert on public.payment_slips
for each row execute function public.set_payment_slip_currency();

create or replace function public.create_storefront_order_v2(order_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_result jsonb;
  v_order_id uuid;
  v_payment_id uuid;
  v_base_total numeric(12,2);
  v_currency text := upper(coalesce(nullif(btrim(order_payload ->> 'payment_currency'), ''), 'THB'));
  v_rate numeric(12,4) := 1;
  v_payment_amount numeric(14,2);
begin
  if v_currency not in ('THB', 'LAK') then
    raise exception 'unsupported payment currency';
  end if;

  v_result := public.create_storefront_order(order_payload);
  v_order_id := (v_result ->> 'order_id')::uuid;
  v_payment_id := (v_result ->> 'payment_id')::uuid;
  v_base_total := (v_result ->> 'total_amount')::numeric;

  if v_currency = 'LAK' then
    select thb_to_lak_rate
      into v_rate
    from public.storefront_payment_settings
    where id = 'main';

    v_rate := coalesce(v_rate, 650);
  end if;

  v_payment_amount := round(v_base_total * v_rate, 0);

  update public.orders
  set payment_currency = v_currency,
      exchange_rate = v_rate,
      payment_amount = v_payment_amount,
      updated_at = now()
  where id = v_order_id;

  update public.payments
  set currency = v_currency,
      exchange_rate = v_rate,
      settlement_amount = v_payment_amount,
      updated_at = now()
  where id = v_payment_id;

  return v_result || jsonb_build_object(
    'base_currency', 'THB',
    'payment_currency', v_currency,
    'exchange_rate', v_rate,
    'payment_amount', v_payment_amount
  );
end;
$$;

revoke all on function public.create_storefront_order_v2(jsonb) from public;
grant execute on function public.create_storefront_order_v2(jsonb) to anon, authenticated;
