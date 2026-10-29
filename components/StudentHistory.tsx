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
                <div>Started: <strong className="text-brand-dark">{fmtDate(st.started_at)}</strong></div>
                <div>{st.is_current ? 'Status: ' : 'Completed: '}<strong className="text-brand-dark">{st.is_current ? 'Current level' : fmtDate(st.ended_at)}</strong></div>
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

// ── Link an older record of the same person into this one ──
export function LinkRecordModal({ student, onClose, onDone }: { student: any; onClose: () => void; onDone?: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [picked, setPicked] = useState<any>(null);
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

  const link = async () => {
    setWorking(true);
    try {
      const r = await studentsApi.merge(student.id, picked.id);
      toast.success(r.data.message);
      onDone?.();
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to link records');
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl my-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="font-display text-xl text-brand-dark">Link Earlier Record</h2>
          <button onClick={onClose} className="text-stone hover:text-brand transition" aria-label="Close">✕</button>
        </div>
        <p className="text-sm text-stone mb-1">
          Current record: <strong className="text-brand-dark">{student.admission_no}</strong> — {name(student)} ({student.level})
        </p>
        <p className="text-xs text-stone mb-4">
          Find the student&apos;s <em>older</em> record (for example their Level 4 admission). Its admission number, intake and dates are added to this student&apos;s history.
        </p>

        {!picked ? (
          <>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search older admission no or name…" autoFocus
              className="w-full px-4 py-3 rounded-xl border border-stone/25 text-sm focus:outline-none focus:border-brand" />
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
              {results.map(s => (
                <button key={s.id} onClick={() => setPicked(s)} className="w-full text-left border border-stone/15 rounded-xl p-3 hover:border-brand hover:bg-brand/5 transition">
                  <div className="font-mono text-xs text-brand">{s.admission_no}</div>
                  <div className="text-sm text-brand-dark font-medium">{name(s)}</div>
                  <div className="text-xs text-stone">{s.level} · {titleCase(s.intake)} {s.year} · {s.course?.name}</div>
                </button>
              ))}
              {query.trim().length >= 2 && results.length === 0 && <p className="text-sm text-stone text-center py-4">No matching students.</p>}
            </div>
          </>
        ) : (
          <>
            <div className="border border-stone/15 rounded-xl p-4 mb-4">
              <div className="text-xs text-stone mb-1">Older record to link</div>
              <div className="font-mono text-sm text-brand font-semibold">{picked.admission_no}</div>
              <div className="text-sm text-brand-dark">{name(picked)} · {picked.level} · {titleCase(picked.intake)} {picked.year}</div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 mb-5">
              <strong>This can&apos;t be undone.</strong> Make sure both records are the same person. Fee balances, payments and documents of the older record move to this student,
              and the older record and its login are removed. Its details stay in the history.
            </div>
            <div className="flex gap-3">
              <button onClick={link} disabled={working} className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50">
                {working ? 'Linking…' : 'Link records'}
              </button>
              <button onClick={() => setPicked(null)} disabled={working} className="px-5 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">Back</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
