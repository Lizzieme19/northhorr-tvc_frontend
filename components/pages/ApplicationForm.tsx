'use client';
import { useState, useEffect, useMemo } from 'react';
import { departmentsApi } from '@/lib/services';
import { normalizeKenyaPhone, phoneProblem } from '@/lib/phone';
import api from '@/lib/api';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const KCSE_GRADES = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E'];

/** Returns true if applicantGrade meets or exceeds minGrade */
function kcseGradeMeetsMinimum(applicantGrade: string, minGrade: string): boolean {
  const idx = KCSE_GRADES.indexOf(applicantGrade);
  const minIdx = KCSE_GRADES.indexOf(minGrade);
  if (idx === -1 || minIdx === -1) return false;
  return idx <= minIdx;
}

/** Check if a level is eligible for the applicant's current qualification */
function levelIsEligible(level: any, kcseGrade: string, kcpeMarks: string, priorLevelCompleted: string): boolean {
  // ── Progression bypass: if the level allows entry via a prior level and the
  // applicant has completed that level, they qualify regardless of KCSE/KCPE.
  if (level.allow_progression_from && priorLevelCompleted && priorLevelCompleted === level.allow_progression_from) {
    return true;
  }
  const req = level.entry_requirement;
  if (req === 'NONE') return true;
  if (req === 'KCSE') {
    if (!kcseGrade) return false; // no grade entered yet
    if (!level.min_kcse_grade) return true; // no minimum set, any KCSE qualifies
    return kcseGradeMeetsMinimum(kcseGrade, level.min_kcse_grade);
  }
  if (req === 'KCPE') {
    // Any student who completed KCPE qualifies — marks are for records only
    return kcpeMarks !== '' && !isNaN(parseInt(kcpeMarks));
  }
  return true;
}

