import type { ThesisConfig } from "../types";

export const defaultThesis: ThesisConfig = {
  sectors: ["AI infrastructure", "Developer tools"],
  stage: "Pre-seed",
  geography: ["Europe", "North America"],
  check_size_usd: 100000,
  ownership_target_percent: 5,
  risk_appetite: "high",
  notes: "Technical founders with unusually strong proof of execution before a formal fundraise.",
};

export function loadThesis(): ThesisConfig {
  try {
    const value = localStorage.getItem("lodestar-thesis");
    return value ? { ...defaultThesis, ...JSON.parse(value) } : defaultThesis;
  } catch {
    return defaultThesis;
  }
}

export function saveThesis(thesis: ThesisConfig) {
  localStorage.setItem("lodestar-thesis", JSON.stringify(thesis));
}
