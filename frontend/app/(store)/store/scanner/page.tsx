"use client";

import { Card } from "@/components/ui/card";
import { ticketsApi } from "@/lib/api";
import type { TicketVerifyResponse } from "@/lib/types";
import { useEffect, useRef, useState } from "react";


export default function ScannerPage() {
  const [result, setResult] = useState<TicketVerifyResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const scannerRef = useRef<any>(null);
  const processingRef = useRef(false);

  useEffect(() => {
    // html5-qrcode는 브라우저에서만 동작
    if (typeof window === "undefined") return;

    import("html5-qrcode").then(({ Html5Qrcode }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scanner = new Html5Qrcode("qr-reader") as any;
      scannerRef.current = scanner;
      setScanning(true);

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          async (decodedText: string) => {
            if (processingRef.current) return;
            processingRef.current = true;
            try {
              const res = await ticketsApi.verify(decodedText);
              setResult(res);
              await scanner.stop();
              setScanning(false);
            } catch {
              setResult({ success: false, message: "검증 실패" });
            }
          },
          () => {}
        )
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : "카메라 접근 실패");
          setScanning(false);
        });
    });

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  const handleReset = () => {
    setResult(null);
    processingRef.current = false;
    window.location.reload();
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="font-bold text-xl">QR 스캐너</h1>
        <p className="text-sm text-muted-foreground mt-0.5">관객의 QR 티켓을 스캔하여 입장을 확인합니다.</p>
      </div>

      {!result ? (
        <div className="space-y-4">
          {error ? (
            <Card className="p-6 text-center text-destructive">
              <p className="font-semibold">카메라 오류</p>
              <p className="text-sm mt-1">{error}</p>
              <p className="text-xs text-muted-foreground mt-2">브라우저 카메라 권한을 허용해주세요.</p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div id="qr-reader" className="w-full" />
              {scanning && (
                <div className="p-3 text-center text-sm text-muted-foreground">
                  카메라로 QR 코드를 비춰주세요
                </div>
              )}
            </Card>
          )}
        </div>
      ) : (
        <Card className={`p-6 text-center ${result.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
          <div className={`text-5xl mb-3 ${result.success ? "text-green-500" : "text-red-500"}`}>
            {result.success ? "✓" : "✗"}
          </div>
          <p className={`font-bold text-xl ${result.success ? "text-green-700" : "text-red-700"}`}>
            {result.success ? "입장 가능" : "입장 불가"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {result.message === "ok"
              ? "유효한 티켓입니다."
              : result.message === "already_used"
              ? "이미 사용된 티켓입니다."
              : result.message === "outside_time_window"
              ? "입장 시간이 아닙니다."
              : result.message === "invalid_token"
              ? "유효하지 않은 QR 코드입니다."
              : result.message}
          </p>
          <button
            onClick={handleReset}
            className="mt-4 text-sm text-primary underline"
          >
            다시 스캔하기
          </button>
        </Card>
      )}
    </div>
  );
}
