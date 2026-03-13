// ===================== CONFIG =====================
/**
 * Creates a service object.
 * @param {*} routeId - Name of line ("Red" "CR-Greenbush")
 * @param {*} directionId - Direction of service (0 OR 1)
 * @param {*} stopId - Depature stop (ex: "place-sstat")
 * @param {*} destination - Last stop (ex: "Alewife")
 * @returns The service structure.
 */
function service(routeId, directionId, stopId, destination) {
    const isBlueOrGreen = routeId === "Green" || routeId === "Blue" || routeId.startsWith("Green-");
    const direction = isBlueOrGreen
        ? directionId === 0
            ? "Westbound"
            : "Eastbound"
        : directionId === 0
          ? "Southbound"
          : "Northbound";

    return {
        routeId,
        label: `${direction}`,
        directionId,
        stopId,
        headsignContains: destination,
    };
}

/**
 * Panels concist of train lines and their services.
 */
const PANELS = [
    // South Station – Red Line
    {
        title: "Red Line",
        elementId: "south-station-red",
        StationName: "South Station",
        routeId: "Red",
        services: [
            service("Red", 0, "place-sstat", "Ashmont", "Red-1-0"),
            service("Red", 0, "place-sstat", "Braintree", "Red-3-0"),
            service("Red", 1, "place-sstat", "Alewife", "Red-3-1"),
        ],
    },

    // State Station – Orange Line
    {
        title: "Orange Line",
        elementId: "state-station-orange",
        StationName: "South Station",
        routeId: "Orange",
        services: [
            service("Orange", 0, "place-state", "Forest Hills", "Orange-A-0"),
            service("Orange", 1, "place-state", "Oak Grove", "Orange-A-1"),
        ],
    },

    // State Station – Blue Line
    {
        title: "Blue Line",
        elementId: "state-station-blue",
        StationName: "South Station",
        routeId: "Blue",
        services: [
            service("Blue", 0, "place-state", "Bowdoin", "Blue-6-0"),
            service("Blue", 1, "place-state", "Wonderland", "Blue-6-1"),
        ],
    },

    // Park Street – Green Line (all branches)
    {
        title: "Green Line",
        elementId: "park-street-green",
        StationName: "Park Street",
        routeId: "Green",
        services: [
            service("Green-B", 0, "place-pktrm", "Boston College"),
            service("Green-C", 0, "place-pktrm", "Cleveland Circle"),
            service("Green-D", 0, "place-pktrm", "Riverside"),
            service("Green-E", 0, "place-pktrm", "Heath Street"),
            service("Green-E", 1, "place-pktrm", "Medford"),
            service("Green-B", 1, "place-pktrm", "Lechmere"),
        ],
    },

    // South Station – Commuter Rail
    {
        title: "Greenbush Line",
        elementId: "south-station-cr-greenbush",
        StationName: "South Station",
        routeId: "CR-Greenbush",
        services: [service("CR-Greenbush", 0, "place-sstat", "Greenbush")],
    },
    {
        title: "Fairmount Line",
        elementId: "south-station-cr-fairmount",
        StationName: "South Station",
        routeId: "CR-Fairmount",
        services: [
            service("CR-Fairmount", 0, "place-sstat", "Readville"),
            service("CR-Fairmount", 0, "place-sstat", "Fairmount"),
        ],
    },
    {
        title: "Fall River/New Bedford Line",
        elementId: "south-station-cr-newbedford",
        StationName: "South Station",
        routeId: "CR-NewBedford",
        services: [
            service("CR-NewBedford", 0, "place-sstat", "New Bedford"),
            service("CR-NewBedford", 0, "place-sstat", "Fall River"),
        ],
    },
    {
        title: "Framingham/Worcester Line",
        elementId: "south-station-cr-worcester",
        StationName: "South Station",
        routeId: "CR-Worcester",
        services: [
            service("CR-Worcester", 0, "place-sstat", "Worcester"),
            service("CR-Worcester", 0, "place-sstat", "Framingham"),
        ],
    },
    {
        title: "Franklin/Foxboro Line",
        elementId: "south-station-cr-franklin",
        StationName: "South Station",
        routeId: "CR-Franklin",
        services: [
            service("CR-Franklin", 0, "place-sstat", "Foxboro"),
            service("CR-Franklin", 0, "place-sstat", "Forge Park"),
            service("CR-Franklin", 0, "place-sstat", "Walpole"),
        ],
    },
    {
        title: "Providence/Stoughton Line",
        elementId: "south-station-cr-providence",
        StationName: "South Station",
        routeId: "CR-Providence",
        services: [
            service("CR-Providence", 0, "place-sstat", "Providence"),
            service("CR-Providence", 0, "place-sstat", "Wickford"),
            service("CR-Providence", 0, "place-sstat", "Stoughton"),
        ],
    },
    {
        title: "Kingston Line",
        elementId: "south-station-cr-kingston",
        StationName: "South Station",
        routeId: "CR-Kingston",
        services: [service("CR-Kingston", 0, "place-sstat", "Kingston")],
    },
    {
        title: "Needham Line",
        elementId: "south-station-cr-needham",
        StationName: "South Station",
        routeId: "CR-Needham",
        services: [service("CR-Needham", 0, "place-sstat", "Needham")],
    },

    // Long Wharf South -> Charlestown
    {
        title: "Charlestown Ferry",
        elementId: "long-wharf-south-boat-f4",
        StationName: "Long Wharf",
        routeId: "Boat-F4",
        services: [service("Boat-F4", 0, "Boat-Long-South", "Charlestown")],
    },

    // Rowes Wharf -> Hingham
    {
        title: "Hingham/Hull Ferry",
        elementId: "boat-rowes-boat-f1",
        StationName: "Rowes Wharf",
        routeId: "Boat-F1",
        services: [
            service("Boat-F1", 0, "Boat-Rowes", "Hingham"),
            service("Boat-F1", 0, "Boat-Long", "Hull"),
        ],
    },

    // Long Wharf North -> East Boston
    {
        title: "East Boston Ferry",
        elementId: "boat-long-boat-eastboston",
        StationName: "Long Wharf",
        routeId: "Boat-EastBoston",
        services: [service("Boat-EastBoston", 0, "Boat-Long", "Lewis Mall")],
    },

    // Long Wharf North -> Lynn
    {
        title: "Lynn Ferry",
        elementId: "boat-long-boat-lynn",
        StationName: "Long Wharf",
        routeId: "Boat-Lynn",
        services: [service("Boat-Lynn", 0, "Boat-Long", "Blossom Street")],
    },

    // Aquarium -> Winthrop
    {
        title: "Winthrop Ferry",
        elementId: "boat-aquarium-boat-f6",
        StationName: "Aquarium",
        routeId: "Boat-F6",
        services: [service("Boat-F6", 0, "Boat-Aquarium", "Winthrop")],
    },

    // Aquarium -> Quincy
    {
        title: "Quincy Ferry",
        elementId: "boat-aquarium-boat-f7",
        StationName: "Aquarium",
        routeId: "Boat-F7",
        services: [service("Boat-F7", 0, "Boat-Aquarium", "Quincy")],
    },
];

