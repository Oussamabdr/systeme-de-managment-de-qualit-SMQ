export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // Simple health endpoint and placeholder API route for Cloudflare Workers.
    if (url.pathname === '/api/health' || url.pathname === '/api') {
      return new Response(JSON.stringify({ success: true, message: 'QMS Cloudflare Worker running', path: url.pathname }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // For other requests, show a minimal message.
    if (url.pathname.startsWith('/api')) {
      return new Response(JSON.stringify({ success: false, message: 'API endpoints need implementation for Cloudflare Workers' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 501,
      });
    }

    return new Response('Not found', { status: 404 });
  },
};
