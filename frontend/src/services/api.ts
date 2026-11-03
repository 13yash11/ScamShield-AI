import { ScanResult, AdminMetrics, ScamReport, User, UserSettings, SettingsPatch } from '../types';
import { apiRequest, jsonBody } from './http';

class ApiService {
  scanText(text: string): Promise<ScanResult> {
    return apiRequest('/scan/text', { method: 'POST', ...jsonBody({ text }) });
  }
  scanFile(file: File): Promise<ScanResult> {
    const form = new FormData();
    form.append('file', file);
    return apiRequest('/scan/file', { method: 'POST', body: form });
  }
  scanUrl(url: string): Promise<ScanResult> {
    return apiRequest('/scan/url', { method: 'POST', ...jsonBody({ url }) });
  }
  getScanHistory(limit = 50, offset = 0): Promise<ScanResult[]> {
    return apiRequest(`/scans/history?limit=${limit}&offset=${offset}`);
  }
  deleteScan(scanId: string): Promise<void> {
    return apiRequest(`/scans/${encodeURIComponent(scanId)}`, { method: 'DELETE' });
  }
  clearHistory(): Promise<void> {
    return apiRequest('/scans', { method: 'DELETE' });
  }
  reportScan(scanId: string, description: string): Promise<{ message: string }> {
    return apiRequest(`/scans/${encodeURIComponent(scanId)}/report`, { method: 'POST', ...jsonBody({ description }) });
  }
  getAdminMetrics(): Promise<AdminMetrics> { return apiRequest('/admin/metrics'); }
  getScamReports(): Promise<ScamReport[]> { return apiRequest('/admin/reports'); }
  getAdminUsers(): Promise<User[]> { return apiRequest('/admin/users'); }
  reviewReport(id: string, status: ScamReport['status']): Promise<void> {
    return apiRequest(`/admin/reports/${encodeURIComponent(id)}`, { method: 'PATCH', ...jsonBody({ status }) });
  }
  getSettings(): Promise<UserSettings> { return apiRequest('/settings'); }
  updateSettings(settings: SettingsPatch): Promise<UserSettings> {
    return apiRequest('/settings', { method: 'PATCH', ...jsonBody(settings) });
  }
}

export const apiService = new ApiService();
