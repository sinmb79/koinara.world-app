import { useEffect, useMemo, useState } from "react";
import { buildManifestFromPrompt, buildSubmissionHashes, defaultDeadlineForJobType, recommendJobType } from "../orchestrator/submitJob";
import { JobForm } from "../components/JobForm";
import { PaymentPanel } from "../components/PaymentPanel";
import { WalletPanel } from "../components/WalletPanel";
import { useAppContext } from "../state/AppContext";

export function SubmitPage() {
  const { chainConfig, networks, selectedNetworkId, selectNetwork, submitJob, chooseDiscoveryRoot, lastError, estimateGas, quoteFor } =
    useAppContext();
  const [prompt, setPrompt] = useState("");
  const [discoveryRoot, setDiscoveryRoot] = useState(chainConfig.discoveryDefaults.writableRoot);
  const [selectedToken, setSelectedToken] = useState(chainConfig.payments.defaultTokenId);
  const [gasEstimate, setGasEstimate] = useState<string>();
  const recommended = useMemo(() => recommendJobType(prompt), [prompt]);
  const manifest = useMemo(
    () => (prompt.trim() ? buildManifestFromPrompt({ prompt, contentType: "text/plain" }) : null),
    [prompt]
  );
  const hashes = useMemo(() => (manifest ? buildSubmissionHashes(manifest) : null), [manifest]);
  const resolvedTokenId = useMemo(
    () =>
      chainConfig.payments.supportedTokens.some((token) => token.id === selectedToken)
        ? selectedToken
        : chainConfig.payments.defaultTokenId,
    [chainConfig, selectedToken]
  );
  const selectedQuote = useMemo(
    () => quoteFor(resolvedTokenId, recommended, gasEstimate),
    [gasEstimate, quoteFor, recommended, resolvedTokenId]
  );

  useEffect(() => {
    if (!hashes || recommended === "Collective") {
      setGasEstimate(undefined);
      return;
    }

    const deadline = defaultDeadlineForJobType(recommended);
    void estimateGas(recommended, hashes.requestHash, hashes.schemaHash, deadline).then(setGasEstimate);
  }, [estimateGas, hashes, recommended]);

  useEffect(() => {
    setSelectedToken(chainConfig.payments.defaultTokenId);
    setDiscoveryRoot(chainConfig.discoveryDefaults.writableRoot);
    setGasEstimate(undefined);
  }, [chainConfig]);

  async function handleSubmit() {
    await submitJob({
      prompt,
      contentType: "text/plain",
      tokenId: resolvedTokenId,
      discoveryRoot
    });
  }

  return (
    <div className="page-grid">
      <div>
        <JobForm
          networks={networks}
          selectedNetworkId={selectedNetworkId}
          prompt={prompt}
          discoveryRoot={discoveryRoot}
          onNetworkChange={selectNetwork}
          onPromptChange={setPrompt}
          onDiscoveryRootChange={setDiscoveryRoot}
          onChooseRoot={async () => {
            const selected = await chooseDiscoveryRoot();
            if (selected) {
              setDiscoveryRoot(selected);
            }
          }}
        />
        <PaymentPanel
          selectedToken={resolvedTokenId}
          jobType={recommended}
          gasEstimate={gasEstimate}
          onSelectToken={setSelectedToken}
        />
      </div>
      <div className="stack">
        <WalletPanel />
        <section className="panel">
          <div className="panel-header">
            <h2>Submission Preview</h2>
          </div>
          <p>Network: {chainConfig.label}</p>
          <p>Recommended job type: {recommended}</p>
          <p>Request hash: {manifest?.requestHash ?? "Not ready"}</p>
          <p>Estimated gas: {gasEstimate ?? "Pending config"}</p>
          <p>Selected payment: {selectedQuote.token.symbol}</p>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!prompt.trim() || recommended === "Collective" || !chainConfig.enabled || !selectedQuote.available}
          >
            Submit to Koinara
          </button>
          {!chainConfig.enabled ? <div className="info-banner">{chainConfig.reasonDisabled}</div> : null}
          {recommended === "Collective" ? (
            <div className="info-banner">Collective DAG submission is on the roadmap and disabled in this MVP.</div>
          ) : null}
          {lastError ? (
            <div className={`error-banner ${lastError.bucket}`}>
              {lastError.title}: {lastError.detail}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
