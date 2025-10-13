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
  csvFile: Yup.mixed(),
});

export default function PrimewiseForm() {
  const [senders, setSenders] = useState([]);
  const [recipients, setRecipients] = useState([]);
  const [sendersFile, setSendersFile] = useState(null);
  const [recipientsFile, setRecipientsFile] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const formik = useFormik({
    initialValues: { userName: "", userEmail: "", subject: "", body: "" },
    validationSchema: emailFormSchema,
    onSubmit: async (values) => {
      if (!sendersFile || !recipientsFile)
        return alert("Upload both CSV files");

      const formData = new FormData();
      formData.append("sender_file", sendersFile);
      formData.append("receiver_file", recipientsFile);
      formData.append("subject", values.subject);
      formData.append("body", values.body);

      try {
        setLoading(true);
        setResults([]); 

        const res = await axios.post(
          "http://127.0.0.1:8000/send_bulk_emails",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        
        const allRecipients = [];
        senders.forEach((sender, i) => {
          const start = i * 20;
          const end = start + 20;
          const sendees = recipients.slice(start, end);
          sendees.forEach((recipient) => {
            allRecipients.push({
              recipientEmail: recipient.email,
              status: "Pending",
            });
          });
        });

        setResults(allRecipients);

       
        res.data.results.forEach((senderResult) => {
          senderResult.sent_emails?.forEach((r, idx) => {
            setTimeout(() => {
              setResults((prev) => {
                const copy = [...prev];
                const index = copy.findIndex(
                  (item) => item.recipientEmail === r.email
                );
                if (index > -1)
                  copy[index] = { ...copy[index], status: r.status, time: new Date().toLocaleTimeString() };
                return copy;
              });
            }, idx * 500); 
          });
        });
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
          Object.keys(row || {}).forEach(
            (k) =>
              (cleaned[k.trim().toLowerCase()] = row[k]?.toString().trim() || "")
          );
          return cleaned;
        });
        type === "senders" ? setSenders(parsed) : setRecipients(parsed);
        type === "senders" ? setSendersFile(file) : setRecipientsFile(file);
      },
    });
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) handleCSV(e.dataTransfer.files[0], type);
  };
  const handleDragOver = (e) => e.preventDefault();

 
  const retryEmail = async (recipient) => {
    if (!sendersFile || !recipientsFile) return;

    const formData = new FormData();
    formData.append("sender_file", sendersFile);
    formData.append("receiver_file", recipientsFile);
    formData.append("subject", formik.values.subject);
    formData.append("body", formik.values.body);

    try {
      setResults((prev) =>
        prev.map((r) =>
          r.recipientEmail === recipient.recipientEmail
            ? { ...r, status: "Retrying..." }
            : r
        )
      );

      const res = await axios.post(
        "http://127.0.0.1:8000/send_bulk_emails",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updatedStatus = res.data.results
        .flatMap((s) => s.sent_emails)
        .find((r) => r.email === recipient.recipientEmail)?.status;

      setResults((prev) =>
        prev.map((r) =>
          r.recipientEmail === recipient.recipientEmail
            ? { ...r, status: updatedStatus || "Failed", time: new Date().toLocaleTimeString() }
            : r
        )
      );
    } catch (err) {
      console.error(err);
      setResults((prev) =>
        prev.map((r) =>
          r.recipientEmail === recipient.recipientEmail
            ? { ...r, status: "Retry Failed" }
            : r
        )
      );
    }
  };

 
  const livePreview = recipients.slice(0, 3).map((recipient) => {
    let personalizedBody = formik.values.body;
    Object.keys(recipient).forEach((key) => {
      const regex = new RegExp(`{${key}}`, "gi");
      personalizedBody = personalizedBody.replace(regex, recipient[key]);
    });
    return { email: recipient.email, body: personalizedBody };
  });

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      
      <div className="flex-shrink-0 w-full md:w-48 bg-white p-6 flex flex-col items-start sticky top-0">
        <img src="/logo.png" alt="Primewise Logo" className="w-40 mb-4 sticky top-4" />
      </div>

      {/* Main Form */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-4xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-center">
            Primewise Bulk Email Form
          </h1>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1 font-medium">User Name</label>
              <input
                type="text"
                name="userName"
                onChange={formik.handleChange}
                value={formik.values.userName}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">User Email</label>
              <input
                type="email"
                name="userEmail"
                onChange={formik.handleChange}
                value={formik.values.userEmail}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Subject</label>
              <input
                type="text"
                name="subject"
                onChange={formik.handleChange}
                value={formik.values.subject}
                className="w-full border rounded-lg p-2"
              />
            </div>

            <div>
              <label className="block mb-1 font-medium">Message Body</label>
              <textarea
                name="body"
                onChange={formik.handleChange}
                value={formik.values.body}
                rows={4}
                placeholder="Use {name}, {role}, etc."
                className="w-full border rounded-lg p-2"
              />
            </div>

            {["senders", "recipients"].map((type) => (
              <div
                key={type}
                onDrop={(e) => handleDrop(e, type)}
                onDragOver={handleDragOver}
                onClick={() => document.getElementById(type + "-file").click()}
                className="border-2 border-dashed p-4 rounded-lg text-center cursor-pointer hover:border-blue-500"
              >
                {type === "senders"
                  ? sendersFile?.name || "Upload Senders CSV"
                  : recipientsFile?.name || "Upload Recipients CSV"}
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
              className={`w-full py-2 rounded-lg text-white font-semibold ${
                loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Sending..." : "Send Emails"}
            </button>
          </form>

          
          {livePreview.length > 0 && (
            <div className="mt-4 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-2">Live Preview</h3>
              {livePreview.map((item, idx) => (
                <div key={idx} className="mb-2 p-2 border rounded bg-white">
                  <p><strong>Recipient:</strong> {item.email}</p>
                  <p className="whitespace-pre-wrap">{item.body}</p>
                </div>
              ))}
              {recipients.length > 3 && <p>...and more recipients</p>}
            </div>
          )}

          
          {results.length > 0 && (
            <div className="mt-6 p-4 border rounded-lg bg-gray-50 max-h-96 overflow-y-auto">
              <h3 className="font-semibold mb-2">Sending Status</h3>
              {results.map((r, idx) => (
                <div key={idx} className="mb-1 p-2 border rounded bg-white flex justify-between items-center">
                  <div>
                    <span>{r.recipientEmail}</span>
                    {r.time && <span className="ml-2 text-gray-500">({r.time})</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        r.status === "Sent"
                          ? "text-green-600"
                          : r.status.includes("Failed")
                          ? "text-red-600"
                          : "text-gray-600"
                      }
                    >
                      {r.status}
                    </span>
                    {r.status.includes("Failed") && (
                      <button
                        onClick={() => retryEmail(r)}
                        className="ml-2 px-2 py-1 bg-yellow-400 text-white rounded hover:bg-yellow-500 text-sm"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
