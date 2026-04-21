"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

const KAKAO_AUTH_URL =
  `https://kauth.kakao.com/oauth/authorize?` +
  `client_id=${process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID ?? ""}&` +
  `redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_KAKAO_REDIRECT_URI ?? "http://localhost:3000/auth/kakao/callback")}&` +
  `response_type=code`;

export default function AuthPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGuestLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authApi.guestLogin(phone);
      setToken(res.access_token, "guest", { user_id: res.user_id });
      router.push("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인 실패. 전화번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 헤더 */}
      <div className="bg-gradient-to-br from-primary to-[#7B8BFF] px-6 pt-16 pb-10 text-white">
        <h1 className="font-extrabold text-3xl tracking-tight">HAN:GO</h1>
        <p className="text-white/80 mt-1 text-sm">한동대 주문·결제·예매 플랫폼</p>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* 카카오 로그인 */}
        <div>
          <a href={KAKAO_AUTH_URL}>
            <Button
              className="w-full font-semibold text-sm"
              style={{ backgroundColor: "#FEE500", color: "#191919" }}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.67 1.6 5.02 4 6.47L5 21l4.67-2.47C10.42 18.82 11.2 19 12 19c5.52 0 10-3.48 10-7.8S17.52 3 12 3z" />
              </svg>
              카카오로 시작하기
            </Button>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">또는</span>
          <Separator className="flex-1" />
        </div>

        {/* 비회원 로그인 */}
        <form onSubmit={handleGuestLogin} className="space-y-3">
          <p className="font-semibold text-sm">비회원으로 주문하기</p>
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="text-sm">전화번호</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" variant="outline" className="w-full" disabled={loading}>
            {loading ? "확인 중..." : "비회원으로 계속하기"}
          </Button>
        </form>

        <Separator />

        {/* 비회원 주문 조회 */}
        <div className="text-center">
          <a href="/orders/guest" className="text-sm text-primary underline underline-offset-2">
            비회원 주문 조회
          </a>
        </div>
      </div>
    </div>
  );
}
