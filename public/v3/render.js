// ===================== RENDER HELPERS =====================

function getLinePill(routeId) {
    if (routeId === "Red")              return '<span class="line-pill pill-red">RL</span>';
    if (routeId === "Orange")           return '<span class="line-pill pill-orange">OL</span>';
    if (routeId === "Blue")             return '<span class="line-pill pill-blue">BL</span>';
    if (routeId === "Green")            return '<span class="line-pill pill-green">GL</span>';
    if (routeId === "Green-B")          return '<span class="line-pill pill-green">B</span>';
    if (routeId === "Green-C")          return '<span class="line-pill pill-green">C</span>';
    if (routeId === "Green-D")          return '<span class="line-pill pill-green">D</span>';
    if (routeId === "Green-E")          return '<span class="line-pill pill-green">E</span>';
    if (routeId.startsWith("CR-"))      return '<span class="line-pill pill-cr">CR</span>';
    if (routeId.startsWith("Boat-"))    return '<span class="line-pill pill-boat">FR</span>';
    return "";
}

function getRouteClass(routeId) {
    if (!routeId) return "";
    if (routeId.startsWith("CR-"))    return "route-CR";
    if (routeId.startsWith("Boat-"))  return "route-Boat";
    if (routeId === "Red")            return "route-Red";
    if (routeId === "Orange")         return "route-Orange";
    if (routeId === "Blue")           return "route-Blue";
    if (routeId.startsWith("Green"))  return "route-Green";
    return "";
}

function forecastToEmoji(forecast, isDaytime) {
    const f = forecast.toLowerCase();
    if (f.includes("blizzard")) return "🌨️❄️💨";
    if (f.includes("thunderstorm") || f.includes("lightning"))
        return f.includes("rain") || f.includes("shower") ? "⛈️⚡🌧️" : "⛈️⚡";
    if (f.includes("freezing rain") || f.includes("sleet") || f.includes("ice pellet")) return "🌨️💧";
    if (f.includes("heavy snow")) return "❄️🌨️❄️";
    if (f.includes("snow") || f.includes("flurr")) return "❄️🌨️";
    if (f.includes("heavy rain")) return "🌧️💧💧";
    if (f.includes("rain") && (f.includes("wind") || f.includes("bree"))) return "🌧️💨";
    if (f.includes("shower") && f.includes("sun")) return "🌦️☀️";
    if (f.includes("rain") || f.includes("shower")) return "🌧️💧";
    if (f.includes("drizzle")) return "🌦️💧";
    if (f.includes("dense fog")) return "🌫️🌫️";
    if (f.includes("fog") || f.includes("haze") || f.includes("mist") || f.includes("smoke")) return "🌫️";
    if (f.includes("mostly sunny") && (f.includes("wind") || f.includes("bree"))) return "🌤️💨";
    if (f.includes("partly sunny") || f.includes("mostly sunny")) return "🌤️";
    if (f.includes("partly cloudy")) return isDaytime ? "⛅" : "🌙⛅";
    if (f.includes("mostly cloudy")) return "🌥️☁️";
    if (f.includes("cloudy") || f.includes("overcast")) return "☁️☁️";
    if (f.includes("sunny") || f.includes("clear")) {
        if (f.includes("wind") || f.includes("bree")) return isDaytime ? "☀️💨" : "🌙💨";
        return isDaytime ? "☀️" : "🌙✨";
    }
    if (f.includes("wind") || f.includes("bree")) return "💨💨";
    return isDaytime ? "🌡️" : "🌙";
}

// ===================== RENDER =====================

