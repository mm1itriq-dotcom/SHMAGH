import os
import json
import firebase_admin
from firebase_admin import credentials, firestore

# Path to the Firebase service account key
CREDENTIALS_PATH = os.path.join(os.path.dirname(__file__), "serviceAccountKey.json")

def initialize_firebase():
    """
    Initializes the Firebase Admin SDK.
    If the serviceAccountKey.json is missing, it will print a warning.
    """
    if not os.path.exists(CREDENTIALS_PATH):
        print("=========================================================")
        print("⚠️ WARNING: serviceAccountKey.json not found!")
        print("To connect to the real Firebase database:")
        print("1. Go to Firebase Console > Project Settings > Service Accounts")
        print("2. Generate a new private key")
        print(f"3. Save it as: {CREDENTIALS_PATH}")
        print("=========================================================")
        return None

    try:
        # Check if already initialized to prevent errors during hot-reloads
        if not firebase_admin._apps:
            cred = credentials.Certificate(CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
            print("[SUCCESS] Firebase initialized successfully!")
        
        db = firestore.client()
        return db
    except Exception as e:
        print(f"[ERROR] Error initializing Firebase: {e}")
        return None

# Global database instance
db = initialize_firebase()
