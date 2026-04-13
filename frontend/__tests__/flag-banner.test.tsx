import { render, screen, fireEvent } from '@testing-library/react';
import { FlagBanner } from '@/components/FlagBanner';
import React from 'react';

describe('FlagBanner Component', () => {
  const mockAction = jest.fn();

  const defaultProps = {
    metric: 'roas_drop',
    current: 2.5,
    previous: 3.2,
    entities: ['Campaign A', 'Campaign B', 'Campaign C'],
    entity_count: 3,
    severity: 'high' as const,
    explanation: 'ROAS has dropped by more than 20% in the last 7 days.',
    actions: [
      {
        type: 'pause_campaign',
        label: 'Pause Campaign',
        severity: 'high' as const,
      },
      {
        type: 'increase_budget',
        label: 'Increase Budget',
        severity: 'high' as const,
      },
    ],
    onAction: mockAction,
  };

  beforeEach(() => {
    mockAction.mockClear();
  });

  it('should render flag header with metric name', () => {
    render(<FlagBanner {...defaultProps} />);
    const metricText = screen.getByText(/roas drop/i);
    expect(metricText).toBeInTheDocument();
  });

  it('should display severity badge', () => {
    render(<FlagBanner {...defaultProps} />);
    const badge = screen.getByText(/HIGH/i);
    expect(badge).toBeInTheDocument();
  });

  it('should show affected entity count', () => {
    render(<FlagBanner {...defaultProps} />);
    const countText = screen.getByText(/3 item\(s\) affected/i);
    expect(countText).toBeInTheDocument();
  });

  it('should display current and previous values when provided', () => {
    render(<FlagBanner {...defaultProps} />);
    const valueText = screen.getByText(/2\.50.*was 3\.20/i);
    expect(valueText).toBeInTheDocument();
  });

  it('should have collapsed state initially', () => {
    render(<FlagBanner {...defaultProps} />);
    const explanation = screen.queryByText(/ROAS has dropped/);
    expect(explanation).not.toBeInTheDocument();
  });

  it('should expand to show explanation on click', () => {
    render(<FlagBanner {...defaultProps} />);

    const header = screen.getByText(/roas drop/i);
    fireEvent.click(header);

    const explanation = screen.getByText(/ROAS has dropped/);
    expect(explanation).toBeInTheDocument();
  });

  it('should show affected items when expanded', () => {
    render(<FlagBanner {...defaultProps} />);

    const header = screen.getByText(/roas drop/i);
    fireEvent.click(header);

    expect(screen.getByText('Campaign A')).toBeInTheDocument();
    expect(screen.getByText('Campaign B')).toBeInTheDocument();
    expect(screen.getByText('Campaign C')).toBeInTheDocument();
  });

  it('should show "more" indicator for entities beyond 5', () => {
    const manyEntities = Array.from({ length: 10 }, (_, i) => `Campaign ${i + 1}`);
    const propsWithMany = {
      ...defaultProps,
      entities: manyEntities,
      entity_count: 10,
    };

    render(<FlagBanner {...propsWithMany} />);

    const header = screen.getByText(/roas drop/i);
    fireEvent.click(header);

    expect(screen.getByText(/\+5 more/)).toBeInTheDocument();
  });

  it('should render action buttons when expanded', () => {
    render(<FlagBanner {...defaultProps} />);

    const header = screen.getByText(/roas drop/i);
    fireEvent.click(header);

    expect(screen.getByText('Pause Campaign')).toBeInTheDocument();
    expect(screen.getByText('Increase Budget')).toBeInTheDocument();
  });

  it('should call onAction when action button is clicked', () => {
    render(<FlagBanner {...defaultProps} />);

    const header = screen.getByText(/roas drop/i);
    fireEvent.click(header);

    const pauseButton = screen.getByText('Pause Campaign');
    fireEvent.click(pauseButton);

    expect(mockAction).toHaveBeenCalledWith({
      type: 'pause_campaign',
      label: 'Pause Campaign',
      severity: 'high',
    });
  });

  it('should apply correct severity styles', () => {
    const { container } = render(<FlagBanner {...defaultProps} severity="high" />);
    const banner = container.querySelector('[class*="bg-red"]');
    expect(banner).toBeInTheDocument();
  });

  it('should handle medium severity styling', () => {
    const { container } = render(
      <FlagBanner {...defaultProps} severity="medium" />
    );
    const banner = container.querySelector('[class*="bg-amber"]');
    expect(banner).toBeInTheDocument();
  });

  it('should handle low severity styling', () => {
    const { container } = render(
      <FlagBanner {...defaultProps} severity="low" />
    );
    const banner = container.querySelector('[class*="bg-blue"]');
    expect(banner).toBeInTheDocument();
  });

  it('should toggle expanded state on multiple clicks', () => {
    render(<FlagBanner {...defaultProps} />);

    const header = screen.getByText(/roas drop/i);

    // First click - expand
    fireEvent.click(header);
    expect(screen.getByText(/ROAS has dropped/)).toBeInTheDocument();

    // Second click - collapse
    fireEvent.click(header);
    expect(screen.queryByText(/ROAS has dropped/)).not.toBeInTheDocument();

    // Third click - expand again
    fireEvent.click(header);
    expect(screen.getByText(/ROAS has dropped/)).toBeInTheDocument();
  });

  it('should handle no actions gracefully', () => {
    const propsNoActions = {
      ...defaultProps,
      actions: [],
    };

    render(<FlagBanner {...propsNoActions} />);

    const header = screen.getByText(/roas drop/i);
    fireEvent.click(header);

    // Should not throw error, just show no action buttons
    expect(screen.queryByText('Pause Campaign')).not.toBeInTheDocument();
  });

  it('should handle no entities gracefully', () => {
    const propsNoEntities = {
      ...defaultProps,
      entities: [],
      entity_count: 0,
    };

    render(<FlagBanner {...propsNoEntities} />);

    const header = screen.getByText(/roas drop/i);
    fireEvent.click(header);

    expect(screen.queryByText(/Campaign/)).not.toBeInTheDocument();
  });
});
