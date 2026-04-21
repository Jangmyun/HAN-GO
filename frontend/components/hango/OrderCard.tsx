import { Card } from "@/components/ui/card";
import type { OrderResponse } from "@/lib/types";
import Link from "next/link";
import StatusBadge from "./StatusBadge";

interface Props {
  order: OrderResponse;
}

export default function OrderCard({ order }: Props) {
  return (
    <Link href={`/orders/${order.id}`}>
      <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm font-mono">{order.order_code}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(order.created_at).toLocaleDateString("ko-KR", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-sm">{order.total_price.toLocaleString()}원</p>
            <StatusBadge status={order.status} className="mt-1" />
          </div>
        </div>
        {order.items.length > 0 && (
          <p className="text-xs text-muted-foreground mt-2 truncate">
            {order.items.length}개 상품
          </p>
        )}
      </Card>
    </Link>
  );
}
