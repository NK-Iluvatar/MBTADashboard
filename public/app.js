MBTA_API = "https://api-v3.mbta.com";

// ===================== CONFIG =====================
const PANELS = [
  // South Station – Red Line
  {
    title: "South Station — Red Line",
    elementId: "south-station",
    routeId: "Red",
    services: [
      {
        label: "Southbound → Ashmont",
        directionId: 0,
        stopId: "place-sstat",
        headsignContains: "Ashmont",
      },
      {
        label: "Southbound → Braintree",
        directionId: 0,
        stopId: "place-sstat",
        headsignContains: "Braintree",
      },
      {
        label: "Northbound → Alewife",
        directionId: 1,
        stopId: "place-sstat",
        headsignContains: "Alewife",
      },
    ],
  },

  // State Station – Orange Line
  {
    title: "State Station — Orange Line",
    elementId: "state-orange",
    routeId: "Orange",
    services: [
      {
        label: "Southbound → Forest Hills",
        directionId: 0,
        stopId: "place-state",
        headsignContains: "Forest Hills",
      },
      {
        label: "Northbound → Oak Grove",
        directionId: 1,
        stopId: "place-state",
        headsignContains: "Oak Grove",
      },
    ],
  },

  // State Station – Blue Line
  {
    title: "State Station — Blue Line",
    elementId: "state-blue",
    routeId: "Blue",
    services: [
      {
        label: "Southbound → Bowdoin",
        directionId: 0,
        stopId: "place-state",
        headsignContains: "Bowdoin",
      },
      {
        label: "Northbound → Wonderland",
        directionId: 1,
        stopId: "place-state",
        headsignContains: "Wonderland",
      },
    ],
  },
];

// ===================== STATE =====================
let realtimeData = {};
let alertData = {};

const LIVE_ICON =
  '<i class="bi bi-broadcast-pin" style="font-size:0.9em; margin-right:4px;"></i>';

// ===================== HELPERS =====================
function formatTime(minutes) {
  if (minutes <= 0) return "Now";
  if (minutes < 2) return "1 min";
  return `${Math.floor(minutes)} min`;
}

function buildKey(panel, service) {
  return `${panel.routeId}-${service.stopId}-${service.directionId}-${service.headsignContains}`;
}

async function fetchAPI(url) {
  try {
    const urlObj = new URL(url);
    const proxyUrl = `/api/mbta${urlObj.pathname}${urlObj.search}`;
    const res = await fetch(proxyUrl);
    return await res.json();
  } catch (e) {
    console.error("Fetch error:", e);
    return null;
  }
}

// ===================== ALERTS =====================
async function fetchAlerts() {
  const promises = [];

  PANELS.forEach((panel) => {
    panel.services.forEach((service) => {
      promises.push(
        fetchAPI(`${MBTA_API}/alerts?filter[stop]=${service.stopId}`).then(
          (data) => {
            if (data?.data?.length) {
              alertData[service.stopId] = data;
            }
          }
        )
      );
    });
  });

  await Promise.all(promises);
}

function getAlertForStop(stopId, routeId) {
  const data = alertData[stopId];
  if (!data?.data?.length) return null;

  const filtered = data.data.filter((alert) => {
    const entities = alert.relationships?.informed_entity?.data || [];
    return entities.some(
      (e) => !routeId || (e.type === "route" && e.id === routeId)
    );
  });

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

      promises.push(
        fetchAPI(
          `${MBTA_API}/predictions?filter[stop]=${service.stopId}&filter[route]=${panel.routeId}&filter[direction_id]=${service.directionId}&include=trip`
        ).then((data) => {
          realtimeData[key] = data;
        })
      );
    });
  });

  await Promise.all(promises);
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
    if (minutes < -1 || minutes > 120) return;

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

  panel.services.forEach((service) => {
    const key = buildKey(panel, service);
    let preds = getPredictions(realtimeData[key]);

    if (service.headsignContains) {
      preds = preds.filter((p) =>
        p.headsign
          .toLowerCase()
          .includes(service.headsignContains.toLowerCase())
      );
    }

    const alert = getAlertForStop(service.stopId, panel.routeId);

    let html = "";

    if (alert) {
      html += `
        <div class="alert-banner">
          ⚠️ ${alert.attributes.header}
        </div>
      `;
    }

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

// ===================== UPDATE LOOP =====================
async function updateAll() {
  await fetchRealtime();
  await fetchAlerts();

  PANELS.forEach(renderPanel);

  const ts = document.getElementById("timestamp");
  if (ts) ts.textContent = new Date().toLocaleTimeString();
}

// ===================== START =====================
console.log("Starting scalable MBTA tracker");
updateAll();
setInterval(updateAll, 15000);