function renderStationGroup(group) {
    const container = document.getElementById(group.elementId);
    if (!container) return;
    const predContainer = container.querySelector(".predictions");
    if (!predContainer) return;

    const groupPanels = PANELS.filter((p) => group.panelRouteIds.includes(p.routeId));

    const byDestination = new Map();
    groupPanels.forEach((panel) => {
        panel.services.forEach((svc) => {
            const key = buildKey(panel, svc);
            const preds = getPredictions(realtimeData[key])
                .filter((p) => p.headsign.includes(svc.headsignContains))
                .filter((p) => p.minutes >= group.walkMin);
            if (!preds.length) return;
            const headsign = preds[0].headsign;
            if (!byDestination.has(headsign))
                byDestination.set(headsign, { routeId: svc.routeId ?? panel.routeId, times: [] });
            preds.forEach((p) => byDestination.get(headsign).times.push(p));
        });
    });

    const GREEN_BRANCH_ORDER = { B: 0, C: 1, D: 2, E: 3 };
    const destinations = [...byDestination.entries()].map(([headsign, data]) => {
        data.times.sort((a, b) => a.minutes - b.minutes);
        return { headsign, ...data };
    });
    destinations.sort((a, b) => {
        if (a.routeId.startsWith("Green-") && b.routeId.startsWith("Green-")) {
            const diff = (GREEN_BRANCH_ORDER[a.routeId.split("-")[1]] ?? 99) -
                         (GREEN_BRANCH_ORDER[b.routeId.split("-")[1]] ?? 99);
            if (diff !== 0) return diff;
        }
        return a.times[0].minutes - b.times[0].minutes;
    });

    let html = `
        <div class="card">
            <div class="card-header">
                <span class="header-station">${group.stationName}</span>
                <span class="walk-min">${WALK_ICON} ${group.walkMin} min</span>
            </div>
            <div class="card-body">
    `;

    if (!destinations.length) {
        html += `<div class="no-trains">No service</div>`;
    } else {
        destinations.forEach(({ headsign, routeId, times }) => {
            const timesHtml = times.slice(0, 2).map((p) => `
                <div class="pred-time ${p.isRealtime ? "realtime" : "scheduled"}">
                    ${p.isRealtime ? LIVE_ICON : SCHEDULE_ICON} ${formatTime(p.minutes)}
                </div>`).join("");
            html += `
                <div class="prediction-row">
                    ${getLinePill(routeId)}
                    <div class="destination-main">${headsign}</div>
                    <div class="pred-times">${timesHtml}</div>
                </div>`;
        });
    }

    html += `</div></div>`;
    predContainer.innerHTML = html;
}

function renderCRPanel(panels, stationName, stationClass, walkMin) {
    const container = document.querySelector(`.${stationClass}`);
    if (!container) return;
    const predContainer = container.querySelector(".predictions");
    if (!predContainer) return;

    let html = `
        <div class="card">
            <div class="card-header">
                <span class="header-station">${stationName}</span>
                <span class="walk-min">${WALK_ICON} ${walkMin} min</span>
            </div>
            <div class="card-body">
    `;

    panels.forEach((panel) => {
        const allPreds = [];
        panel.services.forEach((svc) => {
            const key = buildKey(panel, svc);
            getPredictions(realtimeData[key])
                .filter((p) => p.headsign.includes(svc.headsignContains))
                .forEach((p) => allPreds.push(p));
        });
        allPreds.sort((a, b) => a.minutes - b.minutes);
        const next2 = allPreds.slice(0, 2);
        if (!next2.length) return;

        const timesHtml = next2.map((p) => `
            <div class="pred-time ${p.isRealtime ? "realtime" : "scheduled"}">
                ${p.isRealtime ? LIVE_ICON : SCHEDULE_ICON} ${formatTime(p.minutes)}
            </div>`).join("");

        html += `
            <div class="prediction-row">
                ${getLinePill(panel.routeId)}
                <div class="destination-main">${panel.title}</div>
                <div class="pred-times">${timesHtml}</div>
            </div>`;
    });

    html += `</div></div>`;
    predContainer.innerHTML = html;
}

