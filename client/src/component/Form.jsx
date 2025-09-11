import { useFormik } from "formik";
import { emailFormSchema } from "../utils/validationSchema";
import Papa from "papaparse";
import { useState } from "react";

export default function PrimewiseForm() {
  const [totalEmails, setTotalEmails] = useState(0);
  const [requiredSenders, setRequiredSenders] = useState(0);

  const formik = useFormik({
    initialValues: {
      userName: "",
      recipientEmail: "",
      subject: "",
      body: "",
      recipientsPerSender: 1,
      csvFile: null,
    },
    validationSchema: emailFormSchema,
    onSubmit: (values) => {
      console.log("Form Data:", values);
      alert("Form submitted successfully!");
    },
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

  return (
    <div className=" min-h-screen bg-white relative flex items-center justify-center  py-5">
      
      <div className="absolute top-4 left-4">
        <img src="/public/logo.png" alt="primewise" className="h-12" />
      </div>

      
      <div className= " font-sans font-normal bg-white border-2 border-black-100   shadow-xl rounded-2xl p-8 my-16 w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-black mb-6 text-center">
          Primewise Bulk Email Form
        </h1>

        <form onSubmit={formik.handleSubmit} className="space-y-5">
         
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              User Name
            </label>
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
              } focus:ring-2 focus:ring-prime-blue`}
              placeholder="Enter your name"
            />
            {formik.touched.userName && formik.errors.userName && (
              <p className="text-red-500 text-sm">{formik.errors.userName}</p>
            )}
          </div>

         
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Recipient Email
            </label>
            <input
              type="email"
              name="recipientEmail"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.recipientEmail}
              className={`w-full border rounded-lg p-2 ${
                formik.touched.recipientEmail && formik.errors.recipientEmail
                  ? "border-red-500"
                  : "border-gray-300"
              } focus:ring-2 focus:ring-prime-blue`}
              placeholder="Enter recipient email"
            />
            {formik.touched.recipientEmail && formik.errors.recipientEmail && (
              <p className="text-red-500 text-sm">
                {formik.errors.recipientEmail}
              </p>
            )}
          </div>

        
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Upload CSV of Sendees
            </label>
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
            <label className="block mb-1 font-medium text-gray-700">
              Subject
            </label>
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
              } focus:ring-2 focus:ring-prime-blue`}
              placeholder="Enter email subject"
            />
            {formik.touched.subject && formik.errors.subject && (
              <p className="text-red-500 text-sm">{formik.errors.subject}</p>
            )}
          </div>

         
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Email Body
            </label>
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
              } focus:ring-2 focus:ring-prime-blue`}
              placeholder="Write your email here..."
            />
            {formik.touched.body && formik.errors.body && (
              <p className="text-red-500 text-sm">{formik.errors.body}</p>
            )}
          </div>

         
          <div>
            <label className="block mb-1 font-medium text-gray-700">
              Recipients Per Sender
            </label>
            <input
              type="number"
              name="recipientsPerSender"
              onChange={(e) => {
                formik.handleChange(e);
                if (totalEmails > 0) {
                  const sendersNeeded = Math.ceil(
                    totalEmails / e.target.value
                  );
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
              } focus:ring-2 focus:ring-prime-blue`}
              min="1"
            />
            {formik.touched.recipientsPerSender &&
              formik.errors.recipientsPerSender && (
                <p className="text-red-500 text-sm">
                  {formik.errors.recipientsPerSender}
                </p>
              )}
          </div>

         
          {totalEmails > 0 && (
            <div className="bg-prime-gray p-4 rounded-lg text-center">
              <p className="font-medium text-gray-700">
                Total Emails in CSV: <b>{totalEmails}</b>
              </p>
              <p className="font-medium text-gray-700">
                Required Senders:{" "}
                <b className="text-prime-blue">{requiredSenders}</b>
              </p>
            </div>
          )}

          
          <button
            type="submit"
            className="w-full bg-prime-blue text-white font-semibold py-2 rounded-lg shadow-md hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  );
}