// ---------------------------------------------------------------------------
// Field component
// ---------------------------------------------------------------------------
const Field = ({ label, name, type = 'text', required = false, value, onChange, error, ...props }: any) => (
  <div>
    <label className="block text-sm font-semibold text-brand-dark mb-1.5">{label} {required && <span className="text-terracotta">*</span>}</label>
    <input
      type={type} name={name} required={required} value={value} onChange={onChange} {...props}
      aria-invalid={error ? true : undefined}
      className={`w-full px-4 py-3 rounded-xl border bg-white focus:outline-none focus:ring-2 transition text-sm ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-200' : 'border-stone/25 focus:border-brand focus:ring-brand/20'} ${type === 'file' ? 'p-2' : ''}`}
    />
    {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
  </div>
);

// ---------------------------------------------------------------------------
// Select component
// ---------------------------------------------------------------------------
const Select = ({ label, name, required = false, value, onChange, disabled = false, children }: any) => (
  <div>
    <label className="block text-sm font-semibold text-brand-dark mb-1.5">{label} {required && <span className="text-terracotta">*</span>}</label>
    <select name={name} required={required} value={value} onChange={onChange} disabled={disabled}
      className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white disabled:bg-stone/10 disabled:opacity-50 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm">
      {children}
    </select>
  </div>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ApplicationForm() {
  const [step, setStep] = useState(1);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  const [formData, setFormData] = useState({
    // Prior level completed — drives progression bypass
    prior_level_completed: '',
    // Academic qualification — filled first, drives filtering
    kcse_grade: '',
    kcpe_marks: '',
    kcpe_index: '',
    kcse_index: '',
    previous_school: '',
    // Course selection
    department_id: '',
    course_id: '',
    level_applied: '',
    // Personal
    surname: '', other_names: '', gender: '', date_of_birth: '', nationality: 'Kenyan', religion: '',
    id_number: '', birth_cert_no: '', email: '', phone: '', address: '',
    // Parent / Emergency
    father_present: true, father_deceased: false, father_name: '', father_phone: '', father_email: '', father_occupation: '',
    mother_present: true, mother_deceased: false, mother_name: '', mother_phone: '', mother_email: '', mother_occupation: '',
    siblings_no: '',
    emergency_person: '', emergency_phone: '',
    // Disability
    has_disability: false, disability: '',
  });
  const [confirmed, setConfirmed] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [files, setFiles] = useState<any>({
    doc_kcpe: null, doc_kcse: null, doc_id_copy: null, doc_birth_cert: null, doc_medical: null
  });

  useEffect(() => {
    departmentsApi.getAll().then(r => setAllDepartments(r.data)).catch(() => {});
  }, []);

  // ---------------------------------------------------------------------------
  // Smart filtering: derive eligible departments → courses → levels from qual
  // ---------------------------------------------------------------------------
  const hasKcse = formData.kcse_grade !== '';
  const hasKcpe = formData.kcpe_marks !== '' && !isNaN(parseInt(formData.kcpe_marks));
  const hasPriorLevel = formData.prior_level_completed !== '';
  const hasAnyQual = hasKcse || hasKcpe || hasPriorLevel;

  /** Departments that have at least one course with at least one eligible level */
  const eligibleDepartments = useMemo(() => {
    if (!hasAnyQual) return [];
    return allDepartments.filter(dept => {
      const courses: any[] = dept.courses || [];
      return courses.some(course => {
        const levels: any[] = Array.isArray(course.levels) ? course.levels : [];
        return levels.some(l => levelIsEligible(l, formData.kcse_grade, formData.kcpe_marks, formData.prior_level_completed));
      });
    });
  }, [allDepartments, formData.kcse_grade, formData.kcpe_marks, formData.prior_level_completed, hasAnyQual]);

  /** Courses in the selected department that have at least one eligible level */
  const eligibleCourses = useMemo(() => {
    if (!formData.department_id) return [];
    const dept = allDepartments.find(d => d.id === formData.department_id);
    if (!dept) return [];
    return (dept.courses || []).filter((course: any) => {
      const levels: any[] = Array.isArray(course.levels) ? course.levels : [];
      return levels.some(l => levelIsEligible(l, formData.kcse_grade, formData.kcpe_marks, formData.prior_level_completed));
    });
  }, [allDepartments, formData.department_id, formData.kcse_grade, formData.kcpe_marks, formData.prior_level_completed]);

  /** Eligible levels for the selected course */
  const eligibleLevels = useMemo(() => {
    if (!formData.course_id) return [];
    const course = eligibleCourses.find((c: any) => c.id === formData.course_id);
    if (!course) return [];
    const levels: any[] = Array.isArray(course.levels) ? course.levels : [];
    return levels.filter(l => levelIsEligible(l, formData.kcse_grade, formData.kcpe_marks, formData.prior_level_completed));
  }, [eligibleCourses, formData.course_id, formData.kcse_grade, formData.kcpe_marks, formData.prior_level_completed]);

  /** The config for the chosen level */
  const selectedLevelConfig = useMemo(
    () => eligibleLevels.find(l => l.name === formData.level_applied) || null,
    [eligibleLevels, formData.level_applied]
  );

  // Phone numbers must be Kenyan mobile numbers. Shown once the person has typed something, or tried to go on.
  const problems: Record<string, string> = {
    phone: phoneProblem(formData.phone, true),
    father_phone: formData.father_deceased ? '' : phoneProblem(formData.father_phone, true),
    mother_phone: formData.mother_deceased ? '' : phoneProblem(formData.mother_phone, true),
    emergency_phone: phoneProblem(formData.emergency_phone, true),
    disability: formData.has_disability && !formData.disability.trim() ? 'Please describe the disability so the college can support you' : '',
  };
  const stepFields: Record<number, string[]> = { 2: ['phone', 'disability'], 4: ['father_phone', 'mother_phone', 'emergency_phone'] };
  const shown = (f: string) => (showErrors || (formData as any)[f]) && problems[f] ? problems[f] : '';
  // tidy a valid number into 07XXXXXXXX when the person leaves the box
  const tidyPhone = (e: any) => {
    const n = normalizeKenyaPhone(e.target.value);
    if (n && n !== e.target.value) setFormData(prev => ({ ...prev, [e.target.name]: n }));
  };

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset downstream selections when qualifications or prior level change
      ...(name === 'kcse_grade' || name === 'kcpe_marks' || name === 'prior_level_completed'
        ? { department_id: '', course_id: '', level_applied: '' }
        : {}),
      ...(name === 'department_id' ? { course_id: '', level_applied: '' } : {}),
      ...(name === 'course_id' ? { level_applied: '' } : {}),
    }));
  };

  const handleFileChange = (e: any) => setFiles({ ...files, [e.target.name]: e.target.files[0] });

  const nextStep = (e: any) => {
    e.preventDefault();

    // Step 1: must have qualification + complete course selection
    if (step === 1) {
      if (!hasAnyQual) {
        toast.error('Please enter your KCSE grade or KCPE marks first.');
        return;
      }
      if (!formData.department_id || !formData.course_id || !formData.level_applied) {
        toast.error('Please select a Department, Course, and Level to continue.');
        return;
      }
    }
    const bad = (stepFields[step] || []).filter(f => problems[f]);
    if (bad.length) {
      setShowErrors(true);
      toast.error(problems[bad[0]]);
      return;
    }
    setShowErrors(false);
    setStep(s => s + 1);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => { setStep(s => s - 1); if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!confirmed) { toast.error('Please tick the box to confirm that the information is correct.'); return; }
    setSubmitting(true);

    const data = new FormData();
    const fD = formData.father_deceased;
    const mD = formData.mother_deceased;
    const backendData = {
      ...formData,
      phone: normalizeKenyaPhone(formData.phone) || formData.phone,
      emergency_phone: normalizeKenyaPhone(formData.emergency_phone) || formData.emergency_phone,
      father_present: !fD,
      mother_present: !mD,
      father_name: fD ? '' : formData.father_name,
      father_phone: fD ? '' : (normalizeKenyaPhone(formData.father_phone) || formData.father_phone),
      father_email: fD ? '' : formData.father_email,
      father_occupation: fD ? '' : formData.father_occupation,
      mother_name: mD ? '' : formData.mother_name,
      mother_phone: mD ? '' : (normalizeKenyaPhone(formData.mother_phone) || formData.mother_phone),
      mother_email: mD ? '' : formData.mother_email,
      mother_occupation: mD ? '' : formData.mother_occupation,
      disability: formData.has_disability ? formData.disability : '',
      confirmed: true,
    };

    Object.entries(backendData).forEach(([k, v]) => {
      if (v !== null && v !== undefined) data.append(k, String(v));
    });
    Object.entries(files).forEach(([k, v]: any) => { if (v) data.append(k, v); });

    try {
      const res = await api.post('/applications', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess({ ...res.data, email: formData.email });
    } catch (err: any) {
      const fields = err?.response?.data?.fields;
      if (fields) { setShowErrors(true); setStep(fields.phone || fields.disability ? 2 : 4); }
      toast.error(err?.response?.data?.error || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------
  if (success) {
    return (
      <div className="text-center py-10">
        <div className="h-20 w-20 rounded-full bg-green-100 text-green-600 text-4xl grid place-items-center mx-auto mb-6">✅</div>
        <h2 className="font-display text-3xl text-brand-dark mb-4">Application Submitted!</h2>
        <p className="text-stone mb-6 max-w-md mx-auto">Your application has been received and is currently under review. Keep your reference number safe.</p>
        <div className="bg-cream-deep p-6 rounded-2xl max-w-sm mx-auto border border-stone/15">
          <div className="text-xs text-stone uppercase tracking-widest mb-1">Reference Number</div>
          <div className="font-mono text-2xl font-bold text-brand">{success.application_no}</div>
        </div>
        <div className="max-w-md mx-auto mt-6 rounded-2xl border border-gold/50 bg-gold/10 p-5 text-left text-sm text-brand-dark">
          <div className="font-semibold mb-1">📧 Please check your email regularly</div>
          <p>We have sent a confirmation to <strong>{success.email}</strong>. You will also receive an email at this address about the outcome of your application, so check your inbox regularly, and your spam or junk folder too.</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div>
      {/* Stepper */}
      <div className="flex gap-2 mb-8">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={`flex-1 h-2 rounded-full transition-colors ${step >= i ? 'bg-brand' : 'bg-stone/20'}`} />
        ))}
      </div>
      <h2 className="font-display text-2xl text-brand-dark mb-6">
        {step === 1 && 'Step 1: Qualifications & Course'}
        {step === 2 && 'Step 2: Personal Details'}
        {step === 3 && 'Step 3: Supporting Documents'}
        {step === 4 && 'Step 4: Parent & Emergency Details'}
        {step === 5 && 'Step 5: Review and Confirm'}
      </h2>

      <form onSubmit={step === 5 ? handleSubmit : nextStep} className="space-y-8">

        {/* ── Step 1: Qualifications first → then filtered course selection ── */}
        {step === 1 && (
          <div className="space-y-7">

            {/* ── QUALIFICATION ENTRY ── */}
            <div className="rounded-2xl border-2 border-brand/20 bg-brand/5 p-5 space-y-4">
              <div>
                <h3 className="font-display text-base text-brand-dark mb-0.5">Your Academic Qualification</h3>
                <p className="text-xs text-stone">Enter your qualification below. We'll automatically show only the courses and levels you qualify for.</p>
              </div>

              {/* Prior level completed — shown first, can bypass KCSE/KCPE */}
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">
                  Highest TVET / Technical Level Completed <span className="text-stone font-normal text-xs">(if any)</span>
                </label>
                <select name="prior_level_completed" value={formData.prior_level_completed} onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm">
                  <option value="">— None (first-time applicant) —</option>
                  <option value="Level 3">Level 3 (completed)</option>
                  <option value="Level 4">Level 4 (completed)</option>
                  <option value="Level 5">Level 5 (completed)</option>
                </select>
                {formData.prior_level_completed && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
                    🔁 As a continuing student from <strong>{formData.prior_level_completed}</strong>, you may qualify for the next level without needing KCSE/KCPE — depending on the course.
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">KCSE Mean Grade</label>
                  <select name="kcse_grade" value={formData.kcse_grade} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm">
                    <option value="">— Select KCSE Grade —</option>
                    {KCSE_GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-brand-dark mb-1.5">KCPE Marks <span className="text-stone font-normal text-xs">(for records only)</span></label>
                  <input type="number" name="kcpe_marks" min={0} max={500} value={formData.kcpe_marks} onChange={handleChange}
                    placeholder="e.g. 320"
                    className="w-full px-4 py-3 rounded-xl border border-stone/25 bg-white focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition text-sm" />
                  <p className="text-xs text-stone mt-1">Any KCPE score qualifies — marks are collected for record-keeping only.</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field name="kcse_index" label="KCSE Index Number" value={formData.kcse_index} onChange={handleChange} />
                <Field name="kcpe_index" label="KCPE Index Number" value={formData.kcpe_index} onChange={handleChange} />
              </div>
              <Field name="previous_school" label="Previous School Attended" value={formData.previous_school} onChange={handleChange} />
            </div>

            {/* ── COURSE SELECTION (filtered by qual) ── */}
            <div className={`space-y-4 transition-opacity ${hasAnyQual ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
              <div>
                <h3 className="font-display text-base text-brand-dark mb-0.5">Course Selection</h3>
                {!hasAnyQual && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ↑ Enter your KCSE grade, KCPE marks, or select a completed TVET level above to see the courses available to you.
                  </p>
                )}
                {hasAnyQual && eligibleDepartments.length === 0 && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Unfortunately, no courses are currently available for your qualification. Please contact the institution for guidance.
                  </p>
                )}
                {hasAnyQual && eligibleDepartments.length > 0 && (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    ✓ {eligibleDepartments.length} department{eligibleDepartments.length !== 1 ? 's' : ''} available for your qualification.
                  </p>
                )}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="Department" name="department_id" required value={formData.department_id} onChange={handleChange}
                  disabled={!hasAnyQual || eligibleDepartments.length === 0}>
                  <option value="">Select Department...</option>
                  {eligibleDepartments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </Select>

                <Select label="Course" name="course_id" required value={formData.course_id} onChange={handleChange}
                  disabled={!formData.department_id || eligibleCourses.length === 0}>
                  <option value="">Select Course...</option>
                  {eligibleCourses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>

              <Select label="Level Applied" name="level_applied" required value={formData.level_applied} onChange={handleChange}
                disabled={!formData.course_id || eligibleLevels.length === 0}>
                <option value="">Select Level...</option>
                {eligibleLevels.map((l: any) => {
                  const reqLabel = l.entry_requirement === 'KCSE' && l.min_kcse_grade
                    ? ` — min. KCSE ${l.min_kcse_grade}`
                    : l.entry_requirement === 'KCPE' && l.min_kcpe_marks
                      ? ` — min. KCPE ${l.min_kcpe_marks}`
                      : '';
                  return <option key={l.name} value={l.name}>{l.name}{reqLabel}</option>;
                })}
              </Select>

              {/* Entry requirement confirmation badge */}
              {selectedLevelConfig && (
                <div className="rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm p-4 flex items-start gap-3">
                  <span className="text-lg mt-0.5">✅</span>
                  <div>
                    <div className="font-semibold">You qualify for {formData.level_applied}!</div>
                    <div className="text-xs mt-0.5">
                      {/* Progression bypass path */}
                      {selectedLevelConfig.allow_progression_from &&
                        formData.prior_level_completed === selectedLevelConfig.allow_progression_from &&
                        `Progression entry: you completed ${formData.prior_level_completed} — KCSE/KCPE requirement waived.`}
                      {/* Normal paths */}
                      {!(selectedLevelConfig.allow_progression_from && formData.prior_level_completed === selectedLevelConfig.allow_progression_from) && (
                        <>
                          {selectedLevelConfig.entry_requirement === 'KCSE' && selectedLevelConfig.min_kcse_grade &&
                            `Minimum KCSE grade required: ${selectedLevelConfig.min_kcse_grade} — Your grade: ${formData.kcse_grade}`}
                          {selectedLevelConfig.entry_requirement === 'KCSE' && !selectedLevelConfig.min_kcse_grade &&
                            `KCSE certificate required — your grade (${formData.kcse_grade}) qualifies.`}
                          {selectedLevelConfig.entry_requirement === 'KCPE' &&
                            `KCPE certificate required — students who completed primary school qualify.`}
                          {selectedLevelConfig.entry_requirement === 'NONE' &&
                            `Open entry — no minimum qualification required.`}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 2: Personal Details ── */}
        {step === 2 && (
          <div className="grid sm:grid-cols-2 gap-5">
            <Field name="surname" label="Surname" required value={formData.surname} onChange={handleChange} />
            <Field name="other_names" label="Other Names" required value={formData.other_names} onChange={handleChange} />
            <Select label="Gender" name="gender" required value={formData.gender} onChange={handleChange}>
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </Select>
            <Field name="date_of_birth" label="Date of Birth" type="date" required value={formData.date_of_birth} onChange={handleChange} />
            <Field name="id_number" label="National ID No." value={formData.id_number} onChange={handleChange} />
            <Field name="birth_cert_no" label="Birth Certificate No." value={formData.birth_cert_no} onChange={handleChange} />
            <Field name="email" label="Email Address" type="email" required value={formData.email} onChange={handleChange} />
            <Field name="phone" label="Phone Number" required inputMode="tel" placeholder="e.g. 0712 345 678" value={formData.phone} onChange={handleChange} onBlur={tidyPhone} error={shown('phone')} />
            <Field name="address" label="Postal Address" value={formData.address} onChange={handleChange} />
            <Field name="religion" label="Religion" value={formData.religion} onChange={handleChange} />
            <div className="sm:col-span-2 rounded-2xl border border-stone/20 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={formData.has_disability} onChange={e => setFormData(f => ({ ...f, has_disability: e.target.checked, ...(e.target.checked ? {} : { disability: '' }) }))} className="h-5 w-5 mt-0.5 accent-brand" />
                <span><span className="block text-sm font-semibold text-brand-dark">I have a disability</span><span className="block text-xs text-stone">Tick this if you do, so the college can support you.</span></span>
              </label>
              {formData.has_disability && (
                <div className="mt-3">
                  <Field name="disability" label="Please describe the disability" required value={formData.disability} onChange={handleChange} error={shown('disability')} placeholder="e.g. Hearing impairment, needs a seat near the front" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 3: Supporting Documents ── */}
        {step === 3 && (
          <div className="space-y-6">
            <p className="text-sm text-stone">Please upload the required supporting documents. Allowed formats: PDF, JPG, PNG (Max 10MB each).</p>
            {[
              { name: 'doc_id_copy', label: 'National ID / Passport Copy', hint: 'Front and back if applicable' },
              { name: 'doc_kcse', label: 'KCSE Certificate / Result Slip', hint: 'Must be clearly legible' },
              { name: 'doc_birth_cert', label: 'Birth Certificate', hint: 'Required for all applicants' },
              { name: 'doc_medical', label: 'Medical Report', hint: 'Any relevant medical history (Optional)' },
              { name: 'doc_kcpe', label: 'KCPE Certificate', hint: 'If applicable' },
            ].map((doc) => (
              <div key={doc.name}>
                <label className="block text-sm font-semibold text-brand-dark mb-1">{doc.label}</label>
                <p className="text-xs text-stone mb-1.5">{doc.hint}</p>
                <input type="file" name={doc.name} accept=".pdf,image/jpeg,image/jpg,image/png" onChange={handleFileChange}
                  className="w-full text-sm text-stone file:mr-3 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:bg-brand/10 file:text-brand file:font-semibold hover:file:bg-brand hover:file:text-cream transition" />
                {files[doc.name] && <p className="text-xs text-green-600 mt-1">✓ {files[doc.name].name}</p>}
              </div>
            ))}
          </div>
        )}

        {/* ── Step 4: Parent & Emergency Details ── */}
        {step === 4 && (
          <div className="space-y-8">
            {/* Father */}
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                <h3 className="text-lg font-display text-brand-dark">Father Information</h3>
                <label className="flex items-center gap-2 text-sm text-stone cursor-pointer">
                  <input type="checkbox" checked={formData.father_deceased} onChange={e => setFormData(f => ({ ...f, father_deceased: e.target.checked }))} className="h-4 w-4 accent-brand" />
                  Deceased
                </label>
              </div>
              {formData.father_deceased ? (
                <p className="text-sm text-stone bg-cream-deep rounded-xl px-4 py-3">Marked as deceased. No details are needed.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field name="father_name" label="Father's Name" required value={formData.father_name} onChange={handleChange} />
                  <Field name="father_phone" label="Father's Phone" required inputMode="tel" placeholder="e.g. 0712 345 678" value={formData.father_phone} onChange={handleChange} onBlur={tidyPhone} error={shown('father_phone')} />
                  <Field name="father_email" label="Father's Email" type="email" value={formData.father_email} onChange={handleChange} />
                  <Field name="father_occupation" label="Father's Occupation" value={formData.father_occupation} onChange={handleChange} />
                </div>
              )}
            </div>

            {/* Mother */}
            <div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                <h3 className="text-lg font-display text-brand-dark">Mother Information</h3>
                <label className="flex items-center gap-2 text-sm text-stone cursor-pointer">
                  <input type="checkbox" checked={formData.mother_deceased} onChange={e => setFormData(f => ({ ...f, mother_deceased: e.target.checked }))} className="h-4 w-4 accent-brand" />
                  Deceased
                </label>
              </div>
              {formData.mother_deceased ? (
                <p className="text-sm text-stone bg-cream-deep rounded-xl px-4 py-3">Marked as deceased. No details are needed.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-5">
                  <Field name="mother_name" label="Mother's Name" required value={formData.mother_name} onChange={handleChange} />
                  <Field name="mother_phone" label="Mother's Phone" required inputMode="tel" placeholder="e.g. 0712 345 678" value={formData.mother_phone} onChange={handleChange} onBlur={tidyPhone} error={shown('mother_phone')} />
                  <Field name="mother_email" label="Mother's Email" type="email" value={formData.mother_email} onChange={handleChange} />
                  <Field name="mother_occupation" label="Mother's Occupation" value={formData.mother_occupation} onChange={handleChange} />
                </div>
              )}
            </div>

            {/* Emergency */}
            <div>
              <h3 className="text-lg font-display text-brand-dark mb-4">Emergency Contact</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <Field name="emergency_person" label="Emergency Contact Name" required value={formData.emergency_person} onChange={handleChange} />
                <Field name="emergency_phone" label="Phone Number" required inputMode="tel" placeholder="e.g. 0712 345 678" value={formData.emergency_phone} onChange={handleChange} onBlur={tidyPhone} error={shown('emergency_phone')} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 5: Review and confirm ── */}
        {step === 5 && (
          <div className="space-y-6">
            <p className="text-sm text-stone">Please read through everything below. If something is wrong, use <strong>Change</strong> to go back and fix it. Nothing is sent until you confirm.</p>
            {(() => {
              const dept = allDepartments.find(d => d.id === formData.department_id);
              const course = (dept?.courses || []).find((c: any) => c.id === formData.course_id);
              const yn = (v: boolean) => (v ? 'Yes' : 'No');
              const parent = (deceased: boolean, name: string, phone: string) => deceased ? 'Deceased' : [name, normalizeKenyaPhone(phone) || phone].filter(Boolean).join(' · ') || '—';
              const sections: { title: string; step: number; rows: [string, string][] }[] = [
                { title: 'Qualification and course', step: 1, rows: [
                  ['KCSE mean grade', formData.kcse_grade || '—'], ['KCPE marks', formData.kcpe_marks || '—'], ['Prior level completed', formData.prior_level_completed || '—'],
                  ['Department', dept?.name || '—'], ['Course', course?.name || '—'], ['Level', formData.level_applied || '—'],
                ] },
                { title: 'Personal details', step: 2, rows: [
                  ['Name', `${formData.surname} ${formData.other_names}`.trim() || '—'], ['Gender', formData.gender || '—'], ['Date of birth', formData.date_of_birth || '—'],
                  ['National ID', formData.id_number || '—'], ['Birth certificate no.', formData.birth_cert_no || '—'], ['Email', formData.email || '—'],
                  ['Phone', normalizeKenyaPhone(formData.phone) || formData.phone || '—'], ['Postal address', formData.address || '—'], ['Religion', formData.religion || '—'],
                  ['Disability', formData.has_disability ? `Yes: ${formData.disability}` : 'No'],
                ] },
                { title: 'Supporting documents', step: 3, rows: Object.entries(files).map(([k, v]: any) => [({ doc_id_copy: 'National ID / Passport', doc_kcse: 'KCSE certificate', doc_birth_cert: 'Birth certificate', doc_medical: 'Medical report', doc_kcpe: 'KCPE certificate' } as any)[k] || k, v ? v.name : 'Not uploaded']) },
                { title: 'Parents and emergency contact', step: 4, rows: [
                  ['Father', parent(formData.father_deceased, formData.father_name, formData.father_phone)], ['Mother', parent(formData.mother_deceased, formData.mother_name, formData.mother_phone)],
                  ['Emergency contact', [formData.emergency_person, normalizeKenyaPhone(formData.emergency_phone) || formData.emergency_phone].filter(Boolean).join(' · ') || '—'],
                ] },
              ];
              void yn;
              return sections.map(sec => (
                <div key={sec.title} className="border border-stone/15 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-display text-lg text-brand-dark">{sec.title}</h3>
                    <button type="button" onClick={() => setStep(sec.step)} className="text-sm font-semibold text-brand hover:underline">Change</button>
                  </div>
                  <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {sec.rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-stone/10 py-1.5"><dt className="text-stone">{k}</dt><dd className="text-brand-dark text-right break-words">{v}</dd></div>)}
                  </dl>
                </div>
              ));
            })()}
            <label className="flex items-start gap-3 rounded-2xl border-2 border-brand/30 bg-brand/5 p-4 cursor-pointer">
              <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="h-5 w-5 mt-0.5 accent-brand" />
              <span className="text-sm text-brand-dark"><strong>I confirm that the information I have given is correct and complete.</strong> I understand that false information may lead to my application being rejected.</span>
            </label>
          </div>
        )}

        {/* Navigation */}
        <div className="pt-6 flex items-center justify-between border-t border-stone/10">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="px-6 py-3 rounded-full text-brand font-semibold hover:bg-brand/10 transition">
              ← Back
            </button>
          ) : <div />}

          <button type="submit" disabled={submitting || (step === 5 && !confirmed)}
            className="px-8 py-3 rounded-full bg-brand text-cream font-semibold hover:bg-brand-dark transition shadow-lg disabled:opacity-50">
            {step === 5
              ? (submitting ? 'Submitting...' : 'Confirm and Submit ✅')
              : step === 4 ? 'Review →' : 'Next Step →'}
          </button>
        </div>
      </form>
    </div>
  );
}
