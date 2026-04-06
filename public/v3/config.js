// ===================== CONFIG =====================

function service(routeId, directionId, stopId, destination) {
    const isBlueOrGreen =
        routeId === "Green" || routeId === "Blue" || routeId.startsWith("Green-");
    const isCommuter = routeId.startsWith("CR-");
    const direction = isBlueOrGreen
        ? directionId === 0 ? "Westbound" : "Eastbound"
        : isCommuter
          ? directionId === 0 ? "Outbound" : "Inbound"
          : directionId === 0 ? "Southbound" : "Northbound";

    return { routeId, label: direction, directionId, stopId, headsignContains: destination };
}

const PANELS = [
    // South Station – Red Line
    {
        title: "Red Line",
        elementId: "south-station-red",
        StationName: "South Station",
        walkMin: 7,
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
        StationName: "State Station",
        walkMin: 9,
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
        StationName: "State Station",
        walkMin: 9,
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
        walkMin: 16,
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
        title: "Greenbush",
        elementId: "south-station-cr-greenbush",
        StationName: "South Station",
        walkMin: 7,
        routeId: "CR-Greenbush",
        services: [service("CR-Greenbush", 0, "place-sstat", "Greenbush")],
    },
    {
        title: "Fairmount",
        elementId: "south-station-cr-fairmount",
        StationName: "South Station",
        walkMin: 7,
        routeId: "CR-Fairmount",
        services: [
            service("CR-Fairmount", 0, "place-sstat", "Readville"),
            service("CR-Fairmount", 0, "place-sstat", "Fairmount"),
        ],
    },
    {
        title: "Fall River/New Bedford",
        elementId: "south-station-cr-newbedford",
        StationName: "South Station",
        walkMin: 7,
        routeId: "CR-NewBedford",
        services: [
            service("CR-NewBedford", 0, "place-sstat", "New Bedford"),
            service("CR-NewBedford", 0, "place-sstat", "Fall River"),
        ],
    },
    {
        title: "Framingham/Worcester",
        elementId: "south-station-cr-worcester",
        StationName: "South Station",
        walkMin: 7,
        routeId: "CR-Worcester",
        services: [
            service("CR-Worcester", 0, "place-sstat", "Worcester"),
            service("CR-Worcester", 0, "place-sstat", "Framingham"),
        ],
    },
    {
        title: "Franklin/Foxboro",
        elementId: "south-station-cr-franklin",
        StationName: "South Station",
        walkMin: 7,
        routeId: "CR-Franklin",
        services: [
            service("CR-Franklin", 0, "place-sstat", "Foxboro"),
            service("CR-Franklin", 0, "place-sstat", "Forge Park"),
            service("CR-Franklin", 0, "place-sstat", "Walpole"),
        ],
    },
    {
        title: "Providence/Stoughton",
        elementId: "south-station-cr-providence",
        StationName: "South Station",
        walkMin: 7,
        routeId: "CR-Providence",
        services: [
            service("CR-Providence", 0, "place-sstat", "Providence"),
            service("CR-Providence", 0, "place-sstat", "Wickford"),
            service("CR-Providence", 0, "place-sstat", "Stoughton"),
        ],
    },
    {
        title: "Kingston",
        elementId: "south-station-cr-kingston",
        StationName: "South Station",
        walkMin: 7,
        routeId: "CR-Kingston",
        services: [service("CR-Kingston", 0, "place-sstat", "Kingston")],
    },
    {
        title: "Needham",
        elementId: "south-station-cr-needham",
        StationName: "South Station",
        walkMin: 7,
        routeId: "CR-Needham",
        services: [service("CR-Needham", 0, "place-sstat", "Needham")],
    },
    // Ferry – Rowes Wharf
    {
        title: "(F1) RW",
        elementId: "boat-rowes-boat-f1",
        StationName: "Rowes Wharf",
        walkMin: 5,
        routeId: "Boat-F1",
        services: [service("Boat-F1", 0, "Boat-Rowes", "Hingham")],
    },
    {
        title: "(F2H) LWN",
        elementId: "boat-long-boat-f1",
        StationName: "Long Wharf North",
        walkMin: 5,
        routeId: "Boat-F1",
        services: [
            service("Boat-F1", 0, "Boat-Long", "Hingham via Hull"),
            service("Boat-F1", 0, "Boat-Long", "Hull"),
            service("Boat-F1", 0, "Boat-Long", "Hingham via Logan Airport & Hull"),
            service("Boat-F1", 0, "Boat-Long", "HingHam via Logan Airport"),
            service("Boat-F1", 0, "Boat-Long", "Hingham"),
            service("Boat-F1", 0, "Boat-Long", "Hull via Logan Airport"),
        ],
    },
    {
        title: "(F4) LWS",
        elementId: "long-wharf-south-boat-f4",
        StationName: "Long Wharf South",
        walkMin: 10,
        routeId: "Boat-F4",
        services: [service("Boat-F4", 0, "Boat-Long-South", "Charlestown")],
    },
    {
        title: "(F3) LWN",
        elementId: "boat-long-boat-eastboston",
        StationName: "Long Wharf North",
        walkMin: 12,
        routeId: "Boat-EastBoston",
        services: [service("Boat-EastBoston", 0, "Boat-Long", "Lewis Mall")],
    },
    {
        title: "(F5) LWN",
        elementId: "boat-long-boat-lynn",
        StationName: "Long Wharf North",
        walkMin: 12,
        routeId: "Boat-Lynn",
        services: [service("Boat-Lynn", 0, "Boat-Long", "Blossom Street")],
    },
    {
        title: "(F6) - AQ",
        elementId: "boat-aquarium-boat-f6",
        StationName: "Aquarium",
        walkMin: 8,
        routeId: "Boat-F6",
        services: [service("Boat-F6", 0, "Boat-Aquarium", "Winthrop")],
    },
    {
        title: "(F7) - AQ",
        elementId: "boat-aquarium-boat-f7",
        StationName: "Aquarium",
        walkMin: 8,
        routeId: "Boat-F7",
        services: [service("Boat-F7", 0, "Boat-Aquarium", "Quincy")],
    },
    // North Station – Commuter Rail
    {
        title: "Fitchburg",
        elementId: "north-station-cr-fitchburg",
        StationName: "North Station",
        walkMin: 21,
        routeId: "CR-Fitchburg",
        services: [
            service("CR-Fitchburg", 0, "place-north", "Fitchburg"),
            service("CR-Fitchburg", 0, "place-north", "Wachusett"),
        ],
    },
    {
        title: "Lowell",
        elementId: "north-station-cr-lowell",
        StationName: "North Station",
        walkMin: 21,
        routeId: "CR-Lowell",
        services: [service("CR-Lowell", 0, "place-north", "Lowell")],
    },
    {
        title: "Haverhill",
        elementId: "north-station-cr-haverhill",
        StationName: "North Station",
        walkMin: 21,
        routeId: "CR-Haverhill",
        services: [
            service("CR-Haverhill", 0, "place-north", "Haverhill"),
            service("CR-Haverhill", 0, "place-north", "Bradford"),
        ],
    },
    {
        title: "Newburyport/Rockport",
        elementId: "north-station-cr-newburyport",
        StationName: "North Station",
        walkMin: 21,
        routeId: "CR-Newburyport",
        services: [
            service("CR-Newburyport", 0, "place-north", "Newburyport"),
            service("CR-Newburyport", 0, "place-north", "Rockport"),
            service("CR-Newburyport", 0, "place-north", "Gloucester"),
        ],
    },
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
    {
        stationName: "South Station",
        elementId: "south-station-red",
        walkMin: 7,
        headerRouteIds: ["Red"],
        panelRouteIds: ["Red"],
    },
    {
        stationName: "State Street",
        elementId: "state-station-orange",
        walkMin: 9,
        headerRouteIds: ["Orange", "Blue"],
        panelRouteIds: ["Orange", "Blue"],
    },
    {
        stationName: "Park Street",
        elementId: "park-street-green",
        walkMin: 16,
        headerRouteIds: ["Green"],
        panelRouteIds: ["Green"],
    },
];

const BLUEBIKE_STATIONS = [
    "Purchase St at Pearl St",
    "Post Office Square",
    "Rowes Wharf at Atlantic Ave",
];

// Bootstrap icon HTML snippets
const LIVE_ICON     = '<i class="bi bi-broadcast-pin" style="font-size:0.9em; margin-right:4px;"></i>';
const LIVE_ICON_2   = '<i class="bi bi-wifi-2 rotate-315"></i>';
const SCHEDULE_ICON = '<i class="bi bi-calendar-date"></i>';
const WALK_ICON     = '<i class="bi bi-person-walking"></i>';
const TRAIN_ICON    = '<i class="bi bi-train-front"></i>';
const WATER_ICON    = '<i class="bi bi-water"></i>';

// ===================== SHARED HELPERS =====================

function buildKey(panel, service) {
    const routeId = service.routeId ?? panel.routeId;
    return `${routeId}-${service.stopId}-${service.directionId}-${service.headsignContains}`;
}

function formatTime(minutes) {
    if (minutes <= 1) return "Now";
    return `${Math.floor(minutes)}m`;
}
