-- Bets system (scoped per VTuber)

CREATE TABLE IF NOT EXISTS bets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vtuber_id text NOT NULL,
  title text NOT NULL,
  description text,
  option_a text NOT NULL,
  option_b text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'settled')),
  created_by text NOT NULL REFERENCES users(username),
  created_at timestamptz NOT NULL DEFAULT now(),
  closes_at timestamptz,
  settled_at timestamptz
);

-- Bet placements
CREATE TABLE IF NOT EXISTS bet_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bet_id uuid NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(username),
  chosen_option text NOT NULL CHECK (chosen_option IN ('a', 'b')),
  amount integer NOT NULL CHECK (amount > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bet_placements ENABLE ROW LEVEL SECURITY;

-- Policies for bets
CREATE POLICY "Anyone can view open bets for a VTuber"
  ON bets FOR SELECT
  USING (status = 'open');

CREATE POLICY "Authenticated users can create bets for VTubers they follow/claim"
  ON bets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policies for placements
CREATE POLICY "Users can place bets on open markets"
  ON bet_placements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view their own bet placements"
  ON bet_placements FOR SELECT
  USING (user_id = (SELECT username FROM users WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bets_vtuber_status ON bets (vtuber_id, status);
CREATE INDEX IF NOT EXISTS idx_bet_placements_bet ON bet_placements (bet_id);
