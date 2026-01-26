<div align="center">

# Cross-chain Shortcuts Widget

[![NPM Version](https://img.shields.io/npm/v/%40ensofinance%2Fshortcuts-widget)](https://www.npmjs.com/package/%40ensofinance%2Fshortcuts-widget)
[![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/EnsoBuild)](https://twitter.com/EnsoBuild)

</div>

## Overview

The Enso Shortcuts Widget is a React component that provides a seamless interface for cross-chain DeFi operations. Powered by the Enso API, it enables users to perform complex DeFi actions through a simple, intuitive UI without leaving your application.

## Features

- **Token Swaps** - Swap any token to any other token across supported chains
- **Cross-chain Bridging** - Bridge tokens between different blockchain networks
- **DeFi Protocol Integration** - Deposit to and withdraw from various DeFi protocols
- **Zap-in Operations** - Enter complex DeFi positions in a single transaction
- **Token Information** - Display comprehensive token details including balance and USD value
- **Slippage Controls** - Set and manage slippage tolerance for transactions
- **DeFi Composition** - Execute multiple DeFi operations in a single transaction using Enso API

## Installation

To install the widget in your project:

```bash
npm install @ensofinance/shortcuts-widget
```

> **Note:** This package requires `wagmi` and `viem` as peer dependencies. Please ensure these are installed in your project.

## Getting Started

### API Key

To use the widget, you'll need an Enso API key. Visit [https://developers.enso.build](https://developers.enso.build) to get your API key.

### Basic Implementation

```tsx
import React from "react";
import SwapWidget from "@ensofinance/shortcuts-widget";

const App = () => {
    return (
        <div className="app-container">
            <SwapWidget
                apiKey="YOUR_API_KEY"
                // Optional configuration
                enableShare={true}
                adaptive={true}
            />
        </div>
    );
};

export default App;
```

### Advanced Implementation

```tsx
import React, { useState } from "react";
import SwapWidget from "@ensofinance/shortcuts-widget";

const App = () => {
    const [selectedTokens, setSelectedTokens] = useState(null);

    const handleChange = (data) => {
        setSelectedTokens(data);
        console.log("Widget selection changed:", data);
    };

    return (
        <div className="app-container">
            <SwapWidget
                apiKey="YOUR_API_KEY"
                tokenIn="0x1234..." // Specify input token address
                chainId={1} // Ethereum mainnet
                tokenOut="0xabcd..." // Specify output token address
                outChainId={137} // Polygon
                onChange={handleChange}
                enableShare={true}
                indicateRoute={true}
            />
        </div>
    );
};

export default App;
```

## Configuration

### Props

The `SwapWidget` component accepts the following props:

#### Required

- `apiKey` (string): Enso API key

#### Token Selection

- `tokenIn` (string): Token address for the input token
- `tokenOut` (string): Token address for the output token
- `chainId` (number): Chain ID for the input token's blockchain network
- `outChainId` (number): Chain ID for the output token's blockchain network
- `outProject` (string): Limit output token selection to a specific project
- `outProjects` (object): Object containing projects to limit input projects options
- `inProjects` (object): Object containing projects to limit input projects options
- `outTokens` (object): Object containing tokens to limit output token options
- `inTokens` (object): Object containing tokens to limit input token options
- `referralCode` (string): 16 bytes string that enables onchain request tracking

#### UI Configuration

- `themeConfig` (SystemConfig): Customize the widget's appearance
- `enableShare` (boolean): Enable route sharing functionality (copy with button)
- `obligateSelection` (boolean): Force users to select tokens
- `rotateObligated` (boolean | 0 | 1): Display arrow to rotate obligated token selection
- `indicateRoute` (boolean): Show routing information in the UI
- `adaptive` (boolean): Enable adaptive UI behavior based on container size
- `notificationPlacement` (string): Control the placement of notification toasts

#### Event Handlers

- `onChange` (function): Callback triggered when token selections or route change
- `onSuccess` (function): Callback called with amount argument once user perfoms swap action

## Customization

The widget can be customized using the `themeConfig` prop which accepts a `SystemConfig` object from Chakra UI. This allows you to match the widget's appearance to your application's design system.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## Support

For any questions or support, please contact the Enso Finance team:

- [Telegram](https://t.me/Enso_shortcuts)
- [Twitter](https://twitter.com/EnsoBuild)
- [Website](https://enso.build)
