import { Platform } from 'react-native';
import Constants from 'expo-constants';

const getExpoHostIp = () => {
  const hostUri =
    Constants?.expoConfig?.hostUri ||
    Constants?.manifest2?.extra?.expoGo?.debuggerHost ||
    '';

  if (!hostUri || !hostUri.includes(':')) {
    return '';
  }

  return hostUri.split(':')[0] || '';
};

const createBaseUrls = () => {
  const urls = [];
  const expoHostIp = getExpoHostIp();

  if (Platform.OS === 'android') {
    urls.push('http://10.0.2.2:8080');
    if (expoHostIp) {
      urls.push(`http://${expoHostIp}:8080`);
    }
  }

  if (Platform.OS === 'web') {
    urls.push('http://localhost:8080');
    urls.push('http://127.0.0.1:8080');
  }

  if (Platform.OS !== 'web') {
    urls.push('http://localhost:8080');
  }

  return [...new Set(urls)];
};

const BASE_URLS = createBaseUrls();
const BASE_URL = BASE_URLS[0];

const getGatePassApi = (baseUrl) => `${baseUrl}/api/gate-pass`;
const GATE_PASS_API = getGatePassApi(BASE_URL);

async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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

  for (const baseUrl of BASE_URLS) {
    const endpoint = `${getGatePassApi(baseUrl)}${path}`;

    try {
      response = await fetchWithTimeout(endpoint, options);
      break;
    } catch (error) {
      lastNetworkError = error;
    }
  }

  if (!response) {
    if (lastNetworkError?.name === 'AbortError') {
      throw new Error(`Request timeout: ${GATE_PASS_API}${path} is not reachable.`);
    }
    throw new Error('Network error: Unable to connect to backend. If you are on Android emulator use 10.0.2.2, and if on phone use the same Wi-Fi LAN IP.');
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
    const message = typeof body === 'string' ? body : body?.message || 'Request failed';
    throw new Error(message);
  }

  return body;
}

export { BASE_URL, GATE_PASS_API };

