#!/usr/bin/env python3
"""Script to download .1m flight files from Google Drive.

This script connects to Google Drive, navigates the folder structure (year/month/day),
finds all .1m files, and downloads them to a local directory.
"""

import argparse
import os
import sys
from datetime import datetime

# Add the parent directory (api/) to Python path to import local modules
api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

# Load environment variables from api/.env
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(api_dir, ".env"))

import io

from google.oauth2 import service_account  # type:ignore
from googleapiclient.discovery import build  # type:ignore
from googleapiclient.http import MediaIoBaseDownload  # type:ignore

from functions.gdrive import ID_PASTA_VOO  # type: ignore

# Scopes needed for reading from Drive (using same as upload)
SCOPES = ["https://www.googleapis.com/auth/drive.file"]


def get_drive_service():
    """Get authenticated Google Drive service."""
    # Carrega credenciais do arquivo JSON (same method as upload functions)
    api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    credentials_path = os.path.join(api_dir, "credentials.json")
    credentials = service_account.Credentials.from_service_account_file(credentials_path, scopes=SCOPES)

    # Cria o cliente para a API do Drive
    service = build("drive", "v3", credentials=credentials)
    return service


def find_folder_by_name(service, parent_id: str, folder_name: str) -> str | None:
    """Find a folder by name within a parent folder.

    Args:
        service: Google Drive service object
        parent_id: ID of the parent folder
        folder_name: Name of the folder to find

    Returns:
        Folder ID if found, None otherwise
    """
    query = (
        f"name = '{folder_name}' "
        f"and mimeType = 'application/vnd.google-apps.folder' "
        f"and '{parent_id}' in parents "
        f"and trashed = false"
    )
    response = service.files().list(q=query, fields="files(id, name)").execute()
    files = response.get("files", [])

    if files:
        return files[0]["id"]
    return None


def navigate_to_folder_path(
    service, base_folder_id: str, year: str | None = None, month: str | None = None, day: str | None = None
) -> str | None:
    """Navigate to a specific folder path in Google Drive based on year/month/day.

    Args:
        service: Google Drive service object
        base_folder_id: ID of the base folder
        year: Year folder name (e.g., "2025")
        month: Month folder name (e.g., "Apr")
        day: Day folder name (e.g., "02")

    Returns:
        Folder ID if the path exists, None otherwise
    """
    current_folder_id = base_folder_id

    if year:
        folder_id = find_folder_by_name(service, current_folder_id, year)
        if not folder_id:
            return None
        current_folder_id = folder_id

        if month:
            folder_id = find_folder_by_name(service, current_folder_id, month)
            if not folder_id:
                return None
            current_folder_id = folder_id

            if day:
                folder_id = find_folder_by_name(service, current_folder_id, day)
                if not folder_id:
                    return None
                current_folder_id = folder_id

    return current_folder_id


def list_files_in_folder(service, folder_id: str, file_extension: str = ".1m", recursive: bool = True):
    """List all files with given extension in a folder and optionally its subfolders.

    Args:
        service: Google Drive service object
        folder_id: ID of the folder to search
        file_extension: File extension to filter (default: .1m)
        recursive: If True, search subfolders recursively. If False, only search current folder.

    Returns:
        List of file dictionaries with id, name, and parents
    """
    all_files = []

    def list_files_recursive(parent_id: str):
        """Recursively list files in folder and subfolders."""
        # List all files in current folder
        query = f"'{parent_id}' in parents and trashed = false"
        results = service.files().list(q=query, fields="files(id, name, mimeType, parents)").execute()
        items = results.get("files", [])

        for item in items:
            mime_type = item.get("mimeType", "")
            # If it's a folder and recursive is True, recurse into it
            if mime_type == "application/vnd.google-apps.folder" and recursive:
                list_files_recursive(item["id"])
            # If it's a file with the target extension, add it to the list
            elif item["name"].endswith(file_extension):
                all_files.append(item)

    list_files_recursive(folder_id)
    return all_files


def download_file(service, file_id: str, file_name: str, destination_path: str, current: int, total: int):
    """Download a file from Google Drive.

    Args:
        service: Google Drive service object
        file_id: ID of the file to download
        file_name: Name of the file
        destination_path: Local path where file should be saved
        current: Current file number (for progress display)
        total: Total number of files (for progress display)

    Returns:
        True if successful, False otherwise
    """
    try:
        # Print initial progress message
        print(f"\rDownloading file {current}/{total}: {file_name}" + " " * 20, end="", flush=True)

        request = service.files().get_media(fileId=file_id)
        file_handle = io.BytesIO()
        downloader = MediaIoBaseDownload(file_handle, request)

        done = False
        while not done:
            status, done = downloader.next_chunk()
            # Progress is handled by the initial message, no need to print again

        # Write to file
        file_handle.seek(0)
        with open(destination_path, "wb") as f:
            f.write(file_handle.read())

        # Print success message inline
        # print(f"\r✅ Downloaded file {current}/{total}: {file_name}" + " " * 20, end="", flush=True)
        return True
    except Exception as e:
        # Print error message inline
        print(f"\r❌ Error downloading file {current}/{total}: {file_name} - {e}" + " " * 20, flush=True)
        return False


