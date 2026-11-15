"""Count physical source lines, including blank lines and tests, without dependencies."""
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parents[1]
EXTENSIONS = {'.py', '.ts', '.tsx', '.js', '.mjs', '.css', '.sql', '.html', '.ps1'}
EXCLUDED = {'.git', '.reference', '.venv', 'venv', 'node_modules', 'dist', '__pycache__', '.pytest_cache', '.codex', '.agents'}

def source_counts():
    counts = {}
    for directory, folders, files in os.walk(ROOT):
        folders[:] = [name for name in folders if name not in EXCLUDED]
        for name in files:
            path = Path(directory) / name
            if path.suffix not in EXTENSIONS or name.endswith('.d.ts'):
                continue
            group = path.relative_to(ROOT).parts[0]
            counts[group] = counts.get(group, 0) + len(path.read_text(encoding='utf-8-sig').splitlines())
    return counts

if __name__ == '__main__':
    counts = source_counts()
    for group, lines in sorted(counts.items()):
        print(f'{group}: {lines:,} lines')
    print(f'TOTAL: {sum(counts.values()):,} lines')
    print(f'SQL migrations: {len(list((ROOT / "backend/sql").glob("[0-9][0-9][0-9]_*.sql")))}')
