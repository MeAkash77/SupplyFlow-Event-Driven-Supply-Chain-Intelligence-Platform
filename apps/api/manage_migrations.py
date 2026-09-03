"""Helper to run alembic commands from source tree.

Usage:
  python manage_migrations.py upgrade
  python manage_migrations.py downgrade
  python manage_migrations.py revision --autogenerate -m "msg"
"""
import sys
from alembic.config import CommandLine, Config

def main(argv: list[str] | None = None):
    argv = argv or sys.argv[1:]
    cfg = Config(__file__.replace('manage_migrations.py', 'alembic.ini'))
    # ensure current working dir contains project root on PYTHONPATH
    return CommandLine(cfg).main(argv)

if __name__ == '__main__':
    raise SystemExit(main())
