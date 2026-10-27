'use client';
import { useEffect, useState } from 'react';
import { studentDocumentsApi } from '@/lib/services';
import { toast } from 'sonner';

export const DOCUMENT_OPTIONS = [
  { slug: 'admission-letter', label: 'Admission Letter' },
  { slug: 'letter-of-acceptance', label: 'Letter of Acceptance' },
  { slug: 'admission-for-training', label: 'Admission for Training' },
  { slug: 'personal-information', label: 'Student Personal Information' },
];

// The server returns JSON errors as a Blob when responseType is 'blob'
const blobError = async (e: any, fallback: string): Promise<string> => {
  try {
    const data = e?.response?.data;
    if (data instanceof Blob) return JSON.parse(await data.text())?.error || fallback;
  } catch {}
  return e?.response?.data?.error || fallback;
};

// Fetches an issued document and saves it to the user's device
export async function downloadStudentDocument(studentId: string, slug: string, fallbackName = 'document.pdf') {
  try {
    const r = await studentDocumentsApi.download(studentId, slug);
    const name = r.headers?.['content-disposition']?.match(/filename="?([^";]+)"?/i)?.[1] || fallbackName;
    const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return true;
  } catch (e: any) {
    toast.error(await blobError(e, 'Failed to download document'));
    return false;
  }
}

const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const pause = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Per-student documents: issue / regenerate / download (Admin & Registrar) ──
export function StudentDocumentsModal({ student, onClose, onChanged }: { student: any; onClose: () => void; onChanged?: () => void }) {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = () =>
    studentDocumentsApi.getForStudent(student.id)
      .then(r => setDocs(r.data.documents))
      .catch(() => toast.error('Failed to load documents'))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, [student.id]);

  // Issues the chosen documents from the saved templates, then saves each new copy to this device too
  const issue = async (slugs: string[] | 'all', regenerate = false) => {
    setBusy(Array.isArray(slugs) ? slugs[0] : 'all');
    try {
      const r = await studentDocumentsApi.issue(student.id, { documents: slugs, regenerate });
      setDocs(r.data.documents);
      onChanged?.();
      const done = (r.data.results as any[]).filter(x => x.status === 'issued' || x.status === 'regenerated');
      const failed = (r.data.results as any[]).filter(x => x.status === 'failed');
      if (failed.length) toast.error(`Could not generate: ${failed.map(f => f.label).join(', ')}`);
      if (done.length) toast.success(`${done.map(d => d.label).join(', ')} ${regenerate ? 'regenerated' : 'issued'} — students can now download it`);
      for (const d of done) {
        await downloadStudentDocument(student.id, d.slug, `${d.slug}.pdf`);
        if (done.length > 1) await pause(400);
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to issue document');
    } finally {
      setBusy(null);
    }
  };

  const confirmRegenerate = (d: any) => {
    toast(`Regenerate ${d.label}? The saved copy is replaced using the current template.`, {
      action: { label: 'Regenerate', onClick: () => issue([d.slug], true) },
    });
  };

  const issuedCount = docs.filter(d => d.issued).length;

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 w-full max-w-xl shadow-2xl my-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl text-brand-dark">Student Documents</h2>
          <button onClick={onClose} className="text-stone hover:text-brand transition" aria-label="Close">✕</button>
        </div>
        <p className="text-sm text-stone mb-5">
          {student.admission_no} — {student.application?.surname} {student.application?.other_names}
        </p>
        <p className="text-xs text-stone bg-cream-deep rounded-xl px-4 py-3 mb-4">
          Documents are built from the templates saved under <strong>Doc Templates</strong>. A student can only download a document after it has been issued here.
        </p>

        {loading ? (
          <div className="py-8 text-center text-stone text-sm">Loading…</div>
        ) : (
          <div className="space-y-3">
            {docs.map(d => (
              <div key={d.slug} className="flex items-center gap-3 border border-stone/15 rounded-2xl p-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-brand-dark text-sm">{d.label}</div>
                  <div className={`text-xs mt-0.5 ${d.issued ? 'text-green-700' : 'text-stone'}`}>
                    {d.issued ? `Issued ${fmt(d.generated_at)}` : 'Not issued — student cannot download'}
                  </div>
                </div>
                {d.issued ? (
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => downloadStudentDocument(student.id, d.slug, `${d.slug}.pdf`)} className="text-xs px-3 py-1.5 rounded-full bg-brand text-cream hover:bg-brand-dark transition font-medium">Download</button>
                    <button onClick={() => confirmRegenerate(d)} disabled={busy !== null} className="text-xs px-3 py-1.5 rounded-full border border-stone/25 text-brand hover:bg-stone/5 transition font-medium disabled:opacity-50">
                      {busy === d.slug ? 'Working…' : 'Regenerate'}
                    </button>
                  </div>
                ) : (
                  <button onClick={() => issue([d.slug])} disabled={busy !== null} className="shrink-0 text-xs px-4 py-1.5 rounded-full bg-terracotta text-white hover:opacity-90 transition font-medium disabled:opacity-50">
                    {busy === d.slug ? 'Generating…' : 'Issue'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={() => issue('all')}
            disabled={busy !== null || loading || issuedCount === docs.length}
            className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
          >
            {busy === 'all' ? 'Generating…' : issuedCount === docs.length ? 'All documents issued' : 'Issue all missing'}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Issue documents to many selected students (Admin & Registrar) ──
export function BulkIssueDocumentsModal({ studentIds, onClose, onDone }: { studentIds: string[]; onClose: () => void; onDone?: () => void }) {
  const [selected, setSelected] = useState<string[]>(DOCUMENT_OPTIONS.map(o => o.slug));
  const [regenerate, setRegenerate] = useState(false);
  const [working, setWorking] = useState(false);

  const toggle = (slug: string) => setSelected(s => (s.includes(slug) ? s.filter(x => x !== slug) : [...s, slug]));

  const run = async () => {
    if (selected.length === 0) { toast.warning('Choose at least one document'); return; }
    setWorking(true);
    try {
      const r = await studentDocumentsApi.bulkIssue({ student_ids: studentIds, documents: selected, regenerate });
      const { issued, already_issued, failed } = r.data;
      toast.success(`${issued} issued, ${already_issued} already issued${failed ? `, ${failed} failed` : ''}`);
      if (failed) toast.error('Some documents failed — try those students again');
      onDone?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to issue documents');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="font-display text-xl text-brand-dark mb-1">Issue Documents</h2>
        <p className="text-sm text-stone mb-5">For {studentIds.length} selected student{studentIds.length === 1 ? '' : 's'}, built from the saved Doc Templates.</p>
        <div className="space-y-2 mb-4">
          {DOCUMENT_OPTIONS.map(o => (
            <label key={o.slug} className="flex items-center gap-3 text-sm text-brand-dark">
              <input type="checkbox" checked={selected.includes(o.slug)} onChange={() => toggle(o.slug)} className="h-4 w-4 accent-brand" />
              {o.label}
            </label>
          ))}
        </div>
        <label className="flex items-start gap-3 text-xs text-stone mb-6">
          <input type="checkbox" checked={regenerate} onChange={e => setRegenerate(e.target.checked)} className="h-4 w-4 mt-0.5 accent-brand" />
          <span>Also regenerate documents that were already issued (replaces the saved copy with the current template)</span>
        </label>
        <div className="flex gap-3">
          <button onClick={run} disabled={working} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
            {working ? 'Generating… this can take a while' : 'Issue Documents'}
          </button>
          <button onClick={onClose} disabled={working} className="px-6 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition disabled:opacity-50">Cancel</button>
        </div>
      </div>
    </div>
  );
}
