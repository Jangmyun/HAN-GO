"use client";

import { useEffect, useState } from "react";

export function MockProvider({ children }: { children: React.ReactNode }) {
  const mockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
  const [ready, setReady] = useState(!mockingEnabled);

  useEffect(() => {
    if (!mockingEnabled) return;

    // 동적 import: msw/browser를 서버 번들에서 제외
    import("../mocks/browser").then(({ worker }) => {
      worker
        .start({
          onUnhandledRequest: "bypass",
          serviceWorker: { url: "/mockServiceWorker.js" },
        })
        .then(() => setReady(true));
    });
  }, [mockingEnabled]);

  if (!ready) return null;

  return <>{children}</>;
}
