'use client';
import { useEffect, useRef, useState } from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

// The look of the student ID card: colours, background pattern, watermark and banner text. The picture on the right
// is made by the server from what is on screen, so it is exactly what will print. Nothing changes until Save.

type Design = { primary: string; secondary: string; label_color: string; pattern: string; pattern_strength: number; watermark: boolean; banner_text: string };

const PATTERNS: [string, string][] = [['waves', 'Waves'], ['diagonal', 'Diagonal lines'], ['dots', 'Dots'], ['chevrons', 'Zigzag'], ['none', 'Plain']];
const inp = 'w-full px-3 py-2 rounded-lg border border-stone/25 text-sm focus:outline-none focus:border-brand bg-white';
const lab = 'block text-xs font-semibold text-brand-dark mb-1';

function Colour({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className={lab}>{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-9 w-12 rounded border border-stone/25 bg-white p-0.5" />
        <input value={value} onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && onChange(e.target.value)} className={`${inp} font-mono`} />
      </div>
    </div>
  );
}

export default function IdCardDesign() {
  const [design, setDesign] = useState<Design | null>(null);
  const [defaults, setDefaults] = useState<Design | null>(null);
  const [img, setImg] = useState<string | null>(null);
  const [making, setMaking] = useState(false);
  const [saving, setSaving] = useState(false);
  const last = useRef<string | null>(null);

  useEffect(() => { api.get('/id-card/design').then(r => { setDesign(r.data.design); setDefaults(r.data.defaults); }).catch(() => toast.error('Could not load the design')); }, []);

  // redraw the sample card shortly after each change
  useEffect(() => {
    if (!design || !/^#[0-9a-fA-F]{6}$/.test(design.primary) || !/^#[0-9a-fA-F]{6}$/.test(design.secondary) || !/^#[0-9a-fA-F]{6}$/.test(design.label_color)) return;
    const t = setTimeout(async () => {
      setMaking(true);
      try {
        const r = await api.post('/id-card/design/preview', design, { responseType: 'blob' });
        const url = URL.createObjectURL(r.data);
        if (last.current) URL.revokeObjectURL(last.current);
        last.current = url; setImg(url);
      } catch { /* keep the last picture */ }
      finally { setMaking(false); }
    }, 350);
    return () => clearTimeout(t);
  }, [design]);

  if (!design) return <div className="text-sm text-stone">Loading…</div>;
  const set = (patch: Partial<Design>) => setDesign({ ...design, ...patch });
  const save = async () => {
    setSaving(true);
    try { const r = await api.patch('/id-card/design', design); toast.success(r.data.message); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Could not save the design'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-2xl text-brand-dark">Student ID card design</h1>
        <p className="text-sm text-stone">Choose the colours and the background pattern. The card on the right updates as you go and shows an example student. Saving changes every card printed from now on; cards already printed are not affected.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6 space-y-5">
          <div className="grid sm:grid-cols-3 gap-4">
            <Colour label="Main colour (header, banner)" value={design.primary} onChange={v => set({ primary: v })} />
            <Colour label="Gold stripes and photo frame" value={design.secondary} onChange={v => set({ secondary: v })} />
            <Colour label="Field labels" value={design.label_color} onChange={v => set({ label_color: v })} />
          </div>
          <div>
            <label className={lab}>Background pattern</label>
            <div className="flex flex-wrap gap-2">
              {PATTERNS.map(([k, t]) => <button key={k} type="button" onClick={() => set({ pattern: k })} aria-pressed={design.pattern === k} className={`px-3.5 py-2 rounded-xl text-sm font-semibold border transition ${design.pattern === k ? 'bg-brand text-cream border-brand' : 'bg-white text-brand-dark border-stone/25 hover:border-brand'}`}>{t}</button>)}
            </div>
          </div>
          {design.pattern !== 'none' && (
            <div>
              <label className={lab}>How strong the pattern is</label>
              <input type="range" min={0.03} max={0.3} step={0.01} value={design.pattern_strength} onChange={e => set({ pattern_strength: parseFloat(e.target.value) })} className="w-full accent-[#1F6F4A]" />
              <div className="flex justify-between text-[11px] text-stone"><span>Faint</span><span>Bold</span></div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-brand-dark"><input type="checkbox" checked={design.watermark} onChange={e => set({ watermark: e.target.checked })} className="accent-brand" />Show the college logo faintly behind the details</label>
          <div>
            <label className={lab}>Text on the bottom banner</label>
            <input value={design.banner_text} maxLength={40} onChange={e => set({ banner_text: e.target.value })} className={inp} />
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button type="button" onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition disabled:opacity-60">{saving ? 'Saving…' : 'Save this design'}</button>
            {defaults && <button type="button" onClick={() => setDesign(defaults)} className="px-5 py-2.5 rounded-xl border border-stone/25 text-brand text-sm font-semibold hover:bg-stone/5 transition">Put back the standard design</button>}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-stone/10 shadow-sm p-6">
          <div className="flex items-center justify-between mb-3"><div className="text-xs font-semibold text-brand-dark uppercase tracking-wide">Preview</div>{making && <div className="text-xs text-stone">Updating…</div>}</div>
          <div className="rounded-xl bg-stone/5 p-4 grid place-items-center min-h-[260px]">
            {img ? <img src={img} alt="Student ID card preview" className="w-full max-w-[520px] rounded-2xl shadow-lg" /> : <div className="text-sm text-stone">Making the preview…</div>}
          </div>
          <p className="text-[11px] text-stone mt-3">The photo, name and details shown are an example. Each student&apos;s own photo and details are printed on their card.</p>
        </div>
      </div>
    </div>
  );
}
