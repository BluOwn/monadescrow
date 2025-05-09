import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button, Card, Container, Form, ListGroup, Nav, Spinner, Alert, Modal, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import security utilities and components
import {
  ESCROW_SERVICE_ADDRESS,
  validateNetwork,
  verifyContract,
  executeTransactionSecurely,
  validateAddress,
  validateAmount,
  handleError,
  addSecurityHeaders
} from './utils/security';

import {
  ContractInfo,
  SecurityWarningModal,
  SecurityBanner,
  NetworkWarning
} from './components/SecurityComponents';

// Import Contact Form
import ContactForm from './components/ContactForm';

// Creator Information
const CREATOR_WALLET = "0x0b977acab5d9b8f654f48090955f5e00973be0fe";
const CREATOR_TWITTER = "@Oprimedev";

// ABI for the EscrowService contract
const ESCROW_SERVICE_ABI = [
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "initiator",
				"type": "address"
			}
		],
		"name": "DisputeRaised",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "recipient",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "DisputeResolved",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "EscrowCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsRefunded",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "FundsReleased",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "arbiter",
				"type": "address"
			}
		],
		"name": "createEscrow",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "escrows",
		"outputs": [
			{
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "arbiter",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "fundsDisbursed",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "disputeRaised",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "getEscrow",
		"outputs": [
			{
				"internalType": "address",
				"name": "buyer",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "seller",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "arbiter",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "fundsDisbursed",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "disputeRaised",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getEscrowCount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "user",
				"type": "address"
			}
		],
		"name": "getUserEscrows",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "raiseDispute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "refundBuyer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "releaseFunds",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			},
			{
				"internalType": "address payable",
				"name": "recipient",
				"type": "address"
			}
		],
		"name": "resolveDispute",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "userEscrows",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

// Helper function to truncate address
const truncateAddress = (address) => {
  return address.slice(0, 6) + '...' + address.slice(-4);
};

