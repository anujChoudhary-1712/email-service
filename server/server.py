from fastapi import FastAPI, UploadFile, Form, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from bulkemail import send_emails  
import csv
from io import StringIO

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/send_emails")
async def send_emails_route(
    userName: str = Form(...),
    senderEmail: str = Form(...),
    senderPassword: str = Form(...),
    subject: str = Form(...),
    body: str = Form(...),
    recipientsPerSender: int = Form(...),
    csvFile: UploadFile = File(...)
):
    try:
        # Read CSV content
        content = await csvFile.read()
        csv_text = content.decode("utf-8")

       
        reader = csv.reader(StringIO(csv_text))
        recipients = []

        for row in reader:
            if not row:
                continue
            
            email = row[-1].strip()
            if email:
                recipients.append(email)

        if not recipients:
            return JSONResponse(
                status_code=400,
                content={"message": "No valid email addresses found in the CSV."}
            )

        
        required_senders = (len(recipients) + recipientsPerSender - 1) // recipientsPerSender

        results = []
        # Send emails in batches
        for i in range(0, len(recipients), recipientsPerSender):
            batch = recipients[i:i + recipientsPerSender]
            try:
                send_emails(
                    batch,
                    userName,
                    senderEmail,
                    senderPassword,
                    "smtp.gmail.com",
                    587,
                    subject,
                    body
                )
                results.append({
                    "batch_start": i,
                    "count": len(batch),
                    "status": "Success"
                })
            except Exception as e:
                results.append({
                    "batch_start": i,
                    "count": len(batch),
                    "status": f"Failed: {str(e)}"
                })

        return JSONResponse({
            "message": f"Total recipients: {len(recipients)}. Estimated senders needed: {required_senders}",
            "results": results
        })

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"message": f"Server error: {str(e)}"}
        )
