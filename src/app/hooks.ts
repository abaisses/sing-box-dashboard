import { useEffect, useRef, useState, type RefObject } from "react";

import type { StreamSnapshot } from "../api/stream";

export const RECONNECT_GRACE_MS = 6500;

export function useStreamOutage(
  snapshot: StreamSnapshot<unknown>,
  immediate: boolean,
  graceMs = RECONNECT_GRACE_MS,
): string | null {
  const [outage, setOutage] = useState<string | null>(null);
  const lastError = useRef("");
  const timer = useRef<number | null>(null);
  useEffect(() => {
    const cancel = () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    if (snapshot.phase === "active") {
      cancel();
      setOutage(null);
    } else if (snapshot.phase === "error") {
      lastError.current = snapshot.error ?? "";
      if (immediate) {
        cancel();
        setOutage(lastError.current);
      } else if (timer.current === null) {
        timer.current = window.setTimeout(() => {
          timer.current = null;
          setOutage(lastError.current);
        }, graceMs);
      }
    }
  }, [snapshot, immediate, graceMs]);
  useEffect(() => {
    const pending = timer;
    return () => {
      if (pending.current !== null) {
        clearTimeout(pending.current);
      }
    };
  }, []);
  return outage;
}

const escapeStack: (() => void)[] = [];

function useEscapeEntry(active: boolean, onDismiss: () => void) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    if (!active) {
      return;
    }
    const entry = () => dismissRef.current();
    escapeStack.push(entry);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && escapeStack[escapeStack.length - 1] === entry) {
        event.preventDefault();
        entry();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      const index = escapeStack.indexOf(entry);
      if (index >= 0) {
        escapeStack.splice(index, 1);
      }
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [active]);
}

export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: () => void,
) {
  useEscapeEntry(open, onDismiss);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        dismissRef.current();
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [ref, open]);
}

export function usePendingValue<T>(serverValue: T): [T, (pending: T | null) => void] {
  const [pending, setPending] = useState<T | null>(null);
  if (pending !== null && serverValue === pending) {
    setPending(null);
  }
  return [pending ?? serverValue, setPending];
}

// Failures are ignored: daemons predating the method reject with Unimplemented.
export function useUnaryOnce<T>(call: () => Promise<T>, enabled = true): T | null {
  const [value, setValue] = useState<T | null>(null);
  const callRef = useRef(call);
  callRef.current = call;
  useEffect(() => {
    if (!enabled || value !== null) {
      return;
    }
    let stale = false;
    callRef.current().then(
      (result) => {
        if (!stale) {
          setValue(result);
        }
      },
      () => {},
    );
    return () => {
      stale = true;
    };
  }, [enabled, value]);
  return value;
}

export function useStreamingAction(): {
  running: boolean;
  error: string;
  reportError: (message: string) => void;
  start: (run: (signal: AbortSignal) => Promise<void>) => void;
  stop: () => void;
} {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const start = (run: (signal: AbortSignal) => Promise<void>) => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setRunning(true);
    setError("");
    void run(controller.signal)
      .catch((streamError: unknown) => {
        if (!controller.signal.aborted) {
          setError(String(streamError));
        }
      })
      .finally(() => setRunning(false));
  };

  const stop = () => {
    controllerRef.current?.abort();
    setRunning(false);
  };

  return { running, error, reportError: setError, start, stop };
}
