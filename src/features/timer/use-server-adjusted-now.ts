"use client";

import { useEffect, useState } from "react";

export interface ServerAdjustedNow {
  now: number;
  offsetMs: number;
  offsetAvailable: boolean;
}

export function useServerAdjustedNow(): ServerAdjustedNow {
  const [localNow, setLocalNow] = useState(() => Date.now());
  const [offset, setOffset] = useState(0);
  const [offsetAvailable, setOffsetAvailable] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: () => void = () => undefined;
    const intervalId = window.setInterval(() => setLocalNow(Date.now()), 250);

    void import("@/lib/firebase/server-time-repository")
      .then(({ observeServerTimeOffset }) => {
        if (!active) {
          return;
        }

        unsubscribe = observeServerTimeOffset({
          onData: (offsetMs) => {
            if (active) {
              setOffset(offsetMs);
              setOffsetAvailable(true);
            }
          },
          onError: () => {
            if (active) {
              setOffset(0);
              setOffsetAvailable(false);
            }
          },
        });
      })
      .catch(() => {
        if (active) {
          setOffset(0);
          setOffsetAvailable(false);
        }
      });

    return () => {
      active = false;
      window.clearInterval(intervalId);
      unsubscribe();
    };
  }, []);

  return { now: localNow + offset, offsetMs: offset, offsetAvailable };
}
