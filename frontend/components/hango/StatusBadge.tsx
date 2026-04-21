import { Badge } from "@/components/ui/badge";
import type { OrderStatus } from "@/lib/types";

const STATUS_MAP: Record<OrderStatus, { label: string; variant: string }> = {
  pending:                { label: "결제 대기", variant: "secondary" },
  payment_submitted:      { label: "입금 확인 중", variant: "warning" },
  paid:                   { label: "결제 완료", variant: "default" },
  preparing:              { label: "조리 중", variant: "accent" },
  ready:                  { label: "수령 대기", variant: "success" },
  completed:              { label: "완료", variant: "secondary" },
  payment_rejected:       { label: "결제 거절", variant: "destructive" },
  cancelled_by_user:      { label: "취소됨", variant: "destructive" },
  cancellation_requested: { label: "취소 요청", variant: "warning" },
  cancelled_by_store:     { label: "취소됨", variant: "destructive" },
};

interface Props {
  status: OrderStatus;
  className?: string;
}

export default function StatusBadge({ status, className }: Props) {
  const { label, variant } = STATUS_MAP[status] ?? { label: status, variant: "secondary" };
  return (
    <Badge
      className={className}
      style={
        variant === "warning"
          ? { backgroundColor: "#D97706", color: "#fff" }
          : variant === "success"
          ? { backgroundColor: "#16A34A", color: "#fff" }
          : variant === "accent"
          ? { backgroundColor: "#F5670A", color: "#fff" }
          : undefined
      }
      variant={
        variant === "warning" || variant === "success" || variant === "accent"
          ? "default"
          : (variant as "default" | "secondary" | "destructive" | "outline")
      }
    >
      {label}
    </Badge>
  );
}
