// Two ways to run this site.
//
// Static (GitHub Pages): VITE_API_BASE is unset, the roadmap comes from src/content, and the
// admin panel is not reachable. This is what the public deploy does.
//
// Live (docker compose): VITE_API_BASE points at the API, weeks and challenges come from
// there, and the admin panel can unlock weeks and release challenges without a commit.

// Set VITE_API_BASE to '/' when the API answers on the same origin (the Docker setup), or to
// an absolute URL when it does not. Leaving it unset is what keeps the public deploy static.
const RAW_BASE = import.meta.env.VITE_API_BASE ?? '';
export const LIVE = RAW_BASE !== '';
export const API_BASE = RAW_BASE === '/' ? '' : RAW_BASE.replace(/\/$/, '');

const TOKEN_KEY = 'nimbo-admin-token';

export function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function writeToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // Private-mode browsers block storage; the session then lasts for this page only.
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) headers.Authorization = `Bearer ${readToken()}`;

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (response.status === 401) {
    writeToken('');
    throw new Error('unauthorized');
  }
  // Too many guesses. The caller needs the wait in seconds to say something useful, so it
  // travels on the error rather than being flattened into the message.
  if (response.status === 429) {
    const body = await response.json().catch(() => ({}));
    const error = new Error('throttled');
    error.status = 429;
    error.retryAfter = Number(body.retryAfter ?? response.headers.get('Retry-After') ?? 60);
    throw error;
  }
  if (!response.ok) {
    // وضعیت روی خطا سوار می‌شود، نه فقط داخل متن: تفاوت ۴۰۳ با بقیه‌ی خطاها را کسی باید
    // بتواند بدون کندنِ رشته تشخیص بدهد.
    const error = new Error(`${method} ${path} failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.status === 204 ? null : response.json();
}

// A download needs the same bearer token as everything else, so it cannot be a plain link:
// fetch it with the header and hand the browser the bytes to save.
export async function download(path, fallbackName) {
  const response = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${readToken()}` } });
  if (!response.ok) throw new Error(`download failed: ${response.status}`);
  const disposition = response.headers.get('Content-Disposition') ?? '';
  const named = /filename="([^"]+)"/.exec(disposition);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = named?.[1] ?? fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export const api = {
  roadmap: () => request('/api/roadmap'),
  // The unredacted one. Needs a staff session; 401/403 when there is none.
  roadmapFull: () => request('/api/roadmap/full', { auth: true }),
  login: (user, password) => request('/api/auth/login', { method: 'POST', body: { user, password } }),
  // ناظر ارشد بعد از ورود می‌گوید کیست و توکن تازه‌ای با همان اسم می‌گیرد.
  pickPersona: (personaId) => request('/api/auth/persona', { method: 'POST', body: { personaId }, auth: true }),
  personas: () => request('/api/staff/personas', { auth: true }),

  // --- mentors and the programme lead ---
  board: () => request('/api/staff/board', { auth: true }),
  // یک مشاهده. `status` یا draft است یا submitted؛ نقش منتور را سرور از روی حساب می‌گذارد.
  saveAssessment: (body) => request('/api/staff/assessments', { method: 'PUT', body, auth: true }),

  // فانلِ TPM. مسیرش جداست چون داده‌اش جداست — هیچ‌کدام از این دو نباید بتواند ردیف
  // دیگری را بخواند یا بنویسد.
  tpmBoard: () => request('/api/tpm/board', { auth: true }),
  saveReview: (body) => request('/api/tpm/reviews', { method: 'PUT', body, auth: true }),
  addObservation: (body) => request('/api/staff/observations', { method: 'POST', body, auth: true }),
  removeObservation: (id) => request(`/api/staff/observations/${id}`, { method: 'DELETE', auth: true }),
  patchMember: (id, patch) => request(`/api/staff/members/${id}`, { method: 'PATCH', body: patch, auth: true }),
  addHint: (body) => request('/api/staff/hints', { method: 'POST', body, auth: true }),
  readHint: (id) => request(`/api/staff/hints/${id}/read`, { method: 'POST', auth: true }),
  removeHint: (id) => request(`/api/staff/hints/${id}`, { method: 'DELETE', auth: true }),
  addMember: (teamId, body) => request(`/api/staff/teams/${teamId}/members`, { method: 'POST', body, auth: true }),
  removeMember: (id) => request(`/api/staff/members/${id}`, { method: 'DELETE', auth: true }),
  updateCompetency: (id, patch) =>
    request(`/api/staff/competencies/${id}`, { method: 'PATCH', body: patch, auth: true }),
  addCompetency: (body) => request('/api/staff/competencies', { method: 'POST', body, auth: true }),
  archiveCompetency: (id, archived) =>
    request(`/api/staff/competencies/${id}`, { method: 'PATCH', body: { archived }, auth: true }),
  addPersona: (body) => request('/api/staff/personas', { method: 'POST', body, auth: true }),
  archivePersona: (id, archived) =>
    request(`/api/staff/personas/${id}`, { method: 'PATCH', body: { archived }, auth: true }),
  assignObserver: (body) => request('/api/staff/observer-assignments', { method: 'POST', body, auth: true }),
  removeObserverAssignment: (id) =>
    request(`/api/staff/observer-assignments/${id}`, { method: 'DELETE', auth: true }),
  backups: () => request('/api/staff/backups', { auth: true }),
  makeBackup: () => request('/api/staff/backups', { method: 'POST', auth: true }),

  state: () => request('/api/admin/state', { auth: true }),
  patchPhase: (id, patch) => request(`/api/admin/phases/${id}`, { method: 'PATCH', body: patch, auth: true }),
  patchWeek: (id, patch) => request(`/api/admin/weeks/${id}`, { method: 'PATCH', body: patch, auth: true }),
  createChallenge: (challenge) => request('/api/admin/challenges', { method: 'POST', body: challenge, auth: true }),
  updateChallenge: (id, patch) => request(`/api/admin/challenges/${id}`, { method: 'PATCH', body: patch, auth: true }),
  deleteChallenge: (id) => request(`/api/admin/challenges/${id}`, { method: 'DELETE', auth: true }),
  assign: (weekId, challengeId) =>
    request('/api/admin/assignments', { method: 'POST', body: { weekId, challengeId }, auth: true }),
  patchAssignment: (id, patch) => request(`/api/admin/assignments/${id}`, { method: 'PATCH', body: patch, auth: true }),
  removeAssignment: (id) => request(`/api/admin/assignments/${id}`, { method: 'DELETE', auth: true }),
};