function renderFerryPanel(panels, stationClass) {
    const container = document.querySelector(`.${stationClass}`);
    if (!container) return;
    const predContainer = container.querySelector(".predictions");
    if (!predContainer) return;

    let html = `
        <div class="card route-Boat">
            <div class="card-header">
                <span class="header-station">Ferry</span>
            </div>
            <div class="card-body">
            <div class="ferry-grid">
    `;

    panels.forEach((panel) => {
        panel.services.forEach((svc) => {
            const key = buildKey(panel, svc);
            const preds = getPredictions(realtimeData[key])
                .filter((p) => p.headsign === svc.headsignContains);
            if (!preds.length) return;

            const timesHtml = preds.slice(0, 2).map((p) => `
                <div class="pred-time ${p.isRealtime ? "realtime" : "scheduled"}">
                    <div>${p.isRealtime ? LIVE_ICON : SCHEDULE_ICON} ${formatTime(p.minutes)}</div>
                </div>`).join("");

            const [destination, via] = preds[0].headsign.split(" via ");
            html += `
                <div class="ferry-stop">${panel.title}</div>
                <div>
                    <div class="ferry-line">${destination}</div>
                    ${via ? `<div class="ferry-destination-via">via ${via}</div>` : ""}
                </div>
                <div class="ferry-times">${timesHtml}</div>`;
        });
    });

    html += `</div></div></div>`;
    predContainer.innerHTML = html;

    if (!predContainer.innerHTML.trim()) {
        predContainer.innerHTML = '<div class="no-trains">No service</div>';
    }
}

function renderWeather() {
    const container = document.getElementById("weather-box");
    if (!container || !cachedWeather?.length) return;

    const current = cachedWeather[0];
    const tempF = Math.round(current.temperature);
    const description = current.shortForecast;
    const emoji = forecastToEmoji(description, current.isDaytime);
    const date = new Date().toLocaleDateString(undefined, {
        weekday: "long", month: "short", day: "numeric",
    });

    if (!container.querySelector(".weather-card")) {
        container.innerHTML = `
        <div class="card weather-card">
            <div class="card-body weather-card-body">
                <span class="weather-temp">${tempF}°</span>
                <span class="weather-emoji">${emoji}</span>
                <span class="weather-desc">${description}</span>
                <div class="weather-spacer"></div>
                <div class="weather-right-group">
                    <div class="weather-meta">
                        <span class="weather-date">${date}</span>
                        <span class="weather-location">Boston, MA</span>
                    </div>
                    <div id="timestamp"></div>
                </div>
            </div>
        </div>`;
    } else {
        const card = container.querySelector(".weather-card");
        card.querySelector(".weather-temp").textContent = `${tempF}°`;
        card.querySelector(".weather-emoji").textContent = emoji;
        card.querySelector(".weather-date").textContent = date;
    }
}

function renderNews(articles) {
    const container = document.getElementById("news-box");
    if (!container) return;

    if (!articles.length) {
        container.innerHTML = `<div>No updates.</div>`;
        return;
    }

    container.innerHTML = `
        <div class="card route-News">
            <div class="card-header">
                <span class="header-station">News</span>
            </div>
            <div class="card-body news-body">
                <div class="news-list">
                    ${articles.map((a) => `<div class="news-item">${a.title}</div>`).join("")}
                </div>
            </div>
        </div>`;
}

function renderBluebikes(stations) {
    const container = document.getElementById("bluebikes-box");
    if (!container) return;

    if (!stations.length) {
        container.innerHTML = "";
        return;
    }

    const rows = stations.map(({ name, eBikes, regularBikes }) => `
        <div class="bb-row">
            <div class="bb-station-name">${name}</div>
            <div class="bb-counts">
                <span class="bb-ebike"><i class="bi bi-lightning-charge-fill"></i> ${eBikes}</span>
                <span class="bb-bike"><i class="bi bi-bicycle"></i> ${regularBikes}</span>
            </div>
        </div>`).join("");

    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <span class="header-station">Blue Bikes</span>
            </div>
            <div class="card-body">${rows}</div>
        </div>`;
}
