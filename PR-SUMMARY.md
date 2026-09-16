# feat: add Arc (5042) to the widget

Arc is selectable in the widget demo, with wallet chain configuration, token metadata,
network icon, and explorer links. Follows the Robinhood addition (`272d418`).

- **Widget:** register Arc in the chain, token-list, icon, explorer, and native-token maps.
- **Demo:** configure Arc mainnet RPC and native USDC in the wallet provider.
- **USDC detail:** native `0xeeee…` uses **18 decimals**; ERC-20
  `0x3600000000000000000000000000000000000000` uses **6**. Both expose the same balance.
- **Skill:** add `add-new-chain` for Codex and Claude, with a shared workflow and PR
  template; a small Claude entry point references the canonical instructions.

**Verified:** widget and demo typechecks/builds; formatting and diff checks; skill validation
and the Claude entry point; public RPC chain ID, explorer, icon, and token-list metadata.
Browser smoke with mocked API responses confirmed Arc selection and native/ERC-20 amount
normalization. No wallet transaction was signed or broadcast.

**Integration:** embedding apps must include Arc in their own wallet provider configuration.
The Stargate icon mapping does not assert bridge availability. Package publication and a real
wallet transaction remain release/manual follow-ups.
