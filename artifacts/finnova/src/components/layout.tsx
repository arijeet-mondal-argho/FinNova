import { Link, useLocation } from "wouter";
import { Home, PieChart, Wallet, Target, Lightbulb, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/expenses", icon: PieChart, label: "Expenses" },
  { href: "/budget", icon: Wallet, label: "Budget" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/learn", icon: Lightbulb, label: "Learn" },
  { href: "/achievements", icon: Trophy, label: "Awards" },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background w-full flex justify-center text-foreground font-sans">
      <div className="w-full max-w-[480px] bg-background shadow-2xl min-h-[100dvh] flex flex-col relative overflow-hidden border-x border-border/40">
        <main className="flex-1 overflow-y-auto pb-[80px]">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </main>
        
        <nav className="absolute bottom-0 left-0 right-0 h-[70px] bg-card border-t border-border/50 flex items-center justify-around px-2 z-50 rounded-t-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <div 
                  className="flex flex-col items-center justify-center w-full h-full gap-1 cursor-pointer"
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <div className={cn(
                    "p-2 rounded-full transition-all duration-200",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  )}>
                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
