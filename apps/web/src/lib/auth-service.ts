import { apiClient, isAuthTokenExpired } from './api-client';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const SESSION_KEYS = [
  'auth_token',
  'user_id',
  'user_email',
  'user_name',
  'user_role',
  'tenant_id',
  'user_permissions',
];

interface LoginResult {
  token: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
  permissions?: string[];
  expires_at: string;
}

interface LoginResponse {
  success: boolean;
  code?: string;
  message?: string;
  data?: LoginResult;
  meta?: any;
}

export const PLATFORM_ROLES = [
  'super_admin',
  'support_l1',
  'support_l2',
  'finance',
  'ops',
  'developer',
];

export const isPlatformUser = (role?: string | null) => role && PLATFORM_ROLES.includes(role);

// B1 Hardening: JS-level obfuscation for mobile session persistence
const encryptValue = (val: string) => {
  const enc = new TextEncoder();
  const encoded = enc.encode(val);
  const salt = 'erp-' + (Capacitor.isNativePlatform() ? 'native' : 'web');
  const buffer = Array.from(encoded).map((b, i) => b ^ salt.charCodeAt(i % salt.length));
  return btoa(String.fromCharCode(...buffer));
};

const decryptValue = (val: string) => {
  try {
    const binary = atob(val);
    const salt = 'erp-' + (Capacitor.isNativePlatform() ? 'native' : 'web');
    const buffer = Array.from(binary).map((c, i) => c.charCodeAt(0) ^ salt.charCodeAt(i % salt.length));
    return new TextDecoder().decode(new Uint8Array(buffer));
  } catch (e) { return null; }
};

class AuthServiceClass {
  constructor() {
    this.bootMobileSync();
  }

