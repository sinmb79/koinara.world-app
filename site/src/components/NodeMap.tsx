export function NodeMap({ wallets }: { wallets: string[] }) {
  if (!wallets.length) {
    return <section className="site-panel">Wallet activity graph appears here when recent chain events exist.</section>;
  }

  return (
    <section className="site-panel">
      <div className="panel-headline">
        <h3>Participant Graph</h3>
        <span title="distinct wallet addresses observed from recent provider/verifier events">
          Wallet activity, not geographic location
        </span>
      </div>
      <div className="wallet-cloud">
        {wallets.map((wallet) => (
          <span key={wallet} className="wallet-bubble">
            {wallet.slice(0, 6)}...{wallet.slice(-4)}
          </span>
        ))}
      </div>
    </section>
  );
}
