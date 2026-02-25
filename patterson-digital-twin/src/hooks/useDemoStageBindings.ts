import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import type { DemoActionHandler } from '../types/demo';
import { useDemoStore } from '../store/demoStore';

const EMPTY_HANDLERS: Record<string, DemoActionHandler> = {};

export function useDemoStageBindings(
  route: string,
  handlers: Record<string, DemoActionHandler> = EMPTY_HANDLERS
) {
  const location = useLocation();
  const registerPageReady = useDemoStore((state) => state.registerPageReady);
  const registerActionHandlers = useDemoStore((state) => state.registerActionHandlers);
  const unregisterActionHandlers = useDemoStore((state) => state.unregisterActionHandlers);

  useEffect(() => {
    registerActionHandlers(route, handlers);

    return () => {
      unregisterActionHandlers(route);
    };
  }, [
    handlers,
    registerActionHandlers,
    route,
    unregisterActionHandlers,
  ]);

  useEffect(() => {
    registerPageReady(route, location.pathname === route);
    return () => {
      registerPageReady(route, false);
    };
  }, [location.pathname, registerPageReady, route]);
}
