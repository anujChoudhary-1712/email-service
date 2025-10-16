from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import smtplib
from email.message import EmailMessage
import time
import logging

# Initialize FastAPI
app = FastAPI()
logging.basicConfig(level=logging.INFO)

# CORS
origins = ["http://localhost:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Pydantic models
class Recipient(BaseModel):
    name: str
    email: str
    location: str = ""
    role: str = ""
    company: str = ""

class Sender(BaseModel):
    name: str
    email: str
    password: str

class EmailRequest(BaseModel):
    senders: List[Sender]
    recipients: List[Recipient]
    subject: str
    body: str

# Function to send emails
def send_emails(
    recipients: List[Recipient],
    sender_name: str,
    sender_email: str,
    sender_password: str,
    smtp_server: str,
    smtp_port: int,
    subject: str,
    body_template: str
) -> List[dict]:
    results = []
    for recipient in recipients:
        start = time.time()
        try:
            # Replace dynamic variables
            body = body_template
            for field in recipient.__fields_set__:
                body = body.replace(f"{{{field}}}", getattr(recipient, field))

            # Email message
            msg = EmailMessage()
            msg["From"] = sender_email
            msg["To"] = recipient.email
            msg["Subject"] = subject
            msg.set_content(body)

            # Send email
            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)

            elapsed = round(time.time() - start, 2)
            logging.info(f"Email sent to {recipient.email} by {sender_email} in {elapsed}s")
            results.append({
                "recipient": recipient.email,
                "status": "sent",
                "time_taken": f"{elapsed} seconds"
            })
        except Exception as e:
            elapsed = round(time.time() - start, 2)
            logging.error(f"Failed to send email from {sender_email} to {recipient.email}: {str(e)}")
            results.append({
                "recipient": recipient.email,
                "status": f"failed: {str(e)}",
                "time_taken": f"{elapsed} seconds"
            })
    return results

# API endpoint
@app.post("/send_emails")
def send_emails_api(request: EmailRequest):
    smtp_server = "smtp.gmail.com"
    smtp_port = 587  # TLS
    all_results = []

    for sender in request.senders:
        if not sender.name or not sender.email or not sender.password:
            all_results.append({
                "sender": sender.email,
                "status": "Failed: Missing sender information",
                "recipient_results": []
            })
            continue

        start_sender = time.time()
        try:
            recipient_results = send_emails(
                request.recipients,
                sender.name,
                sender.email,
                sender.password,
                smtp_server,
                smtp_port,
                request.subject,
                request.body
            )
            elapsed_sender = round(time.time() - start_sender, 2)
            all_results.append({
                "sender": sender.email,
                "status": "Successfully Sent",
                "count": len(request.recipients),
                "time_taken": f"{elapsed_sender} seconds",
                "recipient_results": recipient_results
            })
        except Exception as e:
            elapsed_sender = round(time.time() - start_sender, 2)
            all_results.append({
                "sender": sender.email,
                "status": f"Failed: {str(e)}",
                "time_taken": f"{elapsed_sender} seconds",
                "recipient_results": []
            })

    return {"results": all_results}
