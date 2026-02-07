// Frontend Auth Service - Calls real backend API
// This replaces the mock auth service with actual API calls

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/v1';

interface LoginResult {
  token: string;
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id: string;
  expires_at: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  data?: LoginResult;
}

class AuthServiceClass {
  // Role to dashboard path mapping
  private getDashboardPath(roleCode: string): string {
    switch (roleCode) {
      case 'super_admin': return '/admin/overview';
      case 'tenant_admin': return '/students'; // Main School Admin
      case 'teacher': return '/teacher/attendance';
      case 'parent': return '/parent/fees';
      case 'accountant': return '/finance/overview';
      default: return '/';
    }
  }

  // Real login via backend API
  async login(email: string, password: string): Promise<{ success: boolean; role?: string; redirect?: string; error?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data: LoginResponse = await response.json();

      if (!response.ok || !data.success) {
        return {
          success: false,
          error: data.message || 'Invalid credentials'
        };
      }

      if (data.data) {
        // Store token in localStorage
        localStorage.setItem('auth_token', data.data.token);
        localStorage.setItem('user_id', data.data.user_id);
        localStorage.setItem('user_email', data.data.email);
        localStorage.setItem('user_name', data.data.full_name);
        localStorage.setItem('user_role', data.data.role);
        localStorage.setItem('tenant_id', data.data.tenant_id);

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

  // Check if user is logged in
  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('auth_token');
  }

  // Get current user info
  getCurrentUser(): { email: string; name: string; role: string } | null {
    if (typeof window === 'undefined') return null;
    const email = localStorage.getItem('user_email');
    const name = localStorage.getItem('user_name');
    const role = localStorage.getItem('user_role');

    if (!email) return null;
    return { email, name: name || '', role: role || '' };
  }

  // Get auth token
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  // Logout
  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_email');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('tenant_id');
  }
}

// Export singleton instance
export const RBACService = new AuthServiceClass();
