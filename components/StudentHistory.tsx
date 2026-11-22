'use client';
import { useEffect, useState } from 'react';
import { termProgressionApi, studentsApi } from '@/lib/services';
import { toast } from 'sonner';

const KIND_LABEL: Record<string, string> = {
  ADMISSION: 'First admission',
  PROMOTION: 'Promoted',
  RE_ADMISSION: 'Re-admitted',
  LINKED: 'Records linked',
};

const fmtDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const titleCase = (s?: string | null) => (s ? s.charAt(0) + s.slice(1).toLowerCase() : '—');

// ── Timeline of every level a student has been through ──
export function StudentHistoryTimeline({ stages }: { stages: any[] }) {
  if (!stages?.length) return <p className="text-sm text-stone">No history recorded.</p>;
  return (
    <ol className="relative">
      {stages.map((st: any, i: number) => (
        <li key={i} className="flex gap-4 relative">
          {i < stages.length - 1 && <div className="absolute left-5 top-11 bottom-0 w-0.5 bg-brand/20" />}
          <div className={`shrink-0 mt-1 h-10 w-10 rounded-full grid place-items-center text-xs font-bold border-2 ${st.is_current ? 'bg-brand text-cream border-brand' : 'bg-brand/10 text-brand border-brand/40'}`}>
            {String(st.level).replace(/Level\s*/i, 'L')}
          </div>
          <div className="flex-1 pb-5">
            <div className={`rounded-2xl border p-4 ${st.is_current ? 'border-brand/40 bg-brand/5' : 'border-stone/15 bg-white'}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-sm font-semibold text-brand-dark">{st.admission_no || '—'}</div>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-cream-deep text-stone font-medium">{KIND_LABEL[st.kind] || st.kind}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${st.is_current ? 'bg-green-100 text-green-800' : 'bg-stone/15 text-stone'}`}>
                    {st.is_current ? titleCase(st.status) : 'Completed'}
                  </span>
                </div>
              </div>
              <div className="mt-2 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-stone">
                <div>Level: <strong className="text-brand-dark">{st.level}</strong></div>
                <div>Intake: <strong className="text-brand-dark">{st.intake ? `${titleCase(st.intake)} ${st.year ?? ''}` : '—'}</strong></div>
                {st.course && <div className="sm:col-span-2">Course: <strong className="text-brand-dark">{st.course}</strong></div>}
                <div>Started: <strong className="text-brand-dark">{fmtDate(st.started_at)}</strong>{st.start_term && <span> · {st.start_term}</span>}</div>
                <div>{st.is_current ? 'Status: ' : 'Completed: '}<strong className="text-brand-dark">{st.is_current ? (st.status === 'ACTIVE' ? 'Current level' : titleCase(st.status)) : fmtDate(st.ended_at)}</strong></div>
                {st.term && <div className="sm:col-span-2">Term: <strong className="text-brand-dark">{st.term}</strong></div>}
              </div>
              {st.notes && <p className="mt-2 text-xs text-stone italic">{st.notes}</p>}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

// Fetches and shows one student's history (used in the student portal)
export function StudentHistoryPanel({ studentId }: { studentId: string }) {
  const [data, setData] = useState<any>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    termProgressionApi.getHistory(studentId).then(r => setData(r.data)).catch(() => setFailed(true));
  }, [studentId]);
  if (failed) return <p className="text-sm text-stone">Your academic history is not available right now.</p>;
  if (!data) return <p className="text-sm text-stone">Loading…</p>;
  return <StudentHistoryTimeline stages={data.stages} />;
}

// ── Staff view of a student's history ──
export function StudentHistoryModal({ student, onClose }: { student: any; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    termProgressionApi.getHistory(student.id).then(r => setData(r.data)).catch(() => { toast.error('Failed to load history'); onClose(); });
  }, [student.id]);
  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl my-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl text-brand-dark">Academic History</h2>
          <button onClick={onClose} className="text-stone hover:text-brand transition" aria-label="Close">✕</button>
        </div>
        <p className="text-sm text-stone mb-5">
          {student.application?.surname} {student.application?.other_names} · {data?.student?.course || student.course?.name}
        </p>
        {data ? <StudentHistoryTimeline stages={data.stages} /> : <p className="py-8 text-center text-sm text-stone">Loading…</p>}
        <button onClick={onClose} className="mt-2 w-full py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Close</button>
      </div>
    </div>
  );
}

// ── Link another admission of the same person: compare first, then link. Nothing is moved or deleted. ──
function AdmissionCard({ heading, a }: { heading: string; a: any }) {
  const kes = (n: number) => `KES ${Math.round(n || 0).toLocaleString()}`;
  return (
    <div className="border border-stone/15 rounded-xl p-3 text-xs">
      <div className="text-[11px] uppercase tracking-wider text-stone mb-1">{heading}</div>
      <div className="font-mono text-sm text-brand font-semibold">{a.admission_no}</div>
      <div className="text-brand-dark font-medium">{a.name}</div>
      <div className="text-stone mt-1 space-y-0.5">
        <div>{a.course} · {a.level}</div>
        <div>{titleCase(a.intake)} {a.year} · {titleCase(a.status)}</div>
        <div>Admitted {fmtDate(a.admitted_on)} · {a.terms_billed} term{a.terms_billed === 1 ? '' : 's'} billed</div>
        {a.billed !== undefined && <div>Billed {kes(a.billed)} · Paid {kes(a.paid)} · <strong className={a.outstanding > 0 ? 'text-red-600' : 'text-green-700'}>Owed {kes(a.outstanding)}</strong></div>}
      </div>
    </div>
  );
}

export function LinkRecordModal({ student, onClose, onDone }: { student: any; onClose: () => void; onDone?: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [picked, setPicked] = useState<any>(null);
  const [preview, setPreview] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [ack, setAck] = useState(false);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      studentsApi.getAll({ search: query.trim(), limit: 8 })
        .then(r => setResults((r.data.students || []).filter((s: any) => s.id !== student.id)))
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [query, student.id]);

  const name = (s: any) => `${s.application?.surname || ''} ${s.application?.other_names || ''}`.trim();

  const pick = async (s: any) => {
    setPicked(s); setPreview(null); setAck(false); setLoadingPreview(true);
    try { const r = await studentsApi.previewLink(student.id, s.id); setPreview(r.data); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Could not compare the two admissions'); setPicked(null); }
    finally { setLoadingPreview(false); }
  };

  const link = async () => {
    setWorking(true);
    try {
      const r = await studentsApi.linkAdmission(student.id, picked.id, ack);
      toast.success(r.data.message, { duration: 9000 });
      onDone?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to link the admissions');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl my-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl text-brand-dark">Link another admission</h2>
          <button onClick={onClose} className="text-stone hover:text-brand transition" aria-label="Close">✕</button>
        </div>
        <p className="text-sm text-stone mb-1">
          This record keeps the login: <strong className="text-brand-dark">{student.admission_no}</strong> — {name(student)} ({student.level})
        </p>
        <p className="text-xs text-stone mb-4">
          Find the same person&apos;s other admission (for example their Level 5 one). Both stay as they are, each with its own course, level, intake, dates, bills, payments and documents. They share one login, and either admission number opens the same profile.
        </p>

        {!picked ? (
          <>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search the other admission no or name…" autoFocus
              className="w-full px-4 py-3 rounded-xl border border-stone/25 text-sm focus:outline-none focus:border-brand" />
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {results.map(s => (
                <button key={s.id} onClick={() => pick(s)} className="w-full text-left border border-stone/15 rounded-xl p-3 hover:border-brand hover:bg-brand/5 transition">
                  <div className="font-mono text-xs text-brand">{s.admission_no}</div>
                  <div className="text-sm text-brand-dark font-medium">{name(s)}</div>
                  <div className="text-xs text-stone">{s.level} · {titleCase(s.intake)} {s.year} · {s.course?.name}</div>
                </button>
              ))}
              {query.trim().length >= 2 && results.length === 0 && <p className="text-sm text-stone text-center py-4">No matching students.</p>}
            </div>
          </>
        ) : loadingPreview || !preview ? (
          <p className="py-10 text-center text-sm text-stone">Comparing the two admissions…</p>
        ) : (
          <>
            <div className="grid sm:grid-cols-2 gap-3 mb-4">
              <AdmissionCard heading="Keeps the login" a={preview.primary} />
              <AdmissionCard heading="Linked under it" a={preview.other} />
            </div>

            {preview.same_person_signals.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-xs text-green-800 mb-3">
                Looks like the same person: {preview.same_person_signals.join(', ').toLowerCase()}.
              </div>
            )}
            {preview.blockers.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-800 mb-3 space-y-1">
                {preview.blockers.map((b: string, i: number) => <p key={i}>{b}</p>)}
              </div>
            )}
            {preview.differences.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-900 mb-3">
                <p className="font-semibold mb-1">Details that differ</p>
                <table className="w-full"><tbody>
                  {preview.differences.map((d: any) => <tr key={d.field}><td className="py-0.5 pr-3 text-stone">{d.label}</td><td className="pr-3">{d.primary || '—'}</td><td className="text-stone">vs {d.other || '—'}</td></tr>)}
                </tbody></table>
              </div>
            )}
            {preview.warnings.length > 0 && (
              <ul className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-900 mb-3 space-y-1 list-disc pl-8">
                {preview.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            )}
            {preview.can_link && preview.needs_acknowledgement && (
              <label className="flex items-start gap-2 text-sm text-brand-dark mb-4 cursor-pointer">
                <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-1" />
                <span>I have checked the points above and these are the same person.</span>
              </label>
            )}
            <p className="text-xs text-stone mb-4">The other admission&apos;s own login is switched off, and it can be unlinked later by an administrator to get its login back.</p>
            <div className="flex gap-3">
              <button onClick={link} disabled={working || !preview.can_link || (preview.needs_acknowledgement && !ack)} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                {working ? 'Linking…' : 'Link admissions'}
              </button>
              <button onClick={() => { setPicked(null); setPreview(null); }} disabled={working} className="px-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
