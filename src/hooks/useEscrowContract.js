// src/hooks/useEscrowContract.js
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { ESCROW_SERVICE_ADDRESS } from '../utils/security';
import { verifyContract, executeTransactionSecurely, handleError } from '../utils/security';
import { delayBetweenCalls } from '../utils/networkUtils';

// ABI from App.js
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

export const useEscrowContract = (provider, signer) => {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transaction, setTransaction] = useState(null);

  // Initialize contract
  const initializeContract = useCallback(async () => {
    if (!provider || !signer) return null;
    
    try {
      setLoading(true);
      
      // Verify contract is valid
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
      return escrowContract;
    } catch (error) {
      console.error("Error initializing contract", error);
      setError(handleError(error, 'initialize contract'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [provider, signer]);

  // Create new escrow
  const createEscrow = useCallback(async (sellerAddress, arbiterAddress, amount) => {
    if (!contract) {
      setError('Contract not initialized');
      return null;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const amountInWei = ethers.parseEther(amount);
      
      const receipt = await executeTransactionSecurely(
        contract,
        'createEscrow',
        [sellerAddress, arbiterAddress],
        amountInWei
      );
      
      setTransaction(receipt);
      
      // Add delay after transaction
      await delayBetweenCalls(1000);
      
      return receipt;
    } catch (error) {
      console.error(`Error creating escrow`, error);
      setError(handleError(error, 'create escrow'));
      return null;
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Generic contract transaction method
  const executeContractAction = useCallback(async (action, escrowId, recipient = null) => {
    if (!contract) {
      setError('Contract not initialized');
      return null;
    }
    
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
            throw new Error('Recipient address is required to resolve a dispute');
          }
          receipt = await executeTransactionSecurely(contract, 'resolveDispute', [escrowId, recipient]);
          break;
        default:
          throw new Error('Invalid action');
      }
      
      setTransaction(receipt);
      
      // Add delay after transaction
      await delayBetweenCalls(1000);
      
      return receipt;
    } catch (error) {
      console.error(`Error executing ${action}`, error);
      setError(handleError(error, action));
      return null;
    } finally {
      setLoading(false);
    }
  }, [contract]);
  
  return {
    contract,
    loading,
    error,
    transaction,
    initializeContract,
    createEscrow,
    executeContractAction
  };
};

export default useEscrowContract;