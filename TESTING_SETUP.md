# Testing Setup Guide

Step-by-step instructions for setting up local testing with Ganache.

## Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **bun**
- **Ganache CLI**: `npm install -g ganache`

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start Ganache

```bash
ganache --port 7545 --networkId 1337 --mnemonic "twin shadow palm spy donor slight muscle obtain during gentle smart cushion"
```

Leave this terminal running.

## Step 3: Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

The default values in `.env.example` are already configured for local testing. Leave contract addresses empty for now.

## Step 4: Deploy Smart Contracts

Open a new terminal and run:

```bash
npx hardhat run scripts/deploy.cjs --network ganache
```

Copy the deployed contract addresses from the output and update your `.env.local`:

```env
NEXT_PUBLIC_DAO_TOKEN_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS=0x...
NEXT_PUBLIC_GOVERNANCE_DAO_ADDRESS-0x...
```

## Step 5: Run Tests

```bash
npx hardhat test
```

## Step 6: Connect MetaMask to Ganache

1. **Open MetaMask** browser extension
2. **Add a custom network**:

   - Click on the network dropdown (top left)
   - Click "Add Network" → "Add a network manually"
   - Fill in the details:
     - **Network Name**: `Ganache Local`
     - **RPC URL**: `http://127.0.0.1:7545`
     - **Chain ID**: `1337`
     - **Currency Symbol**: `ETH`
   - Click "Save"

3. **Import a Ganache account**:
   - In MetaMask, click on the account icon (top right)
   - Click "Import Account"
   - Select "Private Key"
   - Go to your Ganache terminal output and copy one of the private keys
   - Paste it in MetaMask and click "Import"

You should now see 100 ETH in your imported account.

## Step 7: Start the Development Server

```bash
npm run dev
```

The application will be available at http://localhost:3000

## Troubleshooting

### "Error: connect ECONNREFUSED 127.0.0.1:7545"

Make sure Ganache is running on port 7545.

### "Nonce too high" or "Nonce has already been used"

Restart Ganache and redeploy contracts.

### Contracts need redeployment

Restart Ganache (this resets the blockchain) and run the deploy script again.
