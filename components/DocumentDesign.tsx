'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/lib/api';
import { toast } from 'sonner';

// The look of every official document (letterhead, footer, colour, typeface), and the extras for one document type:
// its title, additional paragraphs, signature and stamp. The defaults match what the documents have always shown.

const inp = 'w-full px-3 py-2 rounded-lg border border-stone/25 text-sm focus:outline-none focus:border-brand bg-white';
const lab = 'block text-xs font-semibold text-brand-dark mb-1';

export type DocStyle = {
  ministry_line: string; college_name: string; contact_line: string; extra_line: string; footer_text: string;
  accent: string; font: string; show_ministry_logo: boolean; show_college_logo: boolean; show_footer: boolean;
};

export function LetterheadPanel({ onChange }: { onChange: (s: DocStyle) => void }) {
  const [style, setStyle] = useState<DocStyle | null>(null);
  const [defaults, setDefaults] = useState<DocStyle | null>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get('/document-templates/style').then(r => { setStyle(r.data.style); setDefaults(r.data.defaults); onChange(r.data.style); }).catch(() => { });
  }, []);
  if (!style) return null;
  const set = (patch: Partial<DocStyle>) => { const n = { ...style, ...patch }; setStyle(n); onChange(n); };
  const save = async () => {
    setSaving(true);
    try { const r = await api.patch('/document-templates/style', style); toast.success(r.data.message); }
    catch (e: any) { toast.error(e?.response?.data?.error || 'Could not save the letterhead'); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone/10 shadow-sm mb-6">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div>
          <div className="font-semibold text-brand-dark">Letterhead, footer and style <span className="font-normal text-stone">(all documents)</span></div>
          <div className="text-xs text-stone">The heading, address line, colour, typeface and footer shown on every letter and form.</div>
        </div>
        <span className="text-brand text-sm font-semibold">{open ? 'Hide' : 'Edit'}</span>
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-stone/10 pt-5 space-y-4">
          <div><label className={lab}>Ministry line (small, above the college name)</label><input value={style.ministry_line} onChange={e => set({ ministry_line: e.target.value })} className={inp} /></div>
          <div><label className={lab}>College name</label><input value={style.college_name} onChange={e => set({ college_name: e.target.value })} className={inp} /></div>
          <div><label className={lab}>Address and contact line</label><input value={style.contact_line} onChange={e => set({ contact_line: e.target.value })} className={inp} /></div>
          <div><label className={lab}>Extra line <span className="font-normal text-stone">(optional, e.g. a motto)</span></label><input value={style.extra_line} onChange={e => set({ extra_line: e.target.value })} className={inp} /></div>
          <div><label className={lab}>Footer text <span className="font-normal text-stone">(the reference number is added after it)</span></label><input value={style.footer_text} onChange={e => set({ footer_text: e.target.value })} className={inp} /></div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={lab}>Accent colour (heading, lines, tables)</label>
              <div className="flex items-center gap-2"><input type="color" value={style.accent} onChange={e => set({ accent: e.target.value })} className="h-9 w-12 rounded border border-stone/25 bg-white p-0.5" /><input value={style.accent} onChange={e => /^#[0-9a-fA-F]{0,6}$/.test(e.target.value) && set({ accent: e.target.value })} className={`${inp} font-mono`} /></div>
            </div>
            <div>
              <label className={lab}>Typeface</label>
              <select value={style.font} onChange={e => set({ font: e.target.value })} className={inp}>
                <option value="Helvetica">Sans-serif (Helvetica)</option><option value="Times-Roman">Serif (Times)</option><option value="Courier">Typewriter (Courier)</option>
              </select>
            </div>
            <div className="space-y-1.5 text-sm text-brand-dark pt-5">
              {([['show_ministry_logo', 'Show the ministry logo'], ['show_college_logo', 'Show the college logo'], ['show_footer', 'Show the footer']] as const).map(([k, t]) => (
                <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={style[k]} onChange={e => set({ [k]: e.target.checked } as any)} className="accent-brand" />{t}</label>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            <button type="button" onClick={save} disabled={saving} className="px-5 py-2.5 rounded-xl bg-brand text-cream text-sm font-semibold hover:bg-brand-dark transition disabled:opacity-60">{saving ? 'Saving…' : 'Save letterhead for all documents'}</button>
            {defaults && <button type="button" onClick={() => set(defaults)} className="px-5 py-2.5 rounded-xl border border-stone/25 text-brand text-sm font-semibold hover:bg-stone/5 transition">Put back the original</button>}
          </div>
          <p className="text-[11px] text-stone">Saving changes every document produced from now on. Use <strong>Preview</strong> on a document below to see the effect before you save.</p>
        </div>
      )}
    </div>
  );
}

export function DocExtras({ type, textBlocks, setTextBlocks, template, signatureFile, setSignatureFile, stampFile, setStampFile, removeSignature, setRemoveSignature, removeStamp, setRemoveStamp }: any) {
  const letter = type === 'ADMISSION_LETTER' || type === 'ACCEPTANCE_LETTER';
  const sigUrl = template?.text_blocks?._signature_url;
  const stampUrl = template?.text_blocks?._stamp_url;
  const extras = [1, 2, 3, 4, 5].filter(i => textBlocks[`extra_${i}`] !== undefined || i === 1);
  const shown = Math.max(1, ...extras.filter(i => String(textBlocks[`extra_${i}`] || '').length > 0), extras.length ? 1 : 1);
  const [count, setCount] = useState(shown);
  useEffect(() => { setCount(Math.max(1, ...[1, 2, 3, 4, 5].filter(i => String(textBlocks[`extra_${i}`] || '').length > 0))); }, [type, template]);
  return (
    <div className="p-6 border-b border-stone/10 space-y-5">
      <h3 className="font-semibold text-brand-dark">Title and additional paragraphs</h3>
      <div>
        <label className={lab}>Document title <span className="font-normal text-stone">(leave empty to keep the usual one)</span></label>
        <input value={textBlocks._title || ''} onChange={e => setTextBlocks({ ...textBlocks, _title: e.target.value })} className={inp} placeholder="e.g. Offer of Admission" />
      </div>
      <div>
        <label className={lab}>Additional paragraphs <span className="font-normal text-stone">(shown near the end{letter ? ', before the closing' : ''}; the variables on the right work here too)</span></label>
        <div className="space-y-2">
          {Array.from({ length: count }, (_, k) => k + 1).map(i => (
            <textarea key={i} rows={2} value={textBlocks[`extra_${i}`] || ''} onChange={e => setTextBlocks({ ...textBlocks, [`extra_${i}`]: e.target.value })} placeholder={`Paragraph ${i}`} className={`${inp} resize-none`} />
          ))}
        </div>
        {count < 5 && <button type="button" onClick={() => setCount(c => c + 1)} className="mt-2 text-xs font-semibold text-brand hover:underline">＋ Add another paragraph</button>}
      </div>
      {letter && (
        <div className="grid sm:grid-cols-2 gap-5">
          {([['Signature image', sigUrl, signatureFile, setSignatureFile, removeSignature, setRemoveSignature], ['Official stamp', stampUrl, stampFile, setStampFile, removeStamp, setRemoveStamp]] as const).map(([label, url, file, setFile, rm, setRm]: any) => (
            <div key={label}>
              <label className={lab}>{label} <span className="font-normal text-stone">(optional, PNG with a clear background works best)</span></label>
              {url && !rm && <div className="flex items-center gap-3 mb-2"><img src={url} alt={label} className="h-12 object-contain rounded border border-stone/10 p-1 bg-stone/5" /><button type="button" onClick={() => setRm(true)} className="text-xs text-red-600 hover:underline">Remove</button></div>}
              {rm && <p className="text-xs text-amber-700 mb-2">Will be removed when you save. <button type="button" onClick={() => setRm(false)} className="underline">Undo</button></p>}
              <input type="file" accept="image/png,image/jpeg" onChange={e => setFile(e.target.files?.[0] || null)} className="block w-full text-xs text-stone file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-brand/10 file:text-brand" />
              {file && <p className="text-xs text-green-600 mt-1">✓ {file.name} selected (saved with the template)</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// A PDF of the document made with what is on screen (nothing is saved), shown in a window
export function PreviewButton({ type, textBlocks, style }: { type: string; textBlocks: any; style: DocStyle | null }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);
  const run = async () => {
    setBusy(true);
    try {
      const r = await api.post(`/document-templates/${type}/preview`, { text_blocks: textBlocks, style }, { responseType: 'blob' });
      setUrl(URL.createObjectURL(r.data));
    } catch (e: any) {
      let msg = 'Could not make the preview';
      try { const t = await e?.response?.data?.text?.(); msg = JSON.parse(t).error || msg; } catch { /* keep the default */ }
      toast.error(msg);
    } finally { setBusy(false); }
  };
  return (
    <>
      <button type="button" onClick={run} disabled={busy} className="px-5 py-3 rounded-xl border border-brand/40 text-brand font-semibold hover:bg-brand/5 transition disabled:opacity-60 text-sm">{busy ? 'Making preview…' : '👁 Preview'}</button>
      {url && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-brand-dark/70 z-[80] flex items-center justify-center p-4" onClick={() => setUrl(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone/10"><div className="font-semibold text-brand-dark text-sm">Preview (example data, nothing is saved)</div><button onClick={() => setUrl(null)} className="text-stone hover:text-brand" aria-label="Close">✕</button></div>
            <iframe src={url} className="flex-1 w-full rounded-b-2xl" title="Document preview" />
          </div>
        </div>, document.body)}
    </>
  );
}
