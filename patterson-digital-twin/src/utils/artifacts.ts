import { getIsoDateStamp } from './time';

function slugifyScenarioName(name: string): string {
  return name.trim().replace(/\s+/g, '-').toLowerCase();
}

export function buildScenarioPdfArtifactName(scenarioName: string): string {
  return `${slugifyScenarioName(scenarioName)}-${getIsoDateStamp()}.pdf`;
}

export function buildBoardPackArtifactName(scenarioName: string): string {
  return `${slugifyScenarioName(scenarioName)}-board-pack-${getIsoDateStamp()}.pdf`;
}

export function buildReportJsonArtifactName(prefix = 'patterson-report'): string {
  return `${prefix}-${Date.now()}.json`;
}
