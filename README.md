# Monad Escrow Service

A secure, decentralized escrow application built on Monad Testnet using React, TypeScript, and ethers.js.

![Monad Escrow](https://github.com/BluOwn/monadescrow/blob/main/Screenshot.png)

## 🔍 Overview

The Monad Escrow Service provides a trustless way to conduct transactions between parties by leveraging smart contracts on the Monad blockchain. The application allows users to:

- Create escrow contracts as buyers
- Receive funds as sellers
- Arbitrate disputes as third parties
- View and manage escrow contracts
- Track transaction statuses in real-time

## 🔒 Security Features

- Contract verification before transactions
- Address validation and verification
- Rate limiting protection
- Security notices and warnings
- Network validation
- Secure transaction handling

## 🏗️ Smart Contract

The escrow smart contract is deployed on Monad Testnet at:

```
0x44f703203A65b6b11ea3b4540cC30337F0630927
```

Source code: [GitHub - BluOwn/monadescrow](https://github.com/BluOwn/monadescrow)

## 🚀 Features

- **Wallet Connection**: MetaMask integration with address display and network detection
- **Escrow Creation**: Create new escrow agreements with sellers and arbiters
- **Escrow Management**: View, manage, and take actions on escrows
- **Dispute Resolution**: Raise and resolve disputes through arbiters
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices
- **Loading States**: Skeleton loaders and progress indicators
- **Error Handling**: Comprehensive error handling and user feedback

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Bootstrap 5, React Bootstrap
- **Blockchain**: ethers.js 6, Monad Testnet
- **Build Tool**: Vite 6
- **Testing**: Vitest, React Testing Library
- **Styling**: CSS with dark mode support
- **Linting**: ESLint with TypeScript support

## 📦 Project Structure

```
src/
├── assets/             # Static assets like images
├── components/         # React components
├── constants/          # Contract ABIs and constants
├── contexts/           # React contexts (e.g., ThemeContext)
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
├── index.css           # Global styles
├── App.css             # Component-specific styles
├── FullDarkMode.css    # Dark mode styles
└── Responsive.css      # Responsive design styles
```

## 🔧 Setup and Installation

### Prerequisites

- Node.js 18+ and npm/yarn
- MetaMask browser extension
- Monad Testnet configured in MetaMask

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/BluOwn/monadescrow.git
   cd monadescrow
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```
npm run build
```

The build artifacts will be in the `build` directory.

## 🚨 Using on Testnet

This application is designed for Monad Testnet only. It's not suitable for mainnet usage with real funds. To use the application:

1. Connect your MetaMask wallet
2. Ensure you're on Monad Testnet (Chain ID: 10143)
3. Have some testnet MON in your wallet
4. Create or interact with escrow contracts

## 🗺️ Roadmap

- [ ] Multi-wallet support (WalletConnect)
- [ ] Transaction history
- [ ] Notifications for escrow status changes
- [ ] Time-based escrow release
- [ ] Multi-signature escrow support
- [ ] NFT escrow support

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This is an experimental application on a testnet blockchain. Do not use for production purposes or with real assets. The developers are not responsible for any loss of funds.

## 📧 Contact

Developer: [@Oprimedev](https://twitter.com/Oprimedev)

Project Link: [https://github.com/BluOwn/monadescrowts](https://github.com/BluOwn/monadescrowts)

Project Website: [testnet.monadescrow.xyz](https://testnet.monadescrow.xyz/)