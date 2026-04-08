import { render, screen, waitFor } from '@testing-library/react';
import UploadPage from '@/app/dashboard/upload/page';
import { AccountProvider } from '@/lib/accountContext';
import React from 'react';

// Mock the account context
jest.mock('@/lib/accountContext', () => ({
  AccountProvider: ({ children }: any) => children,
  useAccount: () => ({
    selectedAccount: { id: 'acc-001', name: 'QI Spine' },
  }),
}));

describe('Upload Flow - Phase 2', () => {
  it('should NOT display account picker (Step 0) - jumps directly to drop zone', () => {
    render(<UploadPage />);
    // Step 0 selector should not be visible
    const selectElement = screen.queryByLabelText(/Select Account to Upload To/i);
    expect(selectElement).not.toBeInTheDocument();
  });

  it('should render drop zone (Step 1) as first step', () => {
    render(<UploadPage />);
    const dropZone = screen.getByText(/Drop your file here or click to browse/i);
    expect(dropZone).toBeInTheDocument();
  });

  it('should NOT display duplicate account selector pill in Step 1', () => {
    render(<UploadPage />);
    // Search for the "Uploading for:" pill that was in Step 1
    const uploadingForPill = screen.queryByText(/Uploading for:/i);
    expect(uploadingForPill).not.toBeInTheDocument();
  });
});

describe('Upload Flow - Ethinos Blocking', () => {
  it('should block upload and show empty state for Ethinos master account', () => {
    // Mock Ethinos master account
    jest.mock('@/lib/accountContext', () => ({
      useAccount: () => ({
        selectedAccount: { id: 'ethinos', name: 'Ethinos (Master)' },
      }),
    }));

    render(<UploadPage />);

    const blockedMessage = screen.getByText(/Select a client account to upload data/i);
    expect(blockedMessage).toBeInTheDocument();

    // Drop zone should NOT be visible
    const dropZone = screen.queryByText(/Drop your file here or click to browse/i);
    expect(dropZone).not.toBeInTheDocument();
  });
});
