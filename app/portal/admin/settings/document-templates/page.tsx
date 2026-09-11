'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function DocumentTemplatesSettings() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState('ADMISSION_LETTER');
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [ministryLogo, setMinistryLogo] = useState<File | null>(null);
  const [collegeLogo, setCollegeLogo] = useState<File | null>(null);
  const [textBlocks, setTextBlocks] = useState<any>({});

  const documentTypes = [
    { id: 'ADMISSION_LETTER', name: 'Admission Letter' },
    { id: 'ACCEPTANCE_LETTER', name: 'Acceptance Letter' },
    { id: 'TRAINING_ADMISSION', name: 'Training Admission' },
    { id: 'FEE_STRUCTURE', name: 'Fee Structure' },
    { id: 'LPO', name: 'Local Purchase Order (LPO)' },
    { id: 'RFQ', name: 'Request for Quotation (RFQ)' },
    { id: 'GRN', name: 'Goods Received Note (GRN)' },
    { id: 'SUPPLIER_INVOICE', name: 'Supplier Invoice' },
  ];

  const variablesGuide: Record<string, string[]> = {
    ADMISSION_LETTER: ['[STUDENT_NAME]', '[ADMISSION_NO]', '[PROGRAMME]'],
    LPO: ['[SUPPLIER_NAME]', '[LPO_NO]', '[TOTAL_AMOUNT]'],
  };

  useEffect(() => {
    fetchTemplate(selectedType);
  }, [selectedType]);

  const fetchTemplate = async (type: string) => {
    setLoading(true);
    try {
      const res = await api.get(`/document-templates/${type}`);
      setTemplate(res.data);
      setTextBlocks(res.data.text_blocks || {});
      setMinistryLogo(null);
      setCollegeLogo(null);
    } catch (error) {
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('text_blocks', JSON.stringify(textBlocks));
      if (ministryLogo) formData.append('ministry_logo', ministryLogo);
      if (collegeLogo) formData.append('college_logo', collegeLogo);

      await api.patch(`/document-templates/${selectedType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Template saved successfully');
      fetchTemplate(selectedType);
    } catch (error) {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleTextChange = (key: string, value: string) => {
    setTextBlocks({ ...textBlocks, [key]: value });
  };

  if (user?.role !== 'ADMIN') {
    return <div className="p-8">Unauthorized Access</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Document Templates</h1>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="border border-gray-300 rounded-md py-2 px-4 shadow-sm focus:ring-green-500 focus:border-green-500"
        >
          {documentTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ministry Logo</label>
                  {template?.ministry_logo_url && (
                    <img src={template.ministry_logo_url} alt="Ministry" className="h-16 mb-2 object-contain" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setMinistryLogo(e.target.files?.[0] || null)}
                    className="text-sm w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">College Logo</label>
                  {template?.college_logo_url && (
                    <img src={template.college_logo_url} alt="College" className="h-16 mb-2 object-contain" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCollegeLogo(e.target.files?.[0] || null)}
                    className="text-sm w-full"
                  />
                </div>
              </div>

              <hr />

              {selectedType === 'ADMISSION_LETTER' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Introductory Paragraph</label>
                    <p className="text-xs text-gray-500 mb-2">The paragraph before the student details table.</p>
                    <textarea
                      rows={4}
                      className="w-full border border-gray-300 rounded-md p-3 focus:ring-green-500 focus:border-green-500"
                      value={textBlocks.intro || ''}
                      onChange={(e) => handleTextChange('intro', e.target.value)}
                      placeholder="Following your application to North Horr..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-900 mb-1">Reporting Requirements</label>
                    <p className="text-xs text-gray-500 mb-2">Any special instructions for the student.</p>
                    <textarea
                      rows={4}
                      className="w-full border border-gray-300 rounded-md p-3 focus:ring-green-500 focus:border-green-500"
                      value={textBlocks.reporting || ''}
                      onChange={(e) => handleTextChange('reporting', e.target.value)}
                      placeholder="Report within 14 days..."
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="md:col-span-1">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Available Variables
            </h3>
            <p className="text-sm text-blue-800 mb-4">You can copy and paste these variables into your text blocks. They will be automatically replaced with the real data when generating the PDF.</p>
            <ul className="space-y-2">
              {(variablesGuide[selectedType] || []).map((v) => (
                <li key={v}>
                  <code className="bg-white border border-blue-200 text-blue-700 px-2 py-1 rounded text-xs font-mono select-all">
                    {v}
                  </code>
                </li>
              ))}
              {!(variablesGuide[selectedType] || []).length && (
                <li className="text-sm text-blue-600 italic">No variables available for this document type yet.</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
