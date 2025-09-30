from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Extra
from typing import List, Optional
from bulkemail import send_emails

app = FastAPI()

origins =[
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


class Recipient(BaseModel, extra=Extra.allow):
    name: str
    email: str

class Sender(BaseModel):
    name: str
    email: str
    password: str

class User(BaseModel):
    name: str
    email: str

class EmailRequest(BaseModel):
    user: Optional[User] = None
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

        recipients_for_helper = [r.dict(by_alias = True) for r in sendees]
        
        try:
            send_emails(
                recipients_for_helper,
                sender.name, 
                sender.email, 
                sender.password, 
                smtp_server, 
                smtp_port, 
                request.subject,
                request.body, 
            )
            results.append({"sender": sender.email, "status": "Successfully Sent", "count": len(sendees)})

        except Exception as e:
            results.append({"sender": sender.email, "status": f"Failed: {str(e)}"})
        
    return {"results": results}