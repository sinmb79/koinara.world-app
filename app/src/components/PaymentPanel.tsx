import type { JobTypeName, SupportedTokenId } from "@koinara/shared";
import { useAppContext } from "../state/AppContext";

interface PaymentPanelProps {
  selectedToken: SupportedTokenId;
  jobType: JobTypeName;
  gasEstimate?: string;
  onSelectToken(token: SupportedTokenId): void;
}

export function PaymentPanel(props: PaymentPanelProps) {
  const { chainConfig, quoteFor } = useAppContext();

  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Quote</h2>
        <span className="subtle">{chainConfig.label} payment profile</span>
      </div>
      <p className="subtle">Premium + estimated gas only. Gas remains payable in {chainConfig.nativeToken.symbol}.</p>
      <div className="token-grid">
        {chainConfig.payments.supportedTokens.map((token) => {
          const quote = quoteFor(token.id, props.jobType, props.gasEstimate);
          return (
            <label key={token.id} className={`token-card ${props.selectedToken === token.id ? "selected" : ""}`}>
              <input
                type="radio"
                name="token"
                checked={props.selectedToken === token.id}
                disabled={!quote.available}
                onChange={() => props.onSelectToken(token.id)}
              />
              <div>
                <strong>{token.symbol}</strong>
                <div>Minimum premium: {quote.minimumPremium}</div>
                <div>Total estimate: {quote.totalDisplay}</div>
                {!quote.available ? <small>{quote.reasonDisabled}</small> : null}
              </div>
            </label>
          );
        })}
      </div>
    </section>
  );
}
