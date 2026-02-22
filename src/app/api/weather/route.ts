import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENWEATHER_API_KEY 필요" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Seoul&units=metric&lang=kr&appid=${apiKey}`,
      { next: { revalidate: 1800 } } // Next.js fetch 캐시 30분
    );
    if (!res.ok) throw new Error(`OpenWeather: ${res.status}`);

    const raw = await res.json();
    const data = {
      temp: Math.round(raw.main.temp),
      description: raw.weather[0].description,
      icon: raw.weather[0].icon,
      city: "서울",
    };

    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
