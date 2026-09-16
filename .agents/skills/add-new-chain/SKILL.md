---
name: add-new-chain
description: Add or review EVM chain support in shortcuts-widget and its demo wallet configuration. Use for a new network rollout, chain metadata or native-token fixes, and the associated developer PR summary.
---

# Add New Chain

Implement the widget side of an Enso chain rollout. Keep backend deployments, bridge
availability, package publication, and widget configuration as separate facts.

## Establish the inputs

- Read the repository instructions, then inspect the latest chain-add commit and current
  consumers. Robinhood `272d418` is the minimal precedent: widget constants plus demo providers.
- For a shared rollout, inspect the relevant sibling worktrees and their published/deployed
  state. Locate related repositories from the rollout ticket and existing checkout paths.
  Verify important claims in source and live APIs.
- Verify the decimal chain ID, display name, public RPC (`eth_chainId`), explorer, chain icon,
  native symbol/decimals, and native sentinel policy. Distinguish mainnet from testnet.
- Check the target Enso API's `/api/v1/networks` and token metadata before calling the chain
  production-ready. Provider announcements and historical rollout notes can become stale.
- Install the locked dependencies in a new worktree with `pnpm install --frozen-lockfile`.

## Implement the two configuration surfaces

| Location | Required change |
| --- | --- |
| `widget/src/constants.ts` | Add `SupportedChainId`, `GECKO_CHAIN_NAMES`, `STARGATE_CHAIN_NAMES`, and `CHAINS_ETHERSCAN` entries. Add native-token metadata or explicitly classify the chain as having no routable native token. |
| `app/src/components/Providers.tsx` | Add the chain to `getDefaultConfig().chains`, including native currency, public RPC, explorer, and icon. Reuse an installed chain definition when available; otherwise follow the existing custom-chain pattern. |

`ChainSelector` intersects the consumer's wallet chains with `SupportedChainId`. The demo
provider change enables the demo; embedding applications must also configure the chain in
their own wallet provider. The library does not configure the host wallet for them.

`GECKO_CHAIN_NAMES` is also used for display names. `STARGATE_CHAIN_NAMES` builds icon URLs;
its presence does not assert that Stargate can bridge the chain. Verify the actual SVG, and
use `CHAIN_ICON_OVERRIDES` only when necessary.

## Respect the native-asset model

- `ETH_ADDRESS` is the shared `0xeeee…` native sentinel, even when the currency is not ETH.
  Set `CHAINS_NATIVE_TOKENS` to the correct symbol, logo, and native decimals; wallet fees,
  token metadata fallbacks, and amount normalization depend on it.
- `CHAINS_WITHOUT_NATIVE` is for chains without a routable native asset (Tempo). Do not add a
  chain merely because its gas currency is a stablecoin.
- Arc (`5042`) exposes one USDC balance as native `0xeeee…` with **18** decimals and ERC-20
  `0x3600000000000000000000000000000000000000` with **6** decimals. Keep native routing enabled.
  Do not invent a wrapper or swap between these views; same-chain conversions to the sender
  are rejected by the backend. Do not sum their balances as independent assets.
- Follow `widget/src/util/common.tsx` for token-list loading and `util/enso.tsx` for API
  fallback metadata and route eligibility. Probe the current CoinGecko and 1inch lists;
  verify returned chain IDs and token decimals. Use a custom list only if the existing
  sources cannot supply the required tokens, and keep it scoped to that chain.

## Verify and summarize

```bash
pnpm --filter @ensofinance/shortcuts-widget exec tsc --noEmit
pnpm build:widget
pnpm build:app
git diff --check
```

Build the widget before the demo: the workspace package exports its `dist` bundle. Use
available lint commands when configured; a script name alone does not mean its config exists.
For failures, compare against the starting revision before changing unrelated code.

Smoke-check the source/destination chain selectors, icon, native-token amount units, explorer
links, and wallet chain configuration. For API checks, use the intended environment and an
authorized API key; never copy secrets into source or a PR. A quote/transaction build is not
an executed transaction or an independent simulator result. Report what was actually tested.

Use [assets/pr-body.md](assets/pr-body.md) for a short developer-focused summary: behavior,
non-obvious native-asset details, checks, and any remaining manual validation. Leave release
or browser checks open unless performed. Follow the repository's release policy; do not infer
publication from adding a chain.

## Maintain the skill

Edit `.agents/skills/add-new-chain/`. Codex discovers this canonical directory;
`.claude/skills/add-new-chain/SKILL.md` directs Claude to the same instructions. If the
skill name or description changes, update the Claude entry point too. Keep workflow
instructions independent of the model and tool host.
