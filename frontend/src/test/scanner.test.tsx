import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ScannerPage } from '../pages/ScannerPage';
import { ResultsPage } from '../pages/ResultsPage';

describe('Scanner Workspace and Results', () => {
  it('renders all 3 scanner tabs and allows switching', () => {
    render(
      <MemoryRouter>
        <ScannerPage />
      </MemoryRouter>
    );

    // Verify tabs
    const textTab = screen.getByRole('tab', { name: /Text Scanner/i });
    const screenshotTab = screen.getByRole('tab', { name: /Screenshot Scanner/i });
    const urlTab = screen.getByRole('tab', { name: /URL Scanner/i });

    expect(textTab).toBeInTheDocument();
    expect(screenshotTab).toBeInTheDocument();
    expect(urlTab).toBeInTheDocument();

    // Default is Text Scanner
    expect(screen.getByPlaceholderText(/Paste suspicious SMS, email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Analyze Message/i })).toBeInTheDocument();

    // Switch to Screenshot Scanner
    fireEvent.click(screenshotTab);
    expect(screen.getByText(/Drag and drop screenshot here/i)).toBeInTheDocument();

    // Switch to URL Scanner
    fireEvent.click(urlTab);
    expect(screen.getByLabelText(/Web Address \(URL\)/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check URL/i })).toBeInTheDocument();
  });

  it('renders clean empty state on results page when no scan has been performed', () => {
    render(
      <MemoryRouter>
        <ResultsPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/No Scan Results Available/i)).toBeInTheDocument();
    expect(
      screen.getByText(/You have not submitted any message, screenshot, or URL for analysis during this session\./i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start a New Scan/i })).toBeInTheDocument();
  });
});
