export default {
  async fetch(request, env, ctx) {
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
    if (url.pathname.startsWith('/api/')) {
      // MBTA API proxy
      if (url.pathname.startsWith('/api/mbta')) {
        const mbtaPath = url.pathname.replace('/api/mbta', '');
        const apiUrl = `https://api-v3.mbta.com${mbtaPath}${url.search}&api_key=${env.MBTA_API_KEY}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
      
      // Weather (NWS) API proxy
      if (url.pathname.startsWith('/api/weather')) {
        const weatherPath = url.pathname.replace('/api/weather', '');
        const apiUrl = `https://api.weather.gov${weatherPath}${url.search}`;

        const response = await fetch(apiUrl, {
          headers: { 'User-Agent': 'MBTADashboard/1.0' }
        });
        const data = await response.json();

        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Static map proxy — fetches a pre-built OSM static map image
      if (url.pathname === '/api/map') {
        const markers = [
          // Office
          '42.3535,-71.0534,red-pushpin',
          // Transit stops
          '42.3519,-71.0551,orange-pushpin',
          '42.3592,-71.0585,orange-pushpin',
          '42.3563,-71.0621,orange-pushpin',
          // Bluebikes stations
          '42.3549,-71.0527,blue-pushpin',
          '42.3566,-71.0541,blue-pushpin',
          '42.3552,-71.0522,blue-pushpin',
        ].map(m => `&markers=${m}`).join('');

        const mapUrl =
          'https://staticmap.openstreetmap.de/staticmap.php' +
          '?center=42.3558,-71.0580&zoom=15&size=700x280' +
          markers;

        const response = await fetch(mapUrl, {
          headers: { 'User-Agent': 'MBTADashboard/1.0' }
        });
        const body = await response.arrayBuffer();

        return new Response(body, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'image/png',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
          }
        });
      }

      // RSS feed proxy — fetches any RSS/Atom feed with browser-like headers
      if (url.pathname === '/api/rss') {
        const feedUrl = url.searchParams.get('url');
        if (!feedUrl) return new Response('Missing url param', { status: 400 });

        let response;
        try {
          response = await fetch(feedUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml, */*',
              'Accept-Language': 'en-US,en;q=0.9',
              'Cache-Control': 'no-cache',
            }
          });
        } catch (e) {
          return new Response(JSON.stringify({ error: 'fetch_failed', message: e.message }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        const text = await response.text();
        console.log(`[rss] ${feedUrl} → status=${response.status} contentType=${response.headers.get('Content-Type')} bodyStart=${text.slice(0, 200)}`);

        if (!response.ok) {
          return new Response(JSON.stringify({ error: 'upstream_error', status: response.status, body: text.slice(0, 500) }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          });
        }

        return new Response(text, {
          headers: {
            'Content-Type': response.headers.get('Content-Type') || 'application/xml',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=1800',
          }
        });
      }

      // Blue Bikes API proxy — passes path through to the GBFS feed
      if (url.pathname.startsWith('/api/bluebikes')) {
        const bikePath = url.pathname.replace('/api/bluebikes', '') || '/station_status.json';
        const response = await fetch(`https://gbfs.bluebikes.com/gbfs/en${bikePath}`);
        const data = await response.json();

        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }
    
    // If we get here, try root path for index.html
    if (url.pathname === '/') {
      return env.ASSETS.fetch(new Request('/index.html', request));
    }
    
    return new Response('Not Found', { status: 404 });
  }
};
