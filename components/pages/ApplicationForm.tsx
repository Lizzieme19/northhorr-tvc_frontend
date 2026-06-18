'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';

const Field = ({ label, name, type = 'text', required = false, value, onChange, ...props }: any) => (
  <div>
    <label className="block text-sm font-semibold text-brand-dark mb-1.5">{label} {required && <span className="text-terracotta">*</span>}</label>
    <input
      type={type} name={name} required={required} value={value} onChange={onChange} {...props}
      className={`w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm ${type === 'file' ? 'p-2' : ''}`}
    />
  </div>
);

export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [departments, setDepartments] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  const [formData, setFormData] = useState({
    surname: '', other_names: '', gender: '', date_of_birth: '', nationality: 'Kenyan', religion: '',
    id_number: '', birth_cert_no: '', email: '', phone: '', address: '',
    previous_school: '', kcpe_index: '', kcpe_marks: '', kcse_index: '', kcse_grade: '',
    father_names: '', father_phone: '', father_id: '', father_occupation: '', father_date_of_birth: '', father_alive: '',
    mother_names: '', mother_phone: '', mother_id: '', mother_occupation: '', mother_date_of_birth: '', mother_alive: '',
    siblings_no: '',
    emergency_name_1: '', emergency_phone_1: '', relationship_1: '', emergency_address_1: '',
    emergency_name_2: '', emergency_phone_2: '', relationship_2: '', emergency_address_2: '',
    department_id: '', course_id: '', level_applied: ''
  });

  const [files, setFiles] = useState<any>({
    doc_kcpe: null, doc_kcse: null, doc_id_copy: null, doc_birth_cert: null, doc_medical: null
  });

  useEffect(() => {
    api.get('/departments').then(r => setDepartments(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (formData.department_id) {
      const dept = departments.find(d => d.id === formData.department_id);
      setCourses(dept ? dept.courses : []);
    } else setCourses([]);
  }, [formData.department_id, departments]);

  const handleChange = (e: any) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleFileChange = (e: any) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const nextStep = (e: any) => { e.preventDefault(); setStep(s => s + 1); };
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSubmitting(true);
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v as string));
    Object.entries(files).forEach(([k, v]: any) => { if (v) data.append(k, v); });

    try {
      const res = await api.post('/applications', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-10 animate-fade-up">
        <div className="h-20 w-20 rounded-full bg-green-100 text-green-600 text-4xl grid place-items-center mx-auto mb-6">✅</div>
        <h2 className="font-display text-3xl text-brand-dark mb-4">Application Submitted!</h2>
        <p className="text-stone mb-6 max-w-md mx-auto">Your application has been received and is currently under review. Keep your application reference number safe.</p>
        <div className="bg-cream-deep p-6 rounded-2xl max-w-sm mx-auto border border-stone/15">
          <div className="text-xs text-stone uppercase tracking-widest mb-1">Reference Number</div>
          <div className="font-mono text-2xl font-bold text-brand">{success.application_no}</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Stepper Header */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`flex-1 h-2 rounded-full min-w-[40px] transition-colors ${step >= i ? 'bg-brand' : 'bg-stone/20'}`} />
        ))}
      </div>
      <h2 className="font-display text-2xl text-brand-dark mb-8">
        {step === 1 && 'Step 1: Course Selection'}
        {step === 2 && 'Step 2: Personal Details'}
        {step === 3 && 'Step 3: Academic Background'}
        {step === 4 && 'Step 4: Parent & Medical'}
        {step === 5 && 'Step 5: Document Uploads'}
      </h2>

      <form onSubmit={step === 5 ? handleSubmit : nextStep} className="space-y-8 animate-fade-in">
        
        {step === 1 && (
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Department <span className="text-terracotta">*</span></label>
              <select name="department_id" required value={formData.department_id} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm">
                <option value="">Select Department...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Course <span className="text-terracotta">*</span></label>
              <select name="course_id" required value={formData.course_id} onChange={handleChange} disabled={!formData.department_id} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white disabled:bg-stone/10 disabled:opacity-50 focus:outline-none focus:border-brand transition text-sm">
                <option value="">Select Course...</option>
                {courses.map((c: any) => <option key={c.id} value={c.id}>{c.name} ({c.levels})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Level Applied <span className="text-terracotta">*</span></label>
              <select name="level_applied" required value={formData.level_applied} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                <option value="">Select Level...</option>
                <option value="Level 3">Level 3 (Artisan)</option>
                <option value="Level 4">Level 4 (Craft Certificate)</option>
                <option value="Level 5">Level 5 (Diploma)</option>
                <option value="Level 6">Level 6 (Advanced Diploma)</option>
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid sm:grid-cols-2 gap-5">
            <Field name="surname" label="Surname" required value={formData.surname} onChange={handleChange} />
            <Field name="other_names" label="Other Names" required value={formData.other_names} onChange={handleChange} />
            <div>
              <label className="block text-sm font-semibold text-brand-dark mb-1.5">Gender <span className="text-terracotta">*</span></label>
              <select name="gender" required value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand transition text-sm">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <Field name="date_of_birth" label="Date of Birth" type="date" required value={formData.date_of_birth} onChange={handleChange} />
            <Field name="id_number" label="National ID No." value={formData.id_number} onChange={handleChange} />
            <Field name="birth_cert_no" label="Birth Certificate No." value={formData.birth_cert_no} onChange={handleChange} />
            <Field name="email" label="Email Address" type="email" required value={formData.email} onChange={handleChange} />
            <Field name="phone" label="Phone Number" required value={formData.phone} onChange={handleChange} />
            <Field name="address" label="Postal Address" value={formData.address} onChange={handleChange} />
            <Field name="religion" label="Religion" value={formData.religion} onChange={handleChange} />
          </div>
        )}

        {step === 3 && (
          <div className="grid sm:grid-cols-2 gap-5">
            <Field name="previous_school" label="Previous School Attended" value={formData.previous_school} onChange={handleChange} />
            <div className="hidden sm:block" />
            <Field name="kcpe_index" label="KCPE Index Number" value={formData.kcpe_index} onChange={handleChange} />
            <Field name="kcpe_marks" label="KCPE Marks" type="number" value={formData.kcpe_marks} onChange={handleChange} />
            <Field name="kcse_index" label="KCSE Index Number" value={formData.kcse_index} onChange={handleChange} />
            <Field name="kcse_grade" label="KCSE Mean Grade" value={formData.kcse_grade} onChange={handleChange} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-display text-brand-dark mb-4">Parent/Guardian Details</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field name="father_names" label="Full Name of Father" required value={formData.father_names} onChange={handleChange} />
                <Field name="father_phone" label="Phone Number" required value={formData.father_phone} onChange={handleChange} />
                <Field name="father_id" label="National ID/ Passport No" required value={formData.father_id} onChange={handleChange} />
                <Field name="father_occupation" label="Occupation" required value={formData.father_occupation} onChange={handleChange} />
                <Field name="father_date_of_birth" label="Date of Birth" required value={formData.father_date_of_birth} onChange={handleChange} />
                <Field name="father_alive" label="Is Father Alive?" required value={formData.father_alive} onChange={handleChange} />
                <Field name="mother_names" label="Full Name of Mother" required value={formData.mother_names} onChange={handleChange} />
                <Field name="mother_phone" label="Phone Number" required value={formData.mother_phone} onChange={handleChange} />
                <Field name="mother_id" label="National ID/ Passport No" required value={formData.mother_id} onChange={handleChange} />
                <Field name="mother_occupation" label="Occupation" required value={formData.mother_occupation} onChange={handleChange} />
                <Field name="mother_date_of_birth" label="Date of Birth" required value={formData.mother_date_of_birth} onChange={handleChange} />
                <Field name="mother_alive" label="Is Mother Alive?" required value={formData.mother_alive} onChange={handleChange} />
                <Field name="siblings_no" label="Number of Siblings" required value={formData.siblings_no} onChange={handleChange} />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-display text-brand-dark mb-4">Emergency Details (Give names and adresses of two persons who can be contacted in case of an emergency)</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field name="emergency_name_1" label="Name" required value={formData.emergency_name_1} onChange={handleChange} />
                <Field name="relationship_1" label="Relationship" required value={formData.relationship_1} onChange={handleChange} />
                <Field name="emergency_phone_1" label="Phone Number" required value={formData.emergency_phone_1} onChange={handleChange} />
                <Field name="emergency_address" label="Address" required value={formData.emergency_address_1} onChange={handleChange} />
                <Field name="emergency_name_2" label="Name" required value={formData.emergency_name_2} onChange={handleChange} />
                <Field name="emergency_phone_2" label="Phone Number" required value={formData.emergency_phone_2} onChange={handleChange} />
                <Field name="relationship_2" label="Relationship" required value={formData.relationship_2} onChange={handleChange} />
                <Field name="emergency_address_2" label="Address" required value={formData.emergency_address_2} onChange={handleChange} />
                <div className="hidden sm:block" />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p className="text-sm text-stone mb-4">Please upload clear scanned copies of the following documents (PDF, JPG, PNG). Max 5MB per file.</p>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field name="doc_kcpe" label="KCPE Result Slip/Certificate" type="file" onChange={handleFileChange} />
              <Field name="doc_kcse" label="KCSE Result Slip/Certificate" type="file" onChange={handleFileChange} />
              <Field name="doc_birth_cert" label="Birth Certificate" type="file" onChange={handleFileChange} />
              <Field name="doc_id_copy" label="Copy of National ID" type="file" onChange={handleFileChange} />
              <Field name="doc_medical" label="Medical Examination Certificate" type="file" onChange={handleFileChange} />
            </div>
          </div>
        )}

        <div className="pt-6 flex items-center justify-between border-t border-stone/10">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="px-6 py-3 rounded-full text-brand font-semibold hover:bg-brand/10 transition">
              ← Back
            </button>
          ) : <div />}
          
          <button type="submit" disabled={submitting} className="px-8 py-3 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition shadow-lg disabled:opacity-50">
            {step === 5 ? (submitting ? 'Submitting...' : 'Submit Application ✅') : 'Next Step →'}
          </button>
        </div>
      </form>
    </div>
  );
}
