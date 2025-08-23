// src/components/index.ts - Simple barrel exports for existing components

// Enhanced Navigation
export { default as EnhancedNavPills } from './EnhancedNavPills';

// Escrow Components  
export { default as EnhancedEscrowCard } from './EnhancedEscrowCard';
export { default as EscrowDashboard } from './EscrowDashboard';
export { default as EscrowStats } from './EscrowStats';

// Search and Filter
export { default as SearchAndFilter } from './SearchAndFilter';

// Activity Feed
export { ActivityFeed, default as ActivityFeedDefault } from './ActivityFeed';

// Security Components
export {
  ContractInfo,
  SecurityWarningModal,
  SecurityBanner,
  NetworkWarning
} from './SecurityComponents';

// Only include existing components from your project
export { default as ThemeToggle } from './ThemeToggle';
export { default as DarkModeWrapper } from './DarkModeWrapper';
export { default as LoadingIndicator } from './LoadingIndicator';
export { default as AddressDisplay } from './AddressDisplay';
export { default as CustomNavPills } from './CustomNavPills';
export { default as CustomAlert } from './CustomAlert';
export { default as RateLimitAlert } from './RateLimitAlert';

// Skeleton Loaders (only existing ones)
export {
  WalletInfoSkeleton,
  EscrowDetailsSkeleton
} from './SkeletonLoaders';