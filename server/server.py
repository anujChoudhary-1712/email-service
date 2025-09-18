from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from bulkemail import send_emails

app = FastAPI()

class Recipient(BaseModel):
    name: str
    email: str

class Sender(BaseModel):
    name: str
    email: str
    password: str

class EmailRequest(BaseModel):
    senders : List[Sender]
    recipients: List[Recipient]
    subject: str   
    body: str

@app.post("/send_emails")

def send_emails_api(request: EmailRequest):
    results = []

    smtp_server = "smtp.gmail.com"
    smtp_port = 587  # TLS
    recipients_per_sender = 20

    for i, sender in enumerate(request.senders):
        start = i * recipients_per_sender
        end = start + recipients_per_sender
        if start >= len(request.recipients):
            break
        sendees = request.recipients[start:end]
        
        try:
            send_emails(
                sendees, 
                sender.name, 
                sender.email, 
                sender.password, 
                smtp_server, 
                smtp_port, 
                request.subject, 
                request.body
            )
            results.append({"sender": sender.email, "status": "Successfully Sent", "count": len(sendees)})

        except Exception as e:
            results.append({"sender": sender.email, "status": f"Failed: {str(e)}"})
        
    return {"results": results}