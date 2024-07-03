import os

# Ensure the upload folder exists
def ensure_upload_folder_exists(upload_folder):
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)