import os
from firebase_config import db

# ---------------------------------------------------------
# SHMAGH MOCK DATA (Matches Figma Designs)
# ---------------------------------------------------------

MOCK_USERS = [
    {
        "uid": "user_12345_mock",
        "email": "traveler@example.com",
        "display_name": "Jordan Explorer",
        "preferences": {
            "favorite_categories": ["Historical", "Nature"],
            "preferred_budget": "High-end luxury"
        },
        "created_at": "2026-09-25T00:00:00Z"
    }
]

MOCK_DESTINATIONS = [
    {
        "id": "dest_petra",
        "title": "Petra",
        "category": "Historical",
        "description": "Walk through rose-red canyons into the timeless heart of the Nabataean kingdom.",
        "image_url": "assets/petra.jpg",
        "price_from": "20 JD",
        "region": "South"
    },
    {
        "id": "dest_wadirum",
        "title": "Wadi Rum",
        "category": "Nature",
        "description": "Cross vast copper dunes and sleep beneath an extraordinary desert sky.",
        "image_url": "assets/wadirum.jpg",
        "price_from": "20 JD",
        "region": "South"
    },
    {
        "id": "dest_jerash",
        "title": "Jerash",
        "category": "Historical",
        "description": "Discover colonnaded avenues and temples from a beautifully preserved Roman city.",
        "image_url": "assets/jerash.jpg",
        "price_from": "20 JD",
        "region": "North"
    }
]

MOCK_HOTELS = [
    {
        "id": "hotel_movenpick_petra",
        "destination_id": "dest_petra",
        "name": "The Mövenpick Resort Petra",
        "location": "Petra, Jordan",
        "description": "5-star luxury at the entrance of Petra. Spacious rooms, fine dining...",
        "price_per_night": 650,
        "stars": 5,
        "image_url": "assets/hotel_movenpick.jpg"
    },
    {
        "id": "hotel_seven_wonders",
        "destination_id": "dest_petra",
        "name": "Seven Wonders Bedouin Camp",
        "location": "Petra, Jordan",
        "description": "Experience traditional Bedouin hospitality in a luxury desert setting...",
        "price_per_night": 520,
        "stars": 5,
        "image_url": "assets/hotel_bedouin.jpg"
    }
]

def seed_database():
    """
    Seeds the Firestore database with initial data.
    """
    if db is None:
        print("[ERROR] Cannot seed database. Firebase is not connected.")
        return

    print("[INFO] Seeding Users to Firestore...")
    for user in MOCK_USERS:
        doc_ref = db.collection('users').document(user['uid'])
        doc_ref.set(user)
        print(f"  -> Added User: {user['display_name']}")

    print("[INFO] Seeding Destinations to Firestore...")
    for dest in MOCK_DESTINATIONS:
        doc_ref = db.collection('destinations').document(dest['id'])
        doc_ref.set(dest)
        print(f"  -> Added {dest['title']}")

    print("[INFO] Seeding Hotels to Firestore...")
    for hotel in MOCK_HOTELS:
        doc_ref = db.collection('hotels').document(hotel['id'])
        doc_ref.set(hotel)
        print(f"  -> Added {hotel['name']}")

    print("[SUCCESS] Database seeding complete!")

if __name__ == "__main__":
    seed_database()
