#!/usr/bin/env python3
"""Generate a secure JWT secret key."""

import secrets
import sys


def generate_jwt_key(length: int = 64) -> str:
    """Generate a cryptographically secure random string for JWT_KEY.

    Args:
        length: Length of the key in characters (default: 64, minimum: 32)

    Returns:
        A secure random string suitable for JWT_KEY
    """
    if length < 32:
        print("Warning: JWT keys should be at least 32 characters for security.", file=sys.stderr)
        length = 32

    # Generate a URL-safe random string
    key = secrets.token_urlsafe(length)
    return key


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Generate a secure JWT secret key")
    parser.add_argument(
        "--length",
        type=int,
        default=64,
        help="Length of the key in characters (default: 64, minimum: 32)",
    )
    args = parser.parse_args()

    key = generate_jwt_key(args.length)
    print(f"Generated JWT_KEY (length: {len(key)}):")
    print(key)
    print("\nAdd this to your .env file:")
    print(f"JWT_KEY={key}")
