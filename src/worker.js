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
      
      // Blue Bikes API proxy
      if (url.pathname === '/api/bluebikes') {
        const response = await fetch('https://gbfs.bluebikes.com/gbfs/en/station_status.json');
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
