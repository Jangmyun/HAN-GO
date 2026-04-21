"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { BarChart3 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminAuthPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await authApi.adminLogin(email, password);
      setToken(res.access_token, "admin");
      router.push("/admin/stores");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#111827] p-4">
      <div className="bg-[#1F2937] rounded-2xl border border-white/10 p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl text-white">HAN:GO Admin</span>
        </div>
        <h1 className="font-bold text-lg text-white mb-1">관리자 로그인</h1>
        <p className="text-sm text-white/50 mb-6">운영팀 계정으로 로그인하세요.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-white/70">이메일</Label>
            <Input
              type="email"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-white/70">비밀번호</Label>
            <Input
              type="password"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </div>
    </div>
  );
}
