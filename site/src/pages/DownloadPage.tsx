import { getSiteChainConfig } from "../network";

export function DownloadPage() {
  const config = getSiteChainConfig();

  return (
    <div className="site-stack">
      <section className="site-panel">
        <h2>Downloads</h2>
        <p>Official releases are distributed through GitHub releases.</p>
        <ul className="link-list">
          <li>
            <a href={config.releaseLinks.app} target="_blank" rel="noreferrer">
              koinara-app releases
            </a>
          </li>
          <li>
            <a href={config.releaseLinks.node} target="_blank" rel="noreferrer">
              koinara-node releases
            </a>
          </li>
          <li>
            <a href={config.releaseLinks.protocol} target="_blank" rel="noreferrer">
              koinara protocol releases
            </a>
          </li>
        </ul>
      </section>
      <section className="site-panel">
        <h2>Node install</h2>
        <pre className="code-block">git clone https://github.com/sinmb79/Koinara-node.git{"\n"}npm install{"\n"}npm run setup</pre>
      </section>
    </div>
  );
}
