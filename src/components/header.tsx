"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LiveIndicator } from "@/components/live-indicator";
import { WeatherWidget } from "@/components/weather-widget";
import { SearchBar } from "@/components/search-bar";

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/search", label: "검색" },
  { href: "/manage", label: "섹터 관리" },
];

export function Header({
  greeting,
  description,
}: {
  greeting: string;
  description: string;
}) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Top row */}
        <div className="flex items-center justify-between py-3">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">모닝데스크</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              경제부 뉴스 대시보드
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <SearchBar />
            <WeatherWidget />
            <LiveIndicator />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{greeting}</p>
              <p className="text-xs text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex gap-4 -mb-px">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm pb-2 border-b-2 transition-colors ${
                pathname === item.href
                  ? "border-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
