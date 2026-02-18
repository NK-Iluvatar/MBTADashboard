/**
 * MBTA Green Line & Bus & Blue Bikes Tracker
 * SIMPLIFIED WORKING VERSION WITH ALERTS
 */

const MBTA_API = 'https://api-v3.mbta.com';
const MBTA_API_KEY = 'API_KEY_PLACEHOLDER';

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

// ===== DATA STORAGE =====
let realtimeData = {};
let scheduleData = {};
let bikeData = {};
let alertData = {};

// ===== ICONS =====
const LIVE_ICON = '<i class="bi bi-broadcast-pin" style="font-size:0.9em; margin-right:4px;"></i>';
const SCHEDULE_ICON = '<i class="bi bi-calendar-date" style="font-size:0.9em; margin-right:4px;"></i>';

// ===== HELPERS =====
function formatTime(minutes) {
    if (minutes <= 0) return 'Now';
    if (minutes < 2) return '1 min';
    return `${Math.floor(minutes)} min`;
}

async function fetchAPI(url) {
    try {
        // Convert MBTA API calls to go through your proxy
        if (url.includes('api-v3.mbta.com')) {
            const proxyUrl = url.replace('https://api-v3.mbta.com', '/api/mbta');
            const res = await fetch(proxyUrl);
            return await res.json();
        }
        // Keep direct fetch for other APIs
        const res = await fetch(url);
        return await res.json();
    } catch (e) {
        console.log('Fetch error:', e);
        return null;
    }
}

// ===== ALERTS =====
async function fetchAlerts() {
    const promises = [];
    
    // Remove ?include=stop from the URL - it's not supported
    GREEN_STOPS.forEach(stop => {
        promises.push(
            fetchAPI(`${MBTA_API}/alerts?filter[stop]=${stop.id}&api_key=${MBTA_API_KEY}`)
                .then(data => { 
                    if (data?.data?.length > 0) {
                        alertData[stop.id] = data;
                    }
                })
        );
        
        if (stop.inboundId && stop.inboundId !== stop.id) {
            promises.push(
                fetchAPI(`${MBTA_API}/alerts?filter[stop]=${stop.inboundId}&api_key=${MBTA_API_KEY}`)
                    .then(data => { 
                        if (data?.data?.length > 0) {
                            alertData[stop.inboundId] = data;
                        }
                    })
            );
        }
    });
    
    BUS_STOPS.forEach(stop => {
        promises.push(
            fetchAPI(`${MBTA_API}/alerts?filter[stop]=${stop.id}&api_key=${MBTA_API_KEY}`)
                .then(data => { 
                    if (data?.data?.length > 0) {
                        alertData[stop.id] = data;
                    }
                })
        );
        if (stop.inboundId) {
            promises.push(
                fetchAPI(`${MBTA_API}/alerts?filter[stop]=${stop.inboundId}&api_key=${MBTA_API_KEY}`)
                    .then(data => { 
                        if (data?.data?.length > 0) {
                            alertData[stop.inboundId] = data;
                        }
                    })
            );
        }
    });
    
    await Promise.all(promises);
    console.log('✅ Alerts fetched');
}

function getAlertForStop(stopId, routeId = null) {
    if (!alertData[stopId]) return null;
    
    const alerts = alertData[stopId].data;
    if (!alerts || alerts.length === 0) return null;
    
    // Filter alerts that affect this specific route
    const routeAlerts = alerts.filter(alert => {
        // Check if alert affects this route
        const entities = alert.relationships?.informed_entity?.data || [];
        return entities.some(entity => 
            !routeId || // If no route specified, include all
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

// ===== REAL-TIME PREDICTIONS =====
async function fetchRealtime() {
    const promises = [];
    
    GREEN_STOPS.forEach(stop => {
        promises.push(
            fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.id}&filter[route]=${stop.route}&filter[direction_id]=0&include=trip&api_key=${MBTA_API_KEY}`)
                .then(data => { realtimeData[`${stop.id}-out`] = data; })
        );
        
        if (!stop.isTerminal && stop.inboundId) {
            promises.push(
                fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.inboundId}&filter[route]=${stop.route}&filter[direction_id]=1&include=trip&api_key=${MBTA_API_KEY}`)
                    .then(data => { realtimeData[`${stop.inboundId}-in`] = data; })
            );
        }
        
        if (stop.isTerminal) {
            promises.push(
                fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.id}&filter[route]=${stop.route}&filter[direction_id]=1&include=trip&api_key=${MBTA_API_KEY}`)
                    .then(data => { realtimeData[`${stop.id}-in`] = data; })
            );
        }
    });
    
    BUS_STOPS.forEach(stop => {
        promises.push(
            fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.id}&filter[route]=${stop.route}&include=trip&api_key=${MBTA_API_KEY}`)
                .then(data => { realtimeData[`${stop.id}-bus`] = data; })
        );
        if (stop.inboundId) {
            promises.push(
                fetchAPI(`${MBTA_API}/predictions?filter[stop]=${stop.inboundId}&filter[route]=${stop.route}&include=trip&api_key=${MBTA_API_KEY}`)
                    .then(data => { realtimeData[`${stop.inboundId}-bus`] = data; })
            );
        }
    });
    
    await Promise.all(promises);
}

