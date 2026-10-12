const TOKEN_KEY = 'algoarena_token';
let unauthorizedHandler = null;

export function getToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
    localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
    localStorage.removeItem(TOKEN_KEY);
}

export function setUnauthorizedHandler(handler) {
    unauthorizedHandler = handler;
}

function parse(text) {
    try {
        return JSON.parse(text);
    } catch {
        return text;
    }
}

async function request(path, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`/api${path}`, { ...options, headers });
    const text = await response.text();
    const body = text ? parse(text) : null;

    if (!response.ok) {
        if (token && !path.startsWith('/auth') && (response.status === 401 || response.status === 403)) {
            if (unauthorizedHandler) unauthorizedHandler();
        }
        const message = typeof body === 'string' && body ? body : `request failed (${response.status})`;
        throw new Error(message);
    }
    return body;
}

export function login(username, password) {
    return request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) });
}

export function register(username, email, password) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) });
}

export function uploadDataset(name, problemTypeCode, rawInput, sizeMetric) {
    return request('/datasets', {
        method: 'POST',
        body: JSON.stringify({ name, problemTypeCode, rawInput, sizeMetric })
    });
}

export function createRace(datasetId) {
    return request(`/races?datasetId=${datasetId}`, { method: 'POST' });
}

export function startRace(raceId) {
    return request(`/races/${raceId}/start`, { method: 'POST' });
}