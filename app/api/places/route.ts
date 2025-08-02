// app/api/places/route.ts

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');

    if (!lat || !lng || !radius) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const GOOGLE_KEY = process.env.GOOGLE_KEY || 'AIzaSyA7k7JvCM_0IYqucJ48W5WnuvYYdIFZ104';

    // 1) Nearby Search via Google Places API, filtered to bars with “pub” in metadata
    const nearbyUrl =
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
      `?location=${lat},${lng}` +
      `&radius=${radius}` +
      `&type=bar` +           // category “bar” covers pubs
      `&keyword=pub` +        // restrict to places mentioning “pub”
      `&key=${GOOGLE_KEY}`;
    const nearRes = await fetch(nearbyUrl);
    const nearJson = await nearRes.json();

    // 2) Fetch full details for each to get weekday_text opening hours, rating, etc.
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const detailed = await Promise.all(
      nearJson.results.map(async (pl: any) => {
        // Compute distance via Haversine
        const dLat = toRad(pl.geometry.location.lat - parseFloat(lat));
        const dLng = toRad(pl.geometry.location.lng - parseFloat(lng));
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(parseFloat(lat))) *
            Math.cos(toRad(pl.geometry.location.lat)) *
            Math.sin(dLng / 2) ** 2;
        const dist = 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000;

        // Place Details for full opening_hours & rating
        const detailsUrl =
          `https://maps.googleapis.com/maps/api/place/details/json` +
          `?place_id=${pl.place_id}` +
          `&fields=name,formatted_address,opening_hours,rating,user_ratings_total,geometry` +
          `&key=${GOOGLE_KEY}`;
        const detRes = await fetch(detailsUrl);
        const detJson = await detRes.json();
        const result = detJson.result;

        return {
          place_id: pl.place_id,
          name: result.name,
          formatted: result.formatted_address,
          opening_hours: result.opening_hours,       // weekday_text array + open_now
          rate: result.rating,
          user_ratings_total: result.user_ratings_total,
          distance: dist,
          geometry: {
            coordinates: [result.geometry.location.lng, result.geometry.location.lat],
          },
        };
      })
    );

    return NextResponse.json(detailed);
  } catch (err) {
    console.error("Places API error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
