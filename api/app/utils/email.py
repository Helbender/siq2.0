"""Email utilities for sending emails."""

import hashlib

from flask_mail import Mail, Message

mail = Mail()


def hash_code(code: str) -> str:
    """Hash the given code using SHA-256.

    Args:
        code: String to hash

    Returns:
        SHA-256 hash of the code as hexadecimal string
    """
    return hashlib.sha256(code.encode()).hexdigest()


def send_email(subject: str, recipients: str | list[str], body: str, html: str | None = None) -> None:
    """Send an email with the provided subject, body, and recipient(s).

    Args:
        subject: Email subject
        recipients: Email recipient(s) - can be a single email string or list of emails
        body: Plain text email body
        html: Optional HTML email body
    """
    # Convert single recipient to list if needed
    if isinstance(recipients, str):
        recipients = [recipients]

    msg = Message(subject=subject, recipients=recipients, body=body, html=html)
    mail.send(msg)
