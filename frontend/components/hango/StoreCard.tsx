import { Card } from "@/components/ui/card";
import type { StoreResponse } from "@/lib/types";
import { MapPin } from "lucide-react";
import Link from "next/link";

interface Props {
  store: StoreResponse;
}

export default function StoreCard({ store }: Props) {
  return (
    <Link href={`/stores/${store.slug}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        {/* 이미지 플레이스홀더 */}
        <div className="w-full h-32 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 mb-3 flex items-center justify-center">
          <span className="text-2xl font-bold text-primary/40">{store.name[0]}</span>
        </div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-sm">{store.name}</p>
            {store.location && (
              <p className="text-xs text-muted-foreground flex items-center gap-0.5 mt-0.5">
                <MapPin className="w-3 h-3" />
                {store.location}
              </p>
            )}
          </div>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
              store.status === "active"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {store.status === "active" ? "운영 중" : "미운영"}
          </span>
        </div>
        {store.opening_hours && (
          <p className="text-xs text-muted-foreground mt-1">{store.opening_hours}</p>
        )}
      </Card>
    </Link>
  );
}
