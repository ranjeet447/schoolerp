# P2 - Access Management & Security Enhancements

## 1. Overview
Extends the R1 RBAC system with multi-factor authentication (MFA), role customization, and IP-based security to meet Enterprise compliance and security expectations.

**Goals:**
- Secure administrative and financial accounts with MFA.
- Allow schools to define custom roles matching their office hierarchy.
- Restrict sensitive access to trusted network environments.

## 2. Features & RBAC Matrix
MFA and Security policies are configured at the Tenant level by the `Tenant Admin`.

| Action | Tenant Admin | Super Admin |
| :--- | :---: | :---: |
| Enforce MFA for Role | ✅ | ✅ |
| Configure IP Allowlists | ✅ | ✅ |
| Define Custom Roles | ✅ | ✅ |

## 3. Workflows
### MFA Enrollment (TOTP)
1. **Trigger**: User navigates to Security Settings.
2. **Setup**: System displays a unique QR code (Secret key).
3. **Verification**: User scans and enters the 6-digit TOTP code.
4. **Activation**: System stores the secret (encrypted) and marks MFA as enabled.
5. **Recovery**: System provides one-time recovery codes.

### Custom Role Creation
1. **Definition**: Admin creates a new role "Junior Accountant".
2. **Assignment**: Admin selects individual permissions (e.g., `receipts:create`, but NOT `receipts:cancel`).
3. **Usage**: Staff members are assigned this new Role ID.

## 4. Data Model
### `user_mfa_secrets`
- `user_id` (FK, Unique)
- `secret_key` (Encrypted)
- `last_used_at`
- `recovery_codes` (JSONB/Hashed)

### `tenant_ip_allowlists`
- `tenant_id` (FK)
- `ip_address_or_range` (CIDR)
- `description`

## 5. Security Note
All login attempts for accounts with MFA enabled must be logged in the `audit_logs` including device fingerprint and location hints. Failures must trigger account lockouts after 5 attempts.
