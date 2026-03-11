import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

type DemoJobType = "Simple" | "General" | "Collective";

interface DemoStage {
  id: string;
  label: string;
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

export function ProcessShowcase() {
  const [prompt, setPrompt] = useState(samplePrompts[1]?.prompt ?? "");
  const jobType = useMemo(() => recommendDemoJobType(prompt), [prompt]);
  const stages = useMemo(() => buildStages(jobType), [jobType]);
  const [selectedStageId, setSelectedStageId] = useState(stages[1]?.id ?? "route");
  const selectedStage = stages.find((stage) => stage.id === selectedStageId) ?? stages[0];

  return (
    <section className="site-panel process-panel">
      <div className="panel-headline">
        <div>
          <p className="site-eyebrow">Inference Swarm Demo</p>
          <h2>Use a familiar AI-style input box, then see how Koinara turns that prompt into network work.</h2>
        </div>
        <span className={`process-badge ${jobType.toLowerCase()}`}>{jobType}</span>
      </div>

      <div className="process-grid">
        <div className="composer-card">
          <p className="site-eyebrow">Prompt Composer</p>
          <div className="composer-surface">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              rows={7}
              placeholder="Ask Koinara to summarize, review, debate, or split work across multiple agents."
            />
            <div className="composer-toolbar">
              <span className="composer-pill">Worldland primary</span>
              <span className={`composer-pill tone-${jobType.toLowerCase()}`}>{jobType} route</span>
              <span className="composer-pill">Client-side hashing</span>
              <button type="button" className="composer-send" onClick={() => setSelectedStageId(stages[1]?.id ?? "route")}>
                Simulate route
              </button>
            </div>
          </div>

          <div className="sample-row">
            {samplePrompts.map((sample) => (
              <button key={sample.label} type="button" className="sample-chip" onClick={() => setPrompt(sample.prompt)}>
                {sample.label}
              </button>
            ))}
          </div>

          <div className="artifact-strip">
            <article className="artifact-card">
              <strong>Prompt size</strong>
              <span>{prompt.length ? `${prompt.length} chars` : "Pending input"}</span>
            </article>
            <article className="artifact-card">
              <strong>Discovery artifact</strong>
              <span>`jobs/&lt;requestHash&gt;.json`</span>
            </article>
            <article className="artifact-card">
              <strong>On-chain footprint</strong>
              <span>Hashes, deadlines, and proof state only</span>
            </article>
          </div>

          <div className="composer-meta">
            <div>
              <strong>Why this input matters</strong>
              <p>
                The website should not feel like a brochure. It should make it obvious that Koinara accepts a job the way
                a user expects from modern AI products, then routes it through a distributed network rather than a
                centralized inference API.
              </p>
            </div>
            <div className="process-actions">
              <Link to="/download" className="site-link-button dark">
                Download the app
              </Link>
              <Link to="/network" className="site-link-button outline-dark">
                Inspect network status
              </Link>
            </div>
          </div>
        </div>

        <div className="process-stage-card">
          <div className="panel-headline">
            <h3>Swarm choreography</h3>
            <span>{jobType} pipeline</span>
          </div>

          <div className="route-list">
            {stages.map((stage, index) => (
              <button
                key={stage.id}
                type="button"
                className={`route-item ${selectedStageId === stage.id ? "active" : ""}`}
                onClick={() => setSelectedStageId(stage.id)}
              >
                <span className="route-index">{index + 1}</span>
                <div>
                  <strong>{stage.label}</strong>
                  <small>{stage.title}</small>
                </div>
              </button>
            ))}
          </div>

          <article className="stage-detail-card">
            <h3>{selectedStage.title}</h3>
            <p>{selectedStage.detail}</p>
          </article>

          {jobType === "Collective" ? (
            <CollectiveFlow activeStageId={selectedStageId} />
          ) : (
            <LinearFlow jobType={jobType} activeStageId={selectedStageId} />
          )}

          <div className="process-footnote">
            <strong>BitTorrent-like goal:</strong> people should feel that they are opening a job into a living swarm where
            work is routed, picked up, checked, and proven in public rather than merely sending text into a black box.
          </div>
        </div>
      </div>
    </section>
  );
}

function LinearFlow({
  activeStageId,
  jobType
}: {
  activeStageId: string;
  jobType: Exclude<DemoJobType, "Collective">;
}) {
  const isVerification = activeStageId === "verify" || activeStageId === "proof";

  return (
    <div className="flow-chain">
      <article className={`flow-card ${activeStageId === "compose" ? "active" : ""}`}>
        <span className="lane-step">Creator</span>
        <strong>{jobType} request enters the swarm</strong>
        <small>The client prepares hashes and writes a discovery artifact that nodes can pick up.</small>
      </article>
      <article className={`flow-card ${activeStageId === "route" || activeStageId === "execute" ? "active" : ""}`}>
        <span className="lane-step">Provider</span>
        <strong>One provider handles execution</strong>
        <small>The response is generated off-chain and submitted back with the response hash.</small>
      </article>
      <article className={`flow-card ${isVerification ? "active" : ""}`}>
        <span className="lane-step">Verifiers</span>
        <strong>Verifier quorum checks the result</strong>
        <small>Timing, format, and validity checks accumulate until proof can finalize.</small>
      </article>
    </div>
  );
}

function CollectiveFlow({ activeStageId }: { activeStageId: string }) {
  return (
    <div className="dag-cluster">
      <article className={`flow-card ${activeStageId === "route" ? "active" : ""}`}>
        <span className="lane-step">Planning</span>
        <strong>Planner breaks the request into branches</strong>
        <small>The network decides that this job needs multiple execution lanes.</small>
      </article>

      <div className="dag-branches">
        <article className={`sub-lane-card ${activeStageId === "execute" ? "active" : ""}`}>Legal analysis</article>
        <article className={`sub-lane-card ${activeStageId === "execute" ? "active" : ""}`}>Financial analysis</article>
        <article className={`sub-lane-card ${activeStageId === "execute" ? "active" : ""}`}>Technical review</article>
      </div>

      <article className={`flow-card ${activeStageId === "execute" ? "active" : ""}`}>
        <span className="lane-step">Execution</span>
        <strong>Parallel specialists run in separate lanes</strong>
        <small>Execution branches complete independently before the synthesis layer can continue.</small>
      </article>

      <article className={`flow-card ${activeStageId === "verify" ? "active" : ""}`}>
        <span className="lane-step">Synthesis</span>
        <strong>Partial outputs are recombined</strong>
        <small>The final response is assembled only after upstream branches settle.</small>
      </article>

      <article className={`flow-card ${activeStageId === "proof" ? "active" : ""}`}>
        <span className="lane-step">Proof</span>
        <strong>Consensus proof closes the DAG</strong>
        <small>Provider, verifier approvals, quorum, and explorer proof make the process inspectable.</small>
      </article>
    </div>
  );
}

function buildStages(jobType: DemoJobType): DemoStage[] {
  return [
    {
      id: "compose",
      label: "Compose",
      title: "Prompt enters the client",
      detail: "The user types a job into a familiar composer. Koinara immediately frames that input as a network task, not a centralized API request."
    },
    {
      id: "route",
      label: "Route",
      title: `${jobType} route is selected`,
      detail:
        jobType === "Collective"
          ? "The client recognizes that the prompt is complex enough to require multi-branch routing and downstream synthesis."
          : "The client decides this request can be handled as a single routed job with one provider path and verifier quorum."
    },
    {
      id: "execute",
      label: "Execute",
      title: "Providers pick up execution",
      detail:
        jobType === "Collective"
          ? "Specialized providers can work in parallel lanes so large reasoning tasks are distributed rather than funneled into one opaque model call."
          : "A provider performs execution off-chain and writes the result artifact back for the network to verify."
    },
    {
      id: "verify",
      label: "Verify",
      title: "Quorum checks the output",
      detail: "Verifiers check the returned work and only allow acceptance when the network has enough confidence to finalize."
    },
    {
      id: "proof",
      label: "Prove",
      title: "The creator receives result plus proof",
      detail: "The app can show who participated, which chain finalized the work, and what quorum produced the final acceptance."
    }
  ];
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
