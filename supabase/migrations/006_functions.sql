-- 006: RPC Functions

-- Atomic stock reduction (prevents race conditions)
create or replace function public.reduce_stock(
  p_variant_id uuid,
  p_quantity int
)
returns boolean
language plpgsql
security definer
as $$
declare
  rows_affected int;
begin
  update public.product_variants
  set stock = stock - p_quantity
  where id = p_variant_id and stock >= p_quantity;

  get diagnostics rows_affected = row_count;
  return rows_affected > 0;
end;
$$;

-- Validate coupon
create or replace function public.validate_coupon(
  p_code text,
  p_purchase_amount int
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_coupon record;
  v_discount int;
begin
  select * into v_coupon
  from public.coupons
  where code = p_code
    and is_active = true
    and valid_from <= now()
    and valid_until > now()
    and used_count < usage_limit;

  if not found then
    return jsonb_build_object('valid', false, 'error', 'Kupon tidak valid atau sudah kadaluarsa');
  end if;

  if p_purchase_amount < v_coupon.min_purchase_amount then
    return jsonb_build_object('valid', false, 'error', 'Minimum pembelian Rp ' || v_coupon.min_purchase_amount);
  end if;

  -- Calculate discount
  if v_coupon.discount_type = 'percentage' then
    v_discount := (p_purchase_amount * v_coupon.discount_value) / 100;
    if v_coupon.max_discount_amount is not null and v_discount > v_coupon.max_discount_amount then
      v_discount := v_coupon.max_discount_amount;
    end if;
  else
    v_discount := v_coupon.discount_value;
  end if;

  return jsonb_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount_amount', v_discount,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value
  );
end;
$$;

-- Increment coupon usage
create or replace function public.use_coupon(p_coupon_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.coupons
  set used_count = used_count + 1
  where id = p_coupon_id and used_count < usage_limit;
end;
$$;
