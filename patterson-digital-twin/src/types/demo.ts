export type DemoStageId =
  | 'S01'
  | 'S02'
  | 'S03'
  | 'S04'
  | 'S05'
  | 'S06'
  | 'S07'
  | 'S08'
  | 'S09'
  | 'S10'
  | 'S11';

export type DemoDirection = 'forward' | 'back' | 'jump';

export interface DemoBubblePosition {
  x: number;
  y: number;
}

export interface DemoAction {
  type: string;
  payload?: Record<string, unknown>;
  timeoutMs?: number;
  blocking?: boolean;
}

export type DemoPersona = 'Executive' | 'Analyst' | 'Mixed';

export interface DemoPersonaCopy {
  summary: string;
  detail: string;
}

export interface DemoStage {
  id: DemoStageId;
  route: string;
  title: string;
  summary: string;
  detail: string;
  personaCopy?: Partial<Record<DemoPersona, DemoPersonaCopy>>;
  anchorId?: string;
  defaultBubblePosition?: DemoBubblePosition;
  enterActions?: DemoAction[];
  nextActions?: DemoAction[];
  backActions?: DemoAction[];
}

export type DemoRunState = 'idle' | 'running' | 'paused' | 'error' | 'completed';

export type DemoActionHandler = (action: DemoAction) => void | Promise<void>;

export interface DemoStoreSnapshot {
  stageIndex: number;
  isActive: boolean;
  runState: DemoRunState;
}
