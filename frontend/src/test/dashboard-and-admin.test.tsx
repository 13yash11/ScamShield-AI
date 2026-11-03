import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { AdminPage } from '../pages/AdminPage';
import { HowItWorksPage } from '../pages/HowItWorksPage';
import { AuthProvider } from '../context/AuthContext';

describe('Dashboard, Admin Access Gate, and How It Works', () => {
  it('renders dashboard with genuine empty state without fake scan records', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <DashboardPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Welcome,/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /New Scan/i })).toBeInTheDocument();
    expect(screen.getByText(/No Scan Records Found/i)).toBeInTheDocument();
  });

  it('enforces backend administrator role verification notice on admin center', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <AdminPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByText(/Security Administration Center/i)).toBeInTheDocument();
    expect(screen.getByText(/Access Control Policy Notice/i)).toBeInTheDocument();
  });

  it('renders all four clear scanning process steps on How It Works', () => {
    render(
      <MemoryRouter>
        <HowItWorksPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: /Submit suspicious content/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /The system analyzes warning signs/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Review the risk assessment/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Read explanations and safety advice/i })).toBeInTheDocument();
  });
});
