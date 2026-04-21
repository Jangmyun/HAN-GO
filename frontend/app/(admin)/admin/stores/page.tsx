"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { adminApi } from "@/lib/api";
import type { StoreResponse } from "@/lib/types";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_LABEL = { active: "활성", suspended: "정지", deleted: "삭제" };
const STATUS_COLOR = { active: "default", suspended: "warning", deleted: "destructive" } as const;

export default function AdminStoresPage() {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => adminApi.listStores().then(setStores).finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleStatus = async (storeId: string, status: string) => {
    if (!confirm(`스토어 상태를 '${STATUS_LABEL[status as keyof typeof STATUS_LABEL]}'으로 변경할까요?`)) return;
    await adminApi.updateStoreStatus(storeId, status);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-xl">스토어 관리</h1>
          <p className="text-sm text-muted-foreground mt-0.5">전체 스토어 현황을 확인하고 관리합니다.</p>
        </div>
        <Link href="/admin/stores/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-1" />
            스토어 발급
          </Button>
        </Link>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-3 gap-4">
        {["active", "suspended", "deleted"].map((s) => (
          <Card key={s} className="p-4">
            <p className="text-xs text-muted-foreground">{STATUS_LABEL[s as keyof typeof STATUS_LABEL]}</p>
            <p className="font-bold text-2xl mt-1">
              {loading ? "—" : stores.filter((st) => st.status === s).length}
            </p>
          </Card>
        ))}
      </div>

      {/* 스토어 목록 */}
      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <div className="space-y-2">
          {stores.map((store) => (
            <Card key={store.id} className="p-4 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{store.name}</p>
                  <Badge
                    variant={
                      store.status === "active" ? "default" :
                      store.status === "suspended" ? "secondary" : "destructive"
                    }
                    className="text-xs"
                  >
                    {STATUS_LABEL[store.status as keyof typeof STATUS_LABEL]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{store.slug}</p>
                {store.location && <p className="text-xs text-muted-foreground">{store.location}</p>}
              </div>
              <div className="flex gap-2 shrink-0">
                {store.status !== "active" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatus(store.id, "active")}>
                    활성화
                  </Button>
                )}
                {store.status === "active" && (
                  <Button size="sm" variant="outline" onClick={() => handleStatus(store.id, "suspended")}>
                    정지
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
