ALTER TABLE deposits
  ADD COLUMN IF NOT EXISTS cloudpay_order_id text;

ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS cloudpay_order_id text;

CREATE UNIQUE INDEX IF NOT EXISTS deposits_cloudpay_order_id_unique
  ON deposits (cloudpay_order_id)
  WHERE cloudpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS withdrawals_cloudpay_order_id_unique
  ON withdrawals (cloudpay_order_id)
  WHERE cloudpay_order_id IS NOT NULL;