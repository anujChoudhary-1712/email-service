import { useFormik } from "formik";
import * as Yup from "yup";
import Papa from "papaparse";
import { useState } from "react";
import axios from "axios";

export const emailFormSchema = Yup.object().shape({
  userName: Yup.string().min(2).required("Required"),
  userEmail: Yup.string().email("Invalid email").required("Required"),
  subject: Yup.string().min(3).required("Required"),
  body: Yup.string().min(10).required("Required"),
});

export default function PrimewiseForm() {
  const [senders, setSenders] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [recipientStatus, setRecipientStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({});

  const formik = useFormik({
    initialValues: { userName: "", userEmail: "", subject: "", body: "" },
    validationSchema: emailFormSchema,
    onSubmit: async (values) => {
      if (!senders.length || !recipients.length) return alert("Upload CSV files!");

      setLoading(true);

      
      const initialStatus = {};
      const initialProgress = {};
      senders.forEach((s) => {
        initialStatus[s.email] = recipients.map((r) => ({
          recipient: r.email,
          status: "pending",
          time_taken: null,
        }));
        initialProgress[s.email] = 0;
      });
      setRecipientStatus(initialStatus);
      setProgress(initialProgress);

      try {
        const payload = { senders, recipients, subject: values.subject, body: values.body };

        
        const interval = setInterval(() => {
          setProgress((prev) => {
            const updated = { ...prev };
            senders.forEach((s) => { if (updated[s.email] < 95) updated[s.email] += Math.random() * 5; });
            return updated;
          });
        }, 500);

        const res = await axios.post("http://127.0.0.1:8000/send_emails", payload);
        clearInterval(interval);

        
        const finalProgress = {};
        senders.forEach((s) => (finalProgress[s.email] = 100));
        setProgress(finalProgress);

        
        const updatedStatus = {};
        res.data.results.forEach((senderResult) => {
          updatedStatus[senderResult.sender] = senderResult.recipient_results.map((r) => ({ ...r }));
        });
        setRecipientStatus(updatedStatus);

      } catch (err) {
        console.error(err);
        alert("Failed to send emails");
      } finally {
        setLoading(false);
      }
    },
  });

  
  const handleCSV = (file, type) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsed = results.data.map((row) => {
          const cleaned = {};
          Object.keys(row || {}).forEach((k) => {
            cleaned[k.trim().toLowerCase()] = row[k]?.toString().trim() || "";
          });
          return cleaned;
        });
        type === "senders" ? setSenders(parsed) : setRecipients(parsed);
      },
    });
  };

  
  const retryEmail = async (senderEmail, recipient) => {
    try {
      const payload = { senders: senders.filter((s) => s.email === senderEmail), recipients: [recipient], subject: formik.values.subject, body: formik.values.body };
      const res = await axios.post("http://127.0.0.1:8000/send_emails", payload);

      const updated = { ...recipientStatus };
      const result = res.data.results[0].recipient_results[0];
      updated[senderEmail] = updated[senderEmail].map((r) => r.recipient === result.recipient ? { ...r, ...result } : r);
      setRecipientStatus(updated);
    } catch (err) {
      console.error(err);
      alert("Retry failed");
    }
  };

  const getPersonalizedBody = (recipient) => {
    let body = formik.values.body;
    if (!recipient) return body;
    Object.keys(recipient).forEach((key) => {
      const regex = new RegExp(`{${key}}`, "gi");
      body = body.replace(regex, recipient[key]);
    });
    return body;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
  
      <div className="flex-shrink-0 w-full md:w-48 bg-white p-6 flex flex-col items-start sticky top-0">
        <img src="/logo.png" alt="Primewise Logo" className="w-40 mb-4 sticky top-4" />
      </div>

    
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-4xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-center">Primewise Bulk Email Form</h1>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <input
              name="userName"
              placeholder="User Name"
              className="w-full border rounded-lg p-2"
              onChange={formik.handleChange}
              value={formik.values.userName}
            />
            <input
              name="userEmail"
              placeholder="User Email"
              className="w-full border rounded-lg p-2"
              onChange={formik.handleChange}
              value={formik.values.userEmail}
            />
            <input
              name="subject"
              placeholder="Subject"
              className="w-full border rounded-lg p-2"
              onChange={formik.handleChange}
              value={formik.values.subject}
            />
            <textarea
              name="body"
              placeholder="Message Body (use {name}, {company}, {role}, {location})"
              rows={4}
              className="w-full border rounded-lg p-2"
              onChange={formik.handleChange}
              value={formik.values.body}
            />

            {["senders", "recipients"].map((type) => (
              <div
                key={type}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleCSV(e.dataTransfer.files[0], type); }}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById(type + "-file").click()}
                className="border-2 border-dashed p-4 rounded-lg text-center cursor-pointer hover:border-blue-500"
              >
                {type === "senders"
                  ? senders.length > 0 ? `Senders CSV Loaded (${senders.length})` : "Upload Senders CSV"
                  : recipients.length > 0 ? `Recipients CSV Loaded (${recipients.length})` : "Upload Recipients CSV"}
                <input
                  id={type + "-file"}
                  type="file"
                  accept=".csv"
                  onChange={(e) => handleCSV(e.target.files[0], type)}
                  className="hidden"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded-lg text-white font-semibold ${loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading ? "Sending..." : "Send Emails"}
            </button>
          </form>

          
          {recipients.length > 0 && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
              <h2 className="text-lg font-semibold mb-2">Live Preview</h2>
              {recipients.map((recipient, idx) => (
                <div key={idx} className="mb-3 p-3 border rounded bg-white">
                  <p className="font-medium"><strong>{recipient.email}</strong></p>
                  <p className="text-gray-700 text-sm">{getPersonalizedBody(recipient)}</p>
                </div>
              ))}
            </div>
          )}

  
          {senders.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Sending Progress</h3>
              {senders.map((s) => (
                <div key={s.email} className="mb-3">
                  <p className="text-sm font-medium">{s.email}</p>
                  <div className="w-full bg-gray-200 h-3 rounded-full">
                    <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress[s.email] || 0}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          
          {Object.keys(recipientStatus).length > 0 && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
              {Object.entries(recipientStatus).map(([senderEmail, recs]) => (
                <div key={senderEmail} className="mb-4">
                  <h3 className="font-semibold mb-2">{senderEmail}</h3>
                  <ul className="space-y-2 text-sm">
                    {recs.map((r, idx) => (
                      <li key={idx} className="flex flex-col md:flex-row justify-between items-start md:items-center p-2 border rounded bg-white">
                        <div>
                          <p><strong>{r.recipient}</strong></p>
                          <p className="text-gray-700 text-sm">{getPersonalizedBody(recipients.find(rec => rec.email === r.recipient) || {})}</p>
                          {r.time_taken && <p className="text-xs text-gray-500">⏱ {r.time_taken}</p>}
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                          {r.status === "sent" && <span className="text-green-600">✅ Sent</span>}
                          {r.status.startsWith("failed") && (
                            <>
                              <span className="text-red-600">❌ Failed</span>
                              <button onClick={() => retryEmail(senderEmail, recipients.find(rec => rec.email === r.recipient))} className="ml-2 px-2 py-1 bg-blue-500 text-white rounded text-xs">
                                Retry
                              </button>
                            </>
                          )}
                          {r.status === "pending" && <span className="text-gray-500">⏳ Pending</span>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