// ===== SCHEDULES =====
async function fetchSchedules() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(3, 0, 0, 0);
    
    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const southUrl = `${MBTA_API}/schedules?filter[stop]=70112&filter[route]=Green-B&filter[direction_id]=1&filter[min_time]=${tomorrow.toISOString()}&filter[max_time]=${nextDay.toISOString()}&include=trip&sort=departure_time&api_key=${MBTA_API_KEY}`;
    const southData = await fetchAPI(southUrl);
    if (southData?.data) scheduleData['70112-sched'] = southData;
    
    const clevelandUrl = `${MBTA_API}/schedules?filter[stop]=place-clmnl&filter[route]=Green-C&filter[direction_id]=1&filter[min_time]=${tomorrow.toISOString()}&filter[max_time]=${nextDay.toISOString()}&include=trip&sort=departure_time&api_key=${MBTA_API_KEY}`;
    const clevelandData = await fetchAPI(clevelandUrl);
    if (clevelandData?.data) scheduleData['place-clmnl-sched'] = clevelandData;
    
    const busUrl = `${MBTA_API}/schedules?filter[stop]=1994&filter[route]=501&filter[direction_id]=1&filter[min_time]=${new Date().toISOString()}&include=trip&sort=departure_time&page[limit]=2&api_key=${MBTA_API_KEY}`;
    const busData = await fetchAPI(busUrl);
    if (busData?.data) scheduleData['1994-sched'] = busData;
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
        // Check for stopped trains FIRST
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
        
        // For commuter routes like 501, be more lenient with time windows
        const timeStr = item.attributes.departure_time || item.attributes.arrival_time;
        if (!timeStr) return;
        
        const minutes = (new Date(timeStr) - now) / 60000;
        
        // For 501, include predictions up to 4 hours ahead (since it runs infrequently)
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

