import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_emails(recipients, userName, senderEmail, senderPassword, smtp_server, port, subject, body):
    try:
        server = smtplib.SMTP(smtp_server, port)
        server.starttls()
        server.login(senderEmail, senderPassword)

        for r in recipients:
            msg = MIMEMultipart()
            msg["From"] = f"{userName} <{senderEmail}>"
            msg["To"] = r   # ✅ recipient is string
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "plain"))

            try:
                server.sendmail(senderEmail, r, msg.as_string())
                print(f"✅ Email sent to {r}")
            except Exception as e:
                print(f"❌ Failed to send to {r}: {e}")

        server.quit()
    except Exception as e:
        print(f"Failed to send emails from {senderEmail}: {e}")
