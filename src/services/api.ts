import {
  AuthToken,
  UserProfile,
  Machine,
  MachineQRInfo,
  SlotBooking,
  MisuseReport,
  VerifyQRResponse,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';
const TOKEN_KEY = 'dormwash_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = `${API_BASE}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (networkError) {
    throw new Error('Unable to connect to the backend server. Please verify the API server is responding.');
  }

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const errData = await response.json();
      if (errData.detail) {
        errorDetail = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
      } else if (errData.message) {
        errorDetail = errData.message;
      }
    } catch {
      // Body not JSON
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Authentication
  async getGoogleAuthUrl(): Promise<{ url: string; redirect_uri: string }> {
    return request<{ url: string; redirect_uri: string }>('/auth/google/url');
  },

  async loginWithGoogleToken(payload: { credential?: string; access_token?: string }): Promise<AuthToken> {
    const data = await request<AuthToken>('/auth/google/login-token', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(data.access_token);
    return data;
  },

  async login(email: string, password: string): Promise<AuthToken> {
    const data = await request<AuthToken>('/auth/login-json', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.access_token);
    return data;
  },

  async register(data: { email: string; password: string; full_name: string; is_admin?: boolean }): Promise<UserProfile> {
    const query = data.is_admin ? '?is_admin=true' : '';
    return request<UserProfile>(`/auth/register${query}`, {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        full_name: data.full_name,
      }),
    });
  },

  async getMe(): Promise<UserProfile> {
    return request<UserProfile>('/auth/me');
  },

  logout(): void {
    setStoredToken(null);
  },

  // Machines
  async getMachines(): Promise<Machine[]> {
    return request<Machine[]>('/machines');
  },

  async getMachine(id: number): Promise<Machine> {
    return request<Machine>(`/machines/${id}`);
  },

  async getMachineQRInfo(id: number): Promise<MachineQRInfo> {
    return request<MachineQRInfo>(`/machines/${id}/qr-info`);
  },

  getMachineQRImageUrl(id: number): string {
    return `${API_BASE}/machines/${id}/qr-image`;
  },

  async createMachine(data: { name: string; location: string }): Promise<Machine> {
    return request<Machine>('/machines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Slots & Check-in
  async bookSlot(machineId: number, startTime: Date, endTime: Date): Promise<SlotBooking> {
    return request<SlotBooking>('/slots/book', {
      method: 'POST',
      body: JSON.stringify({
        machine_id: machineId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      }),
    });
  },

  async getMySlots(): Promise<SlotBooking[]> {
    return request<SlotBooking[]>('/slots/my-slots');
  },

  async verifyQR(slotId: number, qrCodeToken: string): Promise<VerifyQRResponse> {
    return request<VerifyQRResponse>(`/slots/${slotId}/verify-qr`, {
      method: 'POST',
      body: JSON.stringify({ qr_code_token: qrCodeToken }),
    });
  },

  async cancelSlot(slotId: number): Promise<SlotBooking> {
    return request<SlotBooking>(`/slots/${slotId}/cancel`, {
      method: 'POST',
    });
  },

  // Misuse Reporting
  async reportMisuse(qrCodeToken: string, reason: string): Promise<MisuseReport> {
    return request<MisuseReport>('/reports/misuse', {
      method: 'POST',
      body: JSON.stringify({
        qr_code_token: qrCodeToken,
        reason,
      }),
    });
  },

  async getReports(): Promise<MisuseReport[]> {
    return request<MisuseReport[]>('/reports');
  },

  // Health check
  async checkConnection(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE.replace('/api/v1', '')}/`);
      return res.ok;
    } catch {
      return false;
    }
  },
};
