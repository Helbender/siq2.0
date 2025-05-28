import hashlib  # noqa: D100, INP001
import json
import os
import random
import smtplib
import string
from datetime import datetime, timezone
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
    smtp_port = int(os.getenv("SMTP_PORT", 465))  # SSL port
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
    # hashed_token = hash_code(token)  # noqa: ERA001
    timestamp = datetime.now(timezone.utc).isoformat()  # Get current timestamp in ISO format

    data = {
        "token": token,
        "timestamp": timestamp,
    }

    return json.dumps(data, indent=4)  # Convert dictionary to JSON string with indentation


def main(recipient_email: str) -> str:
    """Send email of password recovery and create json data to add to DB.

    :param recipient_email: Recipient email

    return JSON as str
    """
    # Generate a random 8-character/digit code
    code = generate_code()

    # Prepare email details
    subject = "SIQ - Restauro de password"

    # Create the recovery URL with email and code
    recovery_url = f"https://esq502.onrender.com/#/recovery/{code}/{recipient_email}"
    # recovery_url_docker = f"https://siq.brancohome.synology.me/#/recovery/{code}/{recipient_email}"
    # recovery_url_local = f"http://localhost:5173/#/recovery/{code}/{recipient_email}"  # noqa: ERA001

    # Prepare the HTML email body with a clickable link
    body = f"""<!DOCTYPE html>
<html>
<head>
    <title>Recuperação de Senha</title>
</head>
<body>
    <p>Bom dia,</p>
    <p>Foi iniciado um restauro de password da sua conta do SIQ. Clique no seguinte link para completar a operação:</p>
    <p><a href="{recovery_url}"><-- CLICK AQUI PARA NOVA PASSWORD --></a></p>
    <p>Bons voos!</p>
</body>
</html>"""

    # Send the email
    response = send_email(subject, body, recipient_email)
    print(response)  # Print the response from the email function

    # Print the unhashed password for reference
    print(f"Unhashed password: {code}")

    # Print the JSON data with hashed token and timestamp
    json_data = create_json_data(code)
    print(f"JSON data for storage: {json_data}")
    return json_data


if __name__ == "__main__":
    main("tfp.branco@gmail.com")
