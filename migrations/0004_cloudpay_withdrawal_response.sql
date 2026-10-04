ALTER TABLE withdrawals
  ADD COLUMN IF NOT EXISTS cloudpay_response jsonb;