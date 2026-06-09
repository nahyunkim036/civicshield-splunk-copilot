const API_BASE_URL = "http://localhost:8001";

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed: ${response.status} ${text}`);
  }

  return response.json();
}

export async function fetchSupplyChainEpisode() {
  return fetchJson(`${API_BASE_URL}/api/supply-chain/episode`);
}

export async function fetchResponseAudit() {
  return fetchJson(`${API_BASE_URL}/api/response/audit`);
}

export async function runResponseAction(apiPath, payload) {
  return fetchJson(`${API_BASE_URL}${apiPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}