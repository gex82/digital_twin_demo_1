import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DemoBubble } from './DemoBubble';
import { useDemoStore } from '../../store/demoStore';
import { useShallow } from 'zustand/react/shallow';

const HIGHLIGHT = '#00C2A8';

function findAnchorRect(anchorId?: string): DOMRect | null {
  if (!anchorId) return null;
  const element = document.querySelector(`[data-demo-anchor="${anchorId}"]`) as HTMLElement | null;
  if (!element) return null;
  return element.getBoundingClientRect();
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
    if (!isActive || !currentStage) {
      setAnchorRect(null);
      return;
    }
    let frame = 0;
    const tick = () => {
      setAnchorRect(findAnchorRect(currentStage.anchorId));
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [currentStage, isActive, location.pathname]);

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
          onDockRight={() => setBubblePosition({ x: Math.max(18, window.innerWidth - 398), y: bubblePosition.y }, true)}
          onJumpToStage={(stageId) => goToStage(stageId)}
          onPositionChange={setBubblePosition}
        />
      </div>
    </div>
  );
}
