import { useEffect, useMemo, useState } from "react";
import { buildManifestFromPrompt, buildSubmissionHashes, defaultDeadlineForJobType, recommendJobType } from "../orchestrator/submitJob";
import { JobForm } from "../components/JobForm";
import { PaymentPanel } from "../components/PaymentPanel";
import { WalletPanel } from "../components/WalletPanel";
import { useAppContext } from "../state/AppContext";

export function SubmitPage() {
  const { chainConfig, submitJob, chooseDiscoveryRoot, lastError, estimateGas } = useAppContext();
  const [prompt, setPrompt] = useState("");
  const [discoveryRoot, setDiscoveryRoot] = useState(chainConfig.discoveryDefaults.writableRoot);
  const [selectedToken, setSelectedToken] = useState<"wlc" | "wl" | "koin">("wlc");
  const [gasEstimate, setGasEstimate] = useState<string>();
  const recommended = useMemo(() => recommendJobType(prompt), [prompt]);
  const manifest = useMemo(
    () => (prompt.trim() ? buildManifestFromPrompt({ prompt, contentType: "text/plain" }) : null),
    [prompt]
  );
  const hashes = useMemo(() => (manifest ? buildSubmissionHashes(manifest) : null), [manifest]);

  useEffect(() => {
    if (!hashes || recommended === "Collective") {
      setGasEstimate(undefined);
      return;
    }

    const deadline = defaultDeadlineForJobType(recommended);
    void estimateGas(recommended, hashes.requestHash, hashes.schemaHash, deadline).then(setGasEstimate);
  }, [estimateGas, hashes, recommended]);

  async function handleSubmit() {
    await submitJob({
      prompt,
      contentType: "text/plain",
      tokenId: selectedToken,
      discoveryRoot
    });
  }

  return (
    <div className="page-grid">
      <div>
        <JobForm
          prompt={prompt}
          discoveryRoot={discoveryRoot}
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
          selectedToken={selectedToken}
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
          <p>Recommended job type: {recommended}</p>
          <p>Request hash: {manifest?.requestHash ?? "Not ready"}</p>
          <p>Estimated gas: {gasEstimate ?? "Pending config"}</p>
          <button type="button" onClick={() => void handleSubmit()} disabled={!prompt.trim() || recommended === "Collective"}>
            Submit to Koinara
          </button>
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