/** Relevant STOPS */
const STOPID = [{ stopId: "place-sstat" }, { stopId: "place-state" }];

// ===================== STATE =====================
/** MBTA Data */
let realtimeData = {};
let alertData = {};

/** NWS Data */
let cacheWeather = null;
let detailedWeather = null;
let lastWeatherFetch = 0;
let lastHourlyFetch = 0;

const LIVE_ICON =
    '<i class="bi bi-broadcast-pin" style="font-size:0.9em; margin-right:4px;"></i>';

const SCHEDULE_ICON = '<i class="bi bi-calendar-date"></i>';

// ===================== HELPERS =====================
/**
 * Formats minutes to hour and minutes.
 * @param {*} minutes - total minutes
 * @returns total time in hour and minutes.
 */
function formatTime(minutes) {
    if (minutes <= 1) return "Now";

    const h = Math.floor(minutes / 60);
    const m = Math.floor(minutes % 60);
    return h ? `${h}h ${m}m` : `${m}m`;
}

/**
 * Builds a key to store and retrieve data recieved from mbta api
 * @param {*} panel
 * @param {*} service
 * @returns String
 */
function buildKey(panel, service) {
    const routeId = service.routeId ?? panel.routeId;
    return `${routeId}-${service.stopId}-${service.directionId}-${service.headsignContains}`;
}

/**
 * Makes an API call
 * @param {*} url
 * @returns
 */
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

// ===================== ALERTS =====================
/**
 * Makes and API call to get alerts for each line in PANEL
 */
async function fetchAlerts() {
    alertData = {};
    const promises = [];
    // for each line in PANELS
    PANELS.forEach((line) => {
        promises.push(
            fetchAPI(`/api/mbta/alerts?&filter[route]=${line.routeId}`).then(
                (data) => {
                    if (data?.data?.length) {
                        alertData[line.routeId] = data.data;
                    }
                },
            ),
        );
    });
    await Promise.all(promises);
}

