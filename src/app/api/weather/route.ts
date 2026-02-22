import { NextResponse } from "next/server";

// 캐시: 30분
let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 30 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.ts < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY 필요" },
      { status: 500 }
    );
  }

  try {
    // 서울 날씨
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Seoul&units=metric&lang=kr&appid=${apiKey}`
    );
    if (!res.ok) throw new Error(`OpenWeather: ${res.status}`);

    const raw = await res.json();
    const data = {
      temp: Math.round(raw.main.temp),
      description: raw.weather[0].description,
      icon: raw.weather[0].icon,
      city: "서울",
    };

    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
