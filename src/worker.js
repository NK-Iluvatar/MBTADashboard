const JSON_HEADERS = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
};

/**
 * Create a JSON HTTP response
 * @param {*} body - data to dislay as JSON
 * @param {number} status - HTTP ststus code
 * @returns {Response}
 */
function jsonResponse(body, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: JSON_HEADERS,
    });
}

/**
 * Proxy a request to an the API.
 * @param {*} apiUrl - fully conctructed url
 * @param {*} options - optional opstions such as headers
 * @returns {Promise<Response>}
 */
async function proxyRequest(apiUrl, options = {}) {
    const response = await fetch(apiUrl, options);
    if (!response.ok) {
        return jsonResponse(
            { error: "API error", status: response.status },
            response.status,
        );
    }
    return new Response(response.body, {
        headers: JSON_HEADERS,
    });
}

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        // Try to serve static assets first (HTML, CSS, JS)
        try {
            const asset = await env.ASSETS.fetch(request);
            if (asset.status !== 404) {
                return asset;
            }
        } catch (e) {
            // Asset not found, continue to API routes
        }

        // Handle API requests
        if (url.pathname.startsWith("/api/")) {
            // MBTA API proxy
            if (url.pathname.startsWith("/api/mbta")) {
                if (!env.MBTA_API_KEY) {
                    return jsonResponse({ error: "Missing MBTA_API_KEY" }, 500);
                }
                const mbtaPath = url.pathname.replace("/api/mbta", "");
                const params = new URLSearchParams(url.search);
                params.set("api_key", env.MBTA_API_KEY);
                const apiUrl = `https://api-v3.mbta.com${mbtaPath}?${params}`;
                return proxyRequest(apiUrl);
            }

            // weather API proxy
            if (url.pathname.startsWith("/api/weather")) {
                const weatherPath = url.pathname.replace("/api/weather", "");
                if (!weatherPath) {
                    return jsonResponse({ error: "Missing weathr path" }, 400);
                }
                const apiUrl = `https://api.weather.gov${weatherPath}${url.search}`;
                return proxyRequest(apiUrl, {
                    headers: {
                        "User-Agent": `MBTADashboard/1.0 (${env.WEATHER_CONTACT})`,
                        Accept: "application/geo+json",
                    },
                });
            }

            // Blue Bikes API proxy
            /** 
            if (url.pathname === "/api/bluebikes") {
                return proxyRequest(
                    "https://gbfs.bluebikes.com/gbfs/en/station_status.json",
                );
            }
            */
        }

        // If we get here, try root path for index.html
        if (url.pathname === "/") {
            return env.ASSETS.fetch(new Request("/index.html", request));
        }

        return new Response("Not Found", { status: 404 });
    },
};
