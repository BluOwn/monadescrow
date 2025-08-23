import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';

interface FloatingActionButtonProps {
  onClick: () => void;
  icon: string;
  tooltip: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  tooltip
}) => (
  <OverlayTrigger
    placement="left"
    overlay={<Tooltip id="fab-tooltip">{tooltip}</Tooltip>}
  >
    <button className="floating-action-button" onClick={onClick}>
      {icon}
    </button>
  </OverlayTrigger>
);