'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface AuditUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id: string | null;
  changes: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user: AuditUser | null;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const ACTIONS = [
  'create_course', 'update_course', 'publish_course', 'archive_course', 'delete_course',
  'change_role', 'activate_user', 'deactivate_user',
  'create_bundle', 'update_bundle', 'delete_bundle',
  'update_integration',
];

const RESOURCES = ['courses', 'profiles', 'course_bundles', 'integration_configs', 'modules', 'lessons'];

const ACTION_BADGE: Record<string, string> = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  publish: 'bg-teal-100 text-teal-700',
  archive: 'bg-amber-100 text-amber-700',
  activate: 'bg-emerald-100 text-emerald-700',
  deactivate: 'bg-red-100 text-red-700',
  change: 'bg-violet-100 text-violet-700',
};

function getActionColor(action: string) {
  const prefix = action.split('_')[0];
  return ACTION_BADGE[prefix] || 'bg-slate-100 text-slate-700';
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, actionFilter, resourceFilter, fromDate, toDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', '25');
      if (actionFilter) params.set('action', actionFilter);
      if (resourceFilter) params.set('resource', resourceFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const res = await api.get(`/admin/audit-logs?${params}`);
      return res.data as AuditLogsResponse;
    },
  });

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.set('action', actionFilter);
      if (resourceFilter) params.set('resource', resourceFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);
      const res = await api.get(`/admin/audit-logs/export?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'audit-logs.csv';
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('Exported audit logs');
    } catch {
      toast.error('Failed to export');
    } finally {
      setExporting(false);
    }
  };

  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Audit Logs</h1>
          <p className="text-slate-500 mt-1">Track all administrative actions on the platform.</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <select
          value={resourceFilter}
          onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Resources</option>
          {RESOURCES.map((r) => (
            <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="From"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="To"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !data?.logs.length ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-400">No audit logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 font-medium text-slate-600 w-8" />
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Timestamp</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">User</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Action</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Resource</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">IP</th>
                </tr>
              </thead>
              <tbody>
                {data.logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      className="border-b border-slate-100 hover:bg-slate-50/50 cursor-pointer"
                    >
                      <td className="px-4 py-3">
                        {expandedId === log.id ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {log.user ? `${log.user.first_name} ${log.user.last_name}` : 'System'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{log.resource.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{log.ip_address || '—'}</td>
                    </tr>
                    {expandedId === log.id && (
                      <tr key={`${log.id}-details`} className="bg-slate-50/80">
                        <td colSpan={6} className="px-8 py-4">
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <span className="text-slate-500 font-medium">Resource ID:</span>
                              <span className="ml-2 text-slate-700 font-mono">{log.resource_id || '—'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 font-medium">User Agent:</span>
                              <span className="ml-2 text-slate-700 truncate block max-w-xs">{log.user_agent || '—'}</span>
                            </div>
                            {log.user?.email && (
                              <div>
                                <span className="text-slate-500 font-medium">Email:</span>
                                <span className="ml-2 text-slate-700">{log.user.email}</span>
                              </div>
                            )}
                            {log.changes && Object.keys(log.changes).length > 0 && (
                              <div className="col-span-2">
                                <span className="text-slate-500 font-medium">Changes:</span>
                                <pre className="mt-1 p-2 bg-white rounded border border-slate-200 text-slate-700 overflow-x-auto">
                                  {JSON.stringify(log.changes, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} logs)
          </p>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
