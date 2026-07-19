import type { FounderRow } from "../types";

export function founderDisplay(founder: FounderRow) {
  const profile = founder.profile || {};
  const websiteHost = profile.website
    ? profile.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/.]/)[0]
    : null;
  const company = profile.company_name || profile.github_handle || websiteHost || founder.name || profile.name || founder.identity_key;
  const person = founder.name || profile.name || (profile.github_handle ? `@${profile.github_handle}` : "Founder identity pending");

  return {
    company,
    person,
    initials: company.slice(0, 2).toUpperCase(),
  };
}
