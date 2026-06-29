import { supabaseAdmin } from '@/lib/supabase'

export async function recordAuditLog(
  actor: string,
  action: string,
  targetType: string,
  targetId?: string | null,
  details?: Record<string, unknown>,
) {
  const { error } = await supabaseAdmin.from('admin_audit_log').insert({
    actor,
    action,
    target_type: targetType,
    target_id: targetId ?? null,
    details: details ?? {},
    created_at: new Date().toISOString(),
  })
  if (error && error.code !== '42P01') {
    console.error('recordAuditLog failed:', error.message)
  }
}