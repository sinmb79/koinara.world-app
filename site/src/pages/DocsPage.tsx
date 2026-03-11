const docs = [
  "How to submit a job",
  "How to run a node",
  "How to earn KOIN",
  "Protocol overview",
  "FAQ"
];

export function DocsPage() {
  return (
    <section className="site-panel">
      <h2>Docs</h2>
      <div className="docs-grid">
        {docs.map((item) => (
          <article key={item} className="doc-card">
            <h3>{item}</h3>
            <p>Static guide content ships directly with the site and can be hosted on Vercel or Cloudflare Pages.</p>
          </article>
        ))}
      </div>
    </section>
  );
}
