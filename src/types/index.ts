// src/types/index.ts
import { Contract, ContractRunner, Interface, ContractTransactionResponse, BaseContractMethod } from 'ethers';

// Escrow related types
export interface Escrow {
  id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: string;
  fundsDisbursed: boolean;
  disputeRaised: boolean;
  placeholder?: boolean;
  error?: boolean;
}

// Theme context types
export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

// Contract related types - simplified to avoid type conflicts
export interface EscrowContract {
  // Use indexed signature instead of extending Contract
  [key: string]: any;
  
  // Define the methods with any type
  createEscrow: any;
  releaseFunds: any;  
  refundBuyer: any;
  raiseDispute: any;
  resolveDispute: any;
  getEscrow: any;
  getEscrowCount: any;
  getUserEscrows: any;
  
  // Include essential contract properties
  interface: Interface;
  runner?: ContractRunner;
  connect: (runner: ContractRunner) => EscrowContract;
  attach: (addressOrName: string) => EscrowContract;
  getFunction: (key: string) => BaseContractMethod<any[], any, any>;
}

// Helper function to create a typed escrow contract
export function createEscrowContract(contract: Contract): EscrowContract {
  return contract as unknown as EscrowContract;
}

// Component prop types
export interface AddressDisplayProps {
  address: string;
  label?: string;
}

export interface EscrowDetailsProps {
  escrow: Escrow | null;
  account: string;
  onAction: (action: string, escrowId: string, recipient?: string) => void;
  loading: boolean;
}

export interface EscrowListProps {
  escrows: Escrow[];
  onViewDetails: (escrowId: string) => void;
  loadingEscrows: boolean;
  retryLoadingEscrows: () => void;
  account: string;
  onAction: (action: string, escrowId: string, recipient?: string) => void;
}

export interface CreateEscrowTabProps {
  handleCreateEscrow: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
  sellerAddress: string;
  setSellerAddress: (address: string) => void;
  arbiterAddress: string;
  setArbiterAddress: (address: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  loading: boolean;
}

export interface MyEscrowsTabProps {
  escrows: Escrow[];
  onViewDetails: (escrowId: string) => void;
  loadingEscrows: boolean;
  retryLoadingEscrows: () => void;
  account: string;
  onAction: (action: string, escrowId: string, recipient?: string) => void;
}

export interface ArbitratedEscrowsTabProps {
  arbitratedEscrows: Escrow[];
  onViewDetails: (escrowId: string) => void;
  loadingArbitratedEscrows: boolean;
  retryLoadingEscrows: () => void;
  account: string;
  onAction: (action: string, escrowId: string, recipient?: string) => void;
}

export interface FindEscrowTabProps {
  escrowIdToView: string;
  setEscrowIdToView: (id: string) => void;
  handleFindEscrow: (e: React.FormEvent<HTMLFormElement>) => void;
  loading: boolean;
}

export interface EscrowStatisticsProps {
  myEscrowsCount: number;
  arbitratedEscrowsCount: number;
  totalEscrowsCount: number;
  activeEscrowsCount: number;
  disputedEscrowsCount: number;
  completedEscrowsCount: number;
}

export interface RateLimitAlertProps {
  isVisible: boolean;
  onDismiss: () => void;
  onRetry: () => void;
  progress?: number;
  autoRetryIn?: number;
}

export interface SecurityWarningModalProps {
  show: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export interface NetworkWarningProps {
  currentNetwork: string;
  expectedNetwork?: string;
}

export interface LoadingIndicatorProps {
  message?: string;
}

export interface DarkModeWrapperProps {
  children: React.ReactNode;
}

export interface EscrowCardProps {
  escrow: Escrow;
  onViewDetails: (escrowId: string) => void;
  onAction: (action: string, escrowId: string, recipient?: string) => void;
  account: string;
}

export interface SkeletonProps {
  count?: number;
}

// Define a custom Window interface to include ethereum
export interface ExtendedWindow extends Window {
  ethereum?: any;
}