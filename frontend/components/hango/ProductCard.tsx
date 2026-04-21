import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { ProductResponse } from "@/lib/types";
import { Music, ShoppingBag, UtensilsCrossed } from "lucide-react";
import Link from "next/link";

const TYPE_ICON = {
  FOOD: UtensilsCrossed,
  PERFORMANCE: Music,
  MERCH: ShoppingBag,
};

const TYPE_LABEL = {
  FOOD: "푸드",
  PERFORMANCE: "공연",
  MERCH: "굿즈",
};

interface Props {
  product: ProductResponse;
  storeSlug: string;
}

export default function ProductCard({ product, storeSlug }: Props) {
  const Icon = TYPE_ICON[product.type];
  const isSoldOut = product.status === "sold_out" || product.status === "hidden";

  return (
    <Link href={`/stores/${storeSlug}/products/${product.id}`}>
      <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer relative ${isSoldOut ? "opacity-60" : ""}`}>
        {isSoldOut && (
          <div className="absolute inset-0 rounded-lg bg-white/70 flex items-center justify-center z-10">
            <span className="font-bold text-gray-500 text-sm">품절</span>
          </div>
        )}
        <div className="flex gap-3">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-primary/60" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <p className="font-medium text-sm truncate">{product.name}</p>
              <Badge variant="outline" className="text-xs shrink-0">
                {TYPE_LABEL[product.type]}
              </Badge>
            </div>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
            )}
            <p className="font-semibold text-primary mt-1 text-sm">
              {product.base_price.toLocaleString()}원
            </p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
