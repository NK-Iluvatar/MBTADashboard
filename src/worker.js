export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
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
    
    // Serve static assets
    return env.ASSETS.fetch(request);
  }
};
