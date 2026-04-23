"use client";

import { useEffect } from "react";

export function MockProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") return;

    // 동적 import: msw/browser를 서버 번들에서 제외
    import("../mocks/browser").then(({ worker }) => {
      worker.start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
      });
    });
  }, []);

  return <>{children}</>;
}
