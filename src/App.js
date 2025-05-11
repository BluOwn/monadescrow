import React, { Suspense, lazy, useState, useEffect, useCallback, useContext } from 'react';
import { ethers } from 'ethers';
import { Button, Card, Container, Form, Nav, Spinner, Alert, Modal, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import theme context
import { ThemeContext } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import DarkModeWrapper from './components/DarkModeWrapper';

// Import enhanced components
import LoadingIndicator from './components/LoadingIndicator';
import AddressDisplay from './components/AddressDisplay';
import { 
  WalletInfoSkeleton,
  CreateEscrowFormSkeleton,
  EscrowDetailsSkeleton 
} from './components/SkeletonLoaders';

// Import network and caching utilities
import { 
  delayBetweenCalls, 
  processBatches, 
  isRateLimitError 
} from './utils/networkUtils';
import { 
  getAndCacheEscrow, 
  invalidateEscrowCache 
} from './utils/cacheUtils';
import RateLimitAlert from './components/RateLimitAlert';

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

// Lazy load tab components
const CreateEscrowTab = lazy(() => import('./components/CreateEscrowTab'));
const MyEscrowsTab = lazy(() => import('./components/MyEscrowsTab'));
const ArbitratedEscrowsTab = lazy(() => import('./components/ArbitratedEscrowsTab'));
const FindEscrowTab = lazy(() => import('./components/FindEscrowTab'));
const ContactForm = lazy(() => import('./components/ContactForm'));
const EscrowDetails = lazy(() => import('./components/EscrowDetails'));

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

function App() {
  // Access theme context
  const { darkMode } = useContext(ThemeContext);
  
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
  
  // Rate limiting states
  const [rateLimited, setRateLimited] = useState(false);
  const [autoRetry, setAutoRetry] = useState({
    active: false,
    countdown: 0,
    progress: 0
  });

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
  
  // Handle RPC error with rate limit detection
  const handleRpcError = (error, operation = 'operation') => {
    console.error(`Error during ${operation}:`, error);
    
    if (isRateLimitError(error)) {
      setRateLimited(true);
      startAutoRetryCountdown();
      return `The network is currently busy. Please wait a moment and try again.`;
    }
    
    return handleError(error, operation);
  };

  // Auto retry countdown function
  const startAutoRetryCountdown = () => {
    const countdownSeconds = 15;
    setAutoRetry({
      active: true,
      countdown: countdownSeconds,
      progress: 0
    });
    
    let secondsLeft = countdownSeconds;
    const intervalId = setInterval(() => {
      secondsLeft -= 1;
      const progress = ((countdownSeconds - secondsLeft) / countdownSeconds) * 100;
      
      if (secondsLeft <= 0) {
        clearInterval(intervalId);
        setAutoRetry({
          active: false,
          countdown: 0,
          progress: 100
        });
        retryLoadingEscrows(); // Auto retry
      } else {
        setAutoRetry({
          active: true,
          countdown: secondsLeft,
          progress
        });
      }
    }, 1000);
  };

 // In App.js, update the loadUserEscrows function
const loadUserEscrows = useCallback(async (escrowContract, userAddress, maxRetries = 3) => {
  let retries = 0;
  setLoadingEscrows(true);
  
  // Show at least a loading UI immediately
  if (escrows.length === 0) {
    // Set empty array to show the "loading" state
    setEscrows([]);
  }
  
  while (retries < maxRetries) {
    try {
      // Add a small delay to ensure contract is properly initialized
      if (retries > 0) {
        await delayBetweenCalls(2000);
      }
      
      // First check if contract is properly initialized
      if (!escrowContract || !escrowContract.getUserEscrows) {
        throw new Error('Contract not properly initialized');
      }
      
      // Get the IDs first
      const escrowIds = await escrowContract.getUserEscrows(userAddress);
      
      // Create a map to avoid duplicates
      const escrowMap = {};
      
      // Immediately show the number of escrows, even before loading details
      if (escrowIds.length > 0) {
        // Create placeholder escrows with just IDs
        const placeholders = escrowIds.map(id => {
          const escrowId = id.toString();
          const placeholder = {
            id: escrowId,
            placeholder: true,
            amount: "Loading...",
            buyer: userAddress,
            seller: "Loading...",
            arbiter: "Loading...",
            fundsDisbursed: false,
            disputeRaised: false
          };
          
          // Store in map to avoid duplicates
          escrowMap[escrowId] = placeholder;
          return placeholder;
        });
        
        // Set these immediately so user sees something
        setEscrows(Object.values(escrowMap));
        
        // Now load details in batches
        const BATCH_SIZE = 3;
        for (let i = 0; i < escrowIds.length; i += BATCH_SIZE) {
          const batch = escrowIds.slice(i, i + BATCH_SIZE);
          
          const batchDetails = await Promise.all(
            batch.map(async (escrowId) => {
              try {
                const fullEscrow = await getAndCacheEscrow(escrowContract, escrowId, ethers);
                // Update the map with the full data
                escrowMap[fullEscrow.id.toString()] = fullEscrow;
                return fullEscrow;
              } catch (err) {
                console.warn(`Error loading escrow ${escrowId}:`, err);
                // Return a placeholder for failed items with error flag
                const errorEscrow = {
                  id: escrowId.toString(),
                  error: true,
                  amount: "Error",
                  buyer: userAddress,
                  seller: "Error loading data",
                  arbiter: "Error loading data",
                  fundsDisbursed: false,
                  disputeRaised: false
                };
                escrowMap[escrowId.toString()] = errorEscrow;
                return errorEscrow;
              }
            })
          );
          
          // Update escrows with the complete map (removes duplicates)
          setEscrows(Object.values(escrowMap));
          
          // Add delay between batches
          if (i + BATCH_SIZE < escrowIds.length) {
            await delayBetweenCalls(1000);
          }
        }
      } else {
        // No escrows found
        setEscrows([]);
      }
      
      setLoadingEscrows(false);
      setRateLimited(false);
      return;
      
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed loading escrows:`, error);
      retries++;
      
      // Wait longer between retries
      await delayBetweenCalls(2000 * retries);
      
      if (retries >= maxRetries) {
        setLoadingEscrows(false);
        if (error.message?.includes('missing revert data')) {
          setError('Unable to load escrows. Please ensure you are connected to the correct network and the contract is deployed. Try refreshing the page.');
        } else {
          setError(handleRpcError(error, 'load escrows'));
        }
      }
    }
  }
  }, [escrows.length]);
  
  // In App.js, update the loadArbitratedEscrows function similarly
const loadArbitratedEscrows = useCallback(async (escrowContract, arbiterAddress, maxRetries = 3) => {
  let retries = 0;
  setLoadingArbitratedEscrows(true);
  
  while (retries < maxRetries) {
    try {
      // Add a small delay to ensure contract is properly initialized
      if (retries > 0) {
        await delayBetweenCalls(2000);
      }
      
      // First check if contract is properly initialized
      if (!escrowContract || !escrowContract.getEscrowCount) {
        throw new Error('Contract not properly initialized');
      }
      
      // Get total escrow count (with a limit to prevent too many calls)
      const escrowCount = await escrowContract.getEscrowCount();
      const maxToCheck = Math.min(Number(escrowCount), 25); // Limit how many we check
      
      // Create array of escrow IDs to check
      const escrowsToCheck = Array.from({ length: maxToCheck }, (_, i) => i);
      
      // Create a map to store arbitrated escrows by ID
      const arbitratedMap = {};
      
      // Process escrow details in batches
      const BATCH_SIZE = 3;
      
      for (let i = 0; i < escrowsToCheck.length; i += BATCH_SIZE) {
        const batch = escrowsToCheck.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(async (escrowId) => {
            try {
              const escrow = await getAndCacheEscrow(escrowContract, escrowId, ethers);
              
              // Check if the user is the arbiter for this escrow
              if (escrow.arbiter.toLowerCase() === arbiterAddress.toLowerCase()) {
                // Store in map to ensure uniqueness
                arbitratedMap[escrow.id.toString()] = escrow;
                return escrow;
              }
              return null; // Not an arbiter, don't include
            } catch (err) {
              console.warn(`Error fetching escrow #${escrowId}:`, err);
              return null;
            }
          })
        );
        
        // Update the UI with what we have so far (from the map)
        setArbitratedEscrows(Object.values(arbitratedMap));
        
        // Add delay between batches
        if (i + BATCH_SIZE < escrowsToCheck.length) {
          await delayBetweenCalls(1000);
        }
      }
      
      // Final update to ensure we have the complete set
      setArbitratedEscrows(Object.values(arbitratedMap));
      
      setLoadingArbitratedEscrows(false);
      setRateLimited(false); // Clear rate limited state on success
      return; // Success, exit the retry loop
      
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed loading arbitrated escrows:`, error);
      retries++;
      
      if (retries >= maxRetries) {
        setLoadingArbitratedEscrows(false);
        // Only show error after all retries failed
        if (error.message?.includes('missing revert data')) {
          setError('Unable to load arbitrated escrows. Please ensure you are connected to the correct network and the contract is deployed. Try refreshing the page.');
        } else {
          setError(handleRpcError(error, 'load arbitrated escrows'));
        }
        }
      }
    }
  }, [arbitratedEscrows.length]);

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
          
          // Add delay between operations
          await delayBetweenCalls(500);
          
          const network = await provider.getNetwork();
          const signer = await provider.getSigner();
          
          setProvider(provider);
          setSigner(signer);
          setAccount(accounts[0]);
          setNetworkName('Monad Testnet');
          setConnected(true);
          
          // Add delay between operations
          await delayBetweenCalls(500);
          
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
          await delayBetweenCalls(1000);
          
          // Load user's escrows with retry logic
          await loadUserEscrows(escrowContract, accounts[0]);
          
          // Add delay between the two loading operations
          await delayBetweenCalls(1000);
          
          // Load escrows where user is arbiter with retry logic
          await loadArbitratedEscrows(escrowContract, accounts[0]);
        }
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
        setError(handleRpcError(error, 'connect wallet'));
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please install MetaMask');
    }
  };

  // Prefetch data for tabs
  useEffect(() => {
    // Prefetch data for tabs that aren't active yet
    const prefetchData = async () => {
      if (connected && contract) {
        if (activeTab !== 'my' && escrows.length === 0) {
          // Prefetch my escrows in the background
          loadUserEscrows(contract, account).catch(e => {
            // Silently handle errors
            console.warn('Prefetch failed:', e);
          });
        }
        
        if (activeTab !== 'arbitrated' && arbitratedEscrows.length === 0) {
          // Wait a bit before prefetching arbitrated escrows
          setTimeout(() => {
            loadArbitratedEscrows(contract, account).catch(e => {
              // Silently handle errors
              console.warn('Prefetch failed:', e);
            });
          }, 2000);
        }
      }
    };
    
    // Start prefetching after a short delay
    const timerId = setTimeout(prefetchData, 3000);
    
    return () => clearTimeout(timerId);
  }, [connected, contract, account, activeTab, escrows.length, arbitratedEscrows.length, loadUserEscrows, loadArbitratedEscrows]);

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
      
      // Add delay between operations
      await delayBetweenCalls(1000);
      
      // Reload escrows
      await loadUserEscrows(contract, account);
      
      // Add delay between operations
      await delayBetweenCalls(1000);
      
      await loadArbitratedEscrows(contract, account);
    } catch (error) {
      console.error("Error creating escrow", error);
      setError(handleRpcError(error, 'create escrow'));
    } finally {
      setLoading(false);
    }
  };

  // View escrow details
  const viewEscrowDetails = async (escrowId) => {
    try {
      setLoading(true);
      setError('');
      
      // Try to get from cache or fetch new data
      const escrow = await getAndCacheEscrow(contract, escrowId, ethers);
      
      setSelectedEscrow(escrow);
      setShowDetailsModal(true);
    } catch (error) {
      console.error("Error viewing escrow", error);
      setError(handleRpcError(error, 'view escrow'));
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
      
      // Invalidate cache for this escrow
      invalidateEscrowCache(escrowId);
      
      // Add delay between operations
      await delayBetweenCalls(1000);
      
      // Reload escrows
      await loadUserEscrows(contract, account);
      
      // Add delay between operations
      await delayBetweenCalls(1000);
      
      await loadArbitratedEscrows(contract, account);
      
      // If we were showing a modal for this escrow, refresh its details
      if (selectedEscrow && selectedEscrow.id === escrowId) {
        // Add a small delay before refreshing the details
        await delayBetweenCalls(500);
        viewEscrowDetails(escrowId);
      }
    } catch (error) {
      console.error(`Error executing ${action}`, error);
      setError(handleRpcError(error, action));
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
      setError(handleRpcError(error, 'find escrow'));
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
  }, [contract, loadUserEscrows, loadArbitratedEscrows]);

  // Retry loading escrows button
  const retryLoadingEscrows = async () => {
    if (contract && account) {
      // Clear rate limited state
      setRateLimited(false);
      
      // Reload escrows
      await loadUserEscrows(contract, account);
      
      // Add delay between operations
      await delayBetweenCalls(1000);
      
      await loadArbitratedEscrows(contract, account);
    }
  };

  return (
    <DarkModeWrapper>
      <div className="app-wrapper">
        <Container 
          className="py-5"
          style={{
            backgroundColor: darkMode ? "#1e1e1e" : "white",
            color: darkMode ? "#e1e1e1" : "#2d3436",
            boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}
        >
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
              <div className="d-flex flex-column align-items-center">
                <Button 
                  className="wallet-button mb-3"
                  onClick={connectWallet} 
                  disabled={loading}
                >
                  {loading ? <Spinner animation="border" size="sm" /> : 'Connect Wallet'}
                </Button>
                <ThemeToggle />
              </div>
            </div>
          ) : (
            <>
              {loading ? (
                <WalletInfoSkeleton />
              ) : (
                <div className="wallet-info mb-4">
                  <div>
                    <small>Connected to: <span className="network-badge">{networkName}</span></small>
                    <p className="mb-0"><strong>Account:</strong> <AddressDisplay address={account} /></p>
                  </div>
                  <div className="d-flex">
                    <ThemeToggle />
                    <Button variant="outline-secondary" size="sm" className="ms-2" onClick={() => window.location.reload()}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Security Banner */}
              <SecurityBanner />
              
              {/* Network Warning */}
              <NetworkWarning currentNetwork={networkName} />
              
              {/* Error Alert */}
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
              
              {/* Success Message */}
              {successMessage && (
                <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
                  {successMessage}
                </Alert>
              )}
              
              {/* Rate Limit Alert */}
              {rateLimited && (
                <RateLimitAlert 
                  isVisible={rateLimited}
                  onDismiss={() => setRateLimited(false)}
                  onRetry={retryLoadingEscrows}
                  progress={autoRetry.progress}
                  autoRetryIn={autoRetry.countdown}
                />
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
              
              <Suspense fallback={<LoadingIndicator message="Loading tab content..." />}>
                {activeTab === 'create' && (
                  <CreateEscrowTab 
                    handleCreateEscrow={handleCreateEscrow}
                    sellerAddress={sellerAddress}
                    setSellerAddress={setSellerAddress}
                    arbiterAddress={arbiterAddress}
                    setArbiterAddress={setArbiterAddress}
                    amount={amount}
                    setAmount={setAmount}
                    loading={loading}
                  />
                )}
                
                {activeTab === 'my' && (
                  <MyEscrowsTab 
                    escrows={escrows} 
                    onViewDetails={viewEscrowDetails} 
                    loadingEscrows={loadingEscrows}
                    retryLoadingEscrows={retryLoadingEscrows}
                    account={account}
                    onAction={handleEscrowAction}
                  />
                )}

                {activeTab === 'arbitrated' && (
                  <ArbitratedEscrowsTab 
                    arbitratedEscrows={arbitratedEscrows} 
                    onViewDetails={viewEscrowDetails} 
                    loadingArbitratedEscrows={loadingArbitratedEscrows}
                    retryLoadingEscrows={retryLoadingEscrows}
                    account={account}
                    onAction={handleEscrowAction}
                  />
                )}
                
                {activeTab === 'find' && (
                  <FindEscrowTab 
                    escrowIdToView={escrowIdToView}
                    setEscrowIdToView={setEscrowIdToView}
                    handleFindEscrow={handleFindEscrow}
                    loading={loading}
                  />
                )}
                
                {activeTab === 'contact' && (
                  <ContactForm />
                )}
              </Suspense>
              
              {/* Escrow Details Modal */}
              <Modal 
                show={showDetailsModal} 
                onHide={() => setShowDetailsModal(false)}
                contentClassName={darkMode ? "bg-dark text-light" : ""}
              >
                <Modal.Header closeButton>
                  <Modal.Title>Escrow Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                  <Suspense fallback={<EscrowDetailsSkeleton />}>
                    {selectedEscrow ? (
                      <EscrowDetails
                        escrow={selectedEscrow}
                        account={account}
                        onAction={handleEscrowAction}
                        loading={loading}
                      />
                    ) : (
                      <EscrowDetailsSkeleton />
                    )}
                  </Suspense>
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
    Created by{" "}
    <a
      href={`https://twitter.com/${CREATOR_TWITTER.substring(1)}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {CREATOR_TWITTER}
    </a>
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
      style={{ cursor: "pointer", textDecoration: "underline" }}
      title="Click to open and copy"
    >
      {CREATOR_WALLET}
    </a>
  </p>
  <p>
    <a
      href="https://github.com/BluOwn/monadescrow"
      target="_blank"
      rel="noopener noreferrer"
    >
      View on GitHub
    </a>
  </p>
</div>

            </>
          )}
        </Container>
      </div>
    </DarkModeWrapper>
  );
}

export default App; 