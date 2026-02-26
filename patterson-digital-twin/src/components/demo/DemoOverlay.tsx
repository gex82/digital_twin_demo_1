import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DemoBubble } from './DemoBubble';
import { useDemoStore } from '../../store/demoStore';
import { useShallow } from 'zustand/react/shallow';

const HIGHLIGHT = '#00C2A8';
const BUBBLE_EXPANDED_WIDTH = 380;
const BUBBLE_EXPANDED_HEIGHT = 240;
const BUBBLE_MINIMIZED_WIDTH = 270;
const BUBBLE_MINIMIZED_HEIGHT = 74;

function findAnchorRect(anchorId?: string): DOMRect | null {
  if (!anchorId) return null;
  const element = document.querySelector(`[data-demo-anchor="${anchorId}"]`) as HTMLElement | null;
  if (!element) return null;
  return element.getBoundingClientRect();
}

function clampBubblePosition(
  position: { x: number; y: number },
  minimized: boolean
): { x: number; y: number } {
  const width = minimized ? BUBBLE_MINIMIZED_WIDTH : BUBBLE_EXPANDED_WIDTH;
  const height = minimized ? BUBBLE_MINIMIZED_HEIGHT : BUBBLE_EXPANDED_HEIGHT;
  const maxX = Math.max(16, window.innerWidth - width - 16);
  const maxY = Math.max(16, window.innerHeight - height - 16);
  return {
    x: Math.min(Math.max(16, position.x), maxX),
    y: Math.min(Math.max(16, position.y), maxY),
  };
}

