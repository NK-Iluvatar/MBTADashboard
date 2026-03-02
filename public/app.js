MBTA_API = "https://api-v3.mbta.com";

// ===================== CONFIG =====================
// helper services in lines
function service(routeId, directionId, stopId, destination) {
  const isBlueOrGreen = routeId === "Green" || routeId === "Blue";
  const direction = isBlueOrGreen
    ? directionId === 0
      ? "Westbound"
      : "Eastbound"
    : directionId === 0
      ? "Southbound"
      : "Northbound";

  return {
    label: `${direction} → ${destination}`,
    directionId,
    stopId,
    headsignContains: destination,
  };
}

const PANELS = [
  // South Station – Red Line
  {
    title: "South Station — Red Line",
    elementId: "south-station",
    routeId: "Red",
    services: [
      service("Red", 0, "place-sstat", "Ashmont"),
      service("Red", 0, "place-sstat", "Braintree"),
      service("Red", 1, "place-sstat", "Alewife"),
    ],
  },

  // State Station – Orange Line
  {
    title: "State Station — Orange Line",
    elementId: "state-orange",
    routeId: "Orange",
    services: [
      service("Orange", 0, "place-state", "Forest Hills"),
      service("Orange", 1, "place-state", "Oak Grove"),
    ],
  },

  // State Station – Blue Line
  {
    title: "State Station — Blue Line",
    elementId: "state-blue",
    routeId: "Blue",
    services: [
      service("Blue", 0, "place-state", "Bowdoin"),
      service("Blue", 1, "place-state", "Wonderland"),
    ],
  },

  // South Station – Commuter Rail
  {
    elementId: "cr-south-greenbush",
    routeId: "CR-Greenbush",
    services: [service("CR-Greenbush", 0, "place-sstat", "Greenbush")],
  },
  {
    elementId: "cr-south-fairmount",
    routeId: "CR-Fairmount",
    services: [
      service("CR-Fairmount", 0, "place-sstat", "Readville"),
      service("CR-Fairmount", 0, "place-sstat", "Fairmount"),
    ],
  },
  {
    elementId: "cr-south-newbedford",
    routeId: "CR-NewBedford",
    services: [
      service("CR-NewBedford", 0, "place-sstat", "New Bedford"),
      service("CR-NewBedford", 0, "place-sstat", "Fall River"),
    ],
  },
  {
    elementId: "cr-south-worcester",
    routeId: "CR-Worcester",
    services: [
      service("CR-Worcester", 0, "place-sstat", "Worcester"),
      service("CR-Worcester", 0, "place-sstat", "Framingham"),
    ],
  },
  {
    elementId: "cr-south-franklin",
    routeId: "CR-Franklin",
    services: [
      service("CR-Franklin", 0, "place-sstat", "Foxboro"),
      service("CR-Franklin", 0, "place-sstat", "Forge Park"),
      service("CR-Franklin", 0, "place-sstat", "Walpole"),
    ],
  },
  {
    elementId: "cr-south-providence",
    routeId: "CR-Providence",
    services: [
      service("CR-Providence", 0, "place-sstat", "Providence"),
      service("CR-Providence", 0, "place-sstat", "Wickford"),
      service("CR-Providence", 0, "place-sstat", "Stoughton"),
    ],
  },
  {
    elementId: "cr-south-kingston",
    routeId: "CR-Kingston",
    services: [service("CR-Kingston", 0, "place-sstat", "Kingston")],
  },
  {
    elementId: "cr-south-needham",
    routeId: "CR-Needham",
    services: [service("CR-Needham", 0, "place-sstat", "Needham")],
  },
];

const STOPID = [{ stopId: "place-sstat" }, { stopId: "place-state" }];

// ===================== STATE =====================
let realtimeData = {};
let alertData = {};
let cacheWeather = null;
let detailedWeather = null;
let lastWeatherFetch = 0;
let lastHourlyFetch = 0;

const LIVE_ICON =
  '<i class="bi bi-broadcast-pin" style="font-size:0.9em; margin-right:4px;"></i>';

// ===================== HELPERS =====================
// rounds down train departure time
function formatTime(minutes) {
  if (minutes <= 0) return "Now";
  if (minutes < 2) return `${Math.floor(minutes)} min`;

  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h ? `${h}h ${m}m` : `${m} min`;
}

