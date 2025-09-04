import csv
import smtplib
from email.message import EmailMessage
import time
import sys


def read_csv(filename):
    with open(filename, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = []
        for row in reader:
            # Normalize keys to lowercase and strip whitespace
            rows.append({k.strip().lower(): v for k, v in row.items()})
        return rows

def send_emails(sendees, sender_name, sender_email, sender_password, smtp_server, smtp_port, subject, mid_body):
    try:
        with smtplib.SMTP(smtp_server, smtp_port) as smtp:
            smtp.starttls()
            smtp.login(sender_email, sender_password)
            for sendee in sendees:
                sendee_name   = sendee['name']
                sendee_email = sendee['email']
                head = f"Hi {sendee_name},\n"
                bottom = f"\n\nBest,\n{sender_name}\nPrimewise Consulting"
                body = head + mid_body + bottom
                msg = EmailMessage()
                msg['Subject'] = subject
                msg['From'] = sender_email
                msg['To'] = sendee_email
                msg.set_content(body)
                smtp.send_message(msg)
                print(f"Email sent successfully to {sendee_name} at {sendee_email}.")
                time.sleep(25)  # Optional: avoid rate limits
    except Exception as e:
        print(f"Failed to send emails from {sender_email}: {e}")

def main():
    senders = read_csv('senders.csv')
    recipients = read_csv('receivers.csv')

    if not senders:
        print("No senders found in senders.csv.")
        return
    if not recipients:
        print("No recipients found in receivers.csv.")
        return

    # Print sender keys for debugging
    print("Sender keys:", senders[0].keys())

    subject = input("Enter the subject of the email: ")
    print("Enter the body of the email (will be personalized). Press Ctrl+D (on Mac/Linux) or Ctrl+Z then Enter (on Windows) to finish:")
    mid_body = sys.stdin.read()
    smtp_server = "smtp.gmail.com"
    smtp_port = 587  # TLS

    recipients_per_sender = 20

    for i, sender in enumerate(senders):
        sender_name = sender['name']
        sender_email = sender['email']
        sender_password = sender['password']

        start = i * recipients_per_sender
        end = start + recipients_per_sender
        if start >= len(recipients):
            break
        sendees = recipients[start:end]
        print(f"\nSending from {sender_email} to recipients {start+1} to {min(end, len(recipients))}...")
        send_emails(sendees, sender_name, sender_email, sender_password, smtp_server, smtp_port, subject, mid_body)

if __name__ == "__main__":
    main()