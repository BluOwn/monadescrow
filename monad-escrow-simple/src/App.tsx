// src/App.tsx
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// Add window.ethereum type
declare global {
  interface Window {
    ethereum?: any;
  }
}

// Contract constants
const ESCROW_CONTRACT_ADDRESS = "0x44f703203A65b6b11ea3b4540cC30337F0630927";
const MONAD_CHAIN_ID = 10143;

// Simplified ABI - only what we need
const ESCROW_ABI = [
  "function createEscrow(address seller, address arbiter) external payable returns (uint256)",
  "function releaseFunds(uint256 escrowId) external",
  "function refundBuyer(uint256 escrowId) external", 
  "function raiseDispute(uint256 escrowId) external",
  "function resolveDispute(uint256 escrowId, address payable recipient) external",
  "function getEscrow(uint256 escrowId) external view returns (address buyer, address seller, address arbiter, uint256 amount, bool fundsDisbursed, bool disputeRaised)",
  "function getUserEscrows(address user) external view returns (uint256[])",
  "function getEscrowCount() external view returns (uint256)"
];

// Types
interface Escrow {
  id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: string;
  fundsDisbursed: boolean;
  disputeRaised: boolean;
}

interface WalletState {
  connected: boolean;
  account: string;
  provider: ethers.BrowserProvider | null;
  contract: ethers.Contract | null;
}

