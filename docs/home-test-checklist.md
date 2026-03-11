# Home Test Checklist

This checklist is for the home PC where Electron runtime, WalletConnect, real RPC endpoints, and actual chain behavior can be tested safely.

Use this before announcing `koinara-app` or `koinara.world` publicly.

## Rules

- Do not commit wallet keys, private RPC URLs, or personal filesystem paths
- Only edit local config values on the home PC unless a value is safe to publish
- Keep shared discovery roots writable by your local app and readable by your local node

## 1. Clone and install

1. Clone the repository from GitHub
2. Run a normal install so Electron binaries are downloaded
3. Run verification once before opening the app

```bash
git clone https://github.com/sinmb79/koinara.world-app.git
cd koinara.world-app
npm install
npm run verify
```

Pass criteria:

- `npm install` completes without Electron download failure
- `npm run verify` passes

## 2. Fill real chain config

Edit the correct file for the environment you are testing:

- `config/chain.testnet.json`
- `config/chain.mainnet.json`

For the active Worldland profile, fill:

- `rpcUrl`
- `backupRpcUrls` if available
- `explorerBaseUrl`
- `contracts.registry`
- `contracts.verifier`
- `contracts.rewardDistributor`
- `contracts.token` if used

Do not enable Ethereum or Base profiles yet unless protocol deployment is actually ready there.

Pass criteria:

- Worldland active profile has real RPC and contract addresses
- Ethereum/Base staged profiles remain disabled unless intentionally testing rollout

## 3. Prepare local node and shared discovery root

1. Clone and install `Koinara-node` on the same home PC
2. Configure it against the same Worldland deployment
3. Choose a writable shared root for both app and node

Expected layout:

```text
shared-root/
  jobs/
  receipts/
  results/
```

Pass criteria:

- App can write `jobs/<requestHash>.json`
- Node can read the shared root without path or permission issues

## 4. Desktop app launch

Run the Electron app locally.

```bash
npm run dev --workspace app
```

Or use the packaged build flow you prefer after `npm run build`.

Pass criteria:

- Electron window opens
- Submit, Status, Result, and History pages load
- No blank screen or preload bridge error

## 5. Built-in wallet test

Test the built-in wallet vault flow:

1. Save a disposable test private key
2. Unlock it with the chosen passphrase
3. Lock it
4. Unlock again
5. Delete it

Pass criteria:

- Save succeeds
- Unlock succeeds with correct passphrase
- Wrong passphrase fails cleanly
- Lock removes unlocked state
- Delete removes vault state

## 6. WalletConnect test

1. Add `VITE_WALLETCONNECT_PROJECT_ID` locally if needed
2. Connect a test wallet using WalletConnect v2
3. Verify it connects to the selected Worldland profile
4. Change the app network profile and confirm WalletConnect asks to reconnect

Pass criteria:

- WalletConnect session opens
- Address appears in the app
- Wrong or missing project id gives a recoverable error
- Network switch does not silently reuse the old session incorrectly

## 7. Payment profile UI test

On the Submit page, verify the staged multi-network behavior:

- `Worldland` profile is selectable and enabled
- `Ethereum` and `Base` profiles appear but are disabled
- Disabled profiles explain why they are unavailable
- Token options change with the selected network

Current expectation:

- Worldland default token is active
- ERC20 paths such as `WL`, `KOIN`, `USDC`, and `USDT` remain disabled until their real payment rails exist

Pass criteria:

- UI shows network-first selection
- Disabled profiles and tokens are visible with clear reasons
- Submit button is disabled on staged networks

## 8. Simple job submission

Submit a short `Simple` text prompt on Worldland.

Steps:

1. Select the active Worldland profile
2. Choose the shared discovery root
3. Connect WalletConnect or unlock the built-in wallet
4. Enter a short prompt
5. Submit

Pass criteria:

- App writes `jobs/<requestHash>.json`
- `createJob` transaction is signed and broadcast
- Job appears in Status and History
- Session survives app restart

## 9. General job submission

Submit a slightly longer `General` prompt.

Pass criteria:

- Recommended type becomes `General`
- Quote updates correctly
- Submission succeeds the same way as `Simple`

## 10. Collective gating

Enter a large enough prompt to trigger `Collective` recommendation.

Pass criteria:

- UI shows `Collective` or roadmap messaging
- Submit button is disabled
- No accidental fallback submission is sent as a normal job

## 11. Result and proof flow

For at least one successful job, verify the full completion path.

Pass criteria:

- Node writes receipt and result artifacts
- App reads the result from the shared root
- Result page shows output
- Proof viewer shows:
  - job id
  - block number
  - provider
  - approvals and quorum
  - verifier wallets
  - explorer link

## 12. Refund flow

Test at least one refund path:

- `Rejected`
- `Expired`
- `Open` job after deadline, then `Mark expired`

Pass criteria:

- Correct CTA appears for the current state
- Refund transaction succeeds only when allowed
- User sees a recoverable message rather than an unexplained revert

## 13. Site local review

Run the static site locally.

```bash
npm run dev --workspace site
```

Check:

- `/`
- `/download`
- `/docs`
- `/network`

Pass criteria:

- All routes load
- Home shows rollout cards for Worldland, Ethereum, Base
- Network page allows profile switching
- Disabled profiles show explicit empty state instead of fake data

## 14. Production site review on koinara.world

After deploy, verify:

- `https://koinara.world`
- `https://www.koinara.world`
- `https://koinara.world/download`
- `https://koinara.world/docs`
- `https://koinara.world/network`

Pass criteria:

- SSL certificate is valid
- One hostname redirects to the canonical hostname
- Refreshing deep links does not 404
- Release links open the intended GitHub repos

## 15. Final acceptance

Call the build acceptable only when all of these are true:

- Worldland app submission works end-to-end
- Shared discovery interoperability with `Koinara-node` is confirmed
- Result or refund path completes without backend services
- On-chain proof is visible in the app
- Site is reachable on `koinara.world`
- Staged Ethereum/Base profiles are visible but do not mislead users into thinking they are already live

## Known warnings

These are currently non-blocking unless they affect real behavior on the home PC:

- WalletConnect bundle may show a Vite `crypto` externalization warning during web builds
- React Router future warnings may appear during tests

If either turns into a runtime issue on the home PC, treat it as a release blocker and fix before public launch.
