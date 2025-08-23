import React from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

interface TrustIndicatorsProps {
  contractAddress: string;
}

export const TrustIndicators: React.FC<TrustIndicatorsProps> = ({
  contractAddress
}) => (
  <div className="trust-indicators d-flex align-items-center gap-2">
    <OverlayTrigger
      placement="bottom"
      overlay={<Tooltip id="verified-tooltip">Contract verified on Monad Explorer</Tooltip>}
    >
      <Badge bg="success" className="d-flex align-items-center gap-1">
        <span>🛡️</span>
        <span className="d-none d-sm-inline">Verified</span>
      </Badge>
    </OverlayTrigger>
    
    <OverlayTrigger
      placement="bottom"
      overlay={<Tooltip id="opensource-tooltip">Open source on GitHub</Tooltip>}
    >
      <Badge bg="info" className="d-flex align-items-center gap-1">
        <span>📖</span>
        <span className="d-none d-sm-inline">Open Source</span>
      </Badge>
    </OverlayTrigger>
  </div>
);