export function DemoOverlay() {
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isActive,
    runState,
    stages,
    currentStageIndex,
    pendingDirection,
    actionRunToken,
    isActionRunning,
    actionError,
    statusNote,
    bubblePosition,
    bubblePinnedByUser,
    isBubbleMinimized,
    setBubblePosition,
    resetBubblePosition,
    setBubbleMinimized,
    pageReady,
    nextStage,
    prevStage,
    goToStage,
    runStageActions,
    exitDemo,
    restartDemo,
    retryStageActions,
    setStatusNote,
    clearStatusNote,
  } = useDemoStore(
    useShallow((state) => ({
      isActive: state.isActive,
      runState: state.runState,
      stages: state.stages,
      currentStageIndex: state.currentStageIndex,
      pendingDirection: state.pendingDirection,
      actionRunToken: state.actionRunToken,
      isActionRunning: state.isActionRunning,
      actionError: state.actionError,
      statusNote: state.statusNote,
      bubblePosition: state.bubblePosition,
      bubblePinnedByUser: state.bubblePinnedByUser,
      isBubbleMinimized: state.isBubbleMinimized,
      setBubblePosition: state.setBubblePosition,
      resetBubblePosition: state.resetBubblePosition,
      setBubbleMinimized: state.setBubbleMinimized,
      pageReady: state.pageReady,
      nextStage: state.nextStage,
      prevStage: state.prevStage,
      goToStage: state.goToStage,
      runStageActions: state.runStageActions,
      exitDemo: state.exitDemo,
      restartDemo: state.restartDemo,
      retryStageActions: state.retryStageActions,
      setStatusNote: state.setStatusNote,
      clearStatusNote: state.clearStatusNote,
    }))
  );

  const currentStage = stages[currentStageIndex];
  const expectedRoute = currentStage?.route ?? '/';
  const routeMismatch = Boolean(isActive && currentStage && location.pathname !== expectedRoute);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const lastHandledActionToken = useRef<number>(-1);
  const lastRouteToken = useRef<number>(-1);

  useEffect(() => {
    if (!isActive || !currentStage) return;
    if (bubblePinnedByUser) return;
    if (!currentStage.defaultBubblePosition) return;
    setBubblePosition(currentStage.defaultBubblePosition, false);
  }, [bubblePinnedByUser, currentStage, isActive, setBubblePosition]);

  useEffect(() => {
    if (!isActive || !currentStage) return;

    if (actionRunToken !== lastRouteToken.current && location.pathname !== expectedRoute) {
      lastRouteToken.current = actionRunToken;
      navigate(expectedRoute);
      return;
    }
    if (location.pathname === expectedRoute) {
      lastRouteToken.current = actionRunToken;
    }
  }, [actionRunToken, currentStage, expectedRoute, isActive, location.pathname, navigate]);

  useEffect(() => {
    if (!isActive) return;
    if (routeMismatch) {
      setStatusNote('Route changed manually. Return to scripted route or continue to next stage.');
      return;
    }
    clearStatusNote();
  }, [clearStatusNote, isActive, routeMismatch, setStatusNote]);

  useEffect(() => {
    if (!isActive || !currentStage) return;
    if (location.pathname !== expectedRoute) return;
    if (runState === 'error' || runState === 'paused') return;
    if (isActionRunning) return;
    const ready = pageReady[expectedRoute] === true;
    if (!ready) return;
    if (lastHandledActionToken.current === actionRunToken) return;

    lastHandledActionToken.current = actionRunToken;
    void runStageActions(currentStage.id, pendingDirection);
  }, [
    actionRunToken,
    currentStage,
    expectedRoute,
    isActionRunning,
    isActive,
    location.pathname,
    pageReady,
    pendingDirection,
    runStageActions,
    runState,
  ]);

  useEffect(() => {
    if (!isActive || !currentStage) return;
    let frame = 0;
    const refresh = () => {
      frame = 0;
      setAnchorRect(findAnchorRect(currentStage.anchorId));
    };
    const schedule = () => {
      if (frame !== 0) return;
      frame = window.requestAnimationFrame(refresh);
    };

    schedule();
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    const interval = window.setInterval(schedule, 450);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.cancelAnimationFrame(frame);
    };
  }, [currentStage, isActive, location.pathname]);

  useEffect(() => {
    if (!isActive) return;
    const onResize = () => {
      const clamped = clampBubblePosition(bubblePosition, isBubbleMinimized);
      if (clamped.x !== bubblePosition.x || clamped.y !== bubblePosition.y) {
        setBubblePosition(clamped, bubblePinnedByUser);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [bubblePinnedByUser, bubblePosition, isActive, isBubbleMinimized, setBubblePosition]);

  const canBack = currentStageIndex > 0;
  const canNext = currentStageIndex < stages.length - 1 || runState !== 'completed';
  const anchorMissing = Boolean(currentStage?.anchorId && !anchorRect && !routeMismatch);

  const highlightStyle = useMemo(() => {
    if (!anchorRect || routeMismatch) return null;
    return {
      position: 'fixed' as const,
      top: anchorRect.top - 6,
      left: anchorRect.left - 6,
      width: anchorRect.width + 12,
      height: anchorRect.height + 12,
      border: `2px solid ${HIGHLIGHT}`,
      borderRadius: 10,
      boxShadow: `0 0 0 2px rgba(0,194,168,0.16), 0 0 28px rgba(0,194,168,0.26)`,
      pointerEvents: 'none' as const,
      zIndex: 1200,
    };
  }, [anchorRect, routeMismatch]);

  useEffect(() => {
    if (!isActive) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const editableTag = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';
      if (editableTag) return;

      if (event.key === 'ArrowRight' && canNext && !isActionRunning) {
        event.preventDefault();
        void nextStage();
      } else if (event.key === 'ArrowLeft' && canBack && !isActionRunning) {
        event.preventDefault();
        void prevStage();
      } else if ((event.key === 'm' || event.key === 'M') && !isActionRunning) {
        event.preventDefault();
        setBubbleMinimized(!isBubbleMinimized);
      } else if (event.key === 'Escape') {
        event.preventDefault();
        exitDemo(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [canBack, canNext, exitDemo, isActionRunning, isActive, isBubbleMinimized, nextStage, prevStage, setBubbleMinimized]);

  if (!isActive || !currentStage) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1150 }}>
      {highlightStyle && <div style={highlightStyle} />}
      <div style={{ pointerEvents: 'auto' }}>
        <DemoBubble
          stage={currentStage}
          stages={stages}
          stageIndex={currentStageIndex}
          totalStages={stages.length}
          runState={runState}
          isActionRunning={isActionRunning}
          actionError={actionError}
          statusNote={statusNote}
          routeMismatch={routeMismatch}
          expectedRoute={expectedRoute}
          currentRoute={location.pathname}
          anchorMissing={anchorMissing}
          canBack={canBack}
          canNext={canNext}
          position={bubblePosition}
          isMinimized={isBubbleMinimized}
          onBack={() => {
            void prevStage();
          }}
          onNext={() => {
            void nextStage();
          }}
          onExit={() => exitDemo(false)}
          onRestart={restartDemo}
          onRetry={retryStageActions}
          onReturnToStage={() => navigate(expectedRoute)}
          onContinueFlow={() => {
            void nextStage();
          }}
          onResetPosition={resetBubblePosition}
          onToggleMinimized={() => setBubbleMinimized(!isBubbleMinimized)}
          onDockLeft={() => setBubblePosition({ x: 18, y: bubblePosition.y }, true)}
          onDockRight={() => {
            const width = isBubbleMinimized ? BUBBLE_MINIMIZED_WIDTH : BUBBLE_EXPANDED_WIDTH;
            const clamped = clampBubblePosition({ x: window.innerWidth - width - 18, y: bubblePosition.y }, isBubbleMinimized);
            setBubblePosition(clamped, true);
          }}
          onJumpToStage={(stageId) => goToStage(stageId)}
          onPositionChange={setBubblePosition}
        />
      </div>
    </div>
  );
}
