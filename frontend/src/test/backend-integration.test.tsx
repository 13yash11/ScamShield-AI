import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { AuthProvider } from '../context/AuthContext';
import { apiService } from '../services/api';
import { authService } from '../services/auth';
import { ScanResult, User, UserSettings } from '../types';

const user: User = { id: 'user-test', fullName: 'Test Analyst', email: 'test@example.com', role: 'user', createdAt: '2026-11-01T00:00:00Z' };
const scan: ScanResult = {
  id: 'scan-test', scanType: 'text', target: 'Text submission (SHA-256: test)', riskLevel: 'CRITICAL', riskScore: 90,
  summary: 'A contextual request for sensitive credentials.', warningSigns: ['OTP and password requested together'], explanation: 'Combined warning signs.', recommendations: ['Verify the sender independently.'], detectionMethod: 'RULE_BASED_FALLBACK', limitations: 'Gemini was not used. Scores are heuristic.', aiUsed: false, saved: true, createdAt: '2026-11-01T00:00:00Z',
};
const settings: UserSettings = { user, privacyPreferences: { saveHistory: true, storeContent: false, useAi: false }, notificationPreferences: { securityNotices: true } };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

function mount(path: string) {
  return render(<MemoryRouter initialEntries={[path]}><AuthProvider><App /></AuthProvider></MemoryRouter>);
}

