import BottomNav from "./BottomNav";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function MobileLayout({ children, className = "" }: Props) {
  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className={`max-w-[430px] mx-auto bg-background min-h-screen pb-20 ${className}`}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
