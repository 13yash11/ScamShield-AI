import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SignUpPage } from '../pages/SignUpPage';
import { SignInPage } from '../pages/SignInPage';
import { AuthProvider } from '../context/AuthContext';

describe('Authentication Form Validation & Policies', () => {
  it('enforces 5 required fields and 12-char password policy on signup', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SignUpPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify all 5 required fields are present
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Re-enter Password/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Create Account/i });

    // Submit empty form
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Full Name is required\./i)).toBeInTheDocument();

    // Fill short password (<12 characters)
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Alex Security' } });
    fireEvent.change(screen.getByLabelText(/Phone Number/i), { target: { value: '+15551234567' } });
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'alex@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'shortpass' } });
    fireEvent.change(screen.getByLabelText(/Re-enter Password/i), { target: { value: 'shortpass' } });

    fireEvent.click(submitBtn);

    expect(
      await screen.findByText(/Password must meet the 12-character minimum security policy\./i)
    ).toBeInTheDocument();

    // Test password confirmation mismatch
    fireEvent.change(screen.getByLabelText(/^Password/i), { target: { value: 'SuperSecretPass123!' } });
    fireEvent.change(screen.getByLabelText(/Re-enter Password/i), { target: { value: 'DifferentPass123!' } });

    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Passwords do not match\./i)).toBeInTheDocument();
  });

  it('validates sign in required fields without faking authentication', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <SignInPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/Email Address or Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Forgot Password\?/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Create Account/i })).toBeInTheDocument();

    const signInBtn = screen.getByRole('button', { name: /Sign In/i });
    fireEvent.click(signInBtn);

    expect(
      await screen.findByText(/Email address or phone number is required\./i)
    ).toBeInTheDocument();
  });
});