function buildKey(panel, service) {
  return `${panel.routeId}-${service.stopId}-${service.directionId}-${service.headsignContains}`;
}

async function fetchAPI(url) {
  try {
    // If it's an MBTA API call, proxy it through your worker
    if (url.includes("api-v3.mbta.com")) {
      const urlObj = new URL(url);
      const proxyUrl = `/api/mbta${urlObj.pathname}${urlObj.search}`;
      const res = await fetch(proxyUrl);
      return await res.json();
    }
    // For other APIs (Blue Bikes), use proxy too
    if (url.includes("api.weather.gov")) {
      const res = await fetch(url, {
        headers: {
          "User-Agent": "MBTADashboard/1.0 (bnguyen@princelobel.com)",
          Accept: "application/geo+json",
        },
      });
      return await res.json();
    }
    const res = await fetch(url);
    return await res.json();
  } catch (e) {
    console.error("Fetch error:", e);
    return null;
  }
}

// ===================== ALERTS =====================
async function fetchAlerts() {
  alertData = {};
  const promises = [];
  // for each panel in PANELS
  PANELS.forEach((panel) => {
    // for each service in services
    promises.push(
      fetchAPI(`${MBTA_API}/alerts?&filter[route]=${panel.routeId}`).then(
        (data) => {
          if (data?.data?.length) {
            alertData[panel.routeId] = data.data;
          }
        },
      ),
    );
  });

  await Promise.all(promises);
}

function getAlertForStop(stopId, routeId) {
  const alerts = alertData[stopId];
  if (!alerts?.length) return null;

  const filtered = alerts.filter((alert) => {
    const entities = alert.relationships?.informed_entity?.data || [];
    return (
      !routeId ||
      entities.some((e) => e.type === "route" && e.id === routeId) ||
      entities.length === 0
    );
  });

  if (!filtered.length) return null;

  filtered.sort((a, b) => a.attributes.severity - b.attributes.severity);
  return filtered[0];
}

function getAlertForRouteOLD(routeId) {
  const alerts = alertData[routeId];
  if (!alerts?.length) return null;
  alerts.sort((a, b) => a.attributes.severity - b.attributes.severity);
  return alerts[0];
}

function getAlertForRoute(routeId) {
  const alerts = alertData[routeId];
  if (!alerts?.length) return null;
  const allowedEffects = [
    "DELAY",
    "CANCELLATION",
    "SERVICE_CHANGE",
    "NO_SERVICE",
    "REDUCED_SERVICE",
    "SIGNIFICANT_DELAYS",
    "DETOUR",
    "ADDITIONAL_SERVICE",
    "MODIFIED_SERVICE",
    "OTHER_EFFECT",
    "UNKNOWN_EFFECT",
    "STOP_MOVED",
    "NO_EFFECT",
    "SHUTTLE",
  ];
  const filtered = alerts.filter((alert) =>
    allowedEffects.includes(alert.attributes.effect),
  );
  if (!filtered.length) return null;
  filtered.sort((a, b) => a.attributes.severity - b.attributes.severity);
  return filtered[0];
}

// ===================== PREDICTIONS =====================
async function fetchRealtime() {
  const promises = [];

  PANELS.forEach((panel) => {
    panel.services.forEach((service) => {
      const key = buildKey(panel, service);
      const isCommuterRail = panel.routeId.startsWith("CR-");

      let url;

      if (isCommuterRail) {
        url = `${MBTA_API}/schedules?filter[stop]=${service.stopId}&filter[route]=${panel.routeId}&include=prediction,trip`;
      } else {
        url = `${MBTA_API}/predictions?filter[stop]=${service.stopId}&filter[route]=${panel.routeId}&include=trip`;
      }

      if (service.directionId !== undefined) {
        url += `&filter[direction_id]=${service.directionId}`;
      }

      promises.push(
        fetchAPI(url).then((data) => {
          realtimeData[key] = { ...data, _isCommuterRail: isCommuterRail };
        }),
      );
    });
  });

  await Promise.all(promises);
}

async function fetchHourlyForecast() {
  const now = Date.now();
  // fetch weather every 10 mins
  if (cacheWeather && now - lastWeatherFetch < 10 * 60000) {
    return cacheWeather;
  }

  const url = "https://api.weather.gov/gridpoints/BOX/72,90/forecast/hourly";
  const data = await fetchAPI(url);
  cacheWeather = data?.properties?.periods ?? [];
  lastWeatherFetch = now;

  return cacheWeather;
}

