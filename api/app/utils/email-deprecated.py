"""Email utilities for sending emails and password recovery."""

import hashlib
import json
import os
import random
import smtplib
import string
from datetime import UTC, datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr


def generate_code(length: int = 8) -> str:
    """Generate a random alphanumeric code of a given length."""
    characters = string.ascii_letters + string.digits
    return "".join(random.choice(characters) for _ in range(length))  # noqa: S311


def hash_code(code: str) -> str:
    """Hash the given code using SHA-256."""
    return hashlib.sha256(code.encode()).hexdigest()


def send_email(subject: str, body: str, to: str) -> dict:
    """Send an email with the provided subject, body, and recipient."""
    smtp_server = os.getenv("SMTP_SERVER", "mail.esq502.pt")
    smtp_port = int(os.getenv("SMTP_PORT", "465"))  # SSL port
    smtp_user = os.getenv("SMTP_USER", "noreply@esq502.pt")
    smtp_password = os.getenv("SMTP_PASSWORD", "3M^ds124*$")

    # Create the email message
    msg = MIMEMultipart()
    sender_address = formataddr(("SIQ - Recuperar Password", smtp_user))

    msg["From"] = sender_address
    msg["To"] = to
    msg["Subject"] = subject

    # Attach the body of the email to the MIMEText object with HTML content
    msg.attach(MIMEText(body, "html"))

    # Send the email via SMTP
    try:
        server = smtplib.SMTP_SSL(smtp_server, smtp_port)  # Using SMTP_SSL for SSL connection
        server.login(smtp_user, smtp_password)
        text = msg.as_string()
        server.sendmail(smtp_user, to, text)
        server.quit()
    except Exception as e:  # noqa: BLE001
        print(f"Failed to send email: {e}")  # noqa: T201
        return {"msg": "Error"}  # Return error message
    return {"msg": "Success"}  # Return success message


def create_json_data(token: str) -> str:
    """Create a JSON object with the hashed token and timestamp."""
    timestamp = datetime.now(UTC).isoformat()  # Get current timestamp in ISO format

    data = {
        "token": token,
        "timestamp": timestamp,
    }

    return json.dumps(data, indent=4)  # Convert dictionary to JSON string with indentation


def main(recipient_email: str) -> str:
    """Send email of password recovery and create json data to add to DB.

    Args:
        recipient_email: Recipient email

    Returns:
        JSON as str
    """
    # Generate a random 8-character/digit code
    code = generate_code()

    # Prepare email details
    subject = "SIQ - Restauro de password"

    # Create the recovery URL with email and code
    recovery_url = f"https://esq502.onrender.com/#/recovery/{code}/{recipient_email}"

    # Prepare the HTML email body with a clickable link
    body = f"""<!DOCTYPE html>
<html>
<head>
    <title>Recuperação de Senha</title>
</head>
~    <p><a href="{recovery_url}"><-- CLICK AQUI PARA NOVA PASSWORD --></a></p>
    <p>Bons voos!</p>
</body>
</html>"""

    # Send the email
    response = send_email(subject, body, recipient_email)
    print(response)  # Print the response from the email function  # noqa: T201

    # Print the unhashed password for reference
    print(f"Unhashed password: {code}")  # noqa: T201

    # Print the JSON data with hashed token and timestamp
    json_data = create_json_data(code)
    print(f"JSON data for storage: {json_data}")  # noqa: T201
    return json_data
