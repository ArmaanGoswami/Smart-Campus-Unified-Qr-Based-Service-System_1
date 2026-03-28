const createBaseUrls = () => {
  const urls = [];

  // On web, use the current hostname so localhost/LAN setups work without code changes.
  if (typeof window !== 'undefined' && window.location?.hostname) {
    urls.push(`http://${window.location.hostname}:8080`);
  }

  // Common local development endpoints
  urls.push('http://10.200.3.225:8080'); // User's computer LAN IP
  urls.push('http://10.0.2.2:8080');    // Android Emulator loopback
  urls.push('http://localhost:8080');
  urls.push('http://127.0.0.1:8080');
  urls.push('https://smart-campus-unified-qr-based-service.onrender.com');

  return [...new Set(urls)];
};

const BASE_URLS = createBaseUrls();
const BASE_URL = BASE_URLS[0];

const getGatePassApi = (baseUrl) => `${baseUrl}/api/gate-pass`;
const GATE_PASS_API = getGatePassApi(BASE_URL);

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  // Reduce timeout for local candidates to 3.5s to fail-fast if computer is off/wrong network,
  // but keep longer for Render (production).
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('10.');
  const timeoutMs = isLocal ? 4500 : 25000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function request(path, options = {}) {
  let response;
  let lastNetworkError = null;
  let lastEndpoint = `${GATE_PASS_API}${path}`;

  for (const baseUrl of BASE_URLS) {
    const endpoint = `${getGatePassApi(baseUrl)}${path}`;
    lastEndpoint = endpoint;

    try {
      response = await fetchWithTimeout(endpoint, options);
      break;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  if (!response) {
    if (lastNetworkError?.name === 'AbortError') {
      throw new Error(`Request timeout: ${lastEndpoint} did not respond in time.`);
    }
    throw new Error(`Network error: Unable to connect to backend service at ${lastEndpoint}.`);
  }

  const rawText = await response.text();
  let body = null;

  if (rawText) {
    try {
      body = JSON.parse(rawText);
    } catch (error) {
      body = rawText;
    }
  }

  if (!response.ok) {
    const message = typeof body === 'string'
      ? body
      : body?.message || body?.error || `Request failed with status ${response.status}`;
    throw new Error(`HTTP ${response.status}: ${message}`);
  }

  return body;
}

export { BASE_URL, GATE_PASS_API };

