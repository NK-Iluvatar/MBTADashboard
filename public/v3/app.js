// ===================== CLOCK =====================

function startClock() {
    function tick() {
        const ts = document.getElementById("timestamp");
        if (ts) ts.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit", minute: "2-digit", second: "2-digit",
        });
    }
    tick();
    setInterval(tick, 1000);
}

// ===================== UPDATE LOOP =====================

async function updateAll() {
    await fetchRealtime();
    await fetchAlerts();
    await fetchHourlyForecast();

    SUBWAY_STATION_GROUPS.forEach(renderStationGroup);

    const southCRPanels = PANELS.filter((p) => SOUTHSTATIONCR.includes(p.routeId));
    const northPanels   = PANELS.filter((p) => NORTHSTATIONCR.includes(p.routeId));
    const ferryPanels   = PANELS.filter((p) => FERRY.includes(p.routeId));
    renderCRPanel(southCRPanels, "South Station", "south-station-cr", 7);
    renderCRPanel(northPanels, "North Station", "north-station-cr", 21);
    renderFerryPanel(ferryPanels, "ferry");

    const [news, bikes] = await Promise.all([fetchLegalNews(), fetchBluebikes()]);
    renderNews(news);
    renderBluebikes(bikes);

    renderWeather();
}

// ===================== START =====================

console.log("Starting MBTA dashboard");
startClock();
updateAll();
setInterval(updateAll, 30000);
