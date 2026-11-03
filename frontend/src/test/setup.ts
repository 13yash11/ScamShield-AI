import '@testing-library/jest-dom';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setSessionActive } from '../services/http';

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  setSessionActive(false);
  // Tests never contact real authentication or AI services.
  vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ detail: 'Please sign in.' }), { status: 401 }))));
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
