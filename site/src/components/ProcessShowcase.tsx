import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type DemoJobType = "Simple" | "General" | "Collective";

interface DemoStage {
  id: string;
  title: string;
  detail: string;
}

const samplePrompts = [
  {
    label: "Short summary",
    prompt: "Summarize this market brief for a non-technical founder in five bullets."
  },
  {
    label: "Board memo",
    prompt:
      "Read the attached memo, classify operational risks, compare cost tradeoffs, and prepare an executive recommendation for the next quarter."
  },
  {
    label: "Collective review",
    prompt:
      "Review a long due-diligence packet, split legal, financial, and technical concerns into parallel tracks, then synthesize a final investment recommendation with evidence."
  }
];

const baseStages: DemoStage[] = [
  {
    id: "input",
    title: "1. Input",
    detail: "The user enters a prompt or document and the client estimates whether this should be a simple, general, or collective job."
  },
  {
    id: "prepare",
    title: "2. Off-chain prep",
    detail: "The app builds the manifest, computes hashes, and writes a job artifact into the shared discovery root without sending the document to a hosted backend."
  },
  {
    id: "create",
    title: "3. On-chain job",
    detail: "The wallet signs createJob on the selected network. The chain only stores hashes, deadlines, and state transitions."
  },
  {
    id: "distribute",
    title: "4. Distributed execution",
    detail: "Providers pick up the job, generate a response, and verifiers check that the result is valid, timely, and non-empty before quorum is reached."
  },
  {
    id: "prove",
    title: "5. Result and proof",
    detail: "The creator receives the output from the shared discovery path and can inspect the on-chain proof showing provider, verifier approvals, and final settlement."
  }
];

export function ProcessShowcase() {
  const [prompt, setPrompt] = useState(samplePrompts[1]?.prompt ?? "");
  const [selectedStageId, setSelectedStageId] = useState(baseStages[0]?.id ?? "input");
  const jobType = useMemo(() => recommendDemoJobType(prompt), [prompt]);
  const selectedStage = baseStages.find((stage) => stage.id === selectedStageId) ?? baseStages[0];

  return (
    <section className="site-panel process-panel">
      <div className="panel-headline">
        <div>
          <p className="site-eyebrow">See The Network Work</p>
          <h2>Input a job, watch it split across the network, and inspect how consensus is formed.</h2>
        </div>
        <span className={`process-badge ${jobType.toLowerCase()}`}>{jobType}</span>
      </div>
      <div className="process-grid">
        <div className="process-input-card">
          <label className="process-field">
            <span>Try a job prompt</span>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={8} />
          </label>
          <div className="sample-row">
            {samplePrompts.map((sample) => (
              <button key={sample.label} type="button" className="sample-chip" onClick={() => setPrompt(sample.prompt)}>
                {sample.label}
              </button>
            ))}
          </div>
          <div className="artifact-strip">
            <article className="artifact-card">
              <strong>User submits</strong>
              <span>{prompt.length ? `${prompt.length} chars` : "Prompt pending"}</span>
            </article>
            <article className="artifact-card">
              <strong>Client prepares</strong>
              <span>Manifest + request hash</span>
            </article>
            <article className="artifact-card">
              <strong>Chain stores</strong>
              <span>State + proof metadata only</span>
            </article>
          </div>
          <div className="process-actions">
            <Link to="/download" className="site-link-button dark">
              Open the real app
            </Link>
            <Link to="/network" className="site-link-button outline-dark">
              View live network
            </Link>
          </div>
        </div>

        <div className="process-stage-card">
          <div className="stage-tab-row">
            {baseStages.map((stage) => (
              <button
                key={stage.id}
                type="button"
                className={`stage-tab ${selectedStageId === stage.id ? "selected" : ""}`}
                onClick={() => setSelectedStageId(stage.id)}
              >
                {stage.title}
              </button>
            ))}
          </div>
          <article className="stage-detail-card">
            <h3>{selectedStage.title}</h3>
            <p>{selectedStage.detail}</p>
          </article>
          {jobType === "Collective" ? <CollectiveDistribution /> : <LinearDistribution jobType={jobType} />}
          <div className="process-footnote">
            <strong>Why this matters:</strong> Koinara should feel less like a static AI product page and more like a living inference swarm where work is routed, checked, and proven in public.
          </div>
        </div>
      </div>
    </section>
  );
}

function LinearDistribution({ jobType }: { jobType: Exclude<DemoJobType, "Collective"> }) {
  return (
    <div className="lane-grid">
      <article className="lane-card">
        <span className="lane-step">Creator</span>
        <strong>{jobType} request enters the swarm</strong>
        <small>The app writes the discovery artifact and opens the on-chain job.</small>
      </article>
      <article className="lane-card active">
        <span className="lane-step">Provider</span>
        <strong>One provider picks up execution</strong>
        <small>Response artifact is produced off-chain, then submitted back with the response hash.</small>
      </article>
      <article className="lane-card">
        <span className="lane-step">Verifiers</span>
        <strong>Verifier quorum checks the result</strong>
        <small>Approvals, timing, and format checks accumulate until proof can finalize.</small>
      </article>
    </div>
  );
}

function CollectiveDistribution() {
  return (
    <div className="collective-grid">
      <article className="lane-card active">
        <span className="lane-step">Planning</span>
        <strong>Planner breaks the request into branches</strong>
        <small>Large work is split into smaller jobs so no single agent needs the entire reasoning space.</small>
      </article>
      <article className="lane-card">
        <span className="lane-step">Execution</span>
        <strong>Parallel specialists run in separate lanes</strong>
        <small>Legal, financial, and technical execution branches can proceed independently.</small>
      </article>
      <div className="sub-lane-grid">
        <article className="sub-lane-card">Legal analysis</article>
        <article className="sub-lane-card">Financial analysis</article>
        <article className="sub-lane-card">Technical review</article>
      </div>
      <article className="lane-card">
        <span className="lane-step">Synthesis</span>
        <strong>Partial outputs are recombined</strong>
        <small>The final response is assembled only after upstream branches complete.</small>
      </article>
      <article className="lane-card">
        <span className="lane-step">Verification</span>
        <strong>Consensus proof closes the DAG</strong>
        <small>Accepted output becomes inspectable with wallets, quorum counts, and explorer proof.</small>
      </article>
    </div>
  );
}

function recommendDemoJobType(prompt: string): DemoJobType {
  const size = prompt.trim().length;
  if (size > 160) {
    return "Collective";
  }
  if (size > 90) {
    return "General";
  }
  return "Simple";
}
