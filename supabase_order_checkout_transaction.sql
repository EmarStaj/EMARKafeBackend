-- ==============================================================================
-- EMARKafe Atomic Checkout & Order Processing Stored Procedure
-- Purpose: Ensures 100% ACID compliance and eliminates race conditions during checkout.
-- ==============================================================================

CREATE OR REPLACE FUNCTION process_checkout_order(
  p_user_id UUID,
  p_branch_id UUID,
  p_order_id UUID,
  p_total_price NUMERIC,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance NUMERIC;
  v_item RECORD;
  v_new_order JSONB;
BEGIN
  -- 1. Lock user profile row and check balance
  SELECT balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RAISE EXCEPTION 'User profile not found.' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_balance < p_total_price THEN
    RAISE EXCEPTION 'Insufficient balance: available %, required %', v_current_balance, p_total_price USING ERRCODE = 'P0001';
  END IF;

  -- 2. Deduct balance from profile
  UPDATE profiles
  SET balance = balance - p_total_price
  WHERE id = p_user_id;

  -- 3. Insert order record
  INSERT INTO orders (
    id,
    user_id,
    branch_id,
    status,
    total_price,
    created_at
  ) VALUES (
    p_order_id,
    p_user_id,
    p_branch_id,
    'created',
    p_total_price,
    NOW()
  );

  -- 4. Insert order items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id UUID,
    quantity INT,
    unit_price NUMERIC,
    selected_options JSONB
  )
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      unit_price,
      selected_options
    ) VALUES (
      p_order_id,
      v_item.product_id,
      v_item.quantity,
      v_item.unit_price,
      v_item.selected_options
    );
  END LOOP;

  -- 5. Insert transaction log
  INSERT INTO transactions (
    user_id,
    amount,
    type,
    order_id,
    created_at
  ) VALUES (
    p_user_id,
    p_total_price,
    'payment',
    p_order_id,
    NOW()
  );

  -- 6. Clean up user's active cart
  DELETE FROM cart_items
  WHERE cart_id IN (
    SELECT id FROM carts
    WHERE user_id = p_user_id AND status = 'active'
  );

  -- Return created order summary
  SELECT jsonb_build_object(
    'id', p_order_id,
    'user_id', p_user_id,
    'branch_id', p_branch_id,
    'status', 'created',
    'total_price', p_total_price
  ) INTO v_new_order;

  RETURN v_new_order;
END;
$$;
