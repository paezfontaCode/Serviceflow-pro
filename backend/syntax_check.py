"""Simple syntax validation for refactored files."""
import ast
import sys

files_to_check = [
    'app/api/deps.py',
    'app/api/v1/sales.py',
    'app/api/v1/repairs.py',
    'app/api/v1/finance.py',
    'app/core/config.py',
    'app/utils/pagination.py',
    'app/utils/enums.py'
]

all_valid = True
for filepath in files_to_check:
    try:
        with open(filepath, 'r') as f:
            code = f.read()
        ast.parse(code)
        print(f"✓ {filepath} - Syntax OK")
    except SyntaxError as e:
        print(f"✗ {filepath} - Syntax Error: {e}")
        all_valid = False
    except FileNotFoundError:
        print(f"✗ {filepath} - File not found")
        all_valid = False

if all_valid:
    print("\n✅ All files have valid Python syntax!")
    sys.exit(0)
else:
    print("\n❌ Some files have syntax errors!")
    sys.exit(1)
