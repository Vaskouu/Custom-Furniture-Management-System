"""Verify real PostgreSQL migrations in an isolated, disposable schema.

Run: .venv/Scripts/python.exe verify_migrations.py
Uses the configured database, but creates/drops only its own random test schema.
"""
import re
import shutil
import tempfile
import uuid
from pathlib import Path
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.exc import SQLAlchemyError
from database import engine
import migrations


def main():
    name = 'fp_migration_test_' + uuid.uuid4().hex
    assert re.fullmatch(r'fp_migration_test_[0-9a-f]{32}', name)
    with engine.begin() as connection:
        connection.exec_driver_sql(f'CREATE SCHEMA {name}')
    test_engine = create_engine(engine.url, connect_args={'options': f'-csearch_path={name}'})
    original_directory = migrations.SQL_DIRECTORY
    try:
        assert len(migrations.migrate(test_engine)) == 13
        assert len(inspect(test_engine).get_table_names()) == 13
        with test_engine.begin() as connection:
            connection.execute(text("INSERT INTO customers(name,phone,email) VALUES ('Test client','1234567','test@example.com')"))
        assert migrations.migrate(test_engine) == []
        assert all(status == 'applied' for _, status in migrations.migration_status(test_engine))
        with test_engine.connect() as connection:
            assert connection.execute(text('SELECT count(*) FROM customers')).scalar() == 1
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)/'sql'
            shutil.copytree(original_directory, directory)
            migrations.SQL_DIRECTORY = directory
            changed = directory/'012_order_links.sql'
            original = changed.read_text(encoding='utf-8')
            changed.write_text(original+'\n-- Changed after application\n', encoding='utf-8')
            try:
                migrations.migrate(test_engine)
                raise AssertionError('Modified applied migration was accepted')
            except RuntimeError as error:
                assert 'Applied migration changed' in str(error)
            changed.write_text(original, encoding='utf-8')
            (directory/'014_failure.sql').write_text('CREATE TABLE migration_probe (id INT); SELECT * FROM intentionally_missing_table;', encoding='utf-8')
            try:
                migrations.migrate(test_engine)
                raise AssertionError('Invalid migration was accepted')
            except SQLAlchemyError:
                pass
            assert not inspect(test_engine).has_table('migration_probe')
            with test_engine.connect() as connection:
                assert connection.execute(text('SELECT count(*) FROM schema_migrations')).scalar() == 13
        print('Passed: fresh schema, 13 migrations, 13 tables, repeat execution, preserved records, checksum guard, transactional rollback.')
    finally:
        migrations.SQL_DIRECTORY = original_directory
        test_engine.dispose()
        with engine.begin() as connection:
            # This is the generated schema created above, never public.
            connection.exec_driver_sql(f'DROP SCHEMA {name} CASCADE')


if __name__ == '__main__':
    main()
