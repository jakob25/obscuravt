-- Vault Scraps ledger for tamper-evident economy tracking

CREATE TABLE IF NOT EXISTS scrap_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL REFERENCES users(username) ON DELETE CASCADE,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  kind text NOT NULL CHECK (kind IN (
    'daily_bonus', 'bet_place', 'bet_win', 'bet_loss', 'shop_purchase',
    'cmdmi_pledge', 'tag_validator', 'achievement', 'admin_adjust', 'other'
  )),
  reference_id text,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scrap_tx_username ON scrap_transactions(username, created_at DESC);