// ===== RENDER FUNCTIONS =====
function renderStop(elementId, outbound, inbound = null, stopId = null, inboundId = null, routeId = null) {
    const container = document.getElementById(elementId);
    if (!container) return;
    
    const predContainer = container.querySelector('.predictions');
    if (!predContainer) return;
    
    let html = '';
    
    // Outbound section with its own alert
    if (outbound.length > 0) {
        // Check for outbound-specific alert
        const outAlert = getAlertForStop(stopId, routeId);
        if (outAlert) {
            html += renderAlert(outAlert, 'outbound');
        }
        
        html += `<div class="direction-header">
                    <span class="direction-label">Outbound</span>
                    <span class="destination-primary">→ ${outbound[0].headsign}</span>
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
    
    // Inbound section with its own alert
    if (inbound && inbound.length > 0) {
        // Check for inbound-specific alert
        const inAlert = getAlertForStop(inboundId || stopId, routeId);
        if (inAlert) {
            html += renderAlert(inAlert, 'inbound');
        }
        
        html += `<div class="direction-header">
                    <span class="direction-label">Inbound</span>
                    <span class="destination-primary">→ ${inbound[0].headsign}</span>
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
    
    // No trains at all
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
                        <span class="destination-primary">→ ${preds[0].headsign}</span>
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
                        <span class="destination-primary">→ ${preds[0].headsign}</span>
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
    
    // Outbound (real-time or schedules)
    const outboundKey = '11674-bus';
    const outData = realtimeData[outboundKey];
    
    if (outData?.data?.length > 0) {
        const preds = getPredictions(outData, true, true);
        if (preds.length > 0) {
            html += `<div class="direction-header">
                        <span class="direction-label">Outbound</span>
                        <span class="destination-primary">→ ${preds[0].headsign}</span>
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
    
    // Inbound (schedules only)
    const schedData = scheduleData['1994-sched'];
    if (schedData?.data?.length > 0) {
        const preds = getPredictions(schedData, false, true);
        if (preds.length > 0) {
            html += `<div class="direction-header">
                        <span class="direction-label">Inbound</span>
                        <span class="destination-primary">→ ${preds[0].headsign}</span>
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

// ===== BLUE BIKES =====
async function fetchBlueBikes() {
    try {
        const res = await fetch('/api/bluebikes');
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

// ===== UPDATE ALL =====
// ===== UPDATE ALL =====
async function updateAll() {
    console.log('Updating...');
    
    await fetchRealtime();
    await fetchSchedules();
    await fetchAlerts();
    
    // South Street
    const southOut = getPredictions(realtimeData['70111-out']);
    let southIn = getPredictions(realtimeData['70112-in']);
    if (southIn.length === 0 && scheduleData['70112-sched']) {
        southIn = getPredictions(scheduleData['70112-sched'], false);
    }
    renderStop('south-street', southOut, southIn, '70111', '70112', 'Green-B');
    
    // Cleveland Circle
    const cleveOut = getPredictions(realtimeData['place-clmnl-out']);
    let cleveIn = getPredictions(realtimeData['place-clmnl-in']);
    if (cleveIn.length === 0 && scheduleData['place-clmnl-sched']) {
        cleveIn = getPredictions(scheduleData['place-clmnl-sched'], false);
    }
    renderStop('cleveland-circle', cleveOut, cleveIn, 'place-clmnl', null, 'Green-C');
    
    // Reservoir
    const resOut = getPredictions(realtimeData['place-rsmnl-out']);
    const resIn = getPredictions(realtimeData['place-rsmnl-in']);
    renderStop('reservoir', resOut, resIn, 'place-rsmnl', null, 'Green-D');
    
    // Route 86 - Combined card
    renderRoute86();
    
    // Route 501 - Special handling for commuter route
console.log('501 Debug:');
console.log('- Outbound real-time data:', realtimeData['11674-bus'] ? 'exists' : 'missing');
console.log('- Schedule data:', scheduleData['1994-sched'] ? 'exists' : 'missing');

if (scheduleData['1994-sched']) {
    console.log('- Schedule entries:', scheduleData['1994-sched'].data?.length || 0);
}

const container = document.getElementById('bus-501');
if (container) {
    const predContainer = container.querySelector('.predictions');
    if (predContainer) {
        let html = '';
        
        // Check if we're in PM peak hours (roughly 1:30 PM - 7:30 PM)
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        const timeValue = hour + minute / 60;
        
        // PM Peak: ~1:30 PM to 7:30 PM
        const isPMPeak = timeValue >= 13.5 && timeValue <= 19.5;
        
        // Outbound (real-time with extended window)
        const outData = realtimeData['11674-bus'];
        if (outData?.data?.length > 0) {
            console.log('- Processing outbound data');
            const preds = getPredictions(outData, true, true);
            console.log('- Outbound predictions:', preds.length);
            
            if (preds.length > 0) {
                html += `<div class="direction-header">
                            <span class="direction-label">Outbound</span>
                            <span class="destination-primary">→ ${preds[0].headsign}</span>
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
        
        // If no real-time data and we're in PM peak, show static schedule
        if (outData?.data?.length === 0 && isPMPeak) {
            console.log('- Using static PM peak schedule');
            
            // Calculate minutes until 4:16 PM
            const targetTime = new Date();
            targetTime.setHours(16, 16, 0, 0); // 4:16 PM
            
            // If it's past 4:16 PM today, show tomorrow's 4:16 PM
            if (now > targetTime) {
                targetTime.setDate(targetTime.getDate() + 1);
            }
            
            const minutesUntil = (targetTime - now) / 60000;
            
            html += `<div class="direction-header">
                        <span class="direction-label">Outbound</span>
                        <span class="destination-primary">→ Brighton via Copley</span>
                    </div>`;
            html += `<div class="prediction-row">
                        <span class="destination">${SCHEDULE_ICON} Brighton via Copley</span>
                        <span class="time">${formatTime(minutesUntil)}</span>
                    </div>`;
        }
        
        // Inbound (schedules only)
        const schedData = scheduleData['1994-sched'];
        if (schedData?.data?.length > 0) {
            console.log('- Processing inbound schedule data');
            const preds = getPredictions(schedData, false, true);
            console.log('- Inbound predictions:', preds.length);
            
            if (preds.length > 0) {
                html += `<div class="direction-header">
                            <span class="direction-label">Inbound</span>
                            <span class="destination-primary">→ ${preds[0].headsign}</span>
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
        
        // If no schedule data and we're in PM peak, show static inbound schedule
        if ((!schedData?.data?.length) && isPMPeak) {
            console.log('- Using static PM peak inbound schedule');
            
            // Next inbound might be at 5:00 PM etc
            const targetTime = new Date();
            targetTime.setHours(17, 0, 0, 0); // 5:00 PM
            
            if (now > targetTime) {
                targetTime.setHours(18, 0, 0, 0); // 6:00 PM
            }
            
            const minutesUntil = (targetTime - now) / 60000;
            
            html += `<div class="direction-header">
                        <span class="direction-label">Inbound</span>
                        <span class="destination-primary">→ Downtown via Copley</span>
                    </div>`;
            html += `<div class="prediction-row">
                        <span class="destination">${SCHEDULE_ICON} Downtown via Copley</span>
                        <span class="time">${formatTime(minutesUntil)}</span>
                    </div>`;
        }
        
        predContainer.innerHTML = html || '<div class="no-trains">No buses scheduled</div>';
    }
}
    
    // Route 51
    renderRoute51();
    
    // Blue Bikes
    await fetchBlueBikes();
    renderBlueBikes();
    
    // Timestamp
    document.getElementById('timestamp').innerHTML = `🕒 ${new Date().toLocaleTimeString()}`;
    
    console.log('Done');
}

// ===== START =====
console.log('Starting MBTA Tracker with Alerts...');
updateAll();
setInterval(updateAll, 15000);