// ===================== CONFIG =====================

function service(routeId, directionId, stopId, destination) {
    return { routeId, directionId, stopId, headsignContains: destination };
}

const PANELS = [
    // South Station – Red Line
    {
        title: "Red Line",
        routeId: "Red",
        services: [
            service("Red", 0, "place-sstat", "Ashmont"),
            service("Red", 0, "place-sstat", "Braintree"),
            service("Red", 1, "place-sstat", "Alewife"),
        ],
    },
    // State Station – Orange Line
    {
        title: "Orange Line",
        routeId: "Orange",
        services: [
            service("Orange", 0, "place-state", "Forest Hills"),
            service("Orange", 1, "place-state", "Oak Grove"),
        ],
    },
    // State Station – Blue Line
    {
        title: "Blue Line",
        routeId: "Blue",
        services: [
            service("Blue", 0, "place-state", "Bowdoin"),
            service("Blue", 1, "place-state", "Wonderland"),
        ],
    },
    // Park Street – Green Line (all branches)
    {
        title: "Green Line",
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
    { title: "Greenbush",            routeId: "CR-Greenbush",  services: [service("CR-Greenbush",  0, "place-sstat", "Greenbush")] },
    { title: "Fairmount",            routeId: "CR-Fairmount",  services: [service("CR-Fairmount",  0, "place-sstat", "Readville"), service("CR-Fairmount", 0, "place-sstat", "Fairmount")] },
    { title: "Fall River/New Bedford",routeId: "CR-NewBedford", services: [service("CR-NewBedford", 0, "place-sstat", "New Bedford"), service("CR-NewBedford", 0, "place-sstat", "Fall River")] },
    { title: "Framingham/Worcester", routeId: "CR-Worcester",  services: [service("CR-Worcester",  0, "place-sstat", "Worcester"), service("CR-Worcester", 0, "place-sstat", "Framingham")] },
    { title: "Franklin/Foxboro",     routeId: "CR-Franklin",   services: [service("CR-Franklin",   0, "place-sstat", "Foxboro"), service("CR-Franklin", 0, "place-sstat", "Forge Park"), service("CR-Franklin", 0, "place-sstat", "Walpole")] },
    { title: "Providence/Stoughton", routeId: "CR-Providence", services: [service("CR-Providence", 0, "place-sstat", "Providence"), service("CR-Providence", 0, "place-sstat", "Wickford"), service("CR-Providence", 0, "place-sstat", "Stoughton")] },
    { title: "Kingston",             routeId: "CR-Kingston",   services: [service("CR-Kingston",   0, "place-sstat", "Kingston")] },
    { title: "Needham",              routeId: "CR-Needham",    services: [service("CR-Needham",    0, "place-sstat", "Needham")] },
    // Ferry
    { title: "(F1) RW",  routeId: "Boat-F1",       services: [service("Boat-F1", 0, "Boat-Rowes", "Hingham")] },
    {
        title: "(F2H) LWN", routeId: "Boat-F1",
        services: [
            service("Boat-F1", 0, "Boat-Long", "Hingham via Hull"),
            service("Boat-F1", 0, "Boat-Long", "Hull"),
            service("Boat-F1", 0, "Boat-Long", "Hingham via Logan Airport & Hull"),
            service("Boat-F1", 0, "Boat-Long", "HingHam via Logan Airport"),
            service("Boat-F1", 0, "Boat-Long", "Hingham"),
            service("Boat-F1", 0, "Boat-Long", "Hull via Logan Airport"),
        ],
    },
    { title: "(F4) LWS",  routeId: "Boat-F4",       services: [service("Boat-F4",       0, "Boat-Long-South", "Charlestown")] },
    { title: "(F3) LWN",  routeId: "Boat-EastBoston",services: [service("Boat-EastBoston",0, "Boat-Long",       "Lewis Mall")] },
    { title: "(F5) LWN",  routeId: "Boat-Lynn",      services: [service("Boat-Lynn",     0, "Boat-Long",       "Blossom Street")] },
    { title: "(F6) - AQ", routeId: "Boat-F6",        services: [service("Boat-F6",       0, "Boat-Aquarium",   "Winthrop")] },
    { title: "(F7) - AQ", routeId: "Boat-F7",        services: [service("Boat-F7",       0, "Boat-Aquarium",   "Quincy")] },
    // North Station – Commuter Rail
    { title: "Fitchburg",          routeId: "CR-Fitchburg",   services: [service("CR-Fitchburg",   0, "place-north", "Fitchburg"), service("CR-Fitchburg", 0, "place-north", "Wachusett")] },
    { title: "Lowell",             routeId: "CR-Lowell",      services: [service("CR-Lowell",      0, "place-north", "Lowell")] },
    { title: "Haverhill",          routeId: "CR-Haverhill",   services: [service("CR-Haverhill",   0, "place-north", "Haverhill"), service("CR-Haverhill", 0, "place-north", "Bradford")] },
    { title: "Newburyport/Rockport",routeId: "CR-Newburyport",services: [service("CR-Newburyport", 0, "place-north", "Newburyport"), service("CR-Newburyport", 0, "place-north", "Rockport"), service("CR-Newburyport", 0, "place-north", "Gloucester")] },
];

const SOUTHSTATIONCR = [
    "CR-Greenbush", "CR-Fairmount", "CR-NewBedford", "CR-Worcester",
    "CR-Franklin", "CR-Providence", "CR-Kingston", "CR-Needham",
];

const NORTHSTATIONCR = [
    "CR-Fitchburg", "CR-Lowell", "CR-Haverhill", "CR-Newburyport",
];

const FERRY = [
    "Boat-F4", "Boat-F1", "Boat-EastBoston", "Boat-Lynn", "Boat-F6", "Boat-F7",
];

const SUBWAY_STATION_GROUPS = [
    { stationName: "South Station", elementId: "south-station-red",    walkMin: 7,  panelRouteIds: ["Red"] },
    { stationName: "State Street",  elementId: "state-station-orange",  walkMin: 9,  panelRouteIds: ["Orange", "Blue"] },
    { stationName: "Park Street",   elementId: "park-street-green",     walkMin: 16, panelRouteIds: ["Green"] },
];

const LIVE_ICON     = '<i class="bi bi-broadcast-pin" style="font-size:0.9em; margin-right:4px;"></i>';
const SCHEDULE_ICON = '<i class="bi bi-calendar-date"></i>';
const WALK_ICON     = '<i class="bi bi-person-walking"></i>';

function buildKey(panel, svc) {
    const routeId = svc.routeId ?? panel.routeId;
    return `${routeId}-${svc.stopId}-${svc.directionId}-${svc.headsignContains}`;
}

function formatTime(minutes) {
    if (minutes <= 1) return "Now";
    return `${Math.floor(minutes)}m`;
}
