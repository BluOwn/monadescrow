import React, { useState, useEffect } from 'react';
import { Button, ListGroup, Spinner } from 'react-bootstrap';
import { EscrowCardSkeleton } from './SkeletonLoaders';

const EscrowList = ({ 
  escrows, 
  onViewDetails, 
  loadingEscrows, 
  retryLoadingEscrows,
  account,
  onAction
}) => {
  const [displayedEscrows, setDisplayedEscrows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 5;

  useEffect(() => {
    if (escrows.length > 0) {
      // Remove duplicates
      const uniqueEscrows = removeDuplicates(escrows);
      
      // Initial load of first page
      setDisplayedEscrows(uniqueEscrows.slice(0, PAGE_SIZE));
      setHasMore(uniqueEscrows.length > PAGE_SIZE);
    } else {
      setDisplayedEscrows([]);
      setHasMore(false);
    }
    setPage(1);
  }, [escrows]);

  // Function to remove duplicate escrows based on ID
  const removeDuplicates = (escrowArray) => {
    const seen = {};
    return escrowArray.filter(escrow => {
      const id = escrow.id.toString();
      
      // If we've already seen a non-placeholder version of this escrow, use it
      if (seen[id] && !seen[id].placeholder && escrow.placeholder) {
        return false; // Skip this placeholder
      }
      
      // If we're seeing a non-placeholder but have seen a placeholder, replace it
      if (seen[id] && seen[id].placeholder && !escrow.placeholder) {
        seen[id] = escrow; // Update with the non-placeholder version
        return true;
      }
      
      // First time seeing this ID
      if (!seen[id]) {
        seen[id] = escrow;
        return true;
      }
      
      // Default - skip duplicates
      return false;
    });
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const uniqueEscrows = removeDuplicates(escrows);
    const nextEscrows = uniqueEscrows.slice(0, nextPage * PAGE_SIZE);
    setDisplayedEscrows(nextEscrows);
    setPage(nextPage);
    setHasMore(nextEscrows.length < uniqueEscrows.length);
  };

  if (loadingEscrows && escrows.length === 0) {
    return (
      <div>
        {[...Array(3)].map((_, i) => (
          <EscrowCardSkeleton key={`skeleton-${i}`} />
        ))}
      </div>
    );
  }

  if (escrows.length === 0) {
    return (
      <div className="text-center my-4">
        <p>You don't have any escrows yet</p>
        <Button variant="outline-primary" size="sm" onClick={retryLoadingEscrows}>
          Refresh
        </Button>
      </div>
    );
  }

  // Ensure the displayed escrows don't have duplicates
  const escrowsToShow = removeDuplicates(displayedEscrows);

  return (
    <div>
      <ListGroup>
        {escrowsToShow.map((escrow, index) => (
          <ListGroup.Item 
            key={`escrow-${escrow.id.toString()}-${index}`}
            className={`escrow-item ${escrow.placeholder ? 'loading' : ''}`}
          >
            <div className="escrow-info">
              <strong>Escrow #{escrow.id.toString()}</strong>
              <p className="mb-0">
                Amount: {escrow.placeholder ? (
                  <Spinner animation="border" size="sm" className="ms-1" />
                ) : escrow.amount + " MON"}
              </p>
              <div className="escrow-roles">
                {account.toLowerCase() === escrow.buyer?.toLowerCase() && (
                  <span className="role-badge buyer-badge">Buyer</span>
                )}
                {account.toLowerCase() === escrow.seller?.toLowerCase() && (
                  <span className="role-badge seller-badge">Seller</span>
                )}
                {account.toLowerCase() === escrow.arbiter?.toLowerCase() && (
                  <span className="role-badge arbiter-badge">Arbiter</span>
                )}
              </div>
              {!escrow.placeholder && (
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
              )}
            </div>
            <Button 
              variant="outline-info" 
              size="sm"
              onClick={() => onViewDetails(escrow.id)}
              disabled={escrow.placeholder}
            >
              {escrow.placeholder ? 'Loading...' : 'View Details'}
            </Button>
          </ListGroup.Item>
        ))}
      </ListGroup>
      
      {hasMore && (
        <div className="text-center mt-3">
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={loadMore}
          >
            Load More ({escrows.length - displayedEscrows.length} remaining)
          </Button>
        </div>
      )}
    </div>
  );
};

export default EscrowList;