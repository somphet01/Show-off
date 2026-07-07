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
