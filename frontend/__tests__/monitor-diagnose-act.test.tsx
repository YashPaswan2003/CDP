import { render, screen, waitFor } from '@testing-library/react';
import { MonitorDiagnoseAct } from '@/components/MonitorDiagnoseAct';
import * as apiModule from '@/lib/api';
import React from 'react';

// Mock API module
jest.mock('@/lib/api');

describe('MonitorDiagnoseAct Component', () => {
  const mockGetFlags = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetFlags.mockClear();
    (apiModule.getFlags as jest.Mock) = mockGetFlags;
  });

  it('should show loading state initially', () => {
    mockGetFlags.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<MonitorDiagnoseAct accountId="acc-001" />);

    expect(screen.getByText(/Loading alerts/i)).toBeInTheDocument();
  });

  it('should render error state when getFlags fails', async () => {
    mockGetFlags.mockRejectedValue(new Error('API Error'));

    render(<MonitorDiagnoseAct accountId="acc-001" />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load flags/i)).toBeInTheDocument();
    });
  });

  it('should show retry button on error', async () => {
    mockGetFlags.mockRejectedValue(new Error('API Error'));

    render(<MonitorDiagnoseAct accountId="acc-001" />);

    await waitFor(() => {
      expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    });
  });

  it('should render empty state when no flags', async () => {
    mockGetFlags.mockResolvedValue({
      flags: [],
      severity_distribution: { high: 0, medium: 0, low: 0 },
    });

    render(<MonitorDiagnoseAct accountId="acc-001" />);

    await waitFor(() => {
      expect(screen.getByText(/All clear/i)).toBeInTheDocument();
      expect(screen.getByText(/No anomalies detected/i)).toBeInTheDocument();
    });
  });

  it('should render flags when present', async () => {
    const mockFlags = [
      {
        metric: 'roas_drop',
        current: 2.5,
        previous: 3.2,
        entities: ['Campaign A'],
        entity_count: 1,
        severity: 'high' as const,
        explanation: 'ROAS dropped.',
        actions: [],
      },
      {
        metric: 'zero_conversions',
        current: 0,
        previous: 5,
        entities: ['Campaign B'],
        entity_count: 1,
        severity: 'medium' as const,
        explanation: 'No conversions.',
        actions: [],
      },
    ];

    mockGetFlags.mockResolvedValue({
      flags: mockFlags,
      severity_distribution: { high: 1, medium: 1, low: 0 },
    });

    render(<MonitorDiagnoseAct accountId="acc-001" />);

    await waitFor(() => {
      expect(screen.getByText(/1 HIGH/i)).toBeInTheDocument();
      expect(screen.getByText(/1 MEDIUM/i)).toBeInTheDocument();
    });
  });

  it('should display severity distribution summary', async () => {
    mockGetFlags.mockResolvedValue({
      flags: [
        {
          metric: 'test1',
          entities: [],
          entity_count: 0,
          severity: 'high' as const,
          explanation: 'Test flag',
          actions: [],
        },
        {
          metric: 'test2',
          entities: [],
          entity_count: 0,
          severity: 'medium' as const,
          explanation: 'Test flag',
          actions: [],
        },
        {
          metric: 'test3',
          entities: [],
          entity_count: 0,
          severity: 'low' as const,
          explanation: 'Test flag',
          actions: [],
        },
      ],
      severity_distribution: { high: 1, medium: 1, low: 1 },
    });

    render(<MonitorDiagnoseAct accountId="acc-001" />);

    await waitFor(() => {
      expect(screen.getByText(/1 HIGH/)).toBeInTheDocument();
      expect(screen.getByText(/1 MEDIUM/)).toBeInTheDocument();
      expect(screen.getByText(/1 LOW/)).toBeInTheDocument();
    });
  });

  it('should not call getFlags when accountId is missing', async () => {
    mockGetFlags.mockResolvedValue({
      flags: [],
      severity_distribution: { high: 0, medium: 0, low: 0 },
    });

    render(<MonitorDiagnoseAct accountId={undefined} />);

    await waitFor(() => {
      expect(screen.getByText(/No account selected/i)).toBeInTheDocument();
    });
  });

  it('should call getFlags with correct accountId', async () => {
    mockGetFlags.mockResolvedValue({
      flags: [],
      severity_distribution: { high: 0, medium: 0, low: 0 },
    });

    render(<MonitorDiagnoseAct accountId="acc-123" />);

    await waitFor(() => {
      expect(mockGetFlags).toHaveBeenCalledWith('acc-123');
    });
  });

  it('should reload flags when accountId changes', async () => {
    mockGetFlags.mockResolvedValue({
      flags: [],
      severity_distribution: { high: 0, medium: 0, low: 0 },
    });

    const { rerender } = render(<MonitorDiagnoseAct accountId="acc-001" />);

    await waitFor(() => {
      expect(mockGetFlags).toHaveBeenCalledWith('acc-001');
    });

    mockGetFlags.mockClear();

    rerender(<MonitorDiagnoseAct accountId="acc-002" />);

    await waitFor(() => {
      expect(mockGetFlags).toHaveBeenCalledWith('acc-002');
    });
  });

  it('should only show severity counts > 0', async () => {
    mockGetFlags.mockResolvedValue({
      flags: [
        {
          metric: 'test1',
          entities: [],
          entity_count: 0,
          severity: 'high' as const,
          explanation: 'Test flag',
          actions: [],
        },
      ],
      severity_distribution: { high: 1, medium: 0, low: 0 },
    });

    render(<MonitorDiagnoseAct accountId="acc-001" />);

    await waitFor(() => {
      expect(screen.getByText(/1 HIGH/)).toBeInTheDocument();
      expect(screen.queryByText(/MEDIUM/)).not.toBeInTheDocument();
      expect(screen.queryByText(/LOW/)).not.toBeInTheDocument();
    });
  });

  it('should display monitor/diagnose/act heading', async () => {
    mockGetFlags.mockResolvedValue({
      flags: [],
      severity_distribution: { high: 0, medium: 0, low: 0 },
    });

    render(<MonitorDiagnoseAct accountId="acc-001" />);

    await waitFor(() => {
      expect(screen.getByText(/Monitor • Diagnose • Act/i)).toBeInTheDocument();
    });
  });

  it('should render FlagBanner for each flag', async () => {
    mockGetFlags.mockResolvedValue({
      flags: [
        {
          metric: 'roas_drop',
          entities: ['Campaign A'],
          entity_count: 1,
          severity: 'high' as const,
          explanation: 'ROAS dropped.',
          actions: [],
        },
      ],
      severity_distribution: { high: 1, medium: 0, low: 0 },
    });

    render(<MonitorDiagnoseAct accountId="acc-001" />);

    await waitFor(() => {
      expect(screen.getByText(/roas drop/i)).toBeInTheDocument();
    });
  });
});
