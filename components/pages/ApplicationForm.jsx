"use client";

import { useState } from "react";

export default function ApplicationForm() {
    const[formData, setFormData] = useState({
        //Personal Details
        otherNames: "",
        surname: "",
        gender: "",
        dateOfBirth: "",
        nationality: "",
        religion: "",
        idNumber: "",
        birthCertificateNo: "",

        //Contact details
        email: "",
        phone: "",
        address: "",
        
        //Academic Information
        kcpeIndexNo: "",
        kcpeMarks: "",
        kcseIndexNo: "",
        kcseGrade: "",
        previousSchool: "",

        //Parent Details
        parentNames: "",
        parentRelationship: "",
        parentPhone: "",
        parentEmail: "",
        
        //Medical
        medicalConditions: "",
        allergies: "",
        medications: "",
        emergencyContact: "",
        emergencyPhone: "",
    });

    const [documents, setDocuments] = useState({
        birthCertificate: null,
        nationalID: null,
        kcpeCertificate: null,
        kcseCertificate: null,
        medicalCertificate: null,
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleFileChange = (e) => {
        setDocuments({
            ...documents,
            [e.target.name]: e.target.files[0],
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        console.log("FORM DATA:", formData);
        console.log("DOCUMENTS:", documents);

        alert("Application submitted successfully!");
    };
    return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-center">Student Application Form</h1>

      <form onSubmit={handleSubmit} className="space-y-10">

        <section>
            <h2 className="text-xl font-semibold mb-4">Personal Details</h2>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <Field name="surname" label="Surname" required />
          <Field name="otherNames" label="Other Names" required />
          <select name="gender" label="Gender" className="border p-3 rounded-lg" required>
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
          <Field name="dateOfBirth" label="Date of Birth" type="date" required />
          <Field name="nationality" label="Nationality" required />
          <Field name="religion" label="Religion" required />
          <Field name="idNumber" label="National ID/ Birth Certificate No" required />
        </div>
        </section>

        <section>
            <h2 className="text-xl font-semibold mb-4">Contact Details</h2>

            <div className="grid sm:grid-cols-2 gap-4">
                <Field name="phoneNumber" label="Phone Number" required />
                <Field name="email" label="Email" type="email" required />
                <Field name="address" label="Address" required />
            </div>
        </section>

        <section>
            <h2 className="text-xl font-semibold mb-4">Academic Information</h2>

            <div className="grid sm:grid-cols-2 gap-4">
                <Field name="previousSchool" label="Previous School" required />
                <Field name="kcpeIndexNo" label="KCPE Index Number" required />
                <Field name="kcpemarks" label="KCPE Marks" required />
                <Field name="kcseIndexNo" label="KCSE Index Number" required />
                <Field name="kcseGrade" label="KCSE Grade" required />
            </div>
        </section>

        <section>
            <h2 className="text-xl font-semibold mb-4">Parent Details</h2>

            <div className="grid sm:grid-cols-2 gap-4">
                <Field name="parentNames" label="Parent Names" required />
                <Field name="parentRelationship" label="Parent Relationship" required />
                <Field name="parentPhoneNumber" label="Parent Phone Number" required />
                <Field name="parentEmail" label="Parent Email" type="email" required />
            </div>   
        </section>

        <section>
            <h2 className="text-xl font-semibold mb-4">Medical History</h2>

            <div className="grid sm:grid-cols-2 gap-4">
                <Field name="medicalConditions" label="Medical Conditions"/>
                <Field name="allergies" label="Allergies"/>
                <Field name="disability" label="Disability"/>
                <Field name="emergencyPerson" label="Emergency Person"/>
                <Field name="emergencyPhone" label="Emergency Phone"/>
            </div>
        </section>

        <section>
            <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
            <div className="grid gap-4">
                <div>
                    <Field name="kcpeCertificate" label="KCPE Result Slip/ Certificate" type="file"/>
                </div>
                <div>
                    <Field name="kcseCertificate" label="KCSE Result Slip/ Certificate" type="file"/>
                </div>
                <div>
                    <Field name="birthCertificate" label="Birth Certificate" type="file"/>
                </div>
                <div>
                    <Field name="idCopy" label="Copy of ID" type="file"/>
                </div>
                <div>
                    <Field name="medicalCertificate" label="Medical Examination Certificate" type="file"/>
                </div>
            </div>
        </section>

        <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
            Submit Application
        </button>
      </form>
    </div>
  );
}