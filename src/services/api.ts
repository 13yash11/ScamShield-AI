import { ScanResult, ScanHistoryItem, AdminMetrics, ScamReport } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

class ApiService {
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('scamshield_auth_token');
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Submit text content for scam & phishing analysis
   */
  async scanText(text: string): Promise<ScanResult> {
    const response = await fetch(`${API_BASE}/scan/text`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `Analysis request failed (HTTP ${response.status}).`);
    }

    return response.json();
  }

  /**
   * Submit screenshot or file for OCR & visual threat analysis
   */
  async scanFile(file: File): Promise<ScanResult> {
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    delete (headers as Record<string, string>)['Content-Type'];

    const response = await fetch(`${API_BASE}/scan/file`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `File scan failed (HTTP ${response.status}).`);
    }

    return response.json();
  }

  /**
   * Submit URL for domain reputation, redirect tracking, and heuristic inspection
   */
  async scanUrl(url: string): Promise<ScanResult> {
    const response = await fetch(`${API_BASE}/scan/url`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || err.message || `URL inspection failed (HTTP ${response.status}).`);
    }

    return response.json();
  }

  /**
   * Fetch authenticated user's scan history
   */
  async getScanHistory(): Promise<ScanHistoryItem[]> {
    const response = await fetch(`${API_BASE}/scans/history`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to load scan history (HTTP ${response.status}).`);
    }

    return response.json();
  }

  /**
   * Delete a scan record
   */
  async deleteScan(scanId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/scans/${encodeURIComponent(scanId)}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete record (HTTP ${response.status}).`);
    }
  }

  /**
   * Fetch administrative statistics (Requires admin privileges verified by backend)
   */
  async getAdminMetrics(): Promise<AdminMetrics> {
    const response = await fetch(`${API_BASE}/admin/metrics`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Unauthorized or unavailable admin metrics (HTTP ${response.status}).`);
    }

    return response.json();
  }

  /**
   * Fetch user-submitted scam reports for admin review
   */
  async getScamReports(): Promise<ScamReport[]> {
    const response = await fetch(`${API_BASE}/admin/reports`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve submitted scam reports (HTTP ${response.status}).`);
    }

    return response.json();
  }
}

export const apiService = new ApiService();
