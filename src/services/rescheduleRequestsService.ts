/**
 * Servicio para gestión de solicitudes de reschedule de torneos.
 * Endpoints: Feature #3 del backend (match_reschedule_requests).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9999'

export interface RescheduleRequest {
  id: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note: string | null
  resolved_franja_id: string | null
  resolved_franja_label: string | null
  requested_at: string
  resolved_at: string | null
  group: {
    id: string
    group_number: number
    assigned_franja: string | null
    teams: string[]
  }
  team: {
    id: string
    team_id: string
    teams: {
      display_name: string | null
      player1: { first_name: string; last_name: string; email: string } | null
      player2: { first_name: string; last_name: string; email: string } | null
    }
  }
  resolver: { first_name: string; last_name: string } | null
}

export interface RescheduleRequestsResponse {
  tournament_id: string
  total: number
  pending_count: number
  requests: RescheduleRequest[]
}

export interface RescheduleFranjaResult {
  message: string
  group: {
    id: string
    group_number: number
    previous_franja: string
    new_franja: string
    new_franja_label: string
  }
  scheduling: {
    scheduled_count: number
    failed_count: number
    scheduled_matches: Array<{ match_id: string; match_day: string; start_time: string; court_id: string }>
    failed_matches: Array<{ match_id: string; reason: string }>
  }
  warnings: string[]
}

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('adminToken')
    if (token) headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/** Admin: listar solicitudes de un torneo */
export async function fetchRescheduleRequests(
  tournamentId: string,
  status?: 'pending' | 'approved' | 'rejected'
): Promise<RescheduleRequestsResponse> {
  const url = new URL(`${API_BASE}/tournaments/${tournamentId}/reschedule-requests`)
  if (status) url.searchParams.set('status', status)

  const res = await fetch(url.toString(), { headers: getAuthHeaders() })
  if (!res.ok) throw new Error((await res.json()).message || 'Error al cargar solicitudes')
  return res.json()
}

/** Admin: aprobar solicitud de reschedule */
export async function approveRescheduleRequest(
  tournamentId: string,
  requestId: string,
  newFranjaId: string,
  adminNote?: string
): Promise<{ message: string; request_id: string; status: string; reschedule: RescheduleFranjaResult }> {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/reschedule-requests/${requestId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action: 'approve', new_franja_id: newFranjaId, admin_note: adminNote })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Error al aprobar solicitud')
  return data
}

/** Admin: rechazar solicitud de reschedule */
export async function rejectRescheduleRequest(
  tournamentId: string,
  requestId: string,
  adminNote?: string
): Promise<{ message: string; request_id: string; status: string }> {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/reschedule-requests/${requestId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ action: 'reject', admin_note: adminNote })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Error al rechazar solicitud')
  return data
}

/** Admin: cambiar franja de un grupo directamente (sin solicitud previa) */
export async function rescheduleGroupFranja(
  tournamentId: string,
  groupId: string,
  newFranjaId: string
): Promise<RescheduleFranjaResult> {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/groups/${groupId}/reschedule-franja`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ new_franja_id: newFranjaId })
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || 'Error al cambiar franja del grupo')
  return data
}