def get_folder_structure_from_filename(filename: str):
    """Extract year, month, day from filename.

    Filename format: "1M 50A0023 02Apr2025 03_20 16710.1m"
    Date is in the 3rd part: "02Apr2025"

    Args:
        filename: Name of the file

    Returns:
        Tuple of (year, month, day) or None if parsing fails
    """
    try:
        parts = filename.split()
        if len(parts) < 5:
            return None
        date_str = parts[2]  # "02Apr2025"
        day = date_str[:2]  # "02"
        month = date_str[2:5]  # "Apr"
        year = date_str[-4:]  # "2025"

        return (year, month, day)
    except Exception:
        return None


def download_flights_from_drive(
    service,
    base_folder_id: str,
    output_folder: str,
    year_filter: str | None = None,
    month_filter: str | None = None,
    day_filter: str | None = None,
):
    """Download all .1m files from Google Drive to local folder.

    Args:
        service: Google Drive service object
        base_folder_id: ID of the base folder in Google Drive
        output_folder: Local folder where files should be saved
        year_filter: Optional year to filter (e.g., "2025")
        month_filter: Optional month to filter (e.g., "Apr")
        day_filter: Optional day to filter (e.g., "02")
    """
    print("🔍 Searching for .1m files in Google Drive folder...")
    print(f"📁 Base folder ID: {base_folder_id}")
    if year_filter:
        print(f"📅 Year filter: {year_filter}")
    if month_filter:
        print(f"📅 Month filter: {month_filter}")
    if day_filter:
        print(f"📅 Day filter: {day_filter}")
    print("-" * 60)

    # Try to navigate to the filtered folder path first
    search_folder_id = base_folder_id
    recursive_search = True
    navigation_successful = False

    if year_filter or month_filter or day_filter:
        # Navigate to the specific folder path based on filters
        target_folder_id = navigate_to_folder_path(service, base_folder_id, year_filter, month_filter, day_filter)

        if target_folder_id:
            search_folder_id = target_folder_id
            navigation_successful = True
            # If all three filters are provided, we're at the day folder, so no need to recurse
            if year_filter and month_filter and day_filter:
                recursive_search = False
                print(f"✅ Navigated to filtered folder path: {year_filter}/{month_filter}/{day_filter}")
            else:
                print(
                    f"✅ Navigated to filtered folder: {year_filter or 'root'}/{month_filter or ''}/{day_filter or ''}"
                )
                print("   (Searching recursively in subfolders)")
        else:
            print("⚠️  Filtered folder path not found, searching from base folder")
            print("   (This may take longer)")

    # List all .1m files in the target folder
    all_files = list_files_in_folder(service, search_folder_id, ".1m", recursive=recursive_search)
    print(f"📊 Found {len(all_files)} .1m files in Google Drive")

    if not all_files:
        print("❌ No .1m files found!")
        return

    # Create output folder structure
    os.makedirs(output_folder, exist_ok=True)

    # First, filter files and prepare download list
    files_to_download = []
    skipped_count = 0
    skipped_wrong_format = []  # Track files skipped due to wrong filename format
    total_processed = 0

    # Determine which filters still need to be applied based on navigation
    # If we successfully navigated to a folder level, we don't need to filter at that level
    # We only need to filter at levels we didn't navigate to
    if navigation_successful:
        # If we navigated to day folder (all 3 filters), no filtering needed
        if year_filter and month_filter and day_filter and not recursive_search:
            need_year_filter = False
            need_month_filter = False
            need_day_filter = False
        # If we navigated to month folder (year + month), only filter by day
        elif year_filter and month_filter:
            need_year_filter = False
            need_month_filter = False
            need_day_filter = day_filter is not None
        # If we navigated to year folder (only year), filter by month and day
        elif year_filter:
            need_year_filter = False
            need_month_filter = month_filter is not None
            need_day_filter = day_filter is not None
        else:
            # Navigation happened but unclear state, apply all filters
            need_year_filter = year_filter is not None
            need_month_filter = month_filter is not None
            need_day_filter = day_filter is not None
    else:
        # Navigation failed or no filters, apply all filters
        need_year_filter = year_filter is not None
        need_month_filter = month_filter is not None
        need_day_filter = day_filter is not None

    print("\rProcessing files..." + " " * 50, end="", flush=True)

    for file_info in all_files:
        total_processed += 1
        file_name = file_info["name"]
        file_id = file_info["id"]

        # Extract folder structure from filename
        folder_structure = get_folder_structure_from_filename(file_name)
        if not folder_structure or None:
            print(
                f"\r⚠️  Skipping {file_name} (could not parse date) - {total_processed}/{len(all_files)}" + " " * 20,
                flush=True,
            )
            skipped_wrong_format.append(file_name)
            continue

        year, month, day = folder_structure

        # Apply remaining filters (only if we didn't navigate to that level)
        if need_year_filter and year_filter and year != year_filter:
            continue
        if need_month_filter and month_filter and month != month_filter:
            continue
        if need_day_filter and day_filter and day != day_filter:
            continue

        print(f"File to download: {file_name}")

        # Create local folder structure: output_folder/year/month/day/
        local_folder = os.path.join(output_folder, year, month, day)
        os.makedirs(local_folder, exist_ok=True)

        # Destination file path
        destination_path = os.path.join(local_folder, file_name)

        # Check if file already exists
        if os.path.exists(destination_path):
            skipped_count += 1
            continue

        # Add to download list
        files_to_download.append(
            {
                "file_id": file_id,
                "file_name": file_name,
                "destination_path": destination_path,
            }
        )

    # Now download all files with progress
    total_files = len(files_to_download)
    downloaded_count = 0
    error_count = 0

    if total_files == 0:
        print("\rNo new files to download." + " " * 20, flush=True)
    else:
        print(f"\rStarting download of {total_files} files..." + " " * 20, flush=True)
        print()  # New line for download progress

        for idx, file_data in enumerate(files_to_download, start=1):
            if download_file(
                service,
                file_data["file_id"],
                file_data["file_name"],
                file_data["destination_path"],
                current=idx,
                total=total_files,
            ):
                downloaded_count += 1
            else:
                error_count += 1

    print("\n" + "=" * 60)
    print("📊 Download Summary:")
    print(f"  ✅ Downloaded: {downloaded_count}")
    print(f"  ⏭️  Skipped (already exists): {skipped_count}")
    print(f"  ❌ Errors: {error_count}")
    print(f"  📁 Total files: {len(all_files)}")
    if skipped_wrong_format:
        print(f"\n⚠️  Files skipped due to wrong filename format ({len(skipped_wrong_format)}):")
        for filename in skipped_wrong_format:
            print(f"    - {filename}")
    print("=" * 60)


