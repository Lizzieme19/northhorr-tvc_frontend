'use client';
import { useState } from 'react';
import { reportsApi } from '@/lib/services';
import api from '@/lib/api';
import { toast } from 'sonner';

// One student's fee statement, on the college letterhead with their name and admission number as the heading:
// opened to read or print, or downloaded as PDF or Excel. `mine` is for a student's own statement.
const nameFrom = (disposition: string | undefined, fallback: string) => disposition?.match(/filename="?([^";]+)"?/i)?.[1] || fallback;
const readBlobError = async (e: any): Promise<string> => {
  try { const d = e?.response?.data; if (d instanceof Blob) return JSON.parse(await d.text())?.error || 'The statement could not be made'; } catch { /* fall through */ }
  return e?.response?.data?.error || 'The statement could not be made';
};
const save = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export default function StatementButtons({ studentId, mine = false, excel = true, className = '' }: { studentId?: string; mine?: boolean; excel?: boolean; className?: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const fetchFile = (kind: 'pdf' | 'xlsx', inline = false) =>
    mine ? api.get('/reports/my-statement/pdf', { params: inline ? { inline: '1' } : {}, responseType: 'blob' })
      : reportsApi.file('student-statement', kind, { student_id: studentId, ...(inline ? { inline: '1' } : {}) });

  const view = async () => {
    const w = window.open('', '_blank'); // opened first, so the browser does not block it
    setBusy('view');
    try {
      const r = await fetchFile('pdf', true);
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      if (w) w.location.href = url; else save(r.data, 'fee-statement.pdf');
    } catch (e: any) { w?.close(); toast.error(await readBlobError(e)); }
    finally { setBusy(null); }
  };
  const download = async (kind: 'pdf' | 'xlsx') => {
    setBusy(kind);
    try {
      const r = await fetchFile(kind);
      save(r.data, nameFrom(r.headers?.['content-disposition'], `fee-statement.${kind}`));
      toast.success(kind === 'pdf' ? 'Statement downloaded' : 'Excel file downloaded');
    } catch (e: any) { toast.error(await readBlobError(e)); }
    finally { setBusy(null); }
  };

  const btn = 'px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50';
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <button onClick={view} disabled={!!busy} className={`${btn} border border-stone/25 bg-white text-brand hover:bg-brand/5`}>{busy === 'view' ? 'Opening…' : '👁 View statement'}</button>
      <button onClick={() => download('pdf')} disabled={!!busy} className={`${btn} bg-brand text-cream hover:bg-brand-dark`}>{busy === 'pdf' ? 'Preparing…' : '⬇ PDF'}</button>
      {excel && !mine && <button onClick={() => download('xlsx')} disabled={!!busy} className={`${btn} border border-brand/40 bg-white text-brand hover:bg-brand/5`}>{busy === 'xlsx' ? 'Preparing…' : '⬇ Excel'}</button>}
    </div>
  );
}
