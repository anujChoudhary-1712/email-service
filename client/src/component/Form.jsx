import { useFormik } from "formik";
import { emailFormSchema } from "../utils/validationSchema";
import Papa from "papaparse";
import { useState } from "react";
import axios from "axios";

export default function PrimewiseForm() {
  const [senders, setSenders] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: {
      userName: "",      
      userEmail: "",   
      subject: "",
      body: "",     
    },
    validationSchema: emailFormSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values) => {
      if (senders.length === 0) {
        alert("Please upload a valid Senders CSV.");
        return;
      }
      if (recipients.length === 0) {
        alert("Please upload a valid Recipients CSV");
        return;
      }

      const payload = {
        user:{ name: values.userName, email: values.userEmail },
        senders: senders.map(s =>({
          name: s.name,
          email: s.email,
          password: s.password,
        })),
        recipients: recipients.map(r => ({
          ...r,
        })),
        subject: values.subject,
        body : values.body,
      };
      console.log("Submitting Payload:", JSON.stringify(payload, null, 2));

      try {
        setLoading(true);
        const res = await axios.post("http://127.0.0.1:8000/send_emails", payload, {
          method: "POST",
          headers : {"Content-Type" : "application/json"},
        });
        setResults(res.data);
        alert("Emails sent successfully!");
      } catch (err) {
        if (err.response) {
          console.error("Error:", err.response.data);
        } else {
          console.error("Error sending emails:", err)
        }
      } finally {
        setLoading(false);
      }
    },
  });

  //CSV parsing 

  const handleSendersCSV =(file) => {
    Papa.parse(file,{
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row) => ({
          name: row.name?.trim() || "",
          email: row.email?.trim() || "",
          password: row.password?.trim() || "",
        })).filter((r) => r.name && r.email && r.password);
        setSenders(parsed.filter(s => s.name && s.email && s.password));
      },
    });
  };

  const handleRecipientsCSV =(file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      newline: "\n",
      dynamicTyping: false,
      complete: (results) => {
        const parsed = results.data.map((row) => {
          const cleaned = {}
          Object.keys(row || {}).forEach((key) => {
            const safeKey = key.trim();
            const safeVal = row[key]?.toString().trim() || "";
            cleaned[safeKey] =safeVal;
          });
          return cleaned;
        }).filter((r) => r.name && r.email);
        setRecipients(parsed);
      },
    });
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

        <form onSubmit={formik.handleSubmit} className="space-y-5">
         
          <div>
            <label className="block mb-1 font-medium text-gray-700">User Name</label>
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
            <label className="block mb-1 font-medium text-gray-700">User Email</label>
            <input
              type="email"
              name="userEmail"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.userEmail}
              className={`w-full border rounded-lg p-2 ${
                formik.touched.userEmail && formik.errors.userEmail
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="Enter User email"
            />
            {formik.touched.userEmail && formik.errors.userEmail && (
              <p className="text-red-500 text-sm">{formik.errors.userEmail}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Upload CSV of Senders</label>
            <input 
            type="file"
            name="SenderscsvFile"
            accept=".csv"
            onChange={(event) => {
              const file = event.currentTarget.files[0];
              formik.setFieldValue("csvFile", file);
              if (file) handleSendersCSV(file);
            }}
            className="w-full border border-gray-300 rounded-lg p-2 bg-gray-50"
            />
            {formik.touched.csvFile && formik.errors.csvFile && (
              <p className="text-red-500 text-sm">{formik.errors.csvFile}</p>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Upload CSV of Recipients</label>
            <input
              type="file"
              name="RecipientscsvFile"
              accept=".csv"
              onChange={(event) => {
                const file = event.currentTarget.files[0];
                formik.setFieldValue("csvFile", file);
                if (file) handleRecipientsCSV(file);
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

         
          
         
          <button
            type="submit"
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

        {results && results.results && (
          <div className=" mt-6 space-y-4">
            <h3 className="text-xl font-bold text-gray-800">Email Sending Results</h3>
            <div className="grid gap-4">
              {results.results.map((res, index) =>
              <div 
              key={index} 
              className={`p-4 rounded-xl shadow-md border transition ${
                res.status.includes("Success")
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">
                    Sender: <span className="text-blue-600">{res.sender}</span>
                  </span>
                  <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    res.status.includes("Success")
                    ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800"}`}
                  >
                    {res.status}
                  </span>
                </div>
                <p className="mt-2 text-gray-600">Emails Sent: <b>{res.count}</b></p>
              </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
}