def main():
    """Main function to parse arguments and download files."""
    parser = argparse.ArgumentParser(description="Download .1m flight files from Google Drive")
    parser.add_argument(
        "output_folder",
        type=str,
        help="Name of the folder where files will be downloaded (inside scripts/ directory)",
    )
    parser.add_argument(
        "--year",
        type=str,
        help="Filter by year (e.g., 2025)",
        default=None,
    )
    parser.add_argument(
        "--month",
        type=str,
        help="Filter by month (e.g., Apr)",
        default=None,
    )
    parser.add_argument(
        "--day",
        type=str,
        help="Filter by day (e.g., 02)",
        default=None,
    )

    args = parser.parse_args()

    # Check if credentials file exists (in parent api/ directory)
    api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    credentials_path = os.path.join(api_dir, "credentials.json")
    if not os.path.exists(credentials_path):
        print("❌ Error: credentials.json file not found!")
        print("   Please ensure credentials.json is in the api/ directory.")
        sys.exit(1)

    # Check if ID_PASTA_VOO is set
    if not ID_PASTA_VOO:
        print("❌ Error: ID_PASTA_VOO environment variable not set!")
        print("   Please set ID_PASTA_VOO in your .env file.")
        sys.exit(1)

    # Get the scripts directory path
    scripts_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct the full path to the output folder
    output_folder_path = os.path.join(scripts_dir, args.output_folder)

    print("🚀 Starting download from Google Drive")
    print(f"📅 Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📁 Output folder: {output_folder_path}")
    print("-" * 60)

    try:
        # Get Drive service
        service = get_drive_service()

        # Download files
        download_flights_from_drive(
            service=service,
            base_folder_id=ID_PASTA_VOO,
            output_folder=output_folder_path,
            year_filter=args.year,
            month_filter=args.month,
            day_filter=args.day,
        )

        print("\n" + "=" * 60)
        print("✅ Download completed successfully!")
        print(f"📅 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
    except Exception as e:
        print(f"\n❌ Fatal error during download: {e}")
        import traceback

        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