function App() {
  // State variables
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('create');
  const [escrows, setEscrows] = useState([]);
  const [arbitratedEscrows, setArbitratedEscrows] = useState([]);
  const [selectedEscrowId, setSelectedEscrowId] = useState(null);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Form states
  const [sellerAddress, setSellerAddress] = useState('');
  const [arbiterAddress, setArbiterAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [escrowIdToView, setEscrowIdToView] = useState('');
  const [recipientForDispute, setRecipientForDispute] = useState('');

  // Security states
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [hasAcceptedSecurity, setHasAcceptedSecurity] = useState(false);
  const [firstTimeUser, setFirstTimeUser] = useState(true);

  // Loading states for better UX
  const [loadingEscrows, setLoadingEscrows] = useState(false);
  const [loadingArbitratedEscrows, setLoadingArbitratedEscrows] = useState(false);

  // Initialize security headers on component mount
  useEffect(() => {
    addSecurityHeaders();
    
    // Check if user has previously accepted security warning
    const hasAccepted = localStorage.getItem('monad-escrow-security-accepted');
    if (hasAccepted === 'true') {
      setHasAcceptedSecurity(true);
      setFirstTimeUser(false);
    }
  }, []);

  // Connect to MetaMask
  const connectWallet = async () => {
    // Show security warning for first-time users
    if (firstTimeUser && !hasAcceptedSecurity) {
      setShowSecurityWarning(true);
      return;
    }

    if (window.ethereum) {
      try {
        setLoading(true);
        setError('');
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          
          // Validate network
          try {
            await validateNetwork(provider);
          } catch (networkError) {
            setError(networkError.message);
            setLoading(false);
            return;
          }
          
          const network = await provider.getNetwork();
          const signer = await provider.getSigner();
          
          setProvider(provider);
          setSigner(signer);
          setAccount(accounts[0]);
          setNetworkName('Monad Testnet');
          setConnected(true);
          
          // Initialize contract with verification
          const isContractValid = await verifyContract(provider, ESCROW_SERVICE_ADDRESS, ESCROW_SERVICE_ABI);
          
          if (!isContractValid) {
            throw new Error('Contract verification failed. Please check the contract address.');
          }
          
          const escrowContract = new ethers.Contract(
            ESCROW_SERVICE_ADDRESS,
            ESCROW_SERVICE_ABI,
            signer
          );
          setContract(escrowContract);
          
          // Add a small delay to ensure contract is fully initialized
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Load user's escrows with retry logic
          await loadUserEscrows(escrowContract, accounts[0]);
          
          // Load escrows where user is arbiter with retry logic
          await loadArbitratedEscrows(escrowContract, accounts[0]);
        }
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
        setError(handleError(error, 'connect wallet'));
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please install MetaMask');
    }
  };

  // Handle security warning acceptance
  const handleSecurityAccept = () => {
    setHasAcceptedSecurity(true);
    setFirstTimeUser(false);
    setShowSecurityWarning(false);
    localStorage.setItem('monad-escrow-security-accepted', 'true');
    
    // Continue with wallet connection
    connectWallet();
  };

  const handleSecurityDecline = () => {
    setShowSecurityWarning(false);
    // Don't connect wallet if user declines
  };

  // Load user's escrows with retry logic
  const loadUserEscrows = async (escrowContract, userAddress, maxRetries = 3) => {
    let retries = 0;
    setLoadingEscrows(true);
    
    while (retries < maxRetries) {
      try {
        // Add a small delay to ensure contract is properly initialized
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // First check if contract is properly initialized
        if (!escrowContract || !escrowContract.getUserEscrows) {
          throw new Error('Contract not properly initialized');
        }
        
        // Verify the contract has the function we need
        const escrowIds = await escrowContract.getUserEscrows(userAddress);
        
        const escrowDetails = [];
        for (let i = 0; i < escrowIds.length; i++) {
          try {
            const escrowId = escrowIds[i];
            const details = await escrowContract.getEscrow(escrowId);
            
            escrowDetails.push({
              id: escrowId,
              buyer: details[0],
              seller: details[1],
              arbiter: details[2],
              amount: ethers.formatEther(details[3]),
              fundsDisbursed: details[4],
              disputeRaised: details[5]
            });
          } catch (innerError) {
            console.warn(`Error loading escrow ${escrowIds[i]}:`, innerError);
            // Continue with other escrows even if one fails
          }
        }
        
        setEscrows(escrowDetails);
        setLoadingEscrows(false);
        return; // Success, exit the retry loop
        
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed loading escrows:`, error);
        retries++;
        
        if (retries >= maxRetries) {
          setLoadingEscrows(false);
          // Only show error after all retries failed
          if (error.message.includes('missing revert data')) {
            setError('Unable to load escrows. Please ensure you are connected to the correct network and the contract is deployed. Try refreshing the page.');
          } else {
            setError('Failed to load escrows: ' + error.message);
          }
        }
      }
    }
  };
  
  // Load escrows where user is arbiter with retry logic
  const loadArbitratedEscrows = async (escrowContract, arbiterAddress, maxRetries = 3) => {
    let retries = 0;
    setLoadingArbitratedEscrows(true);
    
    while (retries < maxRetries) {
      try {
        // Add a small delay to ensure contract is properly initialized
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // First check if contract is properly initialized
        if (!escrowContract || !escrowContract.getEscrowCount) {
          throw new Error('Contract not properly initialized');
        }
        
        // Get total escrow count
        const escrowCount = await escrowContract.getEscrowCount();
        
        const arbitratedEscrows = [];
        
        // This is a simple approach - in a production app you might want to use events or indexing
        for (let i = 0; i < escrowCount; i++) {
          try {
            const details = await escrowContract.getEscrow(i);
            
            // Check if the user is the arbiter for this escrow
            if (details[2].toLowerCase() === arbiterAddress.toLowerCase()) {
              arbitratedEscrows.push({
                id: i,
                buyer: details[0],
                seller: details[1],
                arbiter: details[2],
                amount: ethers.formatEther(details[3]),
                fundsDisbursed: details[4],
                disputeRaised: details[5]
              });
            }
          } catch (err) {
            // Skip any errors (e.g., if an escrow ID doesn't exist)
            console.warn(`Error fetching escrow #${i}:`, err);
          }
        }
        
        setArbitratedEscrows(arbitratedEscrows);
        setLoadingArbitratedEscrows(false);
        return; // Success, exit the retry loop
        
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed loading arbitrated escrows:`, error);
        retries++;
        
        if (retries >= maxRetries) {
          setLoadingArbitratedEscrows(false);
          // Only show error after all retries failed
          if (error.message.includes('missing revert data')) {
            setError('Unable to load arbitrated escrows. Please ensure you are connected to the correct network and the contract is deployed. Try refreshing the page.');
          } else {
            setError('Failed to load arbitrated escrows: ' + error.message);
          }
        }
      }
    }
  };

  // Create new escrow
  const handleCreateEscrow = async (e) => {
    e.preventDefault();
    
    try {
      // Validate inputs
      validateAddress(sellerAddress, 'Seller address');
      validateAddress(arbiterAddress, 'Arbiter address');
      validateAmount(amount);
      
      // Check that addresses are different
      if (sellerAddress.toLowerCase() === account.toLowerCase()) {
        throw new Error('Seller address cannot be the same as buyer address');
      }
      if (arbiterAddress.toLowerCase() === account.toLowerCase()) {
        throw new Error('Arbiter address cannot be the same as buyer address');
      }
      if (sellerAddress.toLowerCase() === arbiterAddress.toLowerCase()) {
        throw new Error('Seller and arbiter addresses must be different');
      }
      
      setLoading(true);
      setError('');
      
      const amountInWei = ethers.parseEther(amount);
      
      // Use secure transaction execution
      const receipt = await executeTransactionSecurely(
        contract,
        'createEscrow',
        [sellerAddress, arbiterAddress],
        amountInWei
      );
      
      setSuccessMessage(`Escrow created successfully! Transaction hash: ${receipt.hash}`);
      setSellerAddress('');
      setArbiterAddress('');
      setAmount('');
      
      // Reload escrows
      await loadUserEscrows(contract, account);
      await loadArbitratedEscrows(contract, account);
    } catch (error) {
      console.error("Error creating escrow", error);
      setError(handleError(error, 'create escrow'));
    } finally {
      setLoading(false);
    }
  };

  // View escrow details
  const viewEscrowDetails = async (escrowId) => {
    try {
      setLoading(true);
      setError('');
      
      const details = await contract.getEscrow(escrowId);
      const escrow = {
        id: escrowId,
        buyer: details[0],
        seller: details[1],
        arbiter: details[2],
        amount: ethers.formatEther(details[3]),
        fundsDisbursed: details[4],
        disputeRaised: details[5]
      };
      
      setSelectedEscrow(escrow);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error viewing escrow", error);
      setError('Failed to view escrow: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle action on escrow
  const handleEscrowAction = async (action, escrowId, recipient = null) => {
    try {
      setLoading(true);
      setError('');
      
      let receipt;
      
      switch (action) {
        case 'release':
          receipt = await executeTransactionSecurely(contract, 'releaseFunds', [escrowId]);
          break;
        case 'refund':
          receipt = await executeTransactionSecurely(contract, 'refundBuyer', [escrowId]);
          break;
        case 'dispute':
          receipt = await executeTransactionSecurely(contract, 'raiseDispute', [escrowId]);
          break;
        case 'resolve':
          if (!recipient) {
            setError('Recipient address is required to resolve a dispute');
            setLoading(false);
            return;
          }
          validateAddress(recipient, 'Recipient');
          receipt = await executeTransactionSecurely(contract, 'resolveDispute', [escrowId, recipient]);
          break;
        default:
          setError('Invalid action');
          setLoading(false);
          return;
      }
      
      setSuccessMessage(`Action ${action} executed successfully! Transaction hash: ${receipt.hash}`);
      
      // Reload escrows
      await loadUserEscrows(contract, account);
      await loadArbitratedEscrows(contract, account);
      
      // If we were showing a modal for this escrow, refresh its details
      if (selectedEscrow && selectedEscrow.id === escrowId) {
        viewEscrowDetails(escrowId);
      }
    } catch (error) {
      console.error(`Error executing ${action}`, error);
      setError(handleError(error, action));
    } finally {
      setLoading(false);
    }
  };

  // Find escrow by ID
  const handleFindEscrow = async (e) => {
    e.preventDefault();
    
    if (!escrowIdToView) {
      setError('Please enter an escrow ID');
      return;
    }
    
    try {
      await viewEscrowDetails(escrowIdToView);
      setEscrowIdToView('');
    } catch (error) {
      console.error("Error finding escrow", error);
      setError('Failed to find escrow: ' + error.message);
    }
  };

  // Effect for handling account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          if (contract) {
            await loadUserEscrows(contract, accounts[0]);
            await loadArbitratedEscrows(contract, accounts[0]);
          }
        } else {
          setConnected(false);
          setAccount('');
        }
      };
      
      const handleChainChanged = () => {
        window.location.reload();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [contract]);

  // Retry loading escrows button
  const retryLoadingEscrows = async () => {
    if (contract && account) {
      await loadUserEscrows(contract, account);
      await loadArbitratedEscrows(contract, account);
    }
  };

  return (
    <div className="app-wrapper">
      <Container className="py-5">
        <div className="app-header">
          <h1>Monad Escrow Service</h1>
          <p>Secure your transactions with smart contract escrow on Monad Testnet</p>
        </div>
        
        {/* Security Warning Modal */}
        <SecurityWarningModal 
          show={showSecurityWarning}
          onAccept={handleSecurityAccept}
          onDecline={handleSecurityDecline}
        />
        
        {!connected ? (
          <div className="connect-wallet-container">
            <SecurityBanner />
            <ContractInfo />
            <p>Connect your wallet to use the escrow service</p>
            <Button 
              className="wallet-button"
              onClick={connectWallet} 
              disabled={loading}
            >
              {loading ? <Spinner animation="border" size="sm" /> : 'Connect Wallet'}
            </Button>
          </div>
        ) : (
          <>
            <div className="wallet-info mb-4">
              <div>
                <small>Connected to: <span className="network-badge">{networkName}</span></small>
                <p className="mb-0"><strong>Account:</strong> {truncateAddress(account)}</p>
              </div>
              <Button variant="outline-secondary" size="sm" onClick={() => window.location.reload()}>
                Disconnect
              </Button>
            </div>
            
            {/* Security Banner */}
            <SecurityBanner />
            
            {/* Network Warning */}
            <NetworkWarning currentNetwork={networkName} />
            
            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible>
                {error}
                {error.includes('refresh') && (
                  <div className="mt-2">
                    <Button variant="danger" size="sm" onClick={retryLoadingEscrows}>
                      Retry Loading
                    </Button>
                  </div>
                )}
              </Alert>
            )}
            
            {successMessage && (
              <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
                {successMessage}
              </Alert>
            )}
            
            <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="create">Create Escrow</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="my">
                  My Escrows
                  {loadingEscrows && <Spinner animation="border" size="sm" className="ms-2" />}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="arbitrated">
                  Arbitrated Escrows
                  {arbitratedEscrows.length > 0 && (
                    <Badge bg="primary" className="ms-2">{arbitratedEscrows.length}</Badge>
                  )}
                  {loadingArbitratedEscrows && <Spinner animation="border" size="sm" className="ms-2" />}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="find">Find Escrow</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="contact">Contact</Nav.Link>
              </Nav.Item>
            </Nav>
            
            {activeTab === 'create' && (
              <Card>
                <Card.Body>
                  <Card.Title>Create New Escrow</Card.Title>
                  <ContractInfo />
                  <Form onSubmit={handleCreateEscrow}>
                    <Form.Group className="mb-3">
                      <Form.Label>Seller Address</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="0x..."
                        value={sellerAddress}
                        onChange={(e) => setSellerAddress(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        The address of the party who will receive the funds
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Arbiter Address</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="0x..."
                        value={arbiterAddress}
                        onChange={(e) => setArbiterAddress(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        A trusted third party who can resolve disputes and refund funds if needed
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label>Amount (MON)</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                      <Form.Text className="text-muted">
                        The amount to place in escrow (Max: 1000 MON)
                      </Form.Text>
                    </Form.Group>
                    
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : 'Create Escrow'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            )}
            
            {activeTab === 'my' && (
              <Card>
                <Card.Body>
                  <Card.Title>My Escrows</Card.Title>
                  {loadingEscrows ? (
                    <div className="text-center my-4">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading escrows...</p>
                    </div>
                  ) : escrows.length === 0 ? (
                    <div className="text-center my-4">
                      <p>You don't have any escrows yet</p>
                      <Button variant="outline-primary" size="sm" onClick={retryLoadingEscrows}>
                        Refresh
                      </Button>
                    </div>
                  ) : (
                    <ListGroup>
                      {escrows.map((escrow) => (
                        <ListGroup.Item 
                          key={escrow.id.toString()} 
                          className="escrow-item"
                        >
                          <div className="escrow-info">
                            <strong>Escrow #{escrow.id.toString()}</strong>
                            <p className="mb-0">Amount: {escrow.amount} MON</p>
                            <div className="escrow-roles">
                              {account.toLowerCase() === escrow.buyer.toLowerCase() && (
                                <span className="role-badge buyer-badge">Buyer</span>
                              )}
                              {account.toLowerCase() === escrow.seller.toLowerCase() && (
                                <span className="role-badge seller-badge">Seller</span>
                              )}
                              {account.toLowerCase() === escrow.arbiter.toLowerCase() && (
                                <span className="role-badge arbiter-badge">Arbiter</span>
                              )}
                            </div>
                            <span 
                              className={`escrow-status ${
                                escrow.fundsDisbursed 
                                  ? 'status-completed' 
                                  : escrow.disputeRaised 
                                    ? 'status-disputed' 
                                    : 'status-active'
                              }`}
                            >
                              {escrow.fundsDisbursed 
                                ? 'Completed' 
                                : escrow.disputeRaised 
                                  ? 'Disputed' 
                                  : 'Active'}
                            </span>
                          </div>
                          <Button 
                            variant="outline-info" 
                            size="sm"
                            onClick={() => viewEscrowDetails(escrow.id)}
                          >
                            View Details
                          </Button>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            )}

            {activeTab === 'arbitrated' && (
              <Card>
                <Card.Body>
                  <Card.Title>Escrows You're Arbitrating</Card.Title>
                  {loadingArbitratedEscrows ? (
                    <div className="text-center my-4">
                      <Spinner animation="border" />
                      <p className="mt-2">Loading arbitrated escrows...</p>
                    </div>
                  ) : arbitratedEscrows.length === 0 ? (
                    <div className="text-center my-4">
                      <p>You're not arbitrating any escrows yet</p>
                      <Button variant="outline-primary" size="sm" onClick={retryLoadingEscrows}>
                        Refresh
                      </Button>
                    </div>
                  ) : (
                    <ListGroup>
                      {arbitratedEscrows.map((escrow) => (
                        <ListGroup.Item 
                          key={escrow.id.toString()} 
                          className="escrow-item arbiter-item"
                        >
                          <div className="escrow-info">
                            <div className="d-flex align-items-center">
                              <strong>Escrow #{escrow.id.toString()}</strong>
                              <span className="role-badge arbiter-badge ms-2">You are the Arbiter</span>
                            </div>
                            <p className="mb-1">Amount: {escrow.amount} MON</p>
                            <p className="mb-1">Buyer: {truncateAddress(escrow.buyer)}</p>
                            <p className="mb-1">Seller: {truncateAddress(escrow.seller)}</p>
                            <span 
                              className={`escrow-status ${
                                escrow.fundsDisbursed 
                                  ? 'status-completed' 
                                  : escrow.disputeRaised 
                                    ? 'status-disputed' 
                                    : 'status-active'
                              }`}
                            >
                              {escrow.fundsDisbursed 
                                ? 'Completed' 
                                : escrow.disputeRaised 
                                  ? 'Disputed' 
                                  : 'Active'}
                            </span>
                          </div>
                          <div className="d-flex flex-column">
                            <Button 
                              variant="outline-info" 
                              size="sm"
                              className="mb-2"
                              onClick={() => viewEscrowDetails(escrow.id)}
                            >
                              View Details
                            </Button>
                            
                            {!escrow.fundsDisbursed && !escrow.disputeRaised && (
                              <Button 
                                variant="outline-warning" 
                                size="sm"
                                onClick={() => handleEscrowAction('refund', escrow.id)}
                                disabled={loading}
                              >
                                Refund Buyer
                              </Button>
                            )}
                          </div>
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            )}
            
            {activeTab === 'find' && (
              <Card>
                <Card.Body>
                  <Card.Title>Find Escrow by ID</Card.Title>
                  <Form onSubmit={handleFindEscrow} className="mb-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Escrow ID</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter escrow ID"
                        value={escrowIdToView}
                        onChange={(e) => setEscrowIdToView(e.target.value)}
                        required
                      />
                    </Form.Group>
                    
                    <Button 
                      variant="primary" 
                      type="submit" 
                      disabled={loading}
                    >
                      {loading ? <Spinner animation="border" size="sm" /> : 'Find Escrow'}
                    </Button>
                  </Form>
                </Card.Body>
              </Card>
            )}
            
            {activeTab === 'contact' && (
              <ContactForm />
            )}
            
            {/* Escrow Details Modal */}
            <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
              <Modal.Header closeButton>
                <Modal.Title>Escrow Details</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                {selectedEscrow && (
                  <>
                    <p><strong>Escrow ID:</strong> {selectedEscrow.id.toString()}</p>
                    
                    <div className="user-role-section mb-3">
                      {account.toLowerCase() === selectedEscrow.buyer.toLowerCase() && (
                        <div className="user-role-indicator">
                          <span className="role-badge buyer-badge">You are the Buyer</span>
                        </div>
                      )}
                      {account.toLowerCase() === selectedEscrow.seller.toLowerCase() && (
                        <div className="user-role-indicator">
                          <span className="role-badge seller-badge">You are the Seller</span>
                        </div>
                      )}
                      {account.toLowerCase() === selectedEscrow.arbiter.toLowerCase() && (
                        <div className="user-role-indicator">
                          <span className="role-badge arbiter-badge">You are the Arbiter</span>
                        </div>
                      )}
                    </div>
                    
                    <p><strong>Buyer:</strong> <span className="address-display">{selectedEscrow.buyer}</span></p>
                    <p><strong>Seller:</strong> <span className="address-display">{selectedEscrow.seller}</span></p>
                    <p><strong>Arbiter:</strong> <span className="address-display">{selectedEscrow.arbiter}</span></p>
                    <p><strong>Amount:</strong> {selectedEscrow.amount} MON</p>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span 
                        className={`escrow-status ${
                          selectedEscrow.fundsDisbursed 
                            ? 'status-completed' 
                            : selectedEscrow.disputeRaised 
                              ? 'status-disputed' 
                              : 'status-active'
                        }`}
                      >
                        {selectedEscrow.fundsDisbursed 
                          ? 'Completed' 
                          : selectedEscrow.disputeRaised 
                            ? 'Disputed' 
                            : 'Active'}
                      </span>
                    </p>
                    
                    {!selectedEscrow.fundsDisbursed && (
                      <div className="mt-4">
                        <h6>Available Actions</h6>
                        
                        {/* Buyer Actions */}
                        {account.toLowerCase() === selectedEscrow.buyer.toLowerCase() && 
                         !selectedEscrow.disputeRaised && (
                          <Button 
                            variant="success" 
                            size="sm" 
                            className="me-2 mb-2" 
                            onClick={() => handleEscrowAction('release', selectedEscrow.id)}
                            disabled={loading}
                          >
                            Release Funds to Seller
                          </Button>
                        )}
                        
                        {/* Seller Actions */}
                        {account.toLowerCase() === selectedEscrow.seller.toLowerCase() && 
                         !selectedEscrow.disputeRaised && (
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="me-2 mb-2" 
                            onClick={() => handleEscrowAction('refund', selectedEscrow.id)}
                            disabled={loading}
                          >
                            Refund Buyer
                          </Button>
                        )}
                        
                        {/* Dispute Actions (Buyer or Seller) */}
                        {(account.toLowerCase() === selectedEscrow.buyer.toLowerCase() || 
                          account.toLowerCase() === selectedEscrow.seller.toLowerCase()) && 
                          !selectedEscrow.disputeRaised && (
                          <Button 
                            variant="danger" 
                            size="sm" 
                            className="me-2 mb-2" 
                            onClick={() => handleEscrowAction('dispute', selectedEscrow.id)}
                            disabled={loading}
                          >
                            Raise Dispute
                          </Button>
                        )}
                        
                        {/* Arbiter Actions */}
                        {account.toLowerCase() === selectedEscrow.arbiter.toLowerCase() && (
                          <div className="arbiter-actions mt-3">
                            <div className="arbiter-notice mb-3">
                              <Alert variant="info">
                                <strong>Arbiter Controls</strong>
                                <p className="mb-0">As the arbiter, you can resolve disputes or refund the buyer if needed.</p>
                              </Alert>
                            </div>
                            
                            {/* Refund Button (always available to arbiter) */}
                            {!selectedEscrow.disputeRaised && !selectedEscrow.fundsDisbursed && (
                              <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-2 mb-2" 
                                onClick={() => handleEscrowAction('refund', selectedEscrow.id)}
                                disabled={loading}
                              >
                                Refund Buyer
                              </Button>
                            )}
                            
                            {/* Dispute Resolution (only if dispute raised) */}
                            {selectedEscrow.disputeRaised && (
                              <div>
                                <Form.Group className="mb-2">
                                  <Form.Label>Resolve dispute in favor of:</Form.Label>
                                  <Form.Select 
                                    onChange={(e) => setRecipientForDispute(e.target.value)}
                                    className="mb-2"
                                  >
                                    <option value="">Select recipient</option>
                                    <option value={selectedEscrow.buyer}>Buyer</option>
                                    <option value={selectedEscrow.seller}>Seller</option>
                                  </Form.Select>
                                </Form.Group>
                                
                                <Button 
                                  variant="primary" 
                                  size="sm" 
                                  onClick={() => handleEscrowAction('resolve', selectedEscrow.id, recipientForDispute)}
                                  disabled={loading || !recipientForDispute}
                                >
                                  Resolve Dispute
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
            
            {/* Footer with creator info */}
            <div className="footer">
              <p>
                Created by <a href={`https://twitter.com/${CREATOR_TWITTER.substring(1)}`} target="_blank" rel="noopener noreferrer">{CREATOR_TWITTER}</a>
              </p>
              <p>
                Creator wallet:{" "}
                <a
                  href={`https://testnet.monadexplorer.com/address/${CREATOR_WALLET}`}
                  onClick={(e) => {
                    e.preventDefault(); // prevent default to control the behavior
                    navigator.clipboard.writeText(CREATOR_WALLET); // copy to clipboard
                    window.open(e.currentTarget.href, "_blank"); // open in new tab
                  }}
                  style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
                  title="Click to open and copy"
                >
                  {CREATOR_WALLET}
                </a>
              </p>
              <p>
                <a href="https://github.com/BluOwn/monadescrow" target="_blank" rel="noopener noreferrer">View on GitHub</a>
              </p>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}

export default App;