const API_ORIGIN = window.location.port === "3000" || window.location.port === ""
  ? ""
  : "http://localhost:3000";
const API_BASE = `${API_ORIGIN}/api/users`;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Error en la solicitud");
  }

  return data;
}

export async function registerUser(payload) {
  return request("/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return request("/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
