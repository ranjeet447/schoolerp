import { apiClient, isAuthTokenExpired } from './api-client';

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

class AuthServiceClass {
  // Get redirection path based on role
  getDashboardPath(role?: string): string {
    const r = role || this.getCurrentUser()?.role;
    switch (r) {
      case 'super_admin':
        return '/platform/dashboard';
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
        return '/auth/login';
    }
  }

  // Real login via backend API
  async login(email: string, password: string): Promise<{ success: boolean; role?: string; redirect?: string; error?: string }> {
    try {
      const response = await apiClient('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
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
          error: data.message || 'Invalid credentials'
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
        if (data.data.permissions) {
          localStorage.setItem('user_permissions', JSON.stringify(data.data.permissions));
        } else {
          localStorage.removeItem('user_permissions');
        }
        localStorage.removeItem('legal_preauth_token');
        localStorage.removeItem('legal_requirements');

        return {
          success: true,
          role: data.data.role,
          redirect: this.getDashboardPath(data.data.role),
        };
      }

      return { success: false, error: 'Unexpected error' };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Network error. Please check if the API is running.'
      };
    }
  }

  // Check if user has a specific permission
  hasPermission(permission: string): boolean {
    if (typeof window === 'undefined') return false;

    // Admins have wide permissions
    const role = localStorage.getItem('user_role');

    // Platform level permissions are STRICTLY for super_admin
    if (permission.startsWith('platform:')) {
      return role === 'super_admin';
    }

    if (role === 'super_admin' || role === 'tenant_admin') return true;

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
    if (!token) return false;
    return !isAuthTokenExpired(token);
  }

  // Get current user info
  getCurrentUser() {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('auth_token');
    if (!token || isAuthTokenExpired(token)) return null;
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

  // Logout
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.clear(); // Clear all auth data
    window.location.href = '/auth/login';
  }
}

export const RBACService = new AuthServiceClass();
