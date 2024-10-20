# OmiSwap: AI-Powered On-Chain Interactions

OmiSwap is the first platform to enable on-chain interactions powered by an AI wearable device. We revolutionize the way users interact with blockchain technology by translating voice intents into on-chain transactions and swaps.

## Key Features

- **Voice-Activated Transactions**: Execute intents using trigger phrases like "start transaction" and "end transaction".
- **Multi-Chain Support**: Integrated with multiple blockchain networks to ensure the highest compatibility.
- **AI-Powered Interaction**: Leveraging cutting-edge AI technology to interpret and execute user intents.
- **Exportable custodial wallets**: We create your wallets for you on every supported chain, but still give you full access to your private keys and you retain the ability to export your wallets at any time

## Technology Stack

- **Frontend**: Next.js with shadcn/ui
- **Authentication**: next-auth
- **Database**: Supabase
- **Blockchain Interactions**:
  - Coinbase
    - Base
    - Polygon
    - Arbitrum
    - Ethereum
  - Ripple (EVM Side Chain)
  - Sui

## How It Works

1. Users wear the Omi wearable device and activate it with voice commands.
2. Our API interprets the user's intent from natural language. For example, "I want to send five bucks to Rohan on Polygon" → `to: Rohan`, `currency: USDC`, `network: polygon`, `amount: 5`
3. OmiSwap translates the intent into specific blockchain operations.
4. Transactions are executed on the chosen blockchain network.
5. Users receive confirmation of their completed actions in a beautiful, easy to understand UI.

## Why OmiSwap?

OmiSwap stands out by offering:

- **Seamless User Experience**: No need for complex interfaces or deep technical knowledge.
- **Cross-Chain Flexibility**: Execute transactions across different networks effortlessly just by saying so.
- **Innovative Interaction**: Pioneering the use of AI wearables for blockchain interactions.

Join us in shaping the future of decentralized finance with OmiSwap - where your ~~wish~~ _intent_ is your command!
