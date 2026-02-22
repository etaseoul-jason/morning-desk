"use client";

import { useEffect, useState } from "react";

type WeatherData = {
  temp: number;
  description: string;
  icon: string;
  city: string;
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) return;
        const data = await res.json();
        setWeather(data);
      } catch {
        // 날씨 실패 시 무시
      }
    }
    fetchWeather();
    // 30분마다 갱신
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (!weather) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <img
        src={`https://openweathermap.org/img/wn/${weather.icon}.png`}
        alt={weather.description}
        className="w-6 h-6"
      />
      <span className="font-medium text-foreground">{weather.temp}°</span>
      <span className="hidden sm:inline">{weather.city}</span>
    </div>
  );
}
