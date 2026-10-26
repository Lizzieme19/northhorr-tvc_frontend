'use client';
import { useEffect, useMemo, useState } from 'react';
import { financeApi } from '@/lib/services';
import { toast } from 'sonner';

type ReportType = 'fees' | 'students';

const EMPTY_FILTERS = {
  search: '', department_id: '', course_id: '', level: '', intake: '', year: '',
  status: '', gender: '', helb: '', term_id: '', fee_status: '', outstanding_only: false,
  fee_type_id: '', date_from: '', date_to: '',
};

const REPORTS: Record<ReportType, { title: string; blurb: string; sheets: string }> = {
  fees: {
    title: 'Student Fees Report',
    blurb: 'Balances, payments and what was paid per fee type.',
    sheets: 'Sheets: Summary · Fee Balances · Payments · Paid by Fee Type',
  },
  students: {
    title: 'Full Student Details Report',
    blurb: 'Personal, contact, academic, guardian and medical details for every student (plus fee position for Admin).',
    sheets: 'Sheets: Summary · Students',
  },
};

const labelCls = 'block text-xs font-semibold text-brand-dark mb-1';
const inputCls = 'w-full px-3 py-2 rounded-xl border border-stone/25 bg-white text-sm focus:outline-none focus:border-brand';

// Pulls the filename the server chose, falling back to a dated default
const filenameFrom = (disposition: string | undefined, fallback: string) => {
  const m = disposition?.match(/filename="?([^";]+)"?/i);
  return m?.[1] || fallback;
};

// The server returns JSON errors as a Blob when responseType is 'blob'
const readBlobError = async (e: any): Promise<string> => {
  try {
    const data = e?.response?.data;
    if (data instanceof Blob) return JSON.parse(await data.text())?.error || 'Failed to download report';
  } catch {}
  return e?.response?.data?.error || 'Failed to download report';
};

