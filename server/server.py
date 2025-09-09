from fastapi import FastAPI, HTTPException, Form
import subprocess


app = FastAPI()


    

@app.get("/")
def root():
    return {"message": "Email API is running. Use POST /send-emails to send emails."}


@app.post("/send_emails")
 
def send_emails(subject: str = Form(...), body: str = Form(...)):
    try:
        process = subprocess.Popen(
            ['python', 'bulkemail.py'],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        input_text = subject + "\n" + body
        stdout, stderr = process.communicate(input=input_text)
        
        if process.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Error sending emails: {stderr}")
        
        return {"message": "Emails sent successfully", "output": stdout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



