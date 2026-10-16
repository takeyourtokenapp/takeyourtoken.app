/*
# Add blockchain, miner_id, updated_at to transactions view

1. Modified Views
- `transactions`: recreated to expose `blockchain` and `miner_id` from the underlying
  `metadata` JSONB column, plus `updated_at` (aliased to `created_at` since wallet_transactions
  has no separate updated_at column). This fixes transactionService.ts which filters on
  `blockchain` and reads `miner_id`.

2. Triggers
- Re-creates the INSTEAD OF INSERT and INSTEAD OF UPDATE triggers since the view was recreated.
  The INSERT trigger now also extracts `blockchain` and `miner_id` from the NEW record and
  stores them inside the `metadata` JSONB on the underlying `wallet_transactions` row.

3. Notes
- `blockchain` is extracted as `metadata->>'blockchain'`
- `miner_id` is extracted as `metadata->>'miner_id'` (cast to text for view compatibility)
- The underlying `wallet_transactions` table schema is unchanged
*/

DROP TRIGGER IF EXISTS transactions_instead_insert ON transactions;
DROP TRIGGER IF EXISTS transactions_instead_update ON transactions;
DROP VIEW IF EXISTS transactions;

CREATE OR REPLACE VIEW transactions AS
SELECT
  id,
  wallet_id,
  user_id,
  type AS transaction_type,
  type,
  amount,
  currency AS asset,
  currency,
  status,
  tx_hash,
  from_address,
  to_address,
  fee,
  metadata,
  metadata ->> 'description'::text AS description,
  metadata ->> 'blockchain'::text AS blockchain,
  metadata ->> 'miner_id'::text AS miner_id,
  created_at,
  created_at AS updated_at,
  completed_at
FROM wallet_transactions wt;

CREATE OR REPLACE FUNCTION transactions_insert_handler()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_metadata jsonb;
BEGIN
  -- Look up wallet_id from custodial_wallets if not provided
  IF NEW.wallet_id IS NOT NULL THEN
    v_wallet_id := NEW.wallet_id;
  ELSE
    SELECT id INTO v_wallet_id
    FROM custodial_wallets
    WHERE user_id = NEW.user_id AND currency = COALESCE(NEW.currency, NEW.asset)
    LIMIT 1;
  END IF;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'No wallet found for user % and currency %', NEW.user_id, COALESCE(NEW.currency, NEW.asset);
  END IF;

  -- Build metadata from description, blockchain, miner_id, and any explicit metadata
  v_metadata := COALESCE(NEW.metadata, '{}'::jsonb);
  IF NEW.description IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('description', NEW.description);
  END IF;
  IF NEW.blockchain IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('blockchain', NEW.blockchain);
  END IF;
  IF NEW.miner_id IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('miner_id', NEW.miner_id);
  END IF;

  INSERT INTO wallet_transactions (
    wallet_id, user_id, type, amount, currency, status,
    tx_hash, from_address, to_address, fee, metadata, created_at, completed_at
  ) VALUES (
    v_wallet_id, NEW.user_id, COALESCE(NEW.type, NEW.transaction_type), NEW.amount,
    COALESCE(NEW.currency, NEW.asset), COALESCE(NEW.status, 'pending'),
    NEW.tx_hash, NEW.from_address, NEW.to_address, NEW.fee, v_metadata,
    COALESCE(NEW.created_at, now()), NEW.completed_at
  )
  RETURNING id, wallet_id, user_id, type, amount, currency, status,
    tx_hash, from_address, to_address, fee, metadata, created_at, completed_at
  INTO NEW.id, NEW.wallet_id, NEW.user_id, NEW.type, NEW.amount, NEW.currency, NEW.status,
    NEW.tx_hash, NEW.from_address, NEW.to_address, NEW.fee, NEW.metadata, NEW.created_at, NEW.completed_at;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION transactions_update_handler()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_metadata jsonb;
BEGIN
  v_metadata := COALESCE(NEW.metadata, OLD.metadata, '{}'::jsonb);
  IF NEW.description IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('description', NEW.description);
  END IF;
  IF NEW.blockchain IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('blockchain', NEW.blockchain);
  END IF;
  IF NEW.miner_id IS NOT NULL THEN
    v_metadata := v_metadata || jsonb_build_object('miner_id', NEW.miner_id);
  END IF;

  UPDATE wallet_transactions
  SET
    type = COALESCE(NEW.type, NEW.transaction_type, type),
    amount = COALESCE(NEW.amount, amount),
    currency = COALESCE(NEW.currency, NEW.asset, currency),
    status = COALESCE(NEW.status, status),
    tx_hash = COALESCE(NEW.tx_hash, tx_hash),
    from_address = COALESCE(NEW.from_address, from_address),
    to_address = COALESCE(NEW.to_address, to_address),
    fee = COALESCE(NEW.fee, fee),
    metadata = v_metadata,
    completed_at = COALESCE(NEW.completed_at, completed_at)
  WHERE id = OLD.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER transactions_instead_insert
INSTEAD OF INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION transactions_insert_handler();

CREATE TRIGGER transactions_instead_update
INSTEAD OF UPDATE ON transactions
FOR EACH ROW EXECUTE FUNCTION transactions_update_handler();
