import type { AssetSnapshot } from "../../../../packages/shared/src/index";

const profiles: Record<string, { industry: string; description: string; identity: string }> = {
  nova: {
    industry: "Electric mobility",
    description: "Nova Motors builds mass-market electric commuter vehicles for growing city and suburban routes.",
    identity: "The company is known for practical design, accessible vehicle platforms, and a close watch on production follow-through."
  },
  luma: {
    industry: "Energy storage materials",
    description: "Luma Labs develops advanced battery materials and energy-storage technology for the next generation of electric infrastructure.",
    identity: "Its identity is built around ambitious technical work and the challenge of turning laboratory progress into reliable scale."
  },
  hgrid: {
    industry: "Grid storage infrastructure",
    description: "Harvest Grid develops and operates storage systems that help power networks absorb and balance renewable energy.",
    identity: "The company operates where long-term contracts, dependable execution, and changing energy demand meet."
  }
};

const relationshipCopy = {
  supplier: "Battery technology supplier",
  customer: "Mobility customer",
  partner: "Business partner",
  competitor: "Industry competitor"
} as const;

export function CompanyProfile({ asset }: { asset: AssetSnapshot }) {
  const profile = profiles[asset.id];
  if (asset.kind !== "stock" || !profile) return null;
  return (
    <section className="asset-detail-panel company-profile" id="asset-panel-company" role="tabpanel" aria-labelledby="asset-tab-company">
      <span className="section-kicker">COMPANY</span>
      <h2>{asset.name}</h2>
      <dl>
        <div><dt>Symbol</dt><dd>{asset.symbol}</dd></div>
        <div><dt>Sector</dt><dd>{asset.sector}</dd></div>
        <div><dt>Industry</dt><dd>{profile.industry}</dd></div>
      </dl>
      <p>{profile.description}</p>
      <p>{profile.identity}</p>
      {asset.relationships && asset.relationships.length > 0 && <section className="company-connections" aria-label="Business connections">
        <h3>BUSINESS CONNECTIONS</h3>
        <ul>{asset.relationships.map((relationship) => <li key={`${relationship.assetId}-${relationship.kind}`}>
          <strong>{relationship.name}</strong>
          <span>{relationshipCopy[relationship.kind]}</span>
          <small>{relationship.importance} relationship</small>
        </li>)}</ul>
      </section>}
    </section>
  );
}
