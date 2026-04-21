"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { adminApi } from "@/lib/api";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminNewStorePage() {
  const router = useRouter();

  // 스토어 정보
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [location, setLocation] = useState("");
  const [openingHours, setOpeningHours] = useState("");
  const [description, setDescription] = useState("");

  // 계정 정보
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminApi.createStore({
        store: {
          name,
          slug,
          location: location || undefined,
          opening_hours: openingHours || undefined,
          description: description || undefined,
          payment_methods: [],
        },
        account: { email, password, role: "owner" },
      });
      router.push("/admin/stores");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "발급 실패. 슬러그 중복 또는 이메일을 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-xl">스토어 계정 발급</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 스토어 정보 */}
        <div className="space-y-4">
          <p className="font-semibold text-sm">스토어 정보</p>
          <div className="space-y-1.5">
            <Label htmlFor="name">스토어 이름 *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">슬러그 (URL용, 영문 소문자·하이픈) *</Label>
            <Input
              id="slug"
              placeholder="my-store"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="location">위치</Label>
            <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="openingHours">운영 시간</Label>
            <Input id="openingHours" placeholder="예: 10:00 - 20:00" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">설명</Label>
            <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>

        <Separator />

        {/* 계정 정보 */}
        <div className="space-y-4">
          <p className="font-semibold text-sm">스토어 계정</p>
          <div className="space-y-1.5">
            <Label htmlFor="email">이메일 *</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">비밀번호 *</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
          <Button type="submit" disabled={loading}>{loading ? "발급 중..." : "스토어 발급"}</Button>
        </div>
      </form>
    </div>
  );
}
