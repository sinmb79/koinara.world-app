import { useMemo, useState } from "react";
import { recommendJobType } from "../orchestrator/submitJob";

interface JobFormProps {
  prompt: string;
  discoveryRoot: string;
  onPromptChange(value: string): void;
  onDiscoveryRootChange(value: string): void;
  onChooseRoot(): Promise<void>;
}

export function JobForm(props: JobFormProps) {
  const [fileName, setFileName] = useState<string>();
  const recommendedType = useMemo(() => recommendJobType(props.prompt), [props.prompt]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    const text = await file.text();
    props.onPromptChange(text);
    setFileName(file.name);
  }

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Submit Inference Job</h2>
        <span className={`badge badge-${recommendedType.toLowerCase()}`}>{recommendedType}</span>
      </div>
      <label className="field">
        <span>Prompt or document text</span>
        <textarea
          value={props.prompt}
          onChange={(event) => props.onPromptChange(event.target.value)}
          rows={10}
          placeholder="Ask the network to summarize, classify, or analyze text."
        />
      </label>
      <label className="field">
        <span>Text file upload (.txt, .md, .json)</span>
        <input type="file" accept=".txt,.md,.json,text/plain,application/json" onChange={handleFileChange} />
        {fileName ? <small>Loaded {fileName}</small> : null}
      </label>
      <label className="field">
        <span>Discovery root</span>
        <div className="inline-row">
          <input
            value={props.discoveryRoot}
            onChange={(event) => props.onDiscoveryRootChange(event.target.value)}
            placeholder="Select a writable shared root"
          />
          <button type="button" onClick={() => void props.onChooseRoot()}>
            Choose Folder
          </button>
        </div>
      </label>
      {recommendedType === "Collective" ? (
        <div className="info-banner">
          Collective DAG submission is coming soon. The MVP only accepts Simple and General jobs.
        </div>
      ) : null}
    </section>
  );
}
