export const BASE_URL = process.env.PB_URL || "http://127.0.0.1:8091";
export const SUPERUSER_EMAIL = process.env.PB_SUPERUSER_EMAIL || "admin@lalithanaturals.local";
export const SUPERUSER_PASSWORD = process.env.PB_SUPERUSER_PASSWORD || "TestAdmin123!";

export async function api(method, path, { body, token, isForm = false } = {}) {
  const headers = {};
  if (token) headers["Authorization"] = token;
  let payload = body;
  if (body && !isForm) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* non-JSON response */ }
  return { status: res.status, ok: res.ok, json, text };
}

export async function authAsSuperuser() {
  const { json } = await api("POST", "/api/collections/_superusers/auth-with-password", {
    body: { identity: SUPERUSER_EMAIL, password: SUPERUSER_PASSWORD },
  });
  if (!json?.token) throw new Error("failed to authenticate as superuser: " + JSON.stringify(json));
  return json.token;
}

export async function authAsUser(email, password) {
  const { json } = await api("POST", "/api/collections/users/auth-with-password", {
    body: { identity: email, password },
  });
  if (!json?.token) throw new Error("failed to authenticate as user: " + JSON.stringify(json));
  return json;
}

let counter = 0;
export function unique(prefix) {
  counter += 1;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now()}_${counter}_${rand}`;
}

/** Creates a branch + staff + login-capable user in one go, scoped to that branch. */
export async function createBranchStaffUser(superToken, { role = "staff", branchName } = {}) {
  const branch = (await api("POST", "/api/collections/branches/records", {
    token: superToken,
    body: { name: branchName || unique("Branch"), address: "Test Address", is_active: true },
  })).json;

  const staff = (await api("POST", "/api/collections/staff/records", {
    token: superToken,
    body: { name: unique("Staff"), branch: branch.id, is_active: true },
  })).json;

  const email = `${unique("user")}@test.local`;
  const password = "TestPass123!";
  const userRes = await api("POST", "/api/collections/users/records", {
    token: superToken,
    body: {
      email,
      password,
      passwordConfirm: password,
      staff: staff.id,
      role,
      emailVisibility: true,
      verified: true,
    },
  });
  if (!userRes.ok) throw new Error("failed to create user: " + JSON.stringify(userRes.json));

  const auth = await authAsUser(email, password);
  return { branch, staff, user: userRes.json, token: auth.token };
}
