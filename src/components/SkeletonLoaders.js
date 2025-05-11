import React from 'react';
import { Card, Placeholder } from 'react-bootstrap';

export const EscrowCardSkeleton = () => {
  return (
    <Card className="mb-3">
      <Card.Header>
        <Placeholder as={Card.Title} animation="glow">
          <Placeholder xs={6} />
        </Placeholder>
      </Card.Header>
      <Card.Body>
        <Placeholder as={Card.Text} animation="glow">
          <Placeholder xs={7} /> <Placeholder xs={4} /> <Placeholder xs={4} />{' '}
          <Placeholder xs={6} /> <Placeholder xs={8} />
        </Placeholder>
      </Card.Body>
      <Card.Footer>
        <Placeholder.Button variant="primary" xs={4} />
      </Card.Footer>
    </Card>
  );
};

export const EscrowDetailsSkeleton = () => {
  return (
    <div className="escrow-details-skeleton">
      <Placeholder as="p" animation="glow">
        <Placeholder xs={4} className="mb-3" />
      </Placeholder>
      
      <div className="user-role-section mb-3">
        <Placeholder as="p" animation="glow">
          <Placeholder xs={3} className="mb-2" />
        </Placeholder>
      </div>
      
      <Placeholder as="p" animation="glow">
        <Placeholder xs={7} className="mb-2" />
      </Placeholder>
      <Placeholder as="p" animation="glow">
        <Placeholder xs={7} className="mb-2" />
      </Placeholder>
      <Placeholder as="p" animation="glow">
        <Placeholder xs={7} className="mb-2" />
      </Placeholder>
      <Placeholder as="p" animation="glow">
        <Placeholder xs={4} className="mb-2" />
      </Placeholder>
      <Placeholder as="p" animation="glow">
        <Placeholder xs={3} />
      </Placeholder>
      
      <div className="mt-4">
        <Placeholder as="h6" animation="glow">
          <Placeholder xs={4} />
        </Placeholder>
        <Placeholder.Button variant="primary" xs={4} className="me-2" />
        <Placeholder.Button variant="secondary" xs={4} />
      </div>
    </div>
  );
};

// For the wallet info section
export const WalletInfoSkeleton = () => {
  return (
    <div className="wallet-info mb-4">
      <div>
        <Placeholder as="small" animation="glow">
          <Placeholder xs={4} />
        </Placeholder>
        <Placeholder as="p" animation="glow" className="mb-0">
          <Placeholder xs={6} />
        </Placeholder>
      </div>
      <Placeholder.Button variant="outline-secondary" xs={2} />
    </div>
  );
};

// For the create escrow form
export const CreateEscrowFormSkeleton = () => {
  return (
    <Card>
      <Card.Body>
        <Placeholder as={Card.Title} animation="glow">
          <Placeholder xs={4} />
        </Placeholder>
        
        <div className="my-3">
          <Placeholder as="p" animation="glow">
            <Placeholder xs={7} /> <Placeholder xs={4} /> <Placeholder xs={6} />
          </Placeholder>
        </div>
        
        {/* Form fields */}
        <div className="mb-3">
          <Placeholder as="label" animation="glow" className="d-block mb-2">
            <Placeholder xs={3} />
          </Placeholder>
          <Placeholder as="div" animation="glow" className="form-control-placeholder">
            <Placeholder xs={12} style={{ height: '38px' }} />
          </Placeholder>
          <Placeholder as="small" animation="glow" className="d-block mt-1">
            <Placeholder xs={5} />
          </Placeholder>
        </div>
        
        <div className="mb-3">
          <Placeholder as="label" animation="glow" className="d-block mb-2">
            <Placeholder xs={3} />
          </Placeholder>
          <Placeholder as="div" animation="glow" className="form-control-placeholder">
            <Placeholder xs={12} style={{ height: '38px' }} />
          </Placeholder>
          <Placeholder as="small" animation="glow" className="d-block mt-1">
            <Placeholder xs={5} />
          </Placeholder>
        </div>
        
        <div className="mb-3">
          <Placeholder as="label" animation="glow" className="d-block mb-2">
            <Placeholder xs={3} />
          </Placeholder>
          <Placeholder as="div" animation="glow" className="form-control-placeholder">
            <Placeholder xs={12} style={{ height: '38px' }} />
          </Placeholder>
          <Placeholder as="small" animation="glow" className="d-block mt-1">
            <Placeholder xs={5} />
          </Placeholder>
        </div>
        
        <Placeholder.Button variant="primary" xs={3} />
      </Card.Body>
    </Card>
  );
};