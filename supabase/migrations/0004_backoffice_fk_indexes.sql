create index customers_default_address_idx on public.customers (default_address_id);
create index payments_verified_by_idx on public.payments (verified_by);
create index shipments_created_by_idx on public.shipments (created_by);
