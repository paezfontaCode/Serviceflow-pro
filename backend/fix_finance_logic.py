import os

file_path = 'app/api/v1/finance.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_text = '            description="Apertura de caja (VES)"'
new_text = '            currency="VES",\n            description="Apertura de caja (VES)"'

# Use replace only once for safety
if old_text in content and new_text not in content:
    new_content = content.replace(old_text, new_text, 1)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Fix applied successfully")
else:
    print("Fix already applied or target not found")
 Vincular al anterior o al nuevo?