  // Ensure native storage is synced back to localStorage on app start/bootstrap
  private async bootMobileSync() {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      try {
        for (const key of SESSION_KEYS) {
          const { value } = await Preferences.get({ key });
          if (value) {
            const raw = decryptValue(value);
            if (raw) localStorage.setItem(key, raw);
          }
        }
      } catch (e) {
        console.error('Mobile session bootstrap failed', e);
      }
    }
  }

  private async persistToMobile(key: string, value: string | null) {
     if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
        if (value) {
           await Preferences.set({ key, value: encryptValue(value) });
        } else {
           await Preferences.remove({ key });
        }
     }
  }

  // Clear all mobile session data
  private async clearMobileSync() {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
      for (const key of SESSION_KEYS) {
        await Preferences.remove({ key });
      }
    }
  }

  // Get redirection path based on role
  getDashboardPath(role?: string): string {
    const r = role || this.getCurrentUser()?.role;
    if (isPlatformUser(r)) {
      return '/platform/dashboard';
    }
    switch (r) {
      case 'tenant_admin':
        return '/admin/dashboard';
      case 'teacher':
        return '/teacher/dashboard';
      case 'parent':
        return '/parent/dashboard';
      case 'accountant':
        return '/accountant/dashboard';
      case 'student':
        return '/student/dashboard';
      default:
        // If we have a role but it's unknown, don't redirect to login as that causes a loop
        // if the login page also redirects back to the root when a user exists.
        return '/';
    }
  }

  // Real login via backend API
  async login(email: string, password: string): Promise<{ success: boolean; role?: string; redirect?: string; error?: string }> {
    try {
      // apiClient returns parsed JSON data if the response is application/json
      const data = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }) as LoginResponse;

      if (!data.success) {
        if (data.code === 'legal_acceptance_required' && data.meta?.preauth_token) {
          try {
            localStorage.setItem('legal_preauth_token', String(data.meta.preauth_token));
            localStorage.setItem('legal_requirements', JSON.stringify(data.meta.requirements || []));
          } catch (e) {
            // ignore storage failures
          }
          return {
            success: false,
            redirect: '/auth/legal-accept',
            error: data.message || 'Legal acceptance required',
          };
        }
        return {
          success: false,
          error: data.message || 'Invalid credentials. Please check your email and password.'
        };
      }

      if (data.data) {
        // Store user info in localStorage
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_id', data.data.user_id);
        localStorage.setItem('user_email', data.data.email);
        localStorage.setItem('user_name', data.data.full_name);
        localStorage.setItem('user_role', data.data.role);
        localStorage.setItem('tenant_id', data.data.tenant_id);

        if (Capacitor.isNativePlatform()) {
           this.persistToMobile('auth_token', data.data.token);
           this.persistToMobile('user_id', data.data.user_id);
           this.persistToMobile('user_email', data.data.email);
           this.persistToMobile('user_name', data.data.full_name);
           this.persistToMobile('user_role', data.data.role);
           this.persistToMobile('tenant_id', data.data.tenant_id);
        }

        if (data.data.permissions) {
          localStorage.setItem('user_permissions', JSON.stringify(data.data.permissions));
          if (Capacitor.isNativePlatform()) this.persistToMobile('user_permissions', JSON.stringify(data.data.permissions));
        } else {
          localStorage.removeItem('user_permissions');
          if (Capacitor.isNativePlatform()) this.persistToMobile('user_permissions', null);
        }
        localStorage.removeItem('legal_preauth_token');
        localStorage.removeItem('legal_requirements');

        return {
          success: true,
          role: data.data.role,
          redirect: this.getDashboardPath(data.data.role),
        };
      }

      return { success: false, error: 'Authentication failed: No user data received.' };
    } catch (error: any) {
      console.error('Login error:', error);

      // Provide more specific error messages if possible
      if (error?.message?.includes('fetch')) {
        return {
          success: false,
          error: 'Connection failed. Please check your internet or if the API is offline.'
        };
      }

      return {
        success: false,
        error: error?.message || 'An unexpected error occurred during login.'
      };
    }
  }

  // Check if user has a specific permission
  hasPermission(permission: string): boolean {
    if (typeof window === 'undefined') return false;

    // Platform and tenant admins have wide permissions
    const role = localStorage.getItem('user_role') || '';

    if (isPlatformUser(role) || role === 'tenant_admin') return true;

    const permsRaw = localStorage.getItem('user_permissions');
    if (!permsRaw) return false;

    try {
      const perms: string[] = JSON.parse(permsRaw);
      return perms.includes(permission);
    } catch (e) {
      return false;
    }
  }

  // Check if user is logged in
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('auth_token');
    return !!token;
  }

  // Get current user info
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    return {
      id: localStorage.getItem('user_id') || '',
      email: localStorage.getItem('user_email') || '',
      name: localStorage.getItem('user_name') || '',
      role: localStorage.getItem('user_role') || '',
      tenant_id: localStorage.getItem('tenant_id') || '',
    };
  }

  // Get auth token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  // Platform Super-admin Impersonation (Tenant-level)
  async impersonatePlatformTenant(tenantId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (reason.trim().length < 10) {
        return { success: false, error: 'Reason must be at least 10 characters for audit compliance.' };
      }

      const response = await apiClient(`/admin/platform/tenants/${tenantId}/impersonate`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }) as {
        token: string;
        user_id?: string;
        email?: string;
        tenant_id?: string;
        tenant_name?: string;
        target_user_id?: string;
        target_user_email?: string;
        target_tenant_id?: string;
        target_tenant_name?: string;
        target_user_role?: string;
      };

      if (response && response.token) {
        const impersonatedUserId = response.user_id || response.target_user_id || "";
        const impersonatedUserEmail = response.email || response.target_user_email || "";
        const impersonatedTenantId = response.tenant_id || response.target_tenant_id || "";
        const impersonatedTenantName = response.tenant_name || response.target_tenant_name || "Tenant";
        const impersonatedRole = response.target_user_role || "tenant_admin";

        // Capture current session as impersonator
        const currentToken = localStorage.getItem('auth_token');
        const currentRole = localStorage.getItem('user_role');
        const currentUserId = localStorage.getItem('user_id');
        const currentUserEmail = localStorage.getItem('user_email');
        const currentUserName = localStorage.getItem('user_name');
        const currentTenantId = localStorage.getItem('tenant_id');

        // Clear current session
        localStorage.clear();

        // Restore impersonator's context to allows exit
        if (currentToken && currentRole) {
          localStorage.setItem('impersonator_auth_token', currentToken);
          localStorage.setItem('impersonator_user_role', currentRole);
          localStorage.setItem('impersonator_user_id', currentUserId || '');
          localStorage.setItem('impersonator_user_email', currentUserEmail || '');
          localStorage.setItem('impersonator_user_name', currentUserName || '');
          localStorage.setItem('impersonator_tenant_id', currentTenantId || '');
          
          // Track impersonation metadata for logging on exit
          localStorage.setItem('impersonation_target_tenant_id', impersonatedTenantId);
          localStorage.setItem('impersonation_target_user_id', impersonatedUserId);
          localStorage.setItem('impersonation_target_user_email', impersonatedUserEmail);
          localStorage.setItem('impersonation_started_at', new Date().toISOString());
          localStorage.setItem('impersonation_reason', reason);
        }

        // Save new session (impersonated)
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('user_id', impersonatedUserId);
        localStorage.setItem('user_email', impersonatedUserEmail);
        localStorage.setItem('user_name', `${impersonatedTenantName} Admin`);
        localStorage.setItem('user_role', impersonatedRole);
        localStorage.setItem('tenant_id', impersonatedTenantId);

        if (Capacitor.isNativePlatform()) {
           await this.persistToMobile('auth_token', response.token);
           await this.persistToMobile('user_id', impersonatedUserId);
           await this.persistToMobile('user_email', impersonatedUserEmail);
           await this.persistToMobile('user_name', `${impersonatedTenantName} Admin`);
           await this.persistToMobile('user_role', impersonatedRole);
           await this.persistToMobile('tenant_id', impersonatedTenantId);
           
           if (currentToken) await this.persistToMobile('impersonator_auth_token', currentToken);
        }

        // Redirect to new dashboard
        window.location.href = this.getDashboardPath(impersonatedRole);
        return { success: true };
      }
      return { success: false, error: 'Failed to create impersonation token' };
    } catch (error: any) {
      return { success: false, error: error?.message || 'Impersonation failed' };
    }
  }

  // Handle exiting impersonation
  async logout(logoutAll: boolean = false): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const token = localStorage.getItem('auth_token');
      if (token) {
        await apiClient(`/auth/logout${logoutAll ? '?all=true' : ''}`, {
          method: 'POST',
        });
      }
    } catch (error) {
      console.warn('Logout notification to backend failed:', error);
    } finally {
      // Clear all stores
      this.clearMobileSync();
      localStorage.clear();
      window.location.href = '/auth/login';
    }
  }

  // Forgot password
  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const data = await apiClient('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }) as { success: boolean; message?: string };

      return {
        success: data.success,
        message: data.message || 'If an account exists, a reset link has been sent'
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to process forgot password request'
      };
    }
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const data = await apiClient('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, new_password: newPassword }),
      }) as { success: boolean };

      return { success: data.success };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to reset password'
      };
    }
  }
}

export const RBACService = new AuthServiceClass();
