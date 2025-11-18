// src/components/__tests__/AddressDisplay.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddressDisplay from '../AddressDisplay';

describe('AddressDisplay Component', () => {
  const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';

  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn(() => Promise.resolve())
      }
    });
  });

  it('should render truncated address', () => {
    render(<AddressDisplay address={mockAddress} />);

    const truncated = mockAddress.slice(0, 6) + '...' + mockAddress.slice(-4);
    expect(screen.getByText(truncated)).toBeInTheDocument();
  });

  it('should render with label when provided', () => {
    render(<AddressDisplay address={mockAddress} label="Buyer" />);

    expect(screen.getByText('Buyer:')).toBeInTheDocument();
  });

  it('should render without label when not provided', () => {
    render(<AddressDisplay address={mockAddress} />);

    expect(screen.queryByText(/:/)).not.toBeInTheDocument();
  });

  it('should show copy icon by default', () => {
    render(<AddressDisplay address={mockAddress} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('📋');
  });

  it('should copy address to clipboard when button clicked', async () => {
    render(<AddressDisplay address={mockAddress} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockAddress);
    });
  });

  it('should show checkmark after copying', async () => {
    render(<AddressDisplay address={mockAddress} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('✓');
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<AddressDisplay address={mockAddress} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Copy address to clipboard');
    expect(button).toHaveAttribute('aria-live', 'polite');
  });

  it('should update aria-label when copied', async () => {
    render(<AddressDisplay address={mockAddress} />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-label', 'Address copied to clipboard');
    });
  });
});
