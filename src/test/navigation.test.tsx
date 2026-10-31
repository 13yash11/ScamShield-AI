import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { App } from '../App';
import { AuthProvider } from '../context/AuthContext';

describe('Navigation and Homepage Verification', () => {
  it('renders exact hero copy and buttons on homepage', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    );

    // Hero headline
    expect(
      screen.getByRole('heading', { level: 1, name: /Check suspicious messages before you trust them\./i })
    ).toBeInTheDocument();

    // Hero description
    expect(
      screen.getByText(/Analyze suspicious messages, links, and screenshots\. Understand potential scam warning signs and get practical safety guidance\./i)
    ).toBeInTheDocument();

    // Hero CTA buttons
    expect(screen.getAllByRole('button', { name: /Analyze a Message/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /How It Works/i })).toBeInTheDocument();

    // Wordmark
    expect(screen.getAllByText(/ScamShield/i).length).toBeGreaterThan(0);

    // Header nav links
    expect(screen.getByRole('link', { name: /^Home$/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Scan$/i })).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /^How It Works$/i }).length).toBeGreaterThan(0);
  });
});
