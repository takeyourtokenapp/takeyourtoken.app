/*
# Make transactions view support frontend INSERT/UPDATE operations

The frontend (transactions.ts, transactionService.ts) inserts into 'transactions' with columns:
  user_id, transaction_type, asset, amount, status, description, metadata, tx_hash
But the view maps to wallet_transactions which expects:
  wallet_id (NOT NULL), user_id, type, currency, amount, status, tx_hash, metadata

1. Recreate the transactions view with alias columns matching frontend expectations
2. Create INSTEAD OF INSERT trigger that looks up wallet_id from custodial_wallets
3. Create INSTEAD OF UPDATE trigger for status updates
*/

DROP VIEW IF EXISTS transactions CASCADE;

CREATE VIEW transactions AS
SELECT
  wt.id,
  wt.wallet_id,
  wt.user_id,
  wt.type AS transaction_type,
  wt.type,
  wt.amount,
  wt.currency AS asset,
  wt.currency,
  wt.status,
  wt.tx_hash,
  wt.from_address,
  wt.to_address,
  wt.fee,
  wt.metadata,
  wt.metadata->>'description' AS description,
  wt.created_at,
  wt.completed_at
FROM wallet_transactions wt;

ALTER VIEW transactions SET (security_invoker = true);

-- INSTEAD OF INSERT trigger
CREATE OR REPLACE FUNCTION transactions_insert_handler()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_type text;
  v_currency text;
BEGIN
  -- Resolve type: use transaction_type if provided, else type
  v_type := COALESCE(NEW.transaction_type, NEW.type, 'transfer');
  v_currency := COALESCE(NEW.asset, NEW.currency, 'BTC');

  -- Find the user's wallet for this currency
  SELECT id INTO v_wallet_id
  FROM custodial_wallets
  WHERE user_id = NEW.user_id AND currency = v_currency::wallet_currency
  LIMIT 1;

  -- If no wallet found, try any wallet for the user
  IF v_wallet_id IS NULL THEN
    SELECT id INTO v_wallet_id
    FROM custodial_wallets
    WHERE user_id = NEW.user_id
    LIMIT 1;
  END IF;

  IF v_wallet_id IS NULL THEN
    RAISE EXCEPTION 'No wallet found for user %', NEW.user_id;
  END IF;

  -- Build metadata with description if provided
  IF NEW.description IS NOT NULL THEN
    IF NEW.metadata IS NULL THEN
      NEW.metadata := jsonb_build_object('description', NEW.description);
    ELSE
      NEW.metadata := NEW.metadata || jsonb_build_object('description', NEW.description);
    END IF;
  END IF;

  INSERT INTO wallet_transactions (
    wallet_id, user_id, type, amount, currency, status,
    tx_hash, from_address, to_address, fee, metadata, completed_at
  ) VALUES (
    v_wallet_id, NEW.user_id, v_type::transaction_type, NEW.amount,
    v_currency::wallet_currency, COALESCE(NEW.status, 'pending'),
    NEW.tx_hash, NEW.from_address, NEW.to_address, NEW.fee,
    NEW.metadata, NEW.completed_at
  )
  RETURNING id INTO NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER transactions_instead_insert
  INSTEAD OF INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION transactions_insert_handler();

-- INSTEAD OF UPDATE trigger (only update allowed columns)
CREATE OR REPLACE FUNCTION transactions_update_handler()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE wallet_transactions
  SET
    status = COALESCE(NEW.status, OLD.status),
    tx_hash = COALESCE(NEW.tx_hash, OLD.tx_hash),
    completed_at = COALESCE(NEW.completed_at, OLD.completed_at),
    metadata = COALESCE(NEW.metadata, OLD.metadata)
  WHERE id = OLD.id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER transactions_instead_update
  INSTEAD OF UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION transactions_update_handler();