/**
 * Gets the most severe allowed alert for a given line
 * @param {*} routeId - the ID of the line
 * @returns the relevant alert
 */
function getAlertForRoute(routeId) {
    const alerts = alertData[routeId];
    if (!alerts?.length) return null;
    const allowedEffects = [
        { effect: "DELAY", severity: 10 }, // most urgent
        { effect: "CANCELLATION", severity: 10 },
        { effect: "NO_SERVICE", severity: 10 },
        { effect: "SIGNIFICANT_DELAYS", severity: 10 },
        { effect: "SHUTTLE", severity: 6 },
        { effect: "REDUCED_SERVICE", severity: 5 },
        { effect: "MODIFIED_SERVICE", severity: 5 },
    ];
    // filtered allowed alerts from response and asign new serverity
    const filtered = alerts
        .map((alert) => {
            const rule = allowedEffects.find(
                (r) => r.effect === alert.attributes.effect,
            );
            if (!rule) return null;
            return { alert, serverity: rule.severity };
        })
        .filter(Boolean);

    if (!filtered.length) return null;
    filtered.sort((a, b) => a.severity - b.severity);
    return filtered[0].alert;
}

// ===================== PREDICTIONS =====================
/**
 * fetches schedules for upcoming lines and include predictions amd trips
 */
async function fetchRealtime() {
    const promises = [];

    PANELS.forEach((panel) => {
        panel.services.forEach((service) => {
            const key = buildKey(panel, service);

            let url;
            const routeId = service.routeId ?? panel.routeId;
            url = `/api/mbta/schedules?filter[stop]=${service.stopId}&filter[route]=${routeId}&include=prediction,trip`;
            if (service.directionId !== undefined) {
                url += `&filter[direction_id]=${service.directionId}`;
            }

            promises.push(
                fetchAPI(url).then((data) => {
                    realtimeData[key] = {
                        ...data,
                    };
                }),
            );
        });
    });

    await Promise.all(promises);
}

/**
 * Transfrom data to predictions; if no predictions, default to schedules.
 * @param {*} data - data from api call
 * @returns
 */
function getPredictions(data) {
    if (!data?.data) return [];
    const now = new Date();

    // Build maps
    const predictionsByTrip = {};
    const tripsById = {};

    data.included?.forEach((item) => {
        if (item.type === "prediction") {
            const tripId = item.relationships?.trip?.data?.id;
            if (tripId) predictionsByTrip[tripId] = item.attributes;
        }
        if (item.type === "trip") {
            tripsById[item.id] = {
                headsign: item.attributes.headsign,
                directionId: item.attributes.direction_id,
            };
        }
    });
    const results = [];

    data.data.forEach((schedule) => {
        const tripId = schedule.relationships?.trip?.data?.id;
        const prediction = predictionsByTrip[tripId];
        const timeStr =
            prediction?.departure_time ||
            prediction?.arrival_time ||
            schedule.attributes.departure_time ||
            schedule.attributes.arrival_time;

        if (!timeStr) return;
        const date = new Date(timeStr);
        // how long from now does train arrive
        const minutes = (date - now) / 60000;
        if (minutes < -1 || minutes > 180) return; // allow preds within 3hr
        const headsign = tripsById[tripId]?.headsign;
        if (!headsign) return;

        const trip = tripsById[tripId];
        if (!trip) return;

        // predicted time train arrives
        const formattedTime = date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });

        results.push({
            formattedTime,
            minutes,
            headsign: trip.headsign,
            directionId: trip.directionId,
            status: prediction?.status || null,
            isRealtime: !!prediction,
        });
    });

    return results.sort((a, b) => a.minutes - b.minutes);
}

/**
 * Calls NWS API for hourly weather
 * @returns cached weather
 */
async function fetchHourlyForecast() {
    const now = Date.now();
    // fetch weather every 20 mins
    if (cacheWeather && now - lastWeatherFetch < 20 * 60000) {
        return cacheWeather;
    }

    const url = "/api/weather/gridpoints/BOX/72,90/forecast/hourly"; // BOX(72,90) = Boston area
    const data = await fetchAPI(url);
    cacheWeather = data?.properties?.periods ?? [];
    lastHourlyFetch = now;

    return cacheWeather;
}

/**
 * Calls NWS API for 12 hour forecast
 * @returns detailed description of weather
 */
