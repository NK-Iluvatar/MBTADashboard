/**
 * MBTA Green Line & Bus & Blue Bikes Tracker
 * KIOSK MODE - Simple section rotation
 */

const MBTA_API = 'https://api-v3.mbta.com';

// ===== STOPS =====
const GREEN_STOPS = [
    { 
        id: '70111',
        inboundId: '70112',
        elementId: 'south-street',
        name: 'South Street',
        route: 'Green-B',
        isTerminal: false
    },
    { 
        id: 'place-clmnl',
        elementId: 'cleveland-circle',
        name: 'Cleveland Circle',
        route: 'Green-C',
        isTerminal: true
    },
    { 
        id: 'place-rsmnl',
        elementId: 'reservoir',
        name: 'Reservoir',
        route: 'Green-D',
        isTerminal: true
    }
];

const BUS_STOPS = [
    { 
        id: '1030',
        inboundId: '1085',
        elementId: 'bus-86',
        name: 'Route 86',
        location: 'Strathmore Rd & Embassy Rd',
        route: '86'
    },
    { 
        id: '11674',
        inboundId: '1994',
        elementId: 'bus-501',
        name: 'Route 501',
        location: 'Winship St & Waldo Terr',
        route: '501'
    },
    { 
        id: 'place-rsmnl',
        elementId: 'bus-51',
        name: 'Route 51',
        location: 'Reservoir',
        route: '51'
    }
];

const BLUE_BIKE_STATIONS = [
    {
        id: '1960693490199507164',
        elementId: 'bluebike-ledgemere',
        name: 'Chestnut Hill Ave',
        location: 'at Ledgemere Rd'
    },
    {
        id: '51bb4381-dae4-4aeb-b213-0614b807be29',
        elementId: 'bluebike-chiswick',
        name: 'Commonwealth Ave',
        location: 'at Chiswick Rd'
    },
    {
        id: '25a9114f-66f0-427c-920f-5526ca84f056',
        elementId: 'bluebike-cleveland-circle',
        name: 'Cleveland Circle',
        location: 'at Beacon St'
    }
];

// ===== SECTIONS =====
const SECTIONS = [
    { name: 'green', elementId: 'green-section' },
    { name: 'bus', elementId: 'bus-section' },
    { name: 'bikes', elementId: 'bikes-section' }
];

let currentSectionIndex = 0;

// ===== DATA STORAGE =====
let realtimeData = {};
let scheduleData = {};
let bikeData = {};
let alertData = {};

// ===== ICONS =====
const LIVE_ICON = '<i class="bi bi-broadcast-pin"></i>';
const SCHEDULE_ICON = '<i class="bi bi-calendar-date"></i>';

// ===== HELPERS =====
function formatTime(minutes) {
    if (minutes <= 0) return 'Now';
    if (minutes < 2) return '1 min';
    return `${Math.floor(minutes)} min`;
}

async function fetchAPI(url) {
    try {
        // If it's an MBTA API call, proxy it through your worker
        if (url.includes('api-v3.mbta.com')) {
            const urlObj = new URL(url);
            const proxyUrl = `/api/mbta${urlObj.pathname}${urlObj.search}`;
            const res = await fetch(proxyUrl);
            return await res.json();
        }
        // For other APIs (Blue Bikes), use proxy too
        if (url.includes('bluebikes.com')) {
            const res = await fetch('/api/bluebikes');
            return await res.json();
        }
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.log('Fetch error:', e);
        return null;
    }
}

// ===== ALERTS =====
async function fetchAlertsForStops(stops) {
    const promises = [];
    
    stops.forEach(stop => {
        promises.push(
            fetchAPI(`${MBTA_API}/alerts?filter[stop]=${stop.id}`)
                .then(data => { 
                    if (data?.data?.length > 0) {
                        alertData[stop.id] = data;
                    }
                })
        );
        
        if (stop.inboundId && stop.inboundId !== stop.id) {
            promises.push(
                fetchAPI(`${MBTA_API}/alerts?filter[stop]=${stop.inboundId}`)
                    .then(data => { 
                        if (data?.data?.length > 0) {
                            alertData[stop.inboundId] = data;
                        }
                    })
            );
        }
    });
    
    await Promise.all(promises);
}

