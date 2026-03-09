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
  const isBlueOrGreen = routeId === "Green" || routeId === "Blue";
  const direction = isBlueOrGreen
    ? directionId === 0
      ? "Westbound"
      : "Eastbound"
    : directionId === 0
      ? "Southbound"
      : "Northbound";

  return {
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
    routeId: "Blue",
    services: [
      service("Blue", 0, "place-state", "Bowdoin", "Blue-6-0"),
      service("Blue", 1, "place-state", "Wonderland", "Blue-6-1"),
    ],
  },

  // South Station – Commuter Rail
  {
    title: "Greenbush Line",
    elementId: "south-station-cr-greenbush",
    routeId: "CR-Greenbush",
    services: [service("CR-Greenbush", 0, "place-sstat", "Greenbush")],
    // "CR-Greenbush-6d652c57-0" - Greenbush
  },
  {
    title: "Fairmount Line",
    elementId: "south-station-cr-fairmount",
    routeId: "CR-Fairmount",
    services: [
      service("CR-Fairmount", 0, "place-sstat", "Readville"),
      service("CR-Fairmount", 0, "place-sstat", "Fairmount"),
    ],
  },
  {
    title: "Fall River/New Bedford Line",
    elementId: "south-station-cr-newbedford",
    routeId: "CR-NewBedford",
    services: [
      service("CR-NewBedford", 0, "place-sstat", "New Bedford"),
      service("CR-NewBedford", 0, "place-sstat", "Fall River"),
    ],
  },
  {
    title: "Framingham/Worcester Line",
    elementId: "south-station-cr-worcester",
    routeId: "CR-Worcester",
    services: [
      service("CR-Worcester", 0, "place-sstat", "Worcester"),
      service("CR-Worcester", 0, "place-sstat", "Framingham"),
    ],
  },
  {
    title: "Franklin/Foxboro Line",
    elementId: "south-station-cr-franklin",
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
    routeId: "CR-Kingston",
    services: [service("CR-Kingston", 0, "place-sstat", "Kingston")],
  },
  {
    title: "Needham Line",
    elementId: "south-station-cr-needham",
    routeId: "CR-Needham",
    services: [service("CR-Needham", 0, "place-sstat", "Needham")],
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
 * @returns the unique key
 */
function buildKey(panel, service) {
  return `${panel.routeId}-${service.stopId}-${service.directionId}-${service.headsignContains}`;
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
 * @returns the alert
 */
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
/**
 * fetches schedules for upcoming lines and include predictions
 */
async function fetchRealtime() {
  const promises = [];

  PANELS.forEach((panel) => {
    panel.services.forEach((service) => {
      const key = buildKey(panel, service);

      let url;
      url = `/api/mbta/schedules?filter[stop]=${service.stopId}&filter[route]=${panel.routeId}&include=prediction,trip`;
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
 * Gets predictions from the api call for trains; if no predictiosn, default to schedules.
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
    const minutes = (date - now) / 60000;
    if (minutes < -1 || minutes > 180) return;
    const headsign = tripsById[tripId]?.headsign;
    if (!headsign) return;

    const trip = tripsById[tripId];
    if (!trip) return;

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
  // fetch weather every 15 mins
  if (cacheWeather && now - lastWeatherFetch < 15 * 60000) {
    return cacheWeather;
  }

  const url = "/api/weather/gridpoints/BOX/72,90/forecast/hourly";
  const data = await fetchAPI(url);
  cacheWeather = data?.properties?.periods ?? [];
  lastHourlyFetch = now;

  return cacheWeather;
}

/**
 * Calls NWS API for 12 hour forecast
 * @returns detailed description of weather
 */
async function fetchDeatailedForecast() {
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
function getRouteClass(routeId) {
  if (!routeId) return "";

  if (routeId.startsWith("CR-")) return "route-CR";
  if (routeId === "Red") return "route-Red";
  if (routeId === "Orange") return "route-Orange";
  if (routeId === "Blue") return "route-Blue";
  if (routeId === "Green") return "route-Green";

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

  let html = `
        <div class="mbta-card ${routeClass}">
            <div class="mbta-card-header">
                ${panel.title} 
            </div>
            <div class="mbta-card-body">
        `;

  const alert = getAlertForRoute(panel.routeId);
  if (alert) {
    html += `
            <div class="alert-banner">
                ⚠️ ${alert.attributes.header}
            </div>
        `;
  }

  // Group services by direction
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

      const times = preds
        .slice(0, 3)
        .map((p) => {
          return `
              <div class="pred-time ${p.isRealtime ? "realtime" : "scheduled"}">
                  <div class="pred-number">${p.isRealtime ? LIVE_ICON : SCHEDULE_ICON} ${formatTime(p.minutes)}</div>
                  <div class="pred-unit">${p.formattedTime}</div>
              </div>
                    `;
        })
        .join("");

      html += `
                <div class="prediction-row">
                        <div class="destination">
      <div class="destination-main">${destination}</div>
      ${via ? `<div class="destination-via">via ${via}</div>` : ""}
  </div>

                    <div class="pred-times">
                        ${times}
                    </div>
                </div>
            `;
    });
  });

  html += `
            </div>
        </div>
    `;

  predContainer.innerHTML = html;

  if (!predContainer.innerHTML.trim()) {
    predContainer.innerHTML = '<div class="no-trains">No trains</div>';
  }
}

/**
 * Renders the weather short and long description, inclcude an icon, temp F, Location, and Date
 */
function renderWeather() {
  const container = document.getElementById("weather-box");
  if (!container || !cacheWeather?.length || !detailedWeather?.length) return;

  const current = cacheWeather[0];
  const currentDetailed = detailedWeather[0];

  const tempF = Math.round(current.temperature);
  const description = current.shortForecast;
  const detailedDesc = currentDetailed.detailedForecast;

  const date = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  container.innerHTML = `
  <div class="weather-card">

    <div class="weather-left">
      <div class="weather-main">
        <div class="weather-temp">${tempF}°</div>
        <img class="weather-icon" src="${current.icon}" alt="${description}">
      </div>

      <div class="weather-desc">${description}</div>
      <div class="weather-detail">${detailedDesc}</div>
    </div>

    <div class="weather-right">
      <div class="weather-location">Boston, MA</div>
      <div class="weather-date">${date}</div>
      <div id="timestamp" class="timestamp"></div>
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