async function fetchDetailedForecast() {
    const now = Date.now();
    // fetch weather every hour
    if (detailedWeather && now - lastHourlyFetch < 60 * 60000) {
        return detailedWeather;
    }

    const url = "/api/weather/gridpoints/BOX/72,90/forecast";
    const data = await fetchAPI(url);
    detailedWeather = data?.properties?.periods ?? [];
    lastDetailedFetch = now;

    return detailedWeather;
}

// ===================== RENDER =====================
/**
 * Gets class based on route for styling
 * @param {*} routeId routeID of a line
 * @returns style class
 */
function getRouteClass(routeId) {
    if (!routeId) return "";

    if (routeId.startsWith("CR-")) return "route-CR";
    if (routeId.startsWith("Boat-")) return "route-Boat";
    if (routeId === "Red") return "route-Red";
    if (routeId === "Orange") return "route-Orange";
    if (routeId === "Blue") return "route-Blue";
    if (routeId.startsWith("Green")) return "route-Green";

    return "";
}

/**
 * Renders a line in PANELS
 * @param {*} panel - a train line
 * @returns
 */
function renderPanel(panel) {
    const container = document.getElementById(panel.elementId);
    if (!container) return;

    const predContainer = container.querySelector(".predictions");
    if (!predContainer) return;
    const routeClass = getRouteClass(panel.routeId);

    const headerCopy = `<span class="ticker-title">${panel.title}</span> - <span class="ticker-station">${panel.StationName}</span>`;
    let html = `
        <div class="mbta-card ${routeClass}">
            <div class="mbta-card-header">
                <div class="ticker-container">
                    <span class="ticker-text">${headerCopy}</span>
                </div>
            </div>
            <div class="mbta-card-body">
        `;

    // Group services by direction(eg southbound, northbound) in each line
    const directions = {};
    panel.services.forEach((service) => {
        const dir = service.directionId;
        if (!directions[dir]) {
            directions[dir] = {
                label: service.label || "",
                services: [],
            };
        }
        directions[dir].services.push(service);
    });

    // render predicted time for each service in each direction of each line
    Object.values(directions).forEach((dir) => {
        html += `
            <div class="direction-header">
                <span>${dir.label}</span>
            </div>
        `;

        dir.services.forEach((service) => {
            const key = buildKey(panel, service);
            let preds = getPredictions(realtimeData[key]);

            preds = preds.filter((p) =>
                p.headsign.includes(service.headsignContains),
            );

            if (!preds.length) return;

            const headsign = preds[0].headsign;
            const [destination, via] = headsign.split(" via ");

            // renders predicted time horizontally
            const times = preds
                .slice(0, 3)
                .map((p) => {
                    return `
                        <div class="pred-time ${p.isRealtime ? "realtime" : "scheduled"}">
                            <div>${p.isRealtime ? LIVE_ICON : SCHEDULE_ICON} ${formatTime(p.minutes)}</div>
                            <div>${p.formattedTime}</div>
                        </div>
                    `;
                })
                .join("");

            html += `
                    <div class="prediction-row">
                    <div class="destination-main">${destination}</div>
                        ${via ? `<div class="destination-via">via ${via}</div>` : ""} <!-- COMMENT: Doesn't always exist -->

                    <div class="pred-times">
                            ${times}
                    </div>
                </div>
            `;
        });
    });

    // puts alerts bottom of panel
    const alert = getAlertForRoute(panel.routeId);
    if (alert) {
        html += `
            <div class="alert-banner">
                ⚠️ ${alert.attributes.header}
            </div>
        `;
    }

    html += `
            </div>
        </div>
    `;

    predContainer.innerHTML = html;

    if (!predContainer.innerHTML.trim()) {
        predContainer.innerHTML = '<div class="no-trains">No trains</div>';
    }

    setTimeout(() => {
        const tickerContainer = predContainer.querySelector('.ticker-container');
        const tickerSpan = predContainer.querySelector('.ticker-text');
        if (!tickerContainer || !tickerSpan) return;

        if (tickerSpan.scrollWidth > tickerContainer.offsetWidth) {
            tickerSpan.innerHTML = `${headerCopy}<span style="display:inline-block;width:36px"></span>${headerCopy}<span style="display:inline-block;width:36px"></span>`;
            tickerSpan.classList.add('ticker-active');
        }
    }, 300);
}

/**
 * Maps NWS shortForecast string to a weather emoji.
 */