function mockServer(handler: (path: string, init: RequestInit) => Response | undefined) {
  const fetch = vi.fn(async (input: string | URL | Request, init: RequestInit = {}) => {
    const path = String(input).replace('/api/v1', '').split('?')[0];
    return handler(path, init) || json({ detail: 'Please sign in.' }, 401);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

describe('Backend integration in the existing interface', () => {
  it('registers using only name, email, and password confirmation', async () => {
    const fetch = mockServer((path) => path === '/auth/signup' ? json({ success: true, message: 'Confirm your email.' }, 201) : undefined);
    mount('/signup');
    const submit = await screen.findByRole('button', { name: 'Create Account' });
    await waitFor(() => expect(submit).toBeEnabled());
    expect(screen.queryByLabelText(/Phone Number/)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: user.fullName } });
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'A long test password!' } });
    fireEvent.change(screen.getByLabelText(/Re-enter Password/), { target: { value: 'A long test password!' } });
    fireEvent.click(submit);
    expect(await screen.findByText('Confirm your email.')).toBeInTheDocument();
    const request = fetch.mock.calls.find(([url]) => String(url).endsWith('/auth/signup'));
    expect(JSON.parse(String(request?.[1]?.body))).toEqual({
      fullName: user.fullName, email: user.email, password: 'A long test password!', rePassword: 'A long test password!',
    });
  });

  it('requires a valid email address before submitting sign-in', async () => {
    const fetch = mockServer(() => undefined);
    mount('/login');
    const input = await screen.findByLabelText(/Email Address/);
    expect(input).toHaveAttribute('type', 'email');
    const submit = screen.getAllByRole('button', { name: 'Sign In' }).find((button) => button.getAttribute('type') === 'submit')!;
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.change(input, { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'A long test password!' } });
    fireEvent.click(submit);
    expect(await screen.findByText('Please enter a valid email address.')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([url]) => String(url).endsWith('/auth/login'))).toBe(false);
  });

  it.each(['/scan', '/results'])('requires sign-in before opening %s', async (path) => {
    const fetch = mockServer(() => undefined);
    mount(path);
    expect(await screen.findByRole('heading', { name: 'Sign In to ScamShield' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Suspicious Message Content')).not.toBeInTheDocument();
    expect(fetch.mock.calls.some(([url]) => String(url).includes('/scan/'))).toBe(false);
  });

  it('returns to the scanner after a successful sign-in', async () => {
    mockServer((path) => path === '/auth/login' ? json({ success: true, user }) : undefined);
    mount('/scan');
    const heading = await screen.findByRole('heading', { name: 'Sign In to ScamShield' });
    expect(heading).toBeInTheDocument();
    const submit = screen.getAllByRole('button', { name: 'Sign In' }).find((button) => button.getAttribute('type') === 'submit')!;
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'A long test password!' } });
    fireEvent.click(submit);
    expect(await screen.findByLabelText('Suspicious Message Content')).toBeInTheDocument();
  });

  it('redirects an unauthenticated dashboard visitor to sign-in', async () => {
    const fetch = mockServer(() => undefined);
    mount('/dashboard');
    expect(await screen.findByRole('heading', { name: 'Sign In to ScamShield' })).toBeInTheDocument();
    expect(screen.queryByText('Session Authenticated')).not.toBeInTheDocument();
    expect(fetch.mock.calls.some(([url]) => String(url).includes('/scans/history'))).toBe(false);
  });

  it('shows a rejected login without navigating or storing a token', async () => {
    mockServer((path) => path === '/auth/login' ? json({ detail: 'Invalid email or password.' }, 401) : undefined);
    mount('/login');
    const submit = screen.getAllByRole('button', { name: 'Sign In' }).find((button) => button.getAttribute('type') === 'submit')!;
    await waitFor(() => expect(submit).toBeEnabled());
    fireEvent.change(screen.getByLabelText(/Email Address/), { target: { value: user.email } });
    fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: 'incorrect-password' } });
    fireEvent.click(submit);
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');
    expect(screen.queryByText('Session Authenticated')).not.toBeInTheDocument();
    expect(localStorage.getItem('scamshield_auth_token')).toBeNull();
  });

  it('loads genuine dashboard records from the API', async () => {
    mockServer((path) => path === '/auth/me' ? json({ user }) : path === '/scans/history' ? json([scan]) : undefined);
    mount('/dashboard');
    expect(await screen.findByText(scan.summary)).toBeInTheDocument();
    expect(screen.getByText('Critical Risk')).toBeInTheDocument();
  });

  it('keeps a history row when deletion fails, then removes it after success', async () => {
    let deletions = 0;
    mockServer((path, init) => {
      if (path === '/auth/me') return json({ user });
      if (path === '/scans/history') return json([scan]);
      if (path === '/scans/scan-test' && init.method === 'DELETE') return ++deletions === 1 ? json({ detail: 'Database unavailable.' }, 503) : new Response(null, { status: 204 });
    });
    mount('/history');
    const remove = await screen.findByRole('button', { name: 'Delete record scan-test' });
    fireEvent.click(remove);
    expect(await screen.findByRole('alert')).toHaveTextContent('Database unavailable.');
    expect(screen.getByText(scan.summary)).toBeInTheDocument();
    await waitFor(() => expect(remove).toBeEnabled());
    fireEvent.click(remove);
    expect(await screen.findByText('Scan History Is Empty')).toBeInTheDocument();
  });

  it('saves profile and privacy changes through the real request contract', async () => {
    const fetch = mockServer((path, init) => {
      if (path === '/auth/me') return json({ user });
      if (path === '/settings') return json({ ...settings, message: init.method === 'PATCH' ? 'Settings saved.' : undefined });
    });
    mount('/settings');
    const fullName = await screen.findByLabelText(/Full Name/);
    fireEvent.change(fullName, { target: { value: 'Updated Analyst' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Profile Changes' }));
    expect(await screen.findByText('Settings saved.')).toBeInTheDocument();
    const profileRequest = fetch.mock.calls.find(([url, init]) => String(url).endsWith('/settings') && String(init?.body).includes('Updated Analyst'));
    expect(profileRequest?.[1]?.credentials).toBe('include');
    expect(JSON.parse(String(profileRequest?.[1]?.body))).toEqual({ profile: { fullName: 'Updated Analyst', email: user.email } });
    expect(screen.queryByLabelText(/Phone Number/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Save future scans to my account history'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Preferences' }));
    await waitFor(() => expect(fetch.mock.calls.some(([, init]) => String(init?.body).includes('"saveHistory":false'))).toBe(true));
  });

  it('blocks admin navigation for ordinary users', async () => {
    const fetch = mockServer((path) => path === '/auth/me' ? json({ user }) : undefined);
    mount('/admin');
    expect(await screen.findByText('Administrator Access Denied')).toBeInTheDocument();
    expect(fetch.mock.calls.some(([url]) => String(url).includes('/admin/'))).toBe(false);
  });

  it('renders real admin counts and loads the user directory', async () => {
    mockServer((path) => {
      if (path === '/auth/me') return json({ user: { ...user, role: 'admin' } });
      if (path === '/admin/metrics') return json({ totalScans: 12, flaggedThreats: 3, activeUsers: 1, reportedScamsCount: 0 });
      if (path === '/admin/users') return json([user]);
      if (path === '/admin/reports') return json([]);
    });
    mount('/admin');
    expect(await screen.findByText('12')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'User Directory' }));
    expect(screen.getByText(`${user.fullName} (${user.email})`)).toBeInTheDocument();
  });

  it('shows the backend fallback result without claiming Gemini was used', async () => {
    mockServer((path) => path === '/auth/me' ? json({ user }) : path === '/scan/text' ? json({ ...scan, saved: false }) : undefined);
    mount('/scan');
    fireEvent.change(await screen.findByLabelText('Suspicious Message Content'), { target: { value: 'Share your OTP and password immediately.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Message' }));
    expect(await screen.findByText('RULE_BASED_FALLBACK')).toBeInTheDocument();
    expect(screen.getByText(scan.limitations)).toBeInTheDocument();
    expect(sessionStorage.getItem('scamshield_latest_result')).toBeNull();
  });

  it('refreshes parallel expired requests only once and retries both', async () => {
    let refreshed = false;
    const fetch = mockServer((path) => {
      if (path === '/auth/refresh') { refreshed = true; return json({ success: true }); }
      if (!refreshed) return json({ detail: 'Expired session.' }, 401);
      if (path === '/scans/history') return json([scan]);
      if (path === '/settings') return json(settings);
    });
    const [history, prefs] = await Promise.all([apiService.getScanHistory(), apiService.getSettings()]);
    expect(history[0].id).toBe(scan.id);
    expect(prefs.privacyPreferences.useAi).toBe(false);
    expect(fetch.mock.calls.filter(([url]) => String(url).endsWith('/auth/refresh'))).toHaveLength(1);
    expect(fetch.mock.calls.every(([, init]) => init?.credentials === 'include')).toBe(true);
  });

  it('sends password confirmation and rejects malformed authentication success', async () => {
    const fetch = mockServer((path) => path === '/auth/signup' ? json({ success: true, message: 'Confirm your email.' }, 201) : path === '/auth/login' ? json({ success: true }) : undefined);
    const signup = await authService.signUp({ fullName: user.fullName, email: user.email, password: 'A long test password!', rePassword: 'A long test password!' });
    expect(signup.message).toBe('Confirm your email.');
    expect(JSON.parse(String(fetch.mock.calls[0][1]?.body)).rePassword).toBe('A long test password!');
    expect((await authService.login({ identifier: user.email, password: 'A long test password!' })).success).toBe(false);
  });
});
