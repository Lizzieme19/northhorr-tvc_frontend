'use client';
import { useRef, useState } from 'react';
import { studentsApi } from '@/lib/services';
import { toast } from 'sonner';

type Filter = 'all' | 'ready' | 'duplicate' | 'error';

const STATUS_STYLE: Record<string, string> = {
  ready: 'bg-green-100 text-green-800',
  duplicate: 'bg-amber-100 text-amber-800',
  error: 'bg-red-100 text-red-800',
};
const STATUS_LABEL: Record<string, string> = { ready: 'Ready', duplicate: 'Review', error: 'Problem' };

const saveBlob = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
};

const csvCell = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;

// Import students from a CSV, XLS or XLSX file: check first, then import what is ready.
export default function StudentImportModal({ onClose, onDone }: { onClose: () => void; onDone?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [allowSimilar, setAllowSimilar] = useState(false);
  const [checking, setChecking] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const input = useRef<HTMLInputElement>(null);

  const check = async (f: File, similar = allowSimilar) => {
    setChecking(true);
    setPreview(null);
    try {
      const r = await studentsApi.importPreview(f, similar);
      setPreview(r.data);
      setFilter('all');
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Could not read that file');
      setFile(null);
    } finally {
      setChecking(false);
    }
  };

  const choose = (f: File | null) => {
    if (!f) return;
    if (!/\.(csv|xls|xlsx)$/i.test(f.name)) { toast.error('Choose a CSV, XLS or XLSX file'); return; }
    setFile(f);
    setResult(null);
    check(f);
  };

  const run = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const r = await studentsApi.importStudents(file, allowSimilar);
      setResult(r.data);
      toast.success(r.data.message);
      onDone?.();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const r = await studentsApi.importTemplate();
      saveBlob(r.data, 'Student_Import_Template.xlsx');
    } catch {
      toast.error('Could not download the template');
    }
  };

  // Temporary passwords are only available now, so offer them as a file to hand out
  const downloadCredentials = () => {
    const lines = [
      ['Admission No', 'Name', 'Email', 'Temporary password'],
      ...result.credentials.map((c: any) => [c.admission_no, c.name, c.email, c.password]),
    ];
    saveBlob(new Blob(['﻿' + lines.map(l => l.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }), 'Student_Login_Details.csv');
  };

  const rows = (preview?.rows || []).filter((r: any) => filter === 'all' || r.status === filter);
  const s = preview?.summary;

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-4xl shadow-2xl my-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl text-brand-dark">Import students</h2>
          <button onClick={onClose} className="text-stone hover:text-brand transition" aria-label="Close">✕</button>
        </div>

        {/* ── Result ── */}
        {result ? (
          <div>
            <div className="grid grid-cols-3 gap-3 my-5 text-center">
              <div className="bg-green-50 rounded-xl p-4"><div className="text-2xl font-bold text-green-700">{result.summary.created}</div><div className="text-xs text-stone">imported</div></div>
              <div className="bg-amber-50 rounded-xl p-4"><div className="text-2xl font-bold text-amber-700">{result.summary.skipped}</div><div className="text-xs text-stone">skipped (problems or duplicates)</div></div>
              <div className="bg-red-50 rounded-xl p-4"><div className="text-2xl font-bold text-red-600">{result.summary.failed}</div><div className="text-xs text-stone">failed while importing</div></div>
            </div>
            {result.credentials.length > 0 && (
              <div className="bg-brand/5 border border-brand/20 rounded-2xl p-4 mb-4">
                <div className="font-semibold text-brand-dark text-sm mb-1">Login details for the new students</div>
                <p className="text-xs text-stone mb-3">
                  Each student has their own temporary password and must change it at first sign-in. <strong>The passwords can&apos;t be shown again</strong>, so download them now.
                </p>
                <button onClick={downloadCredentials} className="px-4 py-2 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition">⬇ Download login details (CSV)</button>
              </div>
            )}
            {result.errors?.length > 0 && (
              <div className="mb-4 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                <div className="font-semibold mb-1">Failed rows</div>
                <ul className="list-disc pl-4">{result.errors.map((e: any, i: number) => <li key={i}>Row {e.row} ({e.name}): {e.error}</li>)}</ul>
              </div>
            )}
            <button onClick={onClose} className="w-full py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Done</button>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone mb-4">
              Upload a CSV, XLS or XLSX file. It is checked first, and nothing is created until you confirm.{' '}
              <button onClick={downloadTemplate} className="text-brand font-medium hover:underline">Download the Excel template</button>
            </p>

            {/* ── File ── */}
            {!file && (
              <label
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); choose(e.dataTransfer.files?.[0] || null); }}
                className="block w-full border-2 border-dashed border-brand/30 rounded-2xl p-10 text-center cursor-pointer hover:border-brand hover:bg-brand/5 transition"
              >
                <input ref={input} type="file" accept=".csv,.xls,.xlsx" className="hidden" onChange={e => choose(e.target.files?.[0] || null)} />
                <div className="text-4xl mb-2">📄</div>
                <div className="text-sm font-medium text-brand-dark">Click to choose a file, or drop it here</div>
                <div className="text-xs text-stone mt-1">.csv, .xls or .xlsx · up to 1,000 students</div>
              </label>
            )}

            {file && (
              <div className="flex items-center justify-between gap-3 border border-stone/15 rounded-xl px-4 py-3 mb-4 text-sm">
                <div className="min-w-0 truncate"><span className="mr-2">📄</span><span className="font-medium text-brand-dark">{file.name}</span></div>
                <button
                  onClick={() => { setFile(null); setPreview(null); if (input.current) input.current.value = ''; }}
                  className="shrink-0 text-xs text-brand hover:underline font-medium"
                >
                  Choose another file
                </button>
              </div>
            )}

            {checking && <div className="py-10 text-center text-sm text-stone">Checking the file…</div>}

            {/* ── Preview ── */}
            {preview && s && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-3 text-center">
                  <button onClick={() => setFilter(filter === 'ready' ? 'all' : 'ready')} className={`rounded-xl p-3 border-2 transition bg-green-50 ${filter === 'ready' ? 'border-green-500' : 'border-transparent'}`}>
                    <div className="text-xl font-bold text-green-700">{s.ready}</div>
                    <div className="text-xs text-stone">ready to import{s.with_warnings ? ` (${s.with_warnings} with notes)` : ''}</div>
                  </button>
                  <button onClick={() => setFilter(filter === 'duplicate' ? 'all' : 'duplicate')} className={`rounded-xl p-3 border-2 transition bg-amber-50 ${filter === 'duplicate' ? 'border-amber-500' : 'border-transparent'}`}>
                    <div className="text-xl font-bold text-amber-700">{s.duplicates}</div>
                    <div className="text-xs text-stone">look like existing students</div>
                  </button>
                  <button onClick={() => setFilter(filter === 'error' ? 'all' : 'error')} className={`rounded-xl p-3 border-2 transition bg-red-50 ${filter === 'error' ? 'border-red-500' : 'border-transparent'}`}>
                    <div className="text-xl font-bold text-red-600">{s.errors}</div>
                    <div className="text-xs text-stone">have problems</div>
                  </button>
                </div>

                {preview.ignored_columns?.length > 0 && (
                  <p className="text-xs text-stone mb-3">Columns not used: {preview.ignored_columns.join(', ')}</p>
                )}

                <div className="border border-stone/15 rounded-2xl overflow-hidden mb-4">
                  <div className="max-h-80 overflow-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-cream-deep text-stone uppercase tracking-wider sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left">Row</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Student</th>
                          <th className="px-3 py-2 text-left">Course · Level</th>
                          <th className="px-3 py-2 text-left">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone/10">
                        {rows.map((r: any) => (
                          <tr key={r.row} className="align-top">
                            <td className="px-3 py-2 text-stone">{r.row}</td>
                            <td className="px-3 py-2"><span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_STYLE[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                            <td className="px-3 py-2">
                              <div className="font-medium text-brand-dark">{r.name || '—'}</div>
                              <div className="font-mono text-stone">{r.admission_no || 'auto'}</div>
                            </td>
                            <td className="px-3 py-2 text-stone">
                              {r.course || '—'} · {r.level || '—'}
                              <div>{r.intake ? r.intake.charAt(0) + r.intake.slice(1).toLowerCase() : ''} {r.year || ''}{r.term ? ` · ${r.term}` : ''}</div>
                            </td>
                            <td className="px-3 py-2">
                              {r.messages.map((m: string, i: number) => <div key={i} className="text-red-700">{m}</div>)}
                              {r.warnings.map((m: string, i: number) => <div key={`w${i}`} className="text-stone">{m}</div>)}
                            </td>
                          </tr>
                        ))}
                        {rows.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-stone">No rows in this group.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                {s.duplicates > 0 && (
                  <label className="flex items-start gap-3 text-xs text-stone mb-4">
                    <input
                      type="checkbox"
                      checked={allowSimilar}
                      onChange={e => { setAllowSimilar(e.target.checked); if (file) check(file, e.target.checked); }}
                      className="h-4 w-4 mt-0.5 accent-brand"
                    />
                    <span>Also import the rows that look like existing students (same ID number, or same name and date of birth). Usually better to continue the existing student instead.</span>
                  </label>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={run}
                    disabled={importing || s.ready === 0}
                    className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
                  >
                    {importing ? 'Importing… this can take a minute' : s.ready === 0 ? 'Nothing is ready to import' : `Import ${s.ready} student${s.ready === 1 ? '' : 's'}`}
                  </button>
                  <button onClick={onClose} disabled={importing} className="px-6 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Cancel</button>
                </div>
                {(s.errors > 0 || s.duplicates > 0) && !importing && (
                  <p className="text-xs text-stone mt-2 text-center">Rows with problems are skipped. Fix them in the file and import it again. Students already imported are then recognised as duplicates.</p>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