function forecastToEmoji(forecast, isDaytime) {
    const f = forecast.toLowerCase();
    if (f.includes('blizzard')) return '🌨️❄️💨';
    if (f.includes('thunderstorm') || f.includes('lightning')) {
        return f.includes('rain') || f.includes('shower') ? '⛈️⚡🌧️' : '⛈️⚡';
    }
    if (f.includes('freezing rain') || f.includes('sleet') || f.includes('ice pellet')) return '🌨️💧';
    if (f.includes('heavy snow')) return '❄️🌨️❄️';
    if (f.includes('snow') || f.includes('flurr')) return '❄️🌨️';
    if (f.includes('heavy rain')) return '🌧️💧💧';
    if (f.includes('rain') && (f.includes('wind') || f.includes('bree'))) return '🌧️💨';
    if (f.includes('shower') && f.includes('sun')) return '🌦️☀️';
    if (f.includes('rain') || f.includes('shower')) return '🌧️💧';
    if (f.includes('drizzle')) return '🌦️💧';
    if (f.includes('dense fog')) return '🌫️🌫️';
    if (f.includes('fog') || f.includes('haze') || f.includes('mist') || f.includes('smoke')) return '🌫️';
    if (f.includes('mostly sunny') && (f.includes('wind') || f.includes('bree'))) return '🌤️💨';
    if (f.includes('mostly sunny') || f.includes('partly sunny')) return '🌤️';
    if (f.includes('partly cloudy')) return isDaytime ? '⛅' : '🌙⛅';
    if (f.includes('mostly cloudy')) return '🌥️☁️';
    if (f.includes('cloudy') || f.includes('overcast')) return '☁️☁️';
    if (f.includes('sunny') || f.includes('clear')) {
        if (f.includes('wind') || f.includes('bree')) return isDaytime ? '☀️💨' : '🌙💨';
        return isDaytime ? '☀️' : '🌙✨';
    }
    if (f.includes('wind') || f.includes('bree')) return '💨💨';
    return isDaytime ? '🌡️' : '🌙';
}

/**
 * Renders weather as an MBTA-style card with date/time in the header.
 */
function renderWeather() {
    const container = document.getElementById("weather-box");
    if (!container || !cacheWeather?.length) return;

    const current = cacheWeather[0];
    const tempF = Math.round(current.temperature);
    const description = current.shortForecast;
    const emoji = forecastToEmoji(description, current.isDaytime);

    const date = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
    });

    if (!container.querySelector(".weather-card")) {
        container.innerHTML = `
        <div class="mbta-card weather-card">
            <div class="mbta-card-body weather-card-body">
                <span class="weather-temp">${tempF}°</span>
                <span class="weather-emoji">${emoji}</span>
                <div class="weather-spacer"></div>
                <div class="weather-right-group">
                    <div class="weather-meta">
                        <span class="weather-date">${date}</span>
                        <span class="weather-location">Boston, MA</span>
                    </div>
                    <div id="timestamp"></div>
                </div>
            </div>
        </div>
        `;
    } else {
        const card = container.querySelector(".weather-card");
        card.querySelector(".weather-temp").textContent = `${tempF}°`;
        card.querySelector(".weather-emoji").textContent = emoji;
        card.querySelector(".weather-date").textContent = date;
    }
}

// ===================== UPDATE LOOP =====================
/**
 * Starts a clock. Called once when first rendered.
 */
function startClock() {
    function updateClock() {
        const ts = document.getElementById("timestamp");
        if (!ts) return;
        ts.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    }
    updateClock();
    setInterval(updateClock, 1000);
}

/** 
 * Update calls and render.
*/
async function updateAll() {
    await fetchRealtime();
    await fetchAlerts();
    await fetchHourlyForecast();
    await fetchDetailedForecast();

    PANELS.forEach(renderPanel);
    renderWeather();
}

/**
 * Alternates visibility between container-top and container-bottom every 20 seconds.
 */
function startContainerRotation() {
    const top = document.querySelector(".container-top");
    const bottom = document.querySelector(".container-bottom");
    if (!top || !bottom) return;

    let showingTop = true;
    bottom.style.display = "none";

    setInterval(() => {
        showingTop = !showingTop;
        top.style.display = showingTop ? "grid" : "none";
        bottom.style.display = showingTop ? "none" : "grid";
    }, 15000);
}

// ===================== START =====================
console.log("Starting scalable MBTA tracker");
startClock();
startContainerRotation();
updateAll();
// update every 15 seconds (weather updates independently every 20 & 60 minutes)
setInterval(updateAll, 15000);
