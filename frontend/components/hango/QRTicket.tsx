"use client";

import type { TicketResponse } from "@/lib/types";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  ticket: TicketResponse;
  orderCode: string;
  productName?: string;
  venueName?: string;
  scheduleDatetime?: string;
  seatLabel?: string;
}

export default function QRTicket({
  ticket,
  orderCode,
  productName,
  venueName,
  scheduleDatetime,
  seatLabel,
}: Props) {
  const isUsed = ticket.status === "used";
  const isRevoked = ticket.status === "revoked";

  return (
    <div className="bg-[#111827] text-white rounded-2xl overflow-hidden max-w-sm mx-auto shadow-2xl">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-primary to-[#7B8BFF] px-6 py-5">
        <p className="text-xs text-white/70 uppercase tracking-widest font-medium">HAN:GO TICKET</p>
        <p className="font-bold text-xl mt-1">{productName ?? "티켓"}</p>
        {venueName && <p className="text-sm text-white/80 mt-0.5">{venueName}</p>}
      </div>

      {/* 정보 섹션 */}
      <div className="px-6 py-4 space-y-2 text-sm">
        {scheduleDatetime && (
          <div className="flex justify-between">
            <span className="text-white/50">일시</span>
            <span className="font-medium">
              {new Date(scheduleDatetime).toLocaleString("ko-KR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
        {seatLabel && (
          <div className="flex justify-between">
            <span className="text-white/50">좌석</span>
            <span className="font-medium">{seatLabel}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-white/50">주문 번호</span>
          <span className="font-mono font-medium">{orderCode}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/50">티켓 코드</span>
          <span className="font-mono text-xs text-white/80">{ticket.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      {/* 구분선 */}
      <div className="flex items-center px-4">
        <div className="w-5 h-5 rounded-full bg-[#F9FAFB]" />
        <div className="flex-1 border-t-2 border-dashed border-white/20 mx-1" />
        <div className="w-5 h-5 rounded-full bg-[#F9FAFB]" />
      </div>

      {/* QR 코드 */}
      <div className="px-6 py-5 flex flex-col items-center gap-3">
        <div className={`p-3 rounded-xl ${isUsed || isRevoked ? "opacity-30" : "bg-white"}`}>
          <QRCodeSVG
            value={ticket.qr_token}
            size={180}
            bgColor="#ffffff"
            fgColor="#111827"
          />
        </div>

        {/* 상태 배지 */}
        {isUsed ? (
          <div className="bg-gray-700 text-gray-300 text-sm font-semibold px-4 py-1.5 rounded-full">
            ✓ 사용됨
          </div>
        ) : isRevoked ? (
          <div className="bg-red-900 text-red-300 text-sm font-semibold px-4 py-1.5 rounded-full">
            무효 티켓
          </div>
        ) : (
          <div className="bg-[#16A34A] text-white text-sm font-semibold px-4 py-1.5 rounded-full">
            ✓ 입장 가능
          </div>
        )}

        <p className="text-xs text-white/40 text-center">
          이 QR 코드를 입장 시 스태프에게 제시하세요
        </p>
      </div>
    </div>
  );
}