async function fetchDeatailedForecast() {
  const now = Date.now();
  // fetch weather every 10 mins
  if (detailedWeather && now - lastHourlyFetch < 10 * 60000) {
    return detailedWeather;
  }

  const url = "https://api.weather.gov/gridpoints/BOX/72,90/forecast";
  const data = await fetchAPI(url);
  detailedWeather = data?.properties?.periods ?? [];
  lastHourlyFetch = now;

  return detailedWeather;
}

function getPredictions(data) {
  if (!data?.data) return [];

  const trips = {};
  data.included?.forEach((i) => {
    if (i.type === "trip") trips[i.id] = i.attributes;
  });

  const now = new Date();
  const results = [];

  data.data.forEach((item) => {
    const timeStr =
      item.attributes.departure_time || item.attributes.arrival_time;
    if (!timeStr) return;

    const minutes = (new Date(timeStr) - now) / 60000;
    if (minutes < -1 || minutes > 180) return;

    console.log(now.toLocaleTimeString());

    const tripId = item.relationships?.trip?.data?.id;
    const headsign = trips[tripId]?.headsign;
    if (!headsign) return;

    results.push({
      minutes,
      headsign,
      status: item.attributes.status,
    });
  });

  return results.sort((a, b) => a.minutes - b.minutes);
}

// ===================== RENDER =====================
function renderPanel(panel) {
  const container = document.getElementById(panel.elementId);
  if (!container) return;

  const predContainer = container.querySelector(".predictions");
  if (!predContainer) return;

  predContainer.innerHTML = ""; // clear once
  const alert = getAlertForRoute(panel.routeId);
  if (alert) {
    predContainer.innerHTML += `
        <div class="alert-banner">
          ⚠️ ${alert.attributes.header}
        </div>
      `;
  }

  panel.services.forEach((service) => {
    const key = buildKey(panel, service);
    let preds = getPredictions(realtimeData[key]);

    if (service.headsignContains) {
      preds = preds.filter((p) =>
        p.headsign
          .toLowerCase()
          .includes(service.headsignContains.toLowerCase()),
      );
    }
    let html = "";

    if (preds.length) {
      html += `
        <div class="direction-header">
          <span class="direction-label">${service.label}</span>
        </div>
      `;

      preds.slice(0, 3).forEach((p) => {
        html += `
          <div class="prediction-row">
            <span>${LIVE_ICON}${p.headsign}</span>
            <span>${formatTime(p.minutes)}</span>
          </div>
        `;
      });
    }

    predContainer.innerHTML += html;
  });

  if (!predContainer.innerHTML.trim()) {
    predContainer.innerHTML = '<div class="no-trains">No trains</div>';
  }
}

function renderWeather() {
  const container = document.getElementById("weather-box");
  if (!container || !cacheWeather?.length || !detailedWeather?.length) return;

  const current = cacheWeather[0];
  const currentDeatailed = detailedWeather[0];
  const tempF = current.temperature;
  const description = current.shortForecast;
  const detailedDesc = currentDeatailed.detailedForecast;
  console.log(detailedDesc);

  container.innerHTML = `
  <div class="weather-content">
    <div class="weather-left">
      <div class="weather-desc">${description}</div>
      <img class="weather-icon" src="${current.icon}" alt="${description}">
      <div class="weather-detail">${detailedDesc}</div> 
    </div>

    <div class="weather-right">
      <div class="weather-temp">${tempF}°F</div>
      <div class="weather-location">Boston, MA</div>
      <div class="weather-date">${new Date().toLocaleDateString()}</div>
    </div>
  </div>
`;
}

// ===================== UPDATE LOOP =====================
async function updateAll() {
  await fetchRealtime();
  await fetchAlerts();
  await fetchHourlyForecast();
  await fetchDeatailedForecast();

  PANELS.forEach(renderPanel);
  renderWeather();

  const ts = document.getElementById("timestamp");
  if (ts) ts.textContent = new Date().toLocaleTimeString();
}

// ===================== START =====================
console.log("Starting scalable MBTA tracker");
updateAll();
setInterval(updateAll, 15000);
