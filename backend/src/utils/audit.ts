import { supabase } from '../lib/supabase.js';

export async function logAudit(params: {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const { error } = await supabase.from('audit_logs').insert({
    user_id: params.userId,
    action: params.action,
    resource: params.resource,
    resource_id: params.resourceId,
    changes: params.changes,
    ip_address: params.ipAddress,
    user_agent: params.userAgent,
  });

  if (error) {
    console.error('Failed to write audit log:', error.message);
  }
}
