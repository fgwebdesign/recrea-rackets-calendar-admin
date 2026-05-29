function apiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL
  if (!raw || raw === 'undefined') {
    throw new Error(
      'Falta NEXT_PUBLIC_API_URL. Configurá la URL del backend (ej. http://localhost:9999) y reiniciá el admin.'
    )
  }
  return raw.replace(/\/$/, '')
}

const API = () => apiBase()

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem('adminToken')}`
  }
}

function friendlyHttpMessage(status: number, bodySnippet: string) {
  if (status === 404) {
    return 'No encontramos este recurso en el servidor. Comprobá que el backend esté actualizado y que NEXT_PUBLIC_API_URL sea correcta.'
  }
  if (status === 401 || status === 403) {
    return 'No tenés permiso o la sesión expiró. Volvé a iniciar sesión.'
  }
  if (bodySnippet && bodySnippet.length < 200 && !/^[\s\n]*[{[]/.test(bodySnippet)) {
    return `Error del servidor (${status}): ${bodySnippet.trim()}`
  }
  return `Error del servidor (${status}).`
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text()
    let message: string | undefined
    try {
      const json = JSON.parse(text) as { message?: string }
      message = json.message
    } catch {
      message = undefined
    }
    const fallback = friendlyHttpMessage(res.status, text)
    throw new Error(message && message !== 'Not Found' ? message : fallback)
  }
  return res.json()
}

// Dashboard
export const getFootballDashboardSummary = () =>
  fetch(`${API()}/football/dashboard/summary`, { headers: authHeaders() }).then(handleResponse)

export const getFootballUpcomingMatches = (limit = 40) =>
  fetch(`${API()}/football/matches/upcoming?limit=${limit}`, { headers: authHeaders() }).then(handleResponse)

// Ligas
export const getFootballLeagues = (page = 1, pageSize = 10) =>
  fetch(`${API()}/football/leagues?page=${page}&pageSize=${pageSize}`, {
    headers: authHeaders()
  }).then(handleResponse)

export const getFootballLeagueById = (id: string) =>
  fetch(`${API()}/football/leagues/${id}`, { headers: authHeaders() }).then(handleResponse)

export const createFootballLeague = (body: object) =>
  fetch(`${API()}/football/leagues`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  }).then(handleResponse)

export const updateFootballLeague = (id: string, body: object) =>
  fetch(`${API()}/football/leagues/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body)
  }).then(handleResponse)

// Equipos
export const joinFootballLeague = (body: object) =>
  fetch(`${API()}/football/leagues/join`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body)
  }).then(handleResponse)

export const removeTeamFromFootballLeague = (league_id: string, team_id: string) =>
  fetch(`${API()}/football/leagues/remove-team`, {
    method: 'DELETE',
    headers: authHeaders(),
    body: JSON.stringify({ league_id, team_id })
  }).then(handleResponse)

export const updateFootballInscriptionPayment = (league_team_id: string, inscription_paid: boolean) =>
  fetch(`${API()}/football/leagues/inscription-payment`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ league_team_id, inscription_paid })
  }).then(handleResponse)

export const updateFootballTeam = (
  leagueId: string,
  teamId: string,
  body: { display_name?: string; image_url?: string | null }
) =>
  fetch(`${API()}/football/leagues/${leagueId}/teams/${teamId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body)
  }).then(handleResponse)

// Fixture
export const generateFootballFixture = (leagueId: string) =>
  fetch(`${API()}/football/leagues/${leagueId}/generate-fixture`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({})
  }).then(handleResponse)

// Partidos
export const getFootballMatchesByLeague = (leagueId: string) =>
  fetch(`${API()}/football/leagues/${leagueId}/matches`, { headers: authHeaders() }).then(handleResponse)

export const updateFootballMatchResult = (matchId: string, home_goals: number, away_goals: number, walkover = false) =>
  fetch(`${API()}/football/matches/${matchId}/result`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ home_goals, away_goals, walkover })
  }).then(handleResponse)

// Standings
export const getFootballStandings = (leagueId: string) =>
  fetch(`${API()}/football/leagues/${leagueId}/standings`, { headers: authHeaders() }).then(handleResponse)

export const recalculateFootballStandings = (leagueId: string) =>
  fetch(`${API()}/football/leagues/${leagueId}/recalculate-standings`, {
    method: 'POST',
    headers: authHeaders()
  }).then(handleResponse)

// Plantel
export const getFootballTeamMembers = (teamId: string) =>
  fetch(`${API()}/football/teams/${teamId}/members`, { headers: authHeaders() }).then(handleResponse)
