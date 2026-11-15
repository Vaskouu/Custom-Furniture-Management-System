"""Local setup. Existing users and edited catalog records are preserved."""
import argparse
from getpass import getpass
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('command', choices=['init', 'migrate', 'migration-status', 'create-admin'])
    args = parser.parse_args()
    from database import engine
    from migrations import migrate, migration_status
    if args.command == 'migration-status':
        rows = migration_status(engine)
        for filename, status in rows:
            print(f'{status:8} {filename}')
        print(f'{len(rows)} migrations; {sum(s == "applied" for _, s in rows)} applied.')
        return
    if args.command == 'migrate':
        completed = migrate(engine)
        print(f'Applied {len(completed)} migrations.')
        return
    from public_api import initialize, SessionLocal, User, passwords
    initialize()
    if args.command == 'init':
        print('Database initialized; existing records preserved.')
        return
    username = input('Username: ').strip()
    email = input('Email: ').strip().lower()
    name = input('Name: ').strip()
    password = getpass('Password (10+ characters): ')
    from studio_api import TeamUser
    TeamUser(id='new', username=username, email=email, name=name, password=password, role='admin', active=True)
    with SessionLocal() as session:
        if session.scalar(select(User).where((User.username==username) | (User.email==email))):
            raise SystemExit('Account already exists; no changes made.')
        session.add(User(username=username,email=email,name=name,password_hash=passwords.hash(password),role='admin'))
        try:
            session.commit()
        except IntegrityError:
            raise SystemExit('Account already exists; no changes made.')
    print('Administrator created.')


if __name__ == '__main__':
    main()
