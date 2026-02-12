/**
 * Servicio para gestión manual de scheduling de torneos
 * Integra los endpoints: manual-scheduling-context, unscheduled, available-slots-for-day,
 * reschedule, assign-day, schedule-matches
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999'

export interface Franja {
  id: string
  label: string
  date?: string
  tournament_day: number
  start_time: string
  end_time: string
}

export interface GroupWithRestrictions {
  id: string
  group_number: number
  assigned_franja: string | null
  preferred_day: string | null
  team_restrictions?: Array<{ display_name: string; unavailable_times: string[] }>
  allowed_franja_ids?: string[]
  blocked_franjas?: Array<{
    franja_id: string
    franja_label: string
    blocked_by: Array<{ display_name: string }>
  }>
}

export interface ManualSchedulingContext {
  tournament: { id: string; name: string; tournament_type: string }
  courts: Array<{ id: string; name: string; venue_id?: string }>
  franjas: Franja[]
  groups: GroupWithRestrictions[]
  unscheduled_matches_count: number
  instructions?: Record<string, string>
}

export interface UnscheduledMatch {
  id: string
  group_number: number
  match_number: number
  tournament_day: number | null
  start_time: string | null
  court_id: string | null
  home_team: {
    id: string
    players?: string[] | { player1?: { first_name?: string; last_name?: string }; player2?: { first_name?: string; last_name?: string } }
  } | null
  away_team: {
    id: string
    players?: string[] | { player1?: { first_name?: string; last_name?: string }; player2?: { first_name?: string; last_name?: string } }
  } | null
  needs: { day: boolean; time: boolean; court: boolean }
  needs_manual?: boolean
}

export interface AvailableSlot {
  tournament_day: number
  start_time: string
  court_id: string
  court_name: string
  franja_label: string
  franja_id?: string
  venue_id?: string
}

export interface AssignDayResult {
  message: string
  group: { id: string; group_number: number; new_franja_label: string }
  matches: { ready_for_auto_scheduling: number }
  next_steps?: { action: string; endpoint?: string }
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `HTTP ${res.status}`)
  }
  return res.json()
}

/**
 * GET /tournaments/:id/manual-scheduling-context
 */
export async function getManualSchedulingContext(tournamentId: string): Promise<ManualSchedulingContext> {
  return request<ManualSchedulingContext>(
    `${API_BASE}/tournaments/${tournamentId}/manual-scheduling-context`
  )
}

/**
 * GET /tournaments/:id/matches/unscheduled
 */
export async function getUnscheduledMatches(
  tournamentId: string
): Promise<{ matches: UnscheduledMatch[]; categorized?: unknown }> {
  return request<{ matches: UnscheduledMatch[]; categorized?: unknown }>(
    `${API_BASE}/tournaments/${tournamentId}/matches/unscheduled`
  )
}

interface AvailableSlotsResponse {
  day: number
  courts: Array<{ id: string; name: string; venue_id?: string }>
  franjas: Array<{
    franja_id?: string
    id?: string
    label: string
    slots: Array<{
      time: string
      usage_by_court: Record<string, number>
    }>
  }>
}

/**
 * GET /tournaments/:id/available-slots-for-day?day=1|2|3
 * Construye lista de AssignableOption (AvailableSlot) desde franjas y usage_by_court
 */
export async function getAvailableSlotsForDay(
  tournamentId: string,
  day: 1 | 2 | 3
): Promise<AvailableSlot[]> {
  const data = await request<AvailableSlotsResponse>(
    `${API_BASE}/tournaments/${tournamentId}/available-slots-for-day?day=${day}`
  )
  const slots: AvailableSlot[] = []
  const courts = data.courts || []
  for (const franja of data.franjas || []) {
    for (const slot of franja.slots || []) {
      const usage = slot.usage_by_court || {}
      for (const court of courts) {
        if (usage[court.id] === 0) {
          slots.push({
            tournament_day: data.day,
            start_time: slot.time?.length === 5 ? slot.time : (slot.time || '').substring(0, 5),
            court_id: court.id,
            court_name: court.name,
            franja_label: franja.label || `Día ${data.day}`,
            franja_id: franja.franja_id || franja.id,
            venue_id: court.venue_id
          })
        }
      }
    }
  }
  return slots
}

/**
 * PUT /tournaments/:id/matches/:matchId/schedule
 */
export async function rescheduleMatch(
  tournamentId: string,
  matchId: string,
  body: {
    tournament_day: number
    start_time: string
    court_id: string
    venue_id?: string
  }
): Promise<unknown> {
  return request(`${API_BASE}/tournaments/${tournamentId}/matches/${matchId}/schedule`, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/**
 * PATCH /tournaments/:id/groups/:groupId/assign-day
 */
export async function assignDayToGroup(
  tournamentId: string,
  groupId: string,
  body: { franja_id: string } | { tournament_day: number }
): Promise<AssignDayResult> {
  return request<AssignDayResult>(
    `${API_BASE}/tournaments/${tournamentId}/groups/${groupId}/assign-day`,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    }
  )
}

export interface ScheduleMatchesResult {
  success: boolean
  message: string
  scheduled_count: number
  failed_count?: number
  total_matches?: number
  success_rate?: string
  groups_processed?: number
  warnings?: string[]
  failed?: Array<{
    match_id: string
    group_id: string
    group_number: number
    reason: string
    needs_manual?: boolean
  }>
}

/**
 * POST /tournaments/:id/schedule-matches
 */
export async function scheduleMatches(tournamentId: string): Promise<ScheduleMatchesResult> {
  return request<ScheduleMatchesResult>(
    `${API_BASE}/tournaments/${tournamentId}/schedule-matches`,
    { method: 'POST' }
  )
}
