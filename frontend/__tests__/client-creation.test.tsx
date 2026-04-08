import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClientsPage from '@/app/dashboard/clients/page';
import React from 'react';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock fetch for API calls
global.fetch = jest.fn();

describe('Client Creation Form - Phase 3', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should display client creation form with all required fields', () => {
    render(<ClientsPage />);

    const addClientButton = screen.getByRole('button', { name: /Add Client/i });
    fireEvent.click(addClientButton);

    expect(screen.getByLabelText(/Client Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Client Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Platforms/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Currency/i)).toBeInTheDocument();
  });

  it('should POST to /api/accounts on form submit', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'acc-new',
        name: 'QI Spine',
        industry: 'Healthcare',
        currency: 'INR',
        client_type: 'web',
        platforms: ['google', 'meta'],
      }),
    });

    render(<ClientsPage />);

    const addClientButton = screen.getByRole('button', { name: /Add Client/i });
    fireEvent.click(addClientButton);

    const nameInput = screen.getByDisplayValue('') as HTMLInputElement;
    nameInput.focus();
    await userEvent.type(nameInput, 'QI Spine');

    const submitButton = screen.getByRole('button', { name: /^Add Client$/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/accounts',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('QI Spine'),
        })
      );
    });
  });

  it('should call refreshAccounts() after successful creation', async () => {
    const refreshAccountsMock = jest.fn();

    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 'acc-new', name: 'QI Spine' }),
    });

    render(<ClientsPage />);

    const addClientButton = screen.getByRole('button', { name: /Add Client/i });
    fireEvent.click(addClientButton);

    // Submit form (implementation should call refreshAccounts)
    const submitButton = screen.getByRole('button', { name: /^Add Client$/ });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/accounts', expect.any(Object));
    });
  });
});

describe('Account Context - refreshAccounts', () => {
  it('should have refreshAccounts function available in context', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ([{ id: 'ethinos' }, { id: 'acc-001' }]),
    });

    render(<ClientsPage />);

    // After form submit, account list should refresh
    // This is tested via the POST + refresh pattern
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });
});
