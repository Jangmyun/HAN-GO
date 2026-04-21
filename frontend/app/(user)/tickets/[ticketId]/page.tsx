"use client";

import QRTicket from "@/components/hango/QRTicket";
import { Skeleton } from "@/components/ui/skeleton";
import { ticketsApi } from "@/lib/api";
import type { TicketResponse } from "@/lib/types";
import { ChevronLeft } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function TicketPage() {
  const params = useParams<{ ticketId: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    ticketsApi.get(params.ticketId)
      .then(setTicket)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "티켓 로드 실패"))
      .finally(() => setLoading(false));
  }, [params.ticketId]);

  return (
    <div className="min-h-screen bg-[#111827]">
      <header className="sticky top-0 z-40 bg-[#1F2937] px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-white/10 text-white">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-white">QR 티켓</span>
      </header>

      <div className="p-4 pt-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 rounded-2xl bg-white/10" />
            <Skeleton className="h-48 rounded-2xl bg-white/10" />
          </div>
        ) : error ? (
          <div className="text-center text-red-400 py-12">{error}</div>
        ) : ticket ? (
          <QRTicket ticket={ticket} orderCode="주문 조회" />
        ) : null}
      </div>
    </div>
  );
}
