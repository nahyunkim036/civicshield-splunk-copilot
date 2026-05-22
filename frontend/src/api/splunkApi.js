const API_BASE_URL = "http://localhost:8001";

async function fetchJson(url) {

  const response = await fetch(url);

  if (!response.ok) {

    throw new Error(`Request failed: ${response.status}`);

  }

  return response.json();

}

export async function fetchSecurityBundle(scenarioId) {

  const query = scenarioId ? `?scenario_id=${scenarioId}` : "";

  const [analysis, attackFlow, logs] = await Promise.all([

    fetchJson(`${API_BASE_URL}/api/splunk/analysis${query}`),

    fetchJson(`${API_BASE_URL}/api/splunk/attack-flow${query}`),

    fetchJson(`${API_BASE_URL}/api/splunk/logs${query}`),

  ]);

  return {

    analysis,

    attackFlow,

    logs: logs.events || [],

  };

}