from getpass import getpass

from pwdlib import PasswordHash
from sqlalchemy import text

from database import engine


password_hash = PasswordHash.recommended()

users = [
    ("admin_demo", "admin@furnipro.example", "admin"),
    ("designer_demo", "designer@furnipro.example", "designer"),
    ("client_demo", "client@furnipro.example", "client"),
]

for username, email, role in users:
    password = getpass(f"Enter password for {username}: ")

    if len(password) < 8:
        print(f"Skipped {username}: password must have at least 8 characters.")
        continue

    hashed_password = password_hash.hash(password)

    with engine.begin() as connection:
        result = connection.execute(
            text("""
                INSERT INTO users (username, email, password_hash, role)
                VALUES (:username, :email, :password_hash, :role)
                ON CONFLICT (username) DO NOTHING
                RETURNING id
            """),
            {
                "username": username,
                "email": email,
                "password_hash": hashed_password,
                "role": role,
            },
        ).first()

    if result is None:
        print(f"User {username} already exists.")
    else:
        print(f"Created {username} with role {role}.")

print("Finished.")