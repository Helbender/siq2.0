"""Time utility functions."""

def parse_time_to_minutes(time_str: str) -> int:
    """Parse time string in format 'HH:MM' to total minutes.

    Args:
        time_str: Time string in format 'HH:MM' or '__:__'

    Returns:
        Total minutes as integer, or 0 if invalid
    """
    if not time_str or time_str == "" or time_str == "__:__":
        return 0
    try:
        parts = time_str.split(":")
        if len(parts) != 2:
            return 0
        hours = int(parts[0])
        minutes = int(parts[1])
        return hours * 60 + minutes
    except (ValueError, AttributeError):
        return 0

