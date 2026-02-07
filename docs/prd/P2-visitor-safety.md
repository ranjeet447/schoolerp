# P2 - Visitor Management & Campus Safety

## 1. Overview
The Visitor Management System (VMS) replaces manual registers with a digital log, ensuring all individuals on campus are verified, tracked, and vetted against safety protocols.

**Goals:**
- Digital log of every visitor (Photo, ID, Purpose).
- QR-based checkout for speed and accuracy.
- Emergency broadcasting capabilities.

## 2. Personas & RBAC Permission Matrix

| Action | Security / Gate | Front Desk | Admin | Host (Staff) |
| :--- | :---: | :---: | :---: | :---: |
| Check-in Visitor | ✅ | ✅ | ✅ | ❌ |
| Check-out Visitor | ✅ | ✅ | ✅ | ❌ |
| View Visit History | ✅ | ✅ | ✅ | ✅ (Own visitors) |
| Print Badges | ✅ | ✅ | ✅ | ❌ |

## 3. Workflows
### Happy Path: Visitor Check-in
1. **Data Entry**: Security clerk captures visitor name, phone, photo, and host staff member.
2. **Verification**: SMS OTP sent to visitor's phone (optional per tenant policy).
3. **Badge**: System generates a QR-coded visitor badge (PDF for thermal printing).
4. **Notification**: Host staff receives an in-app "Visitor Arrived" alert.

### Happy Path: Visitor Check-out
1. **Scan**: Security clerk scans the QR code on the visitor's badge.
2. **Verify**: System marks exit time and stores the record.

## 4. Data Model
### `visitors`
- `id` (PK)
- `tenant_id` (FK)
- `name`, `phone_verified` (Boolean), `id_proof_ref`
- `last_visit_id` (FK)

### `visitor_logs`
- `id` (PK)
- `visitor_id` (FK)
- `host_user_id` (FK)
- `purpose` (Enum: `parents_meeting`, `official_work`, `vendor`)
- `check_in_at`, `check_out_at`
- `qr_token` (Hashed)

## 5. API Contracts
### Check-in
`POST /api/v1/safety/visitors/check-in`
```json
{
  "name": "John Doe",
  "phone": "9999999999",
  "host_id": "uuid",
  "purpose": "official_work"
}
```

## 6. UI Screens
- **Kiosk Interface**: Simplified view for tablet/gate clerk use.
- **Visitor Badge Preview**: Auto-formatted for 2x3 or 3x4 thermal printers.
- **Live Campus Snapshot**: List of "Currently Checked-in" individuals.

## 7. Notifications
- **Host Alert**: Push/SMS to staff member when their visitor checks in.
- **Security Alert**: If a visitor hasn't checked out within 4 hours (configurable).

## 8. Hardware Requirements
- Support for Thermal Printers (via Web Print API or Local Relay).
- Camera access for photo capture.

## 9. Security & Privacy
- **Photo Data**: Automatically purged after X days (GDPR/DPDP compliance).
- **ID Proofs**: Stored in encrypted S3 bucket with restricted access.

## 10. QA Plan
- **Verification**: Test QR scan logic with mocked UUID tokens.
- **Integration**: Verify thermal printer PDF generation aligns with standard sticker sizes.
