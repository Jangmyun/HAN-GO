"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function StoreAuthPage() {
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
      const res = await authApi.storeLogin(email, password);
      setToken(res.access_token, "store", { store_id: res.store_id });
      router.push("/store/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인 실패. 이메일/비밀번호를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] p-4">
      <div className="bg-background rounded-2xl border border-border p-8 w-full max-w-sm shadow-lg">
        <div className="flex items-center gap-2 mb-6">
          <Store className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl text-primary">HAN:GO</span>
        </div>
        <h1 className="font-bold text-lg mb-1">스토어 로그인</h1>
        <p className="text-sm text-muted-foreground mb-6">스토어 관리 계정으로 로그인하세요.</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              placeholder="store@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "로그인 중..." : "로그인"}
          </Button>
        </form>
      </div>
    </div>
  );
}
