# 03 - RBAC and Permissions

## Role-Based Access Control (RBAC)
We implement a granular RBAC system with support for hierarchical scopes.

## Schema Highlights
- `roles`: Defined per tenant (with platform defaults).
- `permissions`: Atomic actions (e.g., `fees:create`, `attendance:edit`).
- `role_assignments`: Links `user_id` to `role_id` within a specific `scope`.

## Hierarchy Scopes
Permissions are not just global; they are scoped:
1. **Tenant**: Can see everything in the school.
2. **Branch**: Limited to a specific campus.
3. **Class/Section**: Limited to assigned students (e.g., a Class Teacher).

## Middleware Flow
1. **Resolve Identity**: JWT contains `user_id`.
2. **Resolve Tenant**: Identification of the school context.
3. **Load Permissions**: Cache the flattened list of permissions for the user-tenant pair in Redis (short-lived) or memory.
4. **Authorize**: Check if the required permission + scope matches the route/resource action.

## Default Roles
- **SaaS Super Admin**: Platform wide access.
- **Tenant Admin**: School owner.
- **Accountant**: Finance only.
- **Teacher**: Academic + assigned class attendance.
- **Parent**: View-only for their own children.
- **Gate Staff**: Safety module access.

## AI Suite Permissions (New)
The AI Suite introduces new capability-based permissions:

| Permission | Description | Target Role |
| :--- | :--- | :--- |
| `ai:chat:query` | Ask questions to the Helpdesk bot. | Parent, Student |
| `ai:content:gen` | Generate lesson plans/quizzes. | Teacher, Coordinator |
| `ai:finance:view` | View predictive fee risk scores. | Accountant, Admin |
| `ai:admin:config` | Enable/Disable AI features, View Logs. | Tenant Admin |
| `ai:premium:config` | Configure Timetable/Insight constraints. | Tenant Admin |

## Security Enhancements (Phase 2)

### Multi-Factor Authentication (MFA)
Accounts with `Admin` or `Finance` roles can be forced to enable MFA (TOTP). This is enforced at the `Resolve Identity` step in the middleware.

### Role Customization
Tenants can define custom roles by selecting a subset of platform permissions.
- `Custom Role = {TenantID, RoleName, [PermissionIDs]}`

## Immutable Audit Trail
Any access denial is logged. Any permission change is logged in the `audit_logs` table with `before/after` states.
