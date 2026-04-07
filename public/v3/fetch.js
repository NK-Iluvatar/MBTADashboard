// ===================== STATE =====================

let realtimeData = {};
let cachedWeather = null;
let lastHourlyFetch = 0;
let cachedNews = [];
let lastNewsFetch = 0;

// ===================== FETCH =====================

async function fetchAPI(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(res.status);
        return await res.json();
    } catch (e) {
        console.error("Fetch error:", e);
        return null;
    }
}

async function fetchRealtime() {
    const promises = [];
    PANELS.forEach((panel) => {
        panel.services.forEach((svc) => {
            const key = buildKey(panel, svc);
            const routeId = svc.routeId ?? panel.routeId;
            let url = `/api/mbta/schedules?filter[stop]=${svc.stopId}&filter[route]=${routeId}&include=prediction,trip`;
            if (svc.directionId !== undefined) url += `&filter[direction_id]=${svc.directionId}`;
            promises.push(fetchAPI(url).then((data) => { realtimeData[key] = data ?? {}; }));
        });
    });
    await Promise.all(promises);
}

async function fetchHourlyForecast() {
    const now = Date.now();
    if (cachedWeather && now - lastHourlyFetch < 20 * 60000) return;
    const data = await fetchAPI("/api/weather/gridpoints/BOX/72,90/forecast/hourly");
    cachedWeather = data?.properties?.periods ?? [];
    lastHourlyFetch = now;
}

async function fetchLegalNews() {
    const now = Date.now();
    if (cachedNews.length && now - lastNewsFetch < 60 * 60000) return cachedNews;
    const results = await Promise.all(
        NEWS_FEEDS.map((feed) =>
            fetchAPI(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}`)
                .then((data) => (data?.items ?? []).slice(0, 3))
        )
    );
    const merged = results.flat();
    if (merged.length) {
        cachedNews = merged;
        lastNewsFetch = now;
    }
    return cachedNews;
}


// ===================== PREDICTION TRANSFORM =====================

function getPredictions(data) {
    if (!data?.data) return [];
    const now = new Date();

    const predictionsByTrip = {};
    const tripsById = {};

    data.included?.forEach((item) => {
        if (item.type === "prediction") {
            const tripId = item.relationships?.trip?.data?.id;
            if (tripId) predictionsByTrip[tripId] = item.attributes;
        } else if (item.type === "trip") {
            tripsById[item.id] = item.attributes.headsign;
        }
    });

    const results = [];
    data.data.forEach((schedule) => {
        const tripId = schedule.relationships?.trip?.data?.id;
        const prediction = predictionsByTrip[tripId];
        const timeStr =
            prediction?.departure_time || prediction?.arrival_time ||
            schedule.attributes.departure_time || schedule.attributes.arrival_time;
        if (!timeStr) return;

        const minutes = (new Date(timeStr) - now) / 60000;
        if (minutes < -1 || minutes > 480) return;

        const headsign = tripsById[tripId];
        if (!headsign) return;

        results.push({ minutes, headsign, isRealtime: !!prediction });
    });

    return results.sort((a, b) => a.minutes - b.minutes);
}
