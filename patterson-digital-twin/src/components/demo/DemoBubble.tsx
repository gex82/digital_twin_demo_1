import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { DemoBubblePosition, DemoRunState, DemoStage } from '../../types/demo';
import { useUiStore } from '../../store/uiStore';

const BUBBLE_WIDTH = 380;
const BUBBLE_MIN_HEIGHT = 240;
const BORDER = '#2e4168';
const BLUE = '#006EFF';
const TEAL = '#00C2A8';

function clampPosition(position: DemoBubblePosition): DemoBubblePosition {
  const maxX = Math.max(16, window.innerWidth - BUBBLE_WIDTH - 16);
  const maxY = Math.max(16, window.innerHeight - BUBBLE_MIN_HEIGHT - 16);
  return {
    x: Math.min(Math.max(16, position.x), maxX),
    y: Math.min(Math.max(16, position.y), maxY),
  };
}

interface DemoBubbleProps {
  stage: DemoStage;
  stages: DemoStage[];
  stageIndex: number;
  totalStages: number;
  runState: DemoRunState;
  isActionRunning: boolean;
  actionError: string | null;
  statusNote: string;
  routeMismatch: boolean;
  expectedRoute: string;
  currentRoute: string;
  anchorMissing: boolean;
  canBack: boolean;
  canNext: boolean;
  position: DemoBubblePosition;
  isMinimized: boolean;
  onBack: () => void;
  onNext: () => void;
  onExit: () => void;
  onRestart: () => void;
  onRetry: () => void;
  onReturnToStage: () => void;
  onContinueFlow: () => void;
  onResetPosition: () => void;
  onToggleMinimized: () => void;
  onDockLeft: () => void;
  onDockRight: () => void;
  onJumpToStage: (stageId: DemoStage['id']) => void;
  onPositionChange: (position: DemoBubblePosition, pinned?: boolean) => void;
}

