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
      userName: "",      // Sender Name
      senderEmail: "",   // Sender Email
      subject: "",
      body: "",
      recipientsPerSender: 1,
      csvFile: null,     
    },
    validationSchema: emailFormSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: () => {},
  });

  const handleCSV = (file) => {
    Papa.parse(file, {
      header: false,
      complete: function (results) {
        const emails = results.data.flat().filter((email) => email.trim() !== "");
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
      if (!formik.isValid) {
        alert("Please fix validation errors before submitting.");
        return;
      }

      const formData = new FormData();
      formData.append("userName", formik.values.userName);       
      formData.append("senderEmail", formik.values.senderEmail);
      formData.append("subject", formik.values.subject);
      formData.append("body", formik.values.body);
      formData.append("recipientsPerSender", formik.values.recipientsPerSender);

      if (formik.values.csvFile) {
        formData.append("csvFile", formik.values.csvFile); 
      }

     const res = await axios.post("http://127.0.0.1:8000/send_emails", formData, {
  headers: { "Content-Type": "multipart/form-data" },
});


      alert(res.data.message || "Form submitted successfully!");
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
        <img src="/public/logo.png" alt="primewise" className="h-12" />
      </div>

      <div className="font-sans font-normal bg-white border-2 border-black-100 shadow-xl rounded-2xl p-8 my-16 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-black mb-6 text-center">
          Primewise Bulk Email Form
        </h1>

        <form className="space-y-5">
         
          <div>
            <label className="block mb-1 font-medium text-gray-700">Sender Name</label>
            <input
              type="text"
              name="userName"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.userName}
              className={`w-full border rounded-lg p-2 ${
                formik.touched.userName && formik.errors.userName
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter sender name"
            />
            {formik.touched.userName && formik.errors.userName && (
              <p className="text-red-500 text-sm">{formik.errors.userName}</p>
            )}
          </div>

         
          <div>
            <label className="block mb-1 font-medium text-gray-700">Sender Email</label>
            <input
              type="email"
              name="senderEmail"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.senderEmail}
              className={`w-full border rounded-lg p-2 ${
                formik.touched.senderEmail && formik.errors.senderEmail
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter sender email"
            />
            {formik.touched.senderEmail && formik.errors.senderEmail && (
              <p className="text-red-500 text-sm">{formik.errors.senderEmail}</p>
            )}
          </div>

        
          <div>
            <label className="block mb-1 font-medium text-gray-700">Upload CSV of Recipients</label>
            <input
              type="file"
              name="csvFile"
              accept=".csv"
              onChange={(event) => {
                const file = event.currentTarget.files[0];
                formik.setFieldValue("csvFile", file);
                if (file) handleCSV(file);
              }}
              className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
            />
            {formik.touched.csvFile && formik.errors.csvFile && (
              <p className="text-red-500 text-sm">{formik.errors.csvFile}</p>
            )}
          </div>

          
          <div>
            <label className="block mb-1 font-medium text-gray-700">Subject</label>
            <input
              type="text"
              name="subject"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.subject}
              className={`w-full border rounded-lg p-2 ${
                formik.touched.subject && formik.errors.subject
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter email subject"
            />
            {formik.touched.subject && formik.errors.subject && (
              <p className="text-red-500 text-sm">{formik.errors.subject}</p>
            )}
          </div>

          
          <div>
            <label className="block mb-1 font-medium text-gray-700">Email Body</label>
            <textarea
              name="body"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.body}
              rows="4"
              className={`w-full border rounded-lg p-2 ${
                formik.touched.body && formik.errors.body
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Write your email here..."
            />
            {formik.touched.body && formik.errors.body && (
              <p className="text-red-500 text-sm">{formik.errors.body}</p>
            )}
          </div>

         
          <div>
            <label className="block mb-1 font-medium text-gray-700">Recipients Per Sender</label>
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
              className={`w-full border rounded-lg p-2 ${
                formik.touched.recipientsPerSender &&
                formik.errors.recipientsPerSender
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              min="1"
            />
            {formik.touched.recipientsPerSender &&
              formik.errors.recipientsPerSender && (
                <p className="text-red-500 text-sm">{formik.errors.recipientsPerSender}</p>
              )}
          </div>

         
          {totalEmails > 0 && (
            <div className="bg-prime-gray p-4 rounded-lg text-center">
              <p className="font-medium text-gray-700">
                Total Recipient Emails in CSV: <b>{totalEmails}</b>
              </p>
              <p className="font-medium text-gray-700">
                Required Senders: <b className="text-prime-blue">{requiredSenders}</b>
              </p>
            </div>
          )}

         
          <button
            type="button"
            onClick={handleSend}
            disabled={loading}
            className={`w-full text-white font-semibold py-2 rounded-lg shadow-md transition 
              ${loading ? "bg-gray-400 cursor-not-allowed" : "bg-prime-blue hover:bg-blue-700"}`}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Sending...</span>
              </div>
            ) : (
              "Send Emails"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}