// ===== SECTION-SPECIFIC FETCHING =====
async function fetchGreenLineData() {
    console.log('Fetching Green Line data...');
    const promises = [];
    
    GREEN_STOPS.forEach(stop => {
        promises.push(
            fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.id}&filter[route]=${stop.route}&filter[direction_id]=0&include=trip`)
                .then(data => { realtimeData[`${stop.id}-out`] = data; })
        );
        
        if (!stop.isTerminal && stop.inboundId) {
            promises.push(
                fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.inboundId}&filter[route]=${stop.route}&filter[direction_id]=1&include=trip`)
                    .then(data => { realtimeData[`${stop.inboundId}-in`] = data; })
            );
        }
        
        if (stop.isTerminal) {
            promises.push(
                fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.id}&filter[route]=${stop.route}&filter[direction_id]=1&include=trip`)
                    .then(data => { realtimeData[`${stop.id}-in`] = data; })
            );
        }
    });
    
    // Fetch tomorrow's schedules for South Street and Cleveland Circle
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(3, 0, 0, 0);
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);
    
    promises.push(
        fetchAPI(`${MBTA_API}/schedules?filter[stop]=70112&filter[route]=Green-B&filter[direction_id]=1&filter[min_time]=${tomorrow.toISOString()}&filter[max_time]=${nextDay.toISOString()}&include=trip&sort=departure_time`)
            .then(data => { if (data?.data) scheduleData['70112-sched'] = data; })
    );
    
    promises.push(
        fetchAPI(`${MBTA_API}/schedules?filter[stop]=place-clmnl&filter[route]=Green-C&filter[direction_id]=1&filter[min_time]=${tomorrow.toISOString()}&filter[max_time]=${nextDay.toISOString()}&include=trip&sort=departure_time`)
            .then(data => { if (data?.data) scheduleData['place-clmnl-sched'] = data; })
    );
    
    // Fetch alerts for Green Line stops
    await fetchAlertsForStops(GREEN_STOPS);
    
    await Promise.all(promises);
}

async function fetchBusData() {
    console.log('Fetching Bus data...');
    const promises = [];
    
    BUS_STOPS.forEach(stop => {
        promises.push(
            fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.id}&filter[route]=${stop.route}&include=trip`)
                .then(data => { realtimeData[`${stop.id}-bus`] = data; })
        );
        if (stop.inboundId) {
            promises.push(
                fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.inboundId}&filter[route]=${stop.route}&include=trip`)
                    .then(data => { realtimeData[`${stop.inboundId}-bus`] = data; })
            );
        }
    });
    
    // Fetch schedule for 501 inbound
    promises.push(
        fetchAPI(`${MBTA_API}/schedules?filter[stop]=1994&filter[route]=501&filter[direction_id]=1&filter[min_time]=${new Date().toISOString()}&include=trip&sort=departure_time&page[limit]=2`)
            .then(data => { if (data?.data) scheduleData['1994-sched'] = data; })
    );
    
    // Fetch alerts for Bus stops
    await fetchAlertsForStops(BUS_STOPS);
    
    await Promise.all(promises);
}

async function fetchBikeData() {
    console.log('Fetching Blue Bikes data...');
    try {
        const res = await fetch('https://gbfs.bluebikes.com/gbfs/en/station_status.json');
        const data = await res.json();
        if (!data?.data?.stations) return;
        
        const stations = {};
        BLUE_BIKE_STATIONS.forEach(s => { stations[s.id] = null; });
        
        data.data.stations.forEach(s => {
            if (stations.hasOwnProperty(s.station_id)) {
                stations[s.station_id] = s;
            }
        });
        
        bikeData = stations;
    } catch (e) {
        console.log('Blue Bikes error:', e);
    }
}

// ===== PROCESS PREDICTIONS =====
function getPredictions(data, isRealtime = true, isCommuterRoute = false) {
    if (!data?.data) return [];
    
    const trips = {};
    if (data.included) {
        data.included.forEach(item => {
            if (item.type === 'trip') trips[item.id] = item.attributes;
        });
    }
    
    const now = new Date();
    const results = [];
    
    data.data.forEach(item => {
        const status = item.attributes.status;
        if (status === 'Stopped' || status === 'Stopped at station') {
            const tripId = item.relationships?.trip?.data?.id;
            const headsign = trips[tripId]?.headsign || 'Train at station';
            
            results.push({
                minutes: 0,
                headsign: headsign,
                isRealtime: true,
                status: 'stopped'
            });
            return;
        }
        
        const timeStr = item.attributes.departure_time || item.attributes.arrival_time;
        if (!timeStr) return;
        
        const minutes = (new Date(timeStr) - now) / 60000;
        
        const maxTime = isCommuterRoute ? 240 : 120;
        if (minutes < 0 || minutes > maxTime) return;
        
        const tripId = item.relationships?.trip?.data?.id;
        const headsign = trips[tripId]?.headsign;
        if (!headsign) return;
        
        results.push({
            minutes,
            headsign,
            isRealtime,
            status: item.attributes.status,
            scheduleRelationship: item.attributes.schedule_relationship
        });
    });
    
    return results.sort((a, b) => a.minutes - b.minutes);
}

function getAlertForStop(stopId, routeId = null) {
    if (!alertData[stopId]) return null;
    
    const alerts = alertData[stopId].data;
    if (!alerts || alerts.length === 0) return null;
    
    const routeAlerts = alerts.filter(alert => {
        const entities = alert.relationships?.informed_entity?.data || [];
        return entities.some(entity => 
            !routeId || 
            (entity.id === routeId) || 
            (entity.type === 'route' && entity.id === routeId)
        );
    });
    
    if (routeAlerts.length === 0) return null;
    
    routeAlerts.sort((a, b) => a.attributes.severity - b.attributes.severity);
    return routeAlerts[0];
}

function renderAlert(alert, direction = '') {
    if (!alert) return '';
    
    const severity = alert.attributes.severity;
    const effect = alert.attributes.effect;
    const header = alert.attributes.header;
    const description = alert.attributes.description;
    
    let alertClass = 'alert-info';
    if (severity <= 5) alertClass = 'alert-high';
    
    let icon = '⚠️';
    if (effect === 'delay') icon = '⏱️';
    else if (effect === 'cancellation') icon = '❌';
    else if (effect === 'suspension') icon = '⏸️';
    else if (effect === 'track_change') icon = '🔄';
    else if (effect === 'detour') icon = '↩️';
    else if (effect === 'shuttle') icon = '🚌';
    
    const directionText = direction ? `${direction} ` : '';
    
    return `
        <div class="alert-banner ${alertClass}">
            <span class="alert-icon">${icon}</span>
            <div class="alert-content">
                <div class="alert-header">${directionText}${header}</div>
                ${description ? `<div class="alert-description">${description}</div>` : ''}
            </div>
        </div>
    `;
}

// ===== RENDER FUNCTIONS =====
function renderStop(elementId, outbound, inbound = null, stopId = null, inboundId = null, routeId = null) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    const predContainer = container.querySelector('.predictions');
    if (!predContainer) return;
    
    let html = '';
    
    if (outbound.length > 0) {
        const outAlert = getAlertForStop(stopId, routeId);
        if (outAlert) {
            html += renderAlert(outAlert, 'outbound');
        }
        
        html += `<div class="direction-header">
                    <span class="direction-label">Outbound</span>
                    <span class="destination-primary">&rarr; ${outbound[0].headsign}</span>
                </div>`;
        
        outbound.slice(0, 4).forEach(p => {
            let timeDisplay = formatTime(p.minutes);
            let statusClass = '';
            let icon = LIVE_ICON;
            
            if (p.status === 'stopped') {
                timeDisplay = 'At station';
                statusClass = 'stopped';
            }
            
            html += `<div class="prediction-row">
                        <span class="destination">${icon} ${p.headsign}</span>
                        <span class="time ${p.minutes <= 1 ? 'now' : ''} ${statusClass}">${timeDisplay}</span>
                    </div>`;
        });
    }
    
    if (inbound && inbound.length > 0) {
        const inAlert = getAlertForStop(inboundId || stopId, routeId);
        if (inAlert) {
            html += renderAlert(inAlert, 'inbound');
        }
        
        html += `<div class="direction-header">
                    <span class="direction-label">Inbound</span>
                    <span class="destination-primary">&rarr; ${inbound[0].headsign}</span>
                </div>`;
        
        inbound.slice(0, 4).forEach(p => {
            let timeDisplay = formatTime(p.minutes);
            let statusClass = '';
            let icon = p.isRealtime ? LIVE_ICON : SCHEDULE_ICON;
            
            if (p.status === 'stopped') {
                timeDisplay = 'At station';
                statusClass = 'stopped';
                icon = LIVE_ICON;
            }
            
            html += `<div class="prediction-row">
                        <span class="destination">${icon} ${p.headsign}</span>
                        <span class="time ${p.minutes <= 1 ? 'now' : ''} ${statusClass}">${timeDisplay}</span>
                    </div>`;
        });
    }
    
    if (outbound.length === 0 && (!inbound || inbound.length === 0)) {
        html = '<div class="no-trains">No trains running</div>';
    }
    
    predContainer.innerHTML = html;
}

function renderRoute86() {
    const container = document.getElementById('bus-86');
    if (!container) return;
    
    const predContainer = container.querySelector('.predictions');
    if (!predContainer) return;
    
    const now = new Date();
    let html = '';
    
    const alert = getAlertForStop('1030');
    if (alert) html += renderAlert(alert);
    
    const strathData = realtimeData['1030-bus'];
    if (strathData?.data?.length > 0) {
        const trips = {};
        if (strathData.included) {
            strathData.included.forEach(item => {
                if (item.type === 'trip') trips[item.id] = item.attributes;
            });
        }
        
        const preds = [];
        strathData.data.forEach(p => {
            const timeStr = p.attributes.departure_time;
            if (!timeStr) return;
            const mins = (new Date(timeStr) - now) / 60000;
            if (mins < 0 || mins > 120) return;
            const tripId = p.relationships?.trip?.data?.id;
            const hs = trips[tripId]?.headsign;
            if (!hs) return;
            preds.push({ minutes: mins, headsign: hs });
        });
        
        preds.sort((a, b) => a.minutes - b.minutes);
        
        if (preds.length > 0) {
            html += `<div class="direction-header">
                        <span class="direction-label">Strathmore Rd</span>
                        <span class="destination-primary">&rarr; ${preds[0].headsign}</span>
                    </div>`;
            preds.slice(0, 2).forEach(p => {
                html += `<div class="prediction-row">
                            <span class="destination">${LIVE_ICON} ${p.headsign}</span>
                            <span class="time ${p.minutes <= 1 ? 'now' : ''}">${formatTime(p.minutes)}</span>
                        </div>`;
            });
        }
    }
    
    const embassyAlert = getAlertForStop('1085');
    if (embassyAlert) html += renderAlert(embassyAlert);
    
    const embassyData = realtimeData['1085-bus'];
    if (embassyData?.data?.length > 0) {
        const trips = {};
        if (embassyData.included) {
            embassyData.included.forEach(item => {
                if (item.type === 'trip') trips[item.id] = item.attributes;
            });
        }
        
        const preds = [];
        embassyData.data.forEach(p => {
            const timeStr = p.attributes.departure_time;
            if (!timeStr) return;
            const mins = (new Date(timeStr) - now) / 60000;
            if (mins < 0 || mins > 120) return;
            const tripId = p.relationships?.trip?.data?.id;
            const hs = trips[tripId]?.headsign;
            if (!hs) return;
            preds.push({ minutes: mins, headsign: hs });
        });
        
        preds.sort((a, b) => a.minutes - b.minutes);
        
        if (preds.length > 0) {
            html += `<div class="direction-header">
                        <span class="direction-label">Embassy Rd</span>
                        <span class="destination-primary">&rarr; ${preds[0].headsign}</span>
                    </div>`;
            preds.slice(0, 2).forEach(p => {
                html += `<div class="prediction-row">
                            <span class="destination">${LIVE_ICON} ${p.headsign}</span>
                            <span class="time ${p.minutes <= 1 ? 'now' : ''}">${formatTime(p.minutes)}</span>
                        </div>`;
            });
        }
    }
    
    predContainer.innerHTML = html || '<div class="no-trains">No buses</div>';
}

function renderRoute501() {
    const container = document.getElementById('bus-501');
    if (!container) return;
    
    const predContainer = container.querySelector('.predictions');
    if (!predContainer) return;
    
    const now = new Date();
    let html = '';
    
    const outData = realtimeData['11674-bus'];
    if (outData?.data?.length > 0) {
        const preds = getPredictions(outData, true, true);
        if (preds.length > 0) {
            html += `<div class="direction-header">
                        <span class="direction-label">Outbound</span>
                        <span class="destination-primary">&rarr; ${preds[0].headsign}</span>
                    </div>`;
            preds.slice(0, 2).forEach(p => {
                const timeDisplay = formatTime(p.minutes);
                const icon = p.scheduleRelationship === 'ADDED' ? SCHEDULE_ICON : LIVE_ICON;
                html += `<div class="prediction-row">
                            <span class="destination">${icon} ${p.headsign}</span>
                            <span class="time ${p.minutes <= 1 ? 'now' : ''}">${timeDisplay}</span>
                        </div>`;
            });
        }
    }
    
    const schedData = scheduleData['1994-sched'];
    if (schedData?.data?.length > 0) {
        const preds = getPredictions(schedData, false, true);
        if (preds.length > 0) {
            html += `<div class="direction-header">
                        <span class="direction-label">Inbound</span>
                        <span class="destination-primary">&rarr; ${preds[0].headsign}</span>
                    </div>`;
            preds.slice(0, 2).forEach(p => {
                const timeDisplay = formatTime(p.minutes);
                html += `<div class="prediction-row">
                            <span class="destination">${SCHEDULE_ICON} ${p.headsign}</span>
                            <span class="time ${p.minutes <= 1 ? 'now' : ''}">${timeDisplay}</span>
                        </div>`;
            });
        }
    }
    
    predContainer.innerHTML = html || '<div class="no-trains">No buses scheduled</div>';
}

function renderRoute51() {
    const container = document.getElementById('bus-51');
    if (!container) return;
    
    const predContainer = container.querySelector('.predictions');
    if (!predContainer) return;
    
    const alert = getAlertForStop('place-rsmnl');
    
    const data = realtimeData['place-rsmnl-bus'];
    if (!data?.data?.length) {
        predContainer.innerHTML = (alert ? renderAlert(alert) : '') + '<div class="no-trains">No buses</div>';
        return;
    }
    
    const now = new Date();
    const trips = {};
    if (data.included) {
        data.included.forEach(item => {
            if (item.type === 'trip') trips[item.id] = item.attributes;
        });
    }
    
    const preds = [];
    data.data.forEach(p => {
        const timeStr = p.attributes.departure_time;
        if (!timeStr) return;
        const mins = (new Date(timeStr) - now) / 60000;
        if (mins < 0 || mins > 120) return;
        const tripId = p.relationships?.trip?.data?.id;
        const hs = trips[tripId]?.headsign;
        if (!hs) return;
        preds.push({ minutes: mins, headsign: hs });
    });
    
    preds.sort((a, b) => a.minutes - b.minutes);
    
    if (preds.length === 0) {
        predContainer.innerHTML = (alert ? renderAlert(alert) : '') + '<div class="no-trains">No buses</div>';
        return;
    }
    
    let html = alert ? renderAlert(alert) : '';
    preds.slice(0, 2).forEach(p => {
        html += `<div class="prediction-row">
                    <span class="destination">${LIVE_ICON} ${p.headsign}</span>
                    <span class="time ${p.minutes <= 1 ? 'now' : ''}">${formatTime(p.minutes)}</span>
                </div>`;
    });
    
    predContainer.innerHTML = html;
}

function renderBlueBikes() {
    BLUE_BIKE_STATIONS.forEach(station => {
        const container = document.getElementById(station.elementId);
        if (!container) return;
        
        const predContainer = container.querySelector('.predictions');
        if (!predContainer) return;
        
        const data = bikeData[station.id];
        if (!data) {
            predContainer.innerHTML = '<div class="no-bikes">No bikes</div>';
            return;
        }
        
        const total = data.num_bikes_available || 0;
        const ebikes = data.num_ebikes_available || 0;
        const classic = total - ebikes;
        
        predContainer.innerHTML = `
            <div class="bike-stats">
                <div class="bike-row"><span class="bike-label"><i class="bi bi-bicycle"></i> Classic</span><span class="bike-count">${classic}</span></div>
                <div class="bike-row"><span class="bike-label"><i class="bi bi-lightning-charge"></i> E-Bike</span><span class="bike-count">${ebikes}</span></div>
                <div class="bike-row total"><span class="bike-label">Total</span><span class="bike-count">${total}</span></div>
            </div>
        `;
    });
}

// ===== RENDER CURRENT SECTION =====
async function renderCurrentSection() {
    const section = SECTIONS[currentSectionIndex];
    
    // Hide all sections, show current
    SECTIONS.forEach(s => {
        const el = document.getElementById(s.elementId);
        if (el) {
            if (s.elementId === section.elementId) {
                el.style.display = 'grid';
            } else {
                el.style.display = 'none';
            }
        }
    });
    
    // Clear old data for this section
    if (section.name === 'green') {
        GREEN_STOPS.forEach(stop => {
            delete realtimeData[`${stop.id}-out`];
            delete realtimeData[`${stop.id}-in`];
            if (stop.inboundId) {
                delete realtimeData[`${stop.inboundId}-in`];
            }
        });
        delete scheduleData['70112-sched'];
        delete scheduleData['place-clmnl-sched'];
    } else if (section.name === 'bus') {
        BUS_STOPS.forEach(stop => {
            delete realtimeData[`${stop.id}-bus`];
            if (stop.inboundId) {
                delete realtimeData[`${stop.inboundId}-bus`];
            }
        });
        delete scheduleData['1994-sched'];
    } else if (section.name === 'bikes') {
        bikeData = {};
    }
    
    alertData = {};
    
    // Fetch and render
    switch(section.name) {
        case 'green':
            await fetchGreenLineData();
            
            const southOut = getPredictions(realtimeData['70111-out']);
            let southIn = getPredictions(realtimeData['70112-in']);
            if (southIn.length === 0 && scheduleData['70112-sched']) {
                southIn = getPredictions(scheduleData['70112-sched'], false);
            }
            renderStop('south-street', southOut, southIn, '70111', '70112', 'Green-B');
            
            const cleveOut = getPredictions(realtimeData['place-clmnl-out']);
            let cleveIn = getPredictions(realtimeData['place-clmnl-in']);
            if (cleveIn.length === 0 && scheduleData['place-clmnl-sched']) {
                cleveIn = getPredictions(scheduleData['place-clmnl-sched'], false);
            }
            renderStop('cleveland-circle', cleveOut, cleveIn, 'place-clmnl', null, 'Green-C');
            
            const resOut = getPredictions(realtimeData['place-rsmnl-out']);
            const resIn = getPredictions(realtimeData['place-rsmnl-in']);
            renderStop('reservoir', resOut, resIn, 'place-rsmnl', null, 'Green-D');
            break;
            
        case 'bus':
            await fetchBusData();
            renderRoute86();
            renderRoute501();
            renderRoute51();
            break;
            
        case 'bikes':
            await fetchBikeData();
            renderBlueBikes();
            break;
    }
    
    // Update timestamp
    const timestampEl = document.getElementById('timestamp');
    if (timestampEl) {
        timestampEl.innerHTML = `${new Date().toLocaleTimeString()}`;
    }
}

// ===== ROTATION =====
function nextSection() {
    currentSectionIndex = (currentSectionIndex + 1) % SECTIONS.length;
    renderCurrentSection();
}

// ===== START =====
console.log('Starting MBTA Tracker - Kiosk Mode...');

// Start with first section
renderCurrentSection();

// Rotate every 15 seconds
setInterval(nextSection, 15000);