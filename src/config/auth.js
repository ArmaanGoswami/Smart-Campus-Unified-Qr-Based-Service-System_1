// ─── Auth State (in-memory, persists for session) ───────────────────────────
let _token = null;
let _role = null;
let _username = null;

export function setAuth(token, role, username) {
  _token = token;
  _role = role;
  _username = username;
}

export function getToken() {
  return _token;
}

export function getRole() {
  return _role;
}

export function getUsername() {
  return _username;
}

export function clearAuth() {
  _token = null;
  _role = null;
  _username = null;
}

export function isLoggedIn() {
  return !!_token;
}
