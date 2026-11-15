import hashlib
import json
from pathlib import Path
import re
from sqlalchemy import inspect, text

SQL_DIRECTORY = Path(__file__).with_name('sql')
CHECKSUM_UPGRADES = json.loads(Path(__file__).with_name('migration_checksums.json').read_text(encoding='utf-8'))


def matches_checksum(path, applied):
    current = checksum(path)
    upgrade = CHECKSUM_UPGRADES.get(path.name, {})
    return applied == current or (current == upgrade.get('after') and applied == upgrade.get('before'))


def migration_files():
    return sorted(SQL_DIRECTORY.glob('[0-9][0-9][0-9]_*.sql'))


def checksum(path):
    return hashlib.sha256(path.read_text(encoding='utf-8').encode('utf-8')).hexdigest()


def migration_status(engine):
    applied = {}
    with engine.connect() as connection:
        if inspect(connection).has_table('schema_migrations'):
            applied = dict(connection.execute(text('SELECT filename, checksum FROM schema_migrations')).all())
    return [(p.name, 'pending' if p.name not in applied else 'applied' if matches_checksum(p, applied[p.name]) else 'CHANGED') for p in migration_files()]


def migrate(engine):
    if engine.dialect.name != 'postgresql':
        raise RuntimeError('SQL migrations require PostgreSQL.')
    completed = []
    with engine.begin() as connection:
        connection.execute(text('SELECT pg_advisory_xact_lock(736292)'))
        connection.exec_driver_sql((SQL_DIRECTORY/'bootstrap/schema_migrations.sql').read_text(encoding='utf-8'))
        applied = dict(connection.execute(text('SELECT filename, checksum FROM schema_migrations')).all())
        for path in migration_files():
            digest = checksum(path)
            if path.name in applied:
                if not matches_checksum(path, applied[path.name]):
                    raise RuntimeError(f'Applied migration changed: {path.name}. Add a new migration instead.')
                continue
            sql = re.sub(r'^(BEGIN|COMMIT);\s*$', '', path.read_text(encoding='utf-8'), flags=re.MULTILINE)
            connection.exec_driver_sql(sql)
            connection.execute(text('INSERT INTO schema_migrations (filename, checksum) VALUES (:filename, :checksum)'), {'filename':path.name, 'checksum':digest})
            completed.append(path.name)
    return completed
