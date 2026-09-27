import os
import firebase_admin
from firebase_admin import credentials, firestore
import logging
logging.basicConfig(level=logging.DEBUG)
print("Init...")
CREDENTIALS_PATH = "serviceAccountKey.json"
cred = credentials.Certificate(CREDENTIALS_PATH)
firebase_admin.initialize_app(cred)
print("Client...")
db = firestore.client()
print("Query...")
docs = db.collection('users').limit(1).stream()
print("Loop...")
for doc in docs:
    print(doc.id)
print("Done.")