export function DemoBubble({
  stage,
  stages,
  stageIndex,
  totalStages,
  runState,
  isActionRunning,
  actionError,
  statusNote,
  routeMismatch,
  expectedRoute,
  currentRoute,
  anchorMissing,
  canBack,
  canNext,
  position,
  isMinimized,
  onBack,
  onNext,
  onExit,
  onRestart,
  onRetry,
  onReturnToStage,
  onContinueFlow,
  onResetPosition,
  onToggleMinimized,
  onDockLeft,
  onDockRight,
  onJumpToStage,
  onPositionChange,
}: DemoBubbleProps) {
  const roleLens = useUiStore((state) => state.roleLens);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef<DemoBubblePosition>({ x: 0, y: 0 });

  const copy = stage.personaCopy?.[roleLens] ?? stage.personaCopy?.Mixed ?? { summary: stage.summary, detail: stage.detail };

  const statusBadge = useMemo(() => {
    if (isActionRunning) return { text: 'Running actions', color: TEAL };
    if (runState === 'error') return { text: 'Action needs retry', color: '#ef4444' };
    if (routeMismatch) return { text: 'Off-script route', color: '#f59e0b' };
    if (runState === 'completed') return { text: 'Demo complete', color: '#10b981' };
    return { text: 'Guided mode', color: BLUE };
  }, [isActionRunning, routeMismatch, runState]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    dragOffset.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    const next = clampPosition({
      x: event.clientX - dragOffset.current.x,
      y: event.clientY - dragOffset.current.y,
    });
    onPositionChange(next, true);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  if (isMinimized) {
    return (
      <section
        data-testid="demo-bubble"
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: 270,
          zIndex: 1300,
          background: 'rgba(13, 30, 53, 0.95)',
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          boxShadow: '0 16px 36px rgba(0, 0, 0, 0.42)',
          backdropFilter: 'blur(8px)',
          padding: '8px 10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#cbd5e1', fontSize: 11, fontWeight: 700 }}>
              Stage {stageIndex + 1}/{totalStages}: {stage.title}
            </div>
            <div style={{ color: statusBadge.color, fontSize: 10 }}>{statusBadge.text}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onBack}
              disabled={!canBack || isActionRunning}
              style={{ border: `1px solid ${BORDER}`, background: 'transparent', color: '#94a3b8', borderRadius: 6, padding: '3px 7px', fontSize: 10, cursor: 'pointer' }}
            >
              Back
            </button>
            <button
              onClick={onNext}
              disabled={!canNext || isActionRunning}
              style={{ border: `1px solid ${BLUE}`, background: BLUE, color: '#fff', borderRadius: 6, padding: '3px 7px', fontSize: 10, cursor: 'pointer' }}
            >
              Next
            </button>
            <button
              onClick={onToggleMinimized}
              style={{ border: `1px solid ${BORDER}`, background: 'transparent', color: '#94a3b8', borderRadius: 6, padding: '3px 7px', fontSize: 10, cursor: 'pointer' }}
            >
              Open
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      data-testid="demo-bubble"
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: BUBBLE_WIDTH,
        zIndex: 1300,
        background: 'rgba(13, 30, 53, 0.95)',
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        boxShadow: '0 16px 36px rgba(0, 0, 0, 0.42)',
        backdropFilter: 'blur(8px)',
        userSelect: isDragging ? 'none' : 'auto',
      }}
      aria-live="polite"
    >
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          padding: '10px 12px',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 700 }}>
            Stage {stageIndex + 1} of {totalStages}: {stage.title}
          </div>
          <div style={{ color: statusBadge.color, fontSize: 10, fontWeight: 600 }}>{statusBadge.text}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={onDockLeft}
            style={{ border: `1px solid ${BORDER}`, background: 'transparent', borderRadius: 6, color: '#94a3b8', fontSize: 10, cursor: 'pointer', padding: '4px 6px' }}
          >
            Dock L
          </button>
          <button
            onClick={onDockRight}
            style={{ border: `1px solid ${BORDER}`, background: 'transparent', borderRadius: 6, color: '#94a3b8', fontSize: 10, cursor: 'pointer', padding: '4px 6px' }}
          >
            Dock R
          </button>
          <button
            onClick={onResetPosition}
            style={{ border: `1px solid ${BORDER}`, background: 'transparent', borderRadius: 6, color: '#94a3b8', fontSize: 10, cursor: 'pointer', padding: '4px 6px' }}
          >
            Reset
          </button>
          <button
            onClick={onToggleMinimized}
            style={{ border: `1px solid ${BORDER}`, background: 'transparent', borderRadius: 6, color: '#94a3b8', fontSize: 10, cursor: 'pointer', padding: '4px 6px' }}
          >
            Min
          </button>
        </div>
      </div>

      <div style={{ padding: '8px 12px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`, gap: 4 }}>
          {stages.map((timelineStage, index) => {
            const isCurrent = index === stageIndex;
            const isComplete = index < stageIndex;
            return (
              <button
                key={timelineStage.id}
                onClick={() => onJumpToStage(timelineStage.id)}
                disabled={isActionRunning}
                title={`${timelineStage.id} ${timelineStage.title}`}
                style={{
                  border: 'none',
                  background: isCurrent ? '#d06414' : isComplete ? '#00C2A8' : '#23344f',
                  color: isCurrent ? '#fff' : '#cbd5e1',
                  borderRadius: 999,
                  height: 18,
                  fontSize: 9,
                  cursor: isActionRunning ? 'not-allowed' : 'pointer',
                  padding: 0,
                }}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '10px 12px 6px' }}>
        <p style={{ margin: '0 0 8px', color: '#e2e8f0', fontSize: 13, lineHeight: 1.45 }}>{copy.summary}</p>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: 11, lineHeight: 1.4 }}>{copy.detail}</p>
      </div>

      {anchorMissing && !routeMismatch && (
        <div style={{ margin: '8px 12px 0', border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '7px 9px', color: '#f59e0b', fontSize: 11 }}>
          Stage target not found on this view. Actions still continue.
        </div>
      )}

      {routeMismatch && (
        <div style={{ margin: '8px 12px 0', border: '1px solid rgba(245,158,11,0.35)', background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '8px 9px' }}>
          <div style={{ color: '#f59e0b', fontSize: 11, marginBottom: 6 }}>
            Demo expects `{expectedRoute}` but you are on `{currentRoute}`.
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={onReturnToStage}
              style={{ border: '1px solid rgba(245,158,11,0.45)', background: 'rgba(245,158,11,0.12)', borderRadius: 6, color: '#fbbf24', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '5px 9px' }}
            >
              Return to Script
            </button>
            <button
              onClick={onContinueFlow}
              style={{ border: `1px solid ${BORDER}`, background: 'transparent', borderRadius: 6, color: '#cbd5e1', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: '5px 9px' }}
            >
              Continue Anyway
            </button>
          </div>
        </div>
      )}

      {statusNote && (
        <div style={{ margin: '8px 12px 0', border: `1px solid ${BORDER}`, background: 'rgba(26, 40, 64, 0.55)', borderRadius: 8, padding: '7px 9px', color: '#94a3b8', fontSize: 11 }}>
          {statusNote}
        </div>
      )}

      {actionError && (
        <div style={{ margin: '8px 12px 0', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)', borderRadius: 8, padding: '8px 9px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#fecaca', fontSize: 11, lineHeight: 1.3 }}>{actionError}</span>
          <button
            onClick={onRetry}
            style={{ border: '1px solid rgba(239,68,68,0.45)', background: 'rgba(239,68,68,0.18)', borderRadius: 6, color: '#fecaca', fontSize: 10, cursor: 'pointer', padding: '5px 8px', flexShrink: 0 }}
          >
            Retry
          </button>
        </div>
      )}

      <div style={{ marginTop: 10, padding: '10px 12px 8px', borderTop: `1px solid ${BORDER}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <button
          onClick={onBack}
          disabled={!canBack || isActionRunning}
          style={{ border: `1px solid ${BORDER}`, background: 'transparent', borderRadius: 8, color: !canBack || isActionRunning ? '#475569' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: !canBack || isActionRunning ? 'not-allowed' : 'pointer', padding: '7px 10px' }}
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canNext || isActionRunning}
          style={{ border: `1px solid ${BLUE}`, background: !canNext || isActionRunning ? 'rgba(0,110,255,0.2)' : BLUE, borderRadius: 8, color: '#fff', fontSize: 12, fontWeight: 700, cursor: !canNext || isActionRunning ? 'not-allowed' : 'pointer', padding: '7px 10px' }}
        >
          Next
        </button>
        <button
          onClick={onExit}
          style={{ border: `1px solid ${BORDER}`, background: 'transparent', borderRadius: 8, color: '#94a3b8', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: '7px 10px' }}
        >
          Exit
        </button>
      </div>

      <div style={{ padding: '0 12px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#64748b', fontSize: 10 }}>Shortcuts: ← Back · → Next · M Minimize</span>
        <button
          onClick={onRestart}
          style={{ border: 'none', background: 'transparent', color: '#64748b', fontSize: 11, textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
        >
          Restart Demo
        </button>
      </div>
    </section>
  );
}
