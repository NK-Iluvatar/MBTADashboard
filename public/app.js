MBTA_API = "https://api-v3.mbta.com";

// ===================== CONFIG =====================
// helper for commuter rail lines with only one service
function crLine(elementId,routeId,destination, stopId= "place-sstat"){
  return {
    elementId,
    routeId,
    services: [
      {
        label: `Southbound → ${destination}`,
        directionId: 0,
        stopId,
        headsignContains: destination,
      },
    ],
  }
}

function service(routeId, directionId, stopId, destination){
  const isBlueOrGreen = routeId === "Green" || routeId === "Blue";
  const direction = isBlueOrGreen 
      ? (directionId === 0 ? "Westbound" : "Eastbound")
      : (directionId === 0 ? "Southbound" : "Northbound");

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
    services: [
      service("CR-Greenbush", 0, "place-sstat", "Greenbush"),
    ],
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
  crLine("cr-south-kingston", "CR-Kingston", "Kingston"),
  crLine("cr-south-needham", "CR-Needham", "Needham"),
];

// ===================== STATE =====================
let realtimeData = {};
// let alertData = {};

const LIVE_ICON =
  '<i class="bi bi-broadcast-pin" style="font-size:0.9em; margin-right:4px;"></i>';

// ===================== HELPERS =====================
// rounds down train departure time
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
// async function fetchAlerts() {
//   const promises = [];
//   // for each panel in PANELS
//   PANELS.forEach((panel) => {
//     // for each service in services
//     panel.services.forEach((service) => {
//       // fetch alerts given the stop
//       promises.push(
//         fetchAPI(`${MBTA_API}/alerts?filter[stop]=${service.stopId}`).then(
//           (data) => {
//             if (data?.data?.length) {
//               alertData[service.stopId] ||= [];
//               alertData[service.stopId].push(...data.data);
//             }
//           }
//         )
//       );
//     });
//   });

//   await Promise.all(promises);
// }

// function getAlertForStop(stopId, routeId) {
//   const data = alertData[stopId];
//   if (!data?.data?.length) return null;

//   const filtered = data.data.filter((alert) => {
//     const entities = alert.relationships?.informed_entity?.data || [];
//     return (!routeId||
//       entities.some(
//       (e) => e.type === "route" && e.id === routeId)||
//       entities.length ===0
//     );
//   });

//   if (!filtered.length) return null;

//   filtered.sort((a, b) => a.attributes.severity - b.attributes.severity);
//   return filtered[0];
// }

// ===================== PREDICTIONS =====================
async function fetchRealtime() {
  const promises = [];

  PANELS.forEach((panel) => {
    panel.services.forEach((service) => {
      const key = buildKey(panel, service);
      const isCommuterRail = panel.routeId.startsWith("CR-")

      let url;

      if (isCommuterRail){
        url=`${MBTA_API}/schedules?filter[stop]=${service.stopId}&filter[route]=${panel.routeId}&include=prediction,trip`;
      } else{
        url=`${MBTA_API}/predictions?filter[stop]=${service.stopId}&filter[route]=${panel.routeId}&include=trip`;
      }

      if (service.directionId !== undefined){
          url += `&filter[direction_id]=${service.directionId}`;
        }

      promises.push(
        fetchAPI(
          url
        ).then((data) => {
          realtimeData[key] = {...data,
            _isCommuterRail: isCommuterRail,
          };
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

    //const alert = getAlertForStop(service.stopId, panel.routeId);

    let html = "";

    // if (alert) {
    //   html += `
    //     <div class="alert-banner">
    //       ⚠️ ${alert.attributes.header}
    //     </div>
    //   `;
    // }

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
  // await fetchAlerts();

  PANELS.forEach(renderPanel);

  const ts = document.getElementById("timestamp");
  if (ts) ts.textContent = new Date().toLocaleTimeString();
}

// ===================== START =====================
console.log("Starting scalable MBTA tracker");
updateAll();
setInterval(updateAll, 15000);
