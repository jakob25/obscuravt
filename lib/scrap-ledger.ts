import { supabaseAdmin } from '@/lib/supabase'

export type ScrapTxKind =
  | 'daily_bonus'
  | 'bet_place'
  | 'bet_win'
  | 'bet_loss'
  | 'shop_purchase'
  | 'cmdmi_pledge'
  | 'tag_validator'
  | 'achievement'
  | 'admin_adjust'
  | 'other'

export async function recordScrapTransaction(
  username: string,
  amount: number,
  balanceAfter: number,
  kind: ScrapTxKind,
  referenceId?: string | null,
  note?: string,
) {
  const { error } = await supabaseAdmin.from('scrap_transactions').insert({
    username,
    amount,
    balance_after: balanceAfter,
    kind,
    reference_id: referenceId ?? null,
    note: note ?? '',
    created_at: new Date().toISOString(),
  })
  if (error && error.code !== '42P01') {
    console.error('recordScrapTransaction failed:', error.message)
  }
}