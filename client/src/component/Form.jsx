import { useFormik } from "formik";
import { emailFormSchema } from "../utils/validationSchema";
import Papa from "papaparse";
import { useState } from "react";
import axios from "axios";

export default function PrimewiseForm() {
  const [totalEmails, setTotalEmails] = useState(0);
  const [requiredSenders, setRequiredSenders] = useState(0);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      userName: "",
      senderEmail: "",
      senderPassword: "",
      subject: "",
      body: "",
      recipientsPerSender: 1,
      csvFile: null,
    },
    validationSchema: emailFormSchema,
    onSubmit: () => {},
  });

  const handleCSV = (file) => {
  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function (results) {
      const emails = results.data
        .map((row) => row.email || row.Email) 
        .filter((email) => email && email.trim() !== ""); 


      const blob = new Blob([emails.join("\n")], { type: "text/csv" });
      const cleanFile = new File([blob], file.name, { type: "text/csv" });
      formik.setFieldValue("csvFile", cleanFile);

      setTotalEmails(emails.length);
      if (formik.values.recipientsPerSender > 0) {
        const sendersNeeded = Math.ceil(
          emails.length / formik.values.recipientsPerSender
        );
        setRequiredSenders(sendersNeeded);
      }
    },
  });
};

  const handleSend = async () => {
    setLoading(true);
    try {
      await formik.validateForm();

      const formData = new FormData();
      Object.entries(formik.values).forEach(([key, value]) => {
        if (value !== null) formData.append(key, value);
      });

      const res = await axios.post("http://127.0.0.1:8000/send_emails", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert( "Form submitted successfully!");
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Failed to submit form!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white relative flex items-center justify-center py-5">
      <div className="absolute top-4 left-4">
        <img src="/logo.png" alt="primewise" className="h-12" />
      </div>

      <div className="font-sans bg-white border-2 shadow-xl rounded-2xl p-8 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-6">
          Primewise Bulk Email Form
        </h1>

        <form className="space-y-5">
          
          <div>
            <label>Sender Name</label>
            <input
              type="text"
              name="userName"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.userName}
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label>Sender Email</label>
            <input
              type="email"
              name="senderEmail"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.senderEmail}
              className="w-full border rounded-lg p-2"
            />
          </div>

         
          <div>
            <label>Sender Password</label>
            <input
              type="password"
              name="senderPassword"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.senderPassword}
              placeholder="Enter Gmail App Password"
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label>Upload CSV (name,email)</label>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                const file = e.currentTarget.files[0];
                formik.setFieldValue("csvFile", file);
                if (file) handleCSV(file);
              }}
              className="w-full border rounded-lg p-2 bg-gray-50"
            />
          </div>

         
          <div>
            <label>Subject</label>
            <input
              type="text"
              name="subject"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.subject}
              className="w-full border rounded-lg p-2"
            />
          </div>


          <div>
            <label>Email Body</label>
            <textarea
              name="body"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.body}
              rows="4"
              className="w-full border rounded-lg p-2"
            />
          </div>

          <div>
            <label>Recipients Per Sender</label>
            <input
              type="number"
              name="recipientsPerSender"
              onChange={(e) => {
                formik.handleChange(e);
                if (totalEmails > 0) {
                  const sendersNeeded = Math.ceil(totalEmails / e.target.value);
                  setRequiredSenders(sendersNeeded);
                }
              }}
              onBlur={formik.handleBlur}
              value={formik.values.recipientsPerSender}
              min="1"
              className="w-full border rounded-lg p-2"
            />
          </div>

         
          {totalEmails > 0 && (
            <div className="bg-gray-100 p-4 rounded-lg text-center">
              <p>Total Recipient Emails: <b>{totalEmails}</b></p>
              <p>Required Senders: <b>{requiredSenders}</b></p>
            </div>
          )}

          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className={`w-full text-white py-2 rounded-lg ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Sending..." : "Send Emails"}
          </button>
        </form>
      </div>
    </div>
  );
}
