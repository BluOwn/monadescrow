// src/components/SearchAndFilter.tsx
import React from 'react';
import { Form, InputGroup } from 'react-bootstrap';

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: string;
  onFilterChange: (status: string) => void;
  sortBy: 'date' | 'amount' | 'status';
  onSortChange: (sort: 'date' | 'amount' | 'status') => void;
}

const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  sortBy,
  onSortChange
}) => {
  const statusOptions = [
    { value: 'all', label: 'All Statuses', icon: '📋' },
    { value: 'pending', label: 'Pending', icon: '⏳' },
    { value: 'funded', label: 'Funded', icon: '💰' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'disputed', label: 'Disputed', icon: '⚠️' },
    { value: 'resolved', label: 'Resolved', icon: '🔨' }
  ];

  const sortOptions = [
    { value: 'date', label: 'Date Created', icon: '📅' },
    { value: 'amount', label: 'Amount', icon: '💵' },
    { value: 'status', label: 'Status', icon: '📊' }
  ];

  return (
    <div className="search-filter-container">
      {/* Search Input */}
      <div className="search-input">
        <Form.Control
          type="text"
          placeholder="Search escrows by ID or description..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-field"
        />
      </div>

      {/* Status Filter */}
      <div className="filter-group">
        <Form.Label className="filter-label">Filter by Status</Form.Label>
        <Form.Select
          value={filterStatus}
          onChange={(e) => onFilterChange(e.target.value)}
          className="filter-select"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </Form.Select>
      </div>

      {/* Sort By */}
      <div className="sort-group">
        <Form.Label className="filter-label">Sort by</Form.Label>
        <Form.Select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value as 'date' | 'amount' | 'status')}
          className="filter-select"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </Form.Select>
      </div>
    </div>
  );
};

export default SearchAndFilter;