// `types` limits which reports are offered — the full student details report is Admin-only
// `hideFinance` removes the fee filters (Registrars have no finance access)
export default function ReportsExport({ onClose, types = ['fees', 'students'], initialType, hideFinance = false }: { onClose: () => void; types?: ReportType[]; initialType?: ReportType; hideFinance?: boolean }) {
  const [type, setType] = useState<ReportType>(initialType && types.includes(initialType) ? initialType : types[0]);
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [options, setOptions] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    financeApi.getReportFilters().then(r => setOptions(r.data)).catch(() => toast.error('Failed to load filter options'));
  }, []);

  const set = (key: keyof typeof EMPTY_FILTERS, value: any) => setFilters(f => ({ ...f, [key]: value }));

  const courses = useMemo(
    () => (options?.courses || []).filter((c: any) => !filters.department_id || c.department_id === filters.department_id),
    [options, filters.department_id]
  );

  // Only send filters that are set; payment-only filters don't apply to the details report
  const buildParams = () => {
    const params: Record<string, string> = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v === '' || v === false) return;
      if (type === 'students' && ['fee_type_id', 'date_from', 'date_to'].includes(k)) return;
      params[k] = String(v);
    });
    return params;
  };

  const activeCount = Object.keys(buildParams()).length;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const call = type === 'fees' ? financeApi.exportFeesReport : financeApi.exportStudentsReport;
      const r = await call(buildParams());
      const fallback = `${type === 'fees' ? 'Student_Fees_Report' : 'Students_Full_Details_Report'}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(r.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filenameFrom(r.headers?.['content-disposition'], fallback);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (e: any) {
      toast.error(await readBlobError(e));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-3xl p-8 w-full max-w-3xl shadow-2xl my-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-2xl text-brand-dark">Download Reports</h2>
          <button onClick={onClose} className="text-stone hover:text-brand transition" aria-label="Close">✕</button>
        </div>

        {/* Report type */}
        <div className="grid sm:grid-cols-2 gap-3 mb-6">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`text-left p-4 rounded-2xl border-2 transition ${type === t ? 'border-brand bg-brand/5' : 'border-stone/15 hover:border-brand/40'}`}
            >
              <div className="font-semibold text-brand-dark text-sm">{REPORTS[t].title}</div>
              <div className="text-xs text-stone mt-1">{REPORTS[t].blurb}</div>
              <div className="text-[11px] text-brand mt-2">{REPORTS[t].sheets}</div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-brand-dark text-sm">Filters {activeCount > 0 && <span className="text-stone font-normal">({activeCount} applied)</span>}</h3>
          <button onClick={() => setFilters({ ...EMPTY_FILTERS })} className="text-xs text-stone hover:text-brand transition">Clear all</button>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-3">
            <label className={labelCls}>Search</label>
            <input value={filters.search} onChange={e => set('search', e.target.value)} placeholder="Admission no, name, phone, ID number, email…" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Department</label>
            <select value={filters.department_id} onChange={e => { set('department_id', e.target.value); set('course_id', ''); }} className={inputCls}>
              <option value="">All departments</option>
              {(options?.departments || []).map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Course</label>
            <select value={filters.course_id} onChange={e => set('course_id', e.target.value)} className={inputCls}>
              <option value="">All courses</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Level</label>
            <select value={filters.level} onChange={e => set('level', e.target.value)} className={inputCls}>
              <option value="">All levels</option>
              {(options?.levels || []).map((l: string) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Intake</label>
            <select value={filters.intake} onChange={e => set('intake', e.target.value)} className={inputCls}>
              <option value="">All intakes</option>
              {(options?.intakes || []).map((i: string) => <option key={i} value={i}>{i.charAt(0) + i.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Year</label>
            <select value={filters.year} onChange={e => set('year', e.target.value)} className={inputCls}>
              <option value="">All years</option>
              {(options?.years || []).map((y: number) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Student status</label>
            <select value={filters.status} onChange={e => set('status', e.target.value)} className={inputCls}>
              <option value="">All statuses</option>
              {(options?.student_statuses || []).map((s: string) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </select>
          </div>

          <div>
            <label className={labelCls}>Gender</label>
            <select value={filters.gender} onChange={e => set('gender', e.target.value)} className={inputCls}>
              <option value="">All</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>HELB</label>
            <select value={filters.helb} onChange={e => set('helb', e.target.value)} className={inputCls}>
              <option value="">All</option>
              <option value="true">Applied</option>
              <option value="false">Not applied</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Term</label>
            <select value={filters.term_id} onChange={e => set('term_id', e.target.value)} className={inputCls}>
              <option value="">All terms</option>
              {(options?.terms || []).map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.academic_year})</option>)}
            </select>
          </div>

          {!hideFinance && <div>
            <label className={labelCls}>Fee status</label>
            <select value={filters.fee_status} onChange={e => set('fee_status', e.target.value)} className={inputCls}>
              <option value="">All</option>
              {(options?.fee_statuses || []).map((s: string) => <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>)}
            </select>
          </div>}
          {!hideFinance && <label className="flex items-center gap-2 text-sm text-brand-dark sm:col-span-2 sm:pt-5">
            <input type="checkbox" checked={filters.outstanding_only} onChange={e => set('outstanding_only', e.target.checked)} className="h-4 w-4 accent-brand" />
            Only students with an outstanding balance
          </label>}

          {type === 'fees' && (
            <>
              <div>
                <label className={labelCls}>Fee type (payments)</label>
                <select value={filters.fee_type_id} onChange={e => set('fee_type_id', e.target.value)} className={inputCls}>
                  <option value="">All fee types</option>
                  {(options?.fee_types || []).map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Payments from</label>
                <input type="date" value={filters.date_from} onChange={e => set('date_from', e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Payments to</label>
                <input type="date" value={filters.date_to} onChange={e => set('date_to', e.target.value)} className={inputCls} />
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-stone mt-4">
          Every data sheet also has Excel filter dropdowns on its header row, so you can keep slicing the data after downloading.
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={downloading || !options}
            className="flex-1 py-2.5 rounded-xl bg-brand text-cream font-semibold hover:bg-brand-dark transition disabled:opacity-50"
          >
            {downloading ? 'Preparing Excel…' : `⬇ Download ${REPORTS[type].title} (.xlsx)`}
          </button>
          <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-stone/25 text-brand font-semibold hover:bg-stone/5 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