const App: React.FC = () => {
  // State
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    account: '',
    provider: null,
    contract: null
  });
  
  const [escrows, setEscrows] = useState<Escrow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  
  // Form states
  const [formData, setFormData] = useState({
    seller: '',
    arbiter: '',
    amount: '',
    findId: ''
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState({
    seller: '',
    arbiter: '',
    amount: ''
  });

  // Dispute resolution state
  const [disputeResolution, setDisputeResolution] = useState<{[key: string]: string}>({});

  // Auto-connect wallet on component mount
  useEffect(() => {
    const autoConnect = async () => {
      if (window.ethereum) {
        try {
          // Check if already connected
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.log('Auto-connect failed:', error);
        }
      }
    };
    
    autoConnect();
  }, []);

  // Utility functions
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const showError = (msg: string) => {
    // Handle different types of errors with more user-friendly messages
    let userFriendlyMessage = msg;
    
    if (msg.includes('user rejected') || msg.includes('User denied') || msg.includes('ACTION_REJECTED')) {
      userFriendlyMessage = '❌ Transaction cancelled by user';
    } else if (msg.includes('insufficient funds') || msg.includes('INSUFFICIENT_FUNDS')) {
      userFriendlyMessage = '💰 Insufficient funds for this transaction';
    } else if (msg.includes('network') || msg.includes('NETWORK_ERROR')) {
      userFriendlyMessage = '🌐 Network error - please check your connection';
    } else if (msg.includes('gas') || msg.includes('GAS')) {
      userFriendlyMessage = '⛽ Gas estimation failed - transaction might fail';
    } else if (msg.includes('nonce')) {
      userFriendlyMessage = '🔄 Transaction nonce error - please try again';
    } else if (msg.includes('replacement')) {
      userFriendlyMessage = '⏳ Transaction replacement error - please wait and retry';
    }
    
    setError(userFriendlyMessage);
    setTimeout(() => setError(''), 8000);
  };

  const showSuccess = (msg: string) => {
    setSuccess('✅ ' + msg);
    setTimeout(() => setSuccess(''), 5000);
  };

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        showError('Please install MetaMask');
        return;
      }

      setLoading(true);
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();

      if (Number(network.chainId) !== MONAD_CHAIN_ID) {
        showError('Please switch to Monad Testnet');
        setLoading(false);
        return;
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(ESCROW_CONTRACT_ADDRESS, ESCROW_ABI, signer);

      setWallet({
        connected: true,
        account: accounts[0],
        provider,
        contract
      });

      setLoading(false);
      loadUserEscrows(contract, accounts[0]);
    } catch (err: any) {
      showError(err.message || 'Failed to connect wallet');
      setLoading(false);
    }
  };

  // Load user escrows
  const loadUserEscrows = async (contract: ethers.Contract, userAddress: string) => {
    try {
      setLoading(true);
      const escrowIds = await contract.getUserEscrows(userAddress);
      const escrowPromises = escrowIds.map(async (id: any) => {
        const details = await contract.getEscrow(id);
        return {
          id: id.toString(),
          buyer: details[0],
          seller: details[1],
          arbiter: details[2],
          amount: ethers.formatEther(details[3]),
          fundsDisbursed: details[4],
          disputeRaised: details[5]
        };
      });
      
      const userEscrows = await Promise.all(escrowPromises);
      
      // Sort by ID in descending order (newest first)
      const sortedEscrows = userEscrows.sort((a, b) => {
        return parseInt(b.id) - parseInt(a.id);
      });
      
      setEscrows(sortedEscrows);
      setCurrentPage(1); // Reset to first page when reloading
      setLoading(false);
    } catch (err: any) {
      showError('Failed to load escrows');
      setLoading(false);
    }
  };

  // Create escrow
  const createEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.contract) return;

    // Validate form first
    if (!validateForm()) {
      showError('Please fix the errors above');
      return;
    }

    try {
      setLoading(true);
      const tx = await wallet.contract.createEscrow(
        formData.seller.trim(),
        formData.arbiter.trim(),
        { value: ethers.parseEther(formData.amount) }
      );
      
      await tx.wait();
      showSuccess('Escrow created successfully!');
      setFormData({ seller: '', arbiter: '', amount: '', findId: '' });
      setFormErrors({ seller: '', arbiter: '', amount: '' });
      loadUserEscrows(wallet.contract, wallet.account);
      setLoading(false);
    } catch (err: any) {
      showError(err.message || 'Failed to create escrow');
      setLoading(false);
    }
  };

  // Handle escrow actions
  const handleAction = async (action: string, escrowId: string, recipient?: string) => {
    if (!wallet.contract) return;

    try {
      setLoading(true);
      let tx;
      
      switch (action) {
        case 'release':
          tx = await wallet.contract.releaseFunds(escrowId);
          break;
        case 'refund':
          tx = await wallet.contract.refundBuyer(escrowId);
          break;
        case 'dispute':
          tx = await wallet.contract.raiseDispute(escrowId);
          break;
        case 'resolve':
          if (!recipient) {
            showError('Recipient address is required');
            setLoading(false);
            return;
          }
          tx = await wallet.contract.resolveDispute(escrowId, recipient);
          break;
        default:
          throw new Error('Invalid action');
      }
      
      await tx.wait();
      showSuccess(`${action} completed successfully!`);
      loadUserEscrows(wallet.contract, wallet.account);
      setLoading(false);
    } catch (err: any) {
      showError(err.message || `Failed to ${action}`);
      setLoading(false);
    }
  };

  // Find escrow by ID
  const findEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.contract || !formData.findId) return;

    try {
      setLoading(true);
      const details = await wallet.contract.getEscrow(formData.findId);
      const escrow: Escrow = {
        id: formData.findId,
        buyer: details[0],
        seller: details[1],
        arbiter: details[2],
        amount: ethers.formatEther(details[3]),
        fundsDisbursed: details[4],
        disputeRaised: details[5]
      };
      
      setSelectedEscrow(escrow);
      setFormData(prev => ({ ...prev, findId: '' }));
      setLoading(false);
    } catch (err: any) {
      showError('Escrow not found');
      setLoading(false);
    }
  };

  // Determine user role in escrow
  const getUserRole = (escrow: Escrow) => {
    const account = wallet.account.toLowerCase();
    if (account === escrow.buyer.toLowerCase()) return 'buyer';
    if (account === escrow.seller.toLowerCase()) return 'seller';
    if (account === escrow.arbiter.toLowerCase()) return 'arbiter';
    return null;
  };

  // Validate form inputs
  const validateForm = () => {
    const errors = {
      seller: '',
      arbiter: '',
      amount: ''
    };

    const currentAccount = wallet.account.toLowerCase();
    const sellerAddr = formData.seller.toLowerCase().trim();
    const arbiterAddr = formData.arbiter.toLowerCase().trim();

    // Validate seller address
    if (!formData.seller.trim()) {
      errors.seller = 'Seller address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.seller.trim())) {
      errors.seller = 'Invalid Ethereum address format';
    } else if (sellerAddr === currentAccount) {
      errors.seller = 'Seller cannot be the same as buyer (your account)';
    }

    // Validate arbiter address
    if (!formData.arbiter.trim()) {
      errors.arbiter = 'Arbiter address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.arbiter.trim())) {
      errors.arbiter = 'Invalid Ethereum address format';
    } else if (arbiterAddr === currentAccount) {
      errors.arbiter = 'Arbiter cannot be the same as buyer (your account)';
    } else if (arbiterAddr === sellerAddr) {
      errors.arbiter = 'Arbiter cannot be the same as seller';
    }

    // Validate amount
    if (!formData.amount.trim()) {
      errors.amount = 'Amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        errors.amount = 'Amount must be a positive number';
      } else if (amount > 1000) {
        errors.amount = 'Amount cannot exceed 1000 MON';
      } else if (amount < 0.001) {
        errors.amount = 'Minimum amount is 0.001 MON';
      }
    }

    setFormErrors(errors);
    return !errors.seller && !errors.arbiter && !errors.amount;
  };

  // Clear form errors when user starts typing
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Pagination helpers
  const getCurrentPageEscrows = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return escrows.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    return Math.ceil(escrows.length / itemsPerPage);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < getTotalPages()) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa', 
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        backgroundColor: 'white', 
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#6c5ce7', marginBottom: '10px' }}>Monad Escrow</h1>
          <p style={{ color: '#636e72' }}>Secure transactions on Monad Testnet</p>
        </div>

        {/* Enhanced Alerts */}
        {error && (
          <div style={{ 
            backgroundColor: '#fff5f5', 
            color: '#c53030', 
            padding: '16px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            border: '1px solid #feb2b2',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            boxShadow: '0 4px 6px rgba(239, 68, 68, 0.1)'
          }}>
            <div style={{ 
              fontSize: '18px',
              lineHeight: '1',
              marginTop: '2px'
            }}>
              ⚠️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Transaction Error
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {error}
              </div>
            </div>
            <button
              onClick={() => setError('')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#c53030',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div style={{ 
            backgroundColor: '#f0fff4', 
            color: '#22543d', 
            padding: '16px', 
            borderRadius: '12px', 
            marginBottom: '20px',
            border: '1px solid #9ae6b4',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            boxShadow: '0 4px 6px rgba(72, 187, 120, 0.1)'
          }}>
            <div style={{ 
              fontSize: '18px',
              lineHeight: '1',
              marginTop: '2px'
            }}>
              ✅
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                Success!
              </div>
              <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                {success}
              </div>
            </div>
            <button
              onClick={() => setSuccess('')}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#22543d',
                cursor: 'pointer',
                fontSize: '18px',
                padding: '4px'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Main Content - Always show the interface */}
        {wallet.connected ? (
          <>
            {/* Wallet Info */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '25px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <small style={{ color: '#636e72' }}>Connected Account:</small>
                <p style={{ margin: 0, fontWeight: '600' }}>{truncateAddress(wallet.account)}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid #ddd',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Disconnect
              </button>
            </div>

            {/* Navigation */}
            <div style={{ display: 'flex', marginBottom: '25px', borderBottom: '1px solid #eee' }}>
              {[
                { key: 'create', label: 'Create Escrow' },
                { key: 'my', label: `My Escrows (${escrows.length})` },
                { key: 'find', label: 'Find Escrow' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    borderBottom: activeTab === tab.key ? '2px solid #6c5ce7' : '2px solid transparent',
                    color: activeTab === tab.key ? '#6c5ce7' : '#636e72',
                    fontWeight: activeTab === tab.key ? '600' : '400'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </>
        ) : (
          /* Show connect button if not connected */
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <button
              onClick={connectWallet}
              disabled={loading}
              style={{
                backgroundColor: '#6c5ce7',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginBottom: '20px'
              }}
            >
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          </div>
        )}

        {/* Main App Content - Show regardless of connection status */}
        {wallet.connected && (
          <>

            {/* Create Escrow Tab */}
            {activeTab === 'create' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Create New Escrow</h3>
                <form onSubmit={createEscrow}>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Seller Address
                    </label>
                    <input
                      type="text"
                      value={formData.seller}
                      onChange={(e) => handleInputChange('seller', e.target.value)}
                      placeholder="0x..."
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: formErrors.seller ? '1px solid #f56565' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: formErrors.seller ? '#fff5f5' : 'white'
                      }}
                    />
                    {formErrors.seller && (
                      <div style={{ 
                        color: '#c53030', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>⚠️</span>
                        {formErrors.seller}
                      </div>
                    )}
                    <small style={{ color: '#636e72', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      The address of the party who will receive the funds
                    </small>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Arbiter Address
                    </label>
                    <input
                      type="text"
                      value={formData.arbiter}
                      onChange={(e) => handleInputChange('arbiter', e.target.value)}
                      placeholder="0x..."
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: formErrors.arbiter ? '1px solid #f56565' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: formErrors.arbiter ? '#fff5f5' : 'white'
                      }}
                    />
                    {formErrors.arbiter && (
                      <div style={{ 
                        color: '#c53030', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>⚠️</span>
                        {formErrors.arbiter}
                      </div>
                    )}
                    <small style={{ color: '#636e72', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      A trusted third party who can resolve disputes
                    </small>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Amount (MON)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={formData.amount}
                      onChange={(e) => handleInputChange('amount', e.target.value)}
                      placeholder="0.001"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: formErrors.amount ? '1px solid #f56565' : '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: formErrors.amount ? '#fff5f5' : 'white'
                      }}
                    />
                    {formErrors.amount && (
                      <div style={{ 
                        color: '#c53030', 
                        fontSize: '12px', 
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <span>⚠️</span>
                        {formErrors.amount}
                      </div>
                    )}
                    <small style={{ color: '#636e72', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Min: 0.001 MON • Max: 1000 MON
                    </small>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      backgroundColor: '#6c5ce7',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Escrow'}
                  </button>
                </form>
              </div>
            )}

            {/* My Escrows Tab */}
            {activeTab === 'my' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h3 style={{ margin: 0 }}>My Escrows</h3>
                  {escrows.length > 0 && (
                    <small style={{ color: '#636e72' }}>
                      {escrows.length} total • Page {currentPage} of {getTotalPages()}
                    </small>
                  )}
                </div>
                
                {loading && escrows.length === 0 ? (
                  <p>Loading escrows...</p>
                ) : escrows.length === 0 ? (
                  <p>No escrows found.</p>
                ) : (
                  <div>
                    {getCurrentPageEscrows().map(escrow => {
                      const role = getUserRole(escrow);
                      return (
                        <div
                          key={escrow.id}
                          style={{
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            padding: '20px',
                            marginBottom: '15px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <h4 style={{ margin: '0 0 10px 0' }}>Escrow #{escrow.id}</h4>
                              <p style={{ margin: '5px 0' }}>
                                <strong>Amount:</strong> {escrow.amount} MON
                              </p>
                              <p style={{ margin: '5px 0' }}>
                                <strong>Status:</strong>{' '}
                                <span style={{
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  backgroundColor: escrow.fundsDisbursed ? '#e8f5e8' : escrow.disputeRaised ? '#ffebee' : '#e3f2fd',
                                  color: escrow.fundsDisbursed ? '#2e7d32' : escrow.disputeRaised ? '#c62828' : '#1565c0'
                                }}>
                                  {escrow.fundsDisbursed ? 'Completed' : escrow.disputeRaised ? 'Disputed' : 'Active'}
                                </span>
                              </p>
                              <p style={{ margin: '5px 0' }}>
                                <strong>Your Role:</strong>{' '}
                                <span style={{
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  fontSize: '12px',
                                  fontWeight: '600',
                                  backgroundColor: '#f0f0f0',
                                  textTransform: 'capitalize'
                                }}>
                                  {role}
                                </span>
                              </p>
                            </div>
                            
                            {!escrow.fundsDisbursed && (
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexDirection: 'column' }}>
                                {/* Buyer Actions */}
                                {role === 'buyer' && !escrow.disputeRaised && (
                                  <button
                                    onClick={() => handleAction('release', escrow.id)}
                                    disabled={loading}
                                    style={{
                                      backgroundColor: '#00b894',
                                      color: 'white',
                                      border: 'none',
                                      padding: '8px 16px',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    Release Funds to Seller
                                  </button>
                                )}
                                
                                {/* Seller Actions */}
                                {role === 'seller' && !escrow.disputeRaised && (
                                  <button
                                    onClick={() => handleAction('refund', escrow.id)}
                                    disabled={loading}
                                    style={{
                                      backgroundColor: '#f39c12',
                                      color: 'white',
                                      border: 'none',
                                      padding: '8px 16px',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    Refund to Buyer
                                  </button>
                                )}
                                
                                {/* Dispute Actions */}
                                {(role === 'buyer' || role === 'seller') && !escrow.disputeRaised && (
                                  <button
                                    onClick={() => handleAction('dispute', escrow.id)}
                                    disabled={loading}
                                    style={{
                                      backgroundColor: '#e74c3c',
                                      color: 'white',
                                      border: 'none',
                                      padding: '8px 16px',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      cursor: loading ? 'not-allowed' : 'pointer'
                                    }}
                                  >
                                    Raise Dispute
                                  </button>
                                )}

                                {/* Arbiter Actions */}
                                {role === 'arbiter' && (
                                  <div style={{ 
                                    backgroundColor: '#f8f9fa', 
                                    padding: '12px', 
                                    borderRadius: '6px',
                                    border: '1px solid #dee2e6'
                                  }}>
                                    <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#6c757d' }}>
                                      ARBITER CONTROLS
                                    </div>
                                    
                                    {!escrow.disputeRaised ? (
                                      <div>
                                        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#495057' }}>
                                          Choose who should receive the funds:
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <button
                                            onClick={() => handleAction('refund', escrow.id)}
                                            disabled={loading}
                                            style={{
                                              backgroundColor: '#007bff',
                                              color: 'white',
                                              border: 'none',
                                              padding: '6px 12px',
                                              borderRadius: '4px',
                                              fontSize: '12px',
                                              cursor: loading ? 'not-allowed' : 'pointer'
                                            }}
                                          >
                                            Award to Buyer
                                          </button>
                                          <button
                                            onClick={() => handleAction('release', escrow.id)}
                                            disabled={loading}
                                            style={{
                                              backgroundColor: '#28a745',
                                              color: 'white',
                                              border: 'none',
                                              padding: '6px 12px',
                                              borderRadius: '4px',
                                              fontSize: '12px',
                                              cursor: loading ? 'not-allowed' : 'pointer'
                                            }}
                                          >
                                            Award to Seller
                                          </button>
                                        </div>
                                      </div>
                                    ) : (
                                      <div>
                                        <div style={{ marginBottom: '8px', fontSize: '12px', color: '#dc3545' }}>
                                          🚨 DISPUTE ACTIVE - Choose resolution:
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                          <button
                                            onClick={() => handleAction('resolve', escrow.id, escrow.buyer)}
                                            disabled={loading}
                                            style={{
                                              backgroundColor: '#007bff',
                                              color: 'white',
                                              border: 'none',
                                              padding: '6px 12px',
                                              borderRadius: '4px',
                                              fontSize: '12px',
                                              cursor: loading ? 'not-allowed' : 'pointer'
                                            }}
                                          >
                                            Award to Buyer
                                          </button>
                                          <button
                                            onClick={() => handleAction('resolve', escrow.id, escrow.seller)}
                                            disabled={loading}
                                            style={{
                                              backgroundColor: '#28a745',
                                              color: 'white',
                                              border: 'none',
                                              padding: '6px 12px',
                                              borderRadius: '4px',
                                              fontSize: '12px',
                                              cursor: loading ? 'not-allowed' : 'pointer'
                                            }}
                                          >
                                            Award to Seller
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {/* Pagination Controls */}
                    {getTotalPages() > 1 && (
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        gap: '10px', 
                        marginTop: '20px',
                        padding: '20px 0'
                      }}>
                        <button
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          style={{
                            backgroundColor: currentPage === 1 ? '#f8f9fa' : '#e9ecef',
                            color: currentPage === 1 ? '#6c757d' : '#495057',
                            border: '1px solid #dee2e6',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
                          }}
                        >
                          ← Previous
                        </button>
                        
                        {/* Page Numbers */}
                        {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map(page => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            style={{
                              backgroundColor: currentPage === page ? '#6c5ce7' : 'white',
                              color: currentPage === page ? 'white' : '#495057',
                              border: '1px solid #dee2e6',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: currentPage === page ? '600' : '400'
                            }}
                          >
                            {page}
                          </button>
                        ))}
                        
                        <button
                          onClick={goToNextPage}
                          disabled={currentPage === getTotalPages()}
                          style={{
                            backgroundColor: currentPage === getTotalPages() ? '#f8f9fa' : '#e9ecef',
                            color: currentPage === getTotalPages() ? '#6c757d' : '#495057',
                            border: '1px solid #dee2e6',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: currentPage === getTotalPages() ? 'not-allowed' : 'pointer'
                          }}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Find Escrow Tab */}
            {activeTab === 'find' && (
              <div>
                <h3 style={{ marginBottom: '20px' }}>Find Escrow by ID</h3>
                <form onSubmit={findEscrow} style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      value={formData.findId}
                      onChange={(e) => setFormData(prev => ({ ...prev, findId: e.target.value }))}
                      placeholder="Enter escrow ID"
                      required
                      style={{
                        flex: 1,
                        padding: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      style={{
                        backgroundColor: '#6c5ce7',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? 'Finding...' : 'Find'}
                    </button>
                  </div>
                </form>

                {selectedEscrow && (
                  <div style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '20px'
                  }}>
                    <h4 style={{ marginTop: 0 }}>Escrow #{selectedEscrow.id}</h4>
                    <p><strong>Buyer:</strong> {truncateAddress(selectedEscrow.buyer)}</p>
                    <p><strong>Seller:</strong> {truncateAddress(selectedEscrow.seller)}</p>
                    <p><strong>Arbiter:</strong> {truncateAddress(selectedEscrow.arbiter)}</p>
                    <p><strong>Amount:</strong> {selectedEscrow.amount} MON</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: selectedEscrow.fundsDisbursed ? '#e8f5e8' : selectedEscrow.disputeRaised ? '#ffebee' : '#e3f2fd',
                        color: selectedEscrow.fundsDisbursed ? '#2e7d32' : selectedEscrow.disputeRaised ? '#c62828' : '#1565c0'
                      }}>
                        {selectedEscrow.fundsDisbursed ? 'Completed' : selectedEscrow.disputeRaised ? 'Disputed' : 'Active'}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '40px', 
          paddingTop: '20px', 
          borderTop: '1px solid #eee' 
        }}>
          <p style={{ margin: 0, color: '#636e72', fontSize: '14px' }}>
            Created by{' '}
            <a href="https://twitter.com/Oprimedev" target="_blank" rel="noopener noreferrer">
              @Oprimedev
            </a>
            {' | '}
            <a href="https://github.com/BluOwn/monadescrow" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;