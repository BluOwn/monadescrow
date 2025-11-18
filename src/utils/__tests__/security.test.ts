// src/utils/__tests__/security.test.ts
import { describe, it, expect } from 'vitest';
import { validateAddress, validateAmount, validateDifferentAddresses } from '../security';

describe('security.ts - Input Validation', () => {
  describe('validateAddress', () => {
    it('should accept valid Ethereum address', () => {
      const validAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
      expect(validateAddress(validAddress, 'Test Address')).toBe(true);
    });

    it('should accept valid checksummed address', () => {
      const validAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      expect(validateAddress(validAddress, 'Test Address')).toBe(true);
    });

    it('should reject empty address', () => {
      expect(() => validateAddress('', 'Test Address')).toThrow('Test Address is required');
    });

    it('should reject invalid address format', () => {
      expect(() => validateAddress('invalid-address', 'Test Address')).toThrow(
        'Test Address is not a valid Ethereum address'
      );
    });

    it('should reject address without 0x prefix', () => {
      expect(() => validateAddress('742d35Cc6634C0532925a3b844Bc9e7595f0bEb', 'Test Address')).toThrow(
        'Test Address is not a valid Ethereum address'
      );
    });

    it('should reject address with wrong length', () => {
      expect(() => validateAddress('0x742d35Cc6634C053', 'Test Address')).toThrow(
        'Test Address is not a valid Ethereum address'
      );
    });

    it('should use default name when not provided', () => {
      expect(() => validateAddress('invalid')).toThrow('Address is not a valid Ethereum address');
    });
  });

  describe('validateAmount', () => {
    it('should accept valid positive amounts', () => {
      expect(validateAmount('10')).toBe(true);
      expect(validateAmount('0.5')).toBe(true);
      expect(validateAmount('999.99')).toBe(true);
    });

    it('should reject empty amount', () => {
      expect(() => validateAmount('')).toThrow('Please enter a valid amount greater than 0');
    });

    it('should reject zero amount', () => {
      expect(() => validateAmount('0')).toThrow('Please enter a valid amount greater than 0');
    });

    it('should reject negative amounts', () => {
      expect(() => validateAmount('-10')).toThrow('Please enter a valid amount greater than 0');
    });

    it('should reject non-numeric values', () => {
      expect(() => validateAmount('abc')).toThrow('Please enter a valid amount greater than 0');
    });

    it('should reject amounts over 1000 MON', () => {
      expect(() => validateAmount('1001')).toThrow('Amount cannot exceed 1000 MON');
    });

    it('should accept exactly 1000 MON', () => {
      expect(validateAmount('1000')).toBe(true);
    });

    it('should reject amounts just over 1000 MON', () => {
      expect(() => validateAmount('1000.01')).toThrow('Amount cannot exceed 1000 MON');
    });
  });

  describe('validateDifferentAddresses', () => {
    const buyer = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    const seller = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
    const arbiter = '0xdD870fA1b7C4700F2BD7f44238821C26f7392148';

    it('should accept three different addresses', () => {
      expect(validateDifferentAddresses(buyer, seller, arbiter)).toBe(true);
    });

    it('should reject when buyer and seller are the same', () => {
      expect(() => validateDifferentAddresses(buyer, buyer, arbiter)).toThrow(
        'Buyer and seller addresses cannot be the same'
      );
    });

    it('should reject when buyer and arbiter are the same', () => {
      expect(() => validateDifferentAddresses(buyer, seller, buyer)).toThrow(
        'Buyer and arbiter addresses cannot be the same'
      );
    });

    it('should reject when seller and arbiter are the same', () => {
      expect(() => validateDifferentAddresses(buyer, seller, seller)).toThrow(
        'Seller and arbiter addresses cannot be the same'
      );
    });

    it('should be case-insensitive', () => {
      const buyerUpperCase = buyer.toUpperCase();
      expect(() => validateDifferentAddresses(buyerUpperCase, buyer, arbiter)).toThrow(
        'Buyer and seller addresses cannot be the same'
      );
    });

    it('should handle mixed case addresses', () => {
      const mixedBuyer = '0x742d35CC6634C0532925A3b844Bc9e7595F0bEb';
      expect(() => validateDifferentAddresses(mixedBuyer, buyer, arbiter)).toThrow(
        'Buyer and seller addresses cannot be the same'
      );
    });
  });
});
