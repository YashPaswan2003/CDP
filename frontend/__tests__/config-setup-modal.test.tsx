import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigSetupModal } from '@/components/ConfigSetupModal';
import * as apiModule from '@/lib/api';
import React from 'react';

// Mock API module
jest.mock('@/lib/api');

describe('ConfigSetupModal Component', () => {
  const mockSetConfig = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (apiModule.setConfig as jest.Mock) = mockSetConfig;
    mockOnClose.mockClear();
    mockOnComplete.mockClear();
  });

  it('should not render when not open', () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={false}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.queryByText(/Account Setup/i)).not.toBeInTheDocument();
  });

  it('should render when open', () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText(/Account Setup/i)).toBeInTheDocument();
  });

  it('should show step 1 of 4 initially', () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
  });

  it('should render upload options on step 1', () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.getByText(/CSV Upload/i)).toBeInTheDocument();
    expect(screen.getByText(/API Connection/i)).toBeInTheDocument();
  });

  it('should advance to step 2 on next button click', async () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    const nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
    });
  });

  it('should show data mapping review on step 2', async () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    const nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Review Data Mapping/i)).toBeInTheDocument();
      expect(screen.getByText(/Impressions Field/i)).toBeInTheDocument();
      expect(screen.getByText(/Clicks Field/i)).toBeInTheDocument();
      expect(screen.getByText(/Spend Field/i)).toBeInTheDocument();
      expect(screen.getByText(/Conversion Field/i)).toBeInTheDocument();
    });
  });

  it('should advance to step 3 from step 2', async () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    let nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton); // Step 1 → 2

    await waitFor(() => {
      nextButton = screen.getByText(/Next/i);
      fireEvent.click(nextButton); // Step 2 → 3
    });

    await waitFor(() => {
      expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument();
    });
  });

  it('should show threshold inputs on step 3', async () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    let nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton); // Step 1 → 2
    fireEvent.click(nextButton); // Step 2 → 3

    await waitFor(() => {
      expect(screen.getByText(/ROAS Target/i)).toBeInTheDocument();
      expect(screen.getByText(/CPA Limit/i)).toBeInTheDocument();
      expect(screen.getByText(/CTR Min/i)).toBeInTheDocument();
      expect(screen.getByText(/Frequency Limit/i)).toBeInTheDocument();
    });
  });

  it('should allow editing threshold values', async () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to step 3
    let nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    await waitFor(() => {
      const roasInput = screen.getByDisplayValue('3') as HTMLInputElement;
      fireEvent.change(roasInput, { target: { value: '2.5' } });

      expect(roasInput.value).toBe('2.5');
    });
  });

  it('should save config and advance to step 4 on final next', async () => {
    mockSetConfig.mockResolvedValue({ success: true });

    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to step 3
    let nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // Click next on step 3
    await waitFor(() => {
      nextButton = screen.getByText(/Next/i);
      fireEvent.click(nextButton);
    });

    // Should show loading or success state
    await waitFor(() => {
      expect(screen.getByText(/Setup Complete/i)).toBeInTheDocument();
    });
  });

  it('should call setConfig with correct data', async () => {
    mockSetConfig.mockResolvedValue({ success: true });

    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to step 3
    let nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // Click next on step 3
    await waitFor(() => {
      nextButton = screen.getByText(/Next/i);
      fireEvent.click(nextButton);
    });

    // Verify setConfig was called
    await waitFor(() => {
      expect(mockSetConfig).toHaveBeenCalledWith('acc-001', expect.any(Object));
      const callArgs = mockSetConfig.mock.calls[0][1];
      expect(callArgs).toHaveProperty('roas_threshold');
      expect(callArgs).toHaveProperty('cpa_threshold');
      expect(callArgs).toHaveProperty('currency');
    });
  });

  it('should show success message on step 4', async () => {
    mockSetConfig.mockResolvedValue({ success: true });

    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to step 4
    let nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    await waitFor(() => {
      nextButton = screen.getByText(/Next/i);
      fireEvent.click(nextButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Setup Complete/i)).toBeInTheDocument();
      expect(screen.getByText(/Redirecting to Monitor dashboard/i)).toBeInTheDocument();
    });
  });

  it('should call onComplete after delay on step 4', async () => {
    jest.useFakeTimers();
    mockSetConfig.mockResolvedValue({ success: true });

    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to step 4
    let nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    await waitFor(() => {
      nextButton = screen.getByText(/Next/i);
      fireEvent.click(nextButton);
    });

    // Fast forward time
    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });

    jest.useRealTimers();
  });

  it('should close modal on skip button', () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    const skipButton = screen.getByText(/Skip/i);
    fireEvent.click(skipButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close modal on X button', () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should disable next button while loading', async () => {
    mockSetConfig.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate to step 3
    let nextButton = screen.getByText(/Next/i) as HTMLButtonElement;
    fireEvent.click(nextButton);
    fireEvent.click(nextButton);

    // Click next on step 3
    await waitFor(() => {
      nextButton = screen.getByText(/Next/i) as HTMLButtonElement;
      expect(nextButton).not.toBeDisabled();
      fireEvent.click(nextButton);
    });

    // Button should be disabled while loading
    await waitFor(() => {
      const buttons = screen.getAllByText(/Next|Redirecting/i);
      const nextBtn = buttons.find((btn) => btn.parentElement?.classList.contains('disabled'));
      expect(nextBtn?.parentElement).toBeDefined();
    });
  });

  it('should maintain state through navigation', async () => {
    render(
      <ConfigSetupModal
        accountId="acc-001"
        isOpen={true}
        onClose={mockOnClose}
        onComplete={mockOnComplete}
      />
    );

    // Navigate forward
    let nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();
    });

    // Navigate forward again
    nextButton = screen.getByText(/Next/i);
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Step 3 of 4/i)).toBeInTheDocument();
      // Verify step 2 content is gone
      expect(screen.queryByText(/Review Data Mapping/i)).not.toBeInTheDocument();
    });
  });
});
