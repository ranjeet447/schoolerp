
import re
import os

all_permissions = {} # code -> (module, description, optional_id)

files_to_scan = [
    "services/api/internal/db/schema.sql",
    "infra/seed/seed_data.sql",
    "infra/migrations/000040_platform_rbac_templates.up.sql",
    "infra/migrations/000047_tenant_default_roles_and_permissions.up.sql",
    "infra/migrations/000048_platform_extras.up.sql"
]

# Specifically look for INSERT INTO permissions
insert_perm_pattern = re.compile(r"INSERT INTO permissions\s+\((.*?)\)\s+VALUES\s+(.*?);", re.DOTALL | re.IGNORECASE)

for file_path in files_to_scan:
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            content = f.read()
            for match in insert_perm_pattern.finditer(content):
                cols_str, vals_str = match.groups()
                cols = [c.strip() for c in cols_str.split(',')]
                
                # Parse individual tuples (x, y, z)
                # This is tricky because of nested commas or escaped quotes, 
                # but our permissions are generally simple.
                tuples = re.findall(r"\((.*?)\)", vals_str, re.DOTALL)
                for t in tuples:
                    if t.strip().startswith("'") and t.count(",") >= 2:
                        # Skip if it's just a comment-like tuple or empty
                        parts = []
                        # Simple split by comma but avoid splitting inside quotes
                        current_part = ""
                        in_quotes = False
                        for char in t:
                            if char == "'":
                                in_quotes = not in_quotes
                            if char == "," and not in_quotes:
                                parts.append(current_part.strip().strip("'"))
                                current_part = ""
                            else:
                                current_part += char
                        parts.append(current_part.strip().strip("'"))
                        
                        if len(parts) >= 3:
                            # Map parts to columns
                            d = dict(zip(cols, parts))
                            code = d.get('code')
                            module = d.get('module')
                            desc = d.get('description')
                            p_id = d.get('id')
                            
                            # Filter out bogus rows like comments caught in parentheses
                            if code and module and desc and len(code) > 2:
                                if code and code not in all_permissions:
                                    all_permissions[code] = (module, desc, p_id if p_id != 'uuid_generate_v4()' and p_id != 'uuid_generate_v7()' else None)

# Manual additions for missing modules
manual_permissions = {
    "automation:view": ("automation", "View automation rules", None),
    "automation:create": ("automation", "Create automation rules", None),
    "automation:edit": ("automation", "Edit automation rules", None),
    "automation:delete": ("automation", "Delete automation rules", None),
    "kb:view": ("kb", "View knowledge base articles", None),
    "kb:write": ("kb", "Create/Edit knowledge base articles", None),
    "kb:delete": ("kb", "Delete knowledge base articles", None),
    "kb:search": ("kb", "Search knowledge base", None),
    "biometric:ingest": ("biometric", "Ingest logs from biometric devices", None),
    "files:upload": ("files", "Upload system files", None),
    "files:read": ("files", "Read/Download system files", None),
    "files:delete": ("files", "Delete system files", None),
    "approvals:view": ("approvals", "View pending and processed approvals", None),
    "approvals:process": ("approvals", "Approve or Reject requests", None),
    "portal:teacher": ("core", "Access teacher portal", None),
    "portal:parent": ("core", "Access parent portal", None),
    "portal:accountant": ("core", "Access accountant portal", None),
}

for code, (module, desc, p_id) in manual_permissions.items():
    if code not in all_permissions:
        all_permissions[code] = (module, desc, p_id)

# Sort by code
sorted_codes = sorted(all_permissions.keys())

# Generate SQL
with open("all_permissions.sql", "w") as f:
    f.write("-- RECONSTRUCTED COMPREHENSIVE PERMISSIONS\n")
    f.write("INSERT INTO permissions (id, code, module, description) VALUES\n")
    values = []
    for code in sorted_codes:
        module, desc, p_id = all_permissions[code]
        if not module or not desc: continue
        desc = desc.replace("'", "''") # escape single quotes
        if p_id:
            values.append(f"('{p_id}', '{code}', '{module}', '{desc}')")
        else:
            values.append(f"(uuid_generate_v7(), '{code}', '{module}', '{desc}')")
    
    f.write(",\n".join(values))
    f.write("\nON CONFLICT (code) DO UPDATE SET \n  module = EXCLUDED.module,\n  description = EXCLUDED.description;\n")

print(f"Extracted {len(all_permissions)} permissions.")
