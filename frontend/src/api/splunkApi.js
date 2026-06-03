const API_BASE_URL = "http://localhost:8001";

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

export async function fetchSecurityBundle(scenarioId) {
  const query = scenarioId ? `?scenario_id=${scenarioId}` : "";

  const [analysis, attackFlow, story, logs] = await Promise.all([
    fetchJson(`${API_BASE_URL}/api/splunk/analysis${query}`),
    fetchJson(`${API_BASE_URL}/api/splunk/attack-flow${query}`),
    fetchJson(`${API_BASE_URL}/api/splunk/story${query}`),
    fetchJson(`${API_BASE_URL}/api/splunk/logs${query}`),
  ]);

  return {
    analysis,
    attackFlow,
    story,
    logs: logs.events || [],
  };
}

export async function fetchSupplyChainEpisode() {
  return fetchJson(`${API_BASE_URL}/api/supply-chain/episode`);
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

export async function fetchResponseAudit() {
  return fetchJson(`${API_BASE_URL}/api/response/audit`);
}