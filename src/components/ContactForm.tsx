// src/components/ContactForm.tsx
import React, { useState } from 'react';
import { Form, Button, Alert, Card } from 'react-bootstrap';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Create mailto URL with form data
      const mailtoUrl = `mailto:oprime@fosta.xyz?subject=${encodeURIComponent(formData.subject)}&body=${encodeURIComponent(
        `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      )}`;
      
      // Open email client
      window.open(mailtoUrl);
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
      
      setSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 5000);
      
    } catch (error) {
      setError('Failed to open email client. Please try again or contact us directly at oprime@fosta.xyz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Contact Us</Card.Title>
        <p className="text-muted mb-4">
          Have questions about Monad Escrow? Need help with a transaction? Get in touch!
        </p>
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(false)} dismissible>
            Message prepared! Please send it from your email client.
          </Alert>
        )}
        
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Your Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Your Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Subject</Form.Label>
            <Form.Control
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="What is this regarding?"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Please describe your question or issue..."
              required
            />
          </Form.Group>
          
          <div className="d-grid">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Preparing...' : 'Send Message'}
            </Button>
          </div>
          
          <div className="mt-3 text-center">
            <small className="text-muted">
              Or email us directly at: <a href="mailto:oprime@fosta.xyz">oprime@fosta.xyz</a>
            </small>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ContactForm;