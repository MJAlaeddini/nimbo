import { resolve } from 'node:path';
import express from 'express';
import {
  canAssess,
  credentialsConfigured,
  login,
  needsPersona,
  ownsTeam,
  requireAdmin,
  requireRole,
  staffConfigured,
  withPersona,
} from './auth.js';
import { fullRoadmap, publicRoadmap } from './public.js';
import { listBackups, snapshotNow, startDailyBackups } from './backup.js';
import { startAnnouncer } from './announce.js';
import { SHEETS } from './sheets.js';
import { staffBoard } from './staff.js';
import * as store from './store.js';
import { checkLogin, loginFailed, loginKeys, loginSucceeded } from './throttle.js';

const app = express();
app.use(express.json({ limit: '256kb' }));

// The API is never exposed directly — nginx (and any TLS proxy in front of it) is the only
// way in, so the last hop in X-Forwarded-For is trustworthy and req.ip becomes the real
// client. Raise TRUST_PROXY if you stack another proxy in front.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1));

// The web container proxies /api to here, so same-origin covers the normal case. CORS is
// opened only when someone runs the two apart, and only for the origin they name.
const ORIGIN = process.env.CORS_ORIGIN;
if (ORIGIN) {
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', ORIGIN);
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  });
}

store.init();
// One copy of the data file a day, kept on the same volume, thirty days deep.
startDailyBackups();
// Announcements to the participants' Bale group. Silent unless a token and a chat id are
// in the environment, so nothing changes for anyone who has not set them.
startAnnouncer();

const ok = (res, value) => (value ? res.json(value) : res.status(404).json({ error: 'not found' }));

// --- public ------------------------------------------------------------------

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', credentials: credentialsConfigured(), weeks: store.listWeeks().length }),
);

app.get('/api/roadmap', (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(
    publicRoadmap({
      phases: store.listPhases(),
      weeks: store.listWeeks(),
      assignments: store.listAssignments(),
      challenges: store.listChallenges(),
    }),
  );
});

// The same roadmap with nothing withheld, for signed-in staff. It sits behind the same role
// check as the panel, so there is one set of credentials and one place to revoke them.
app.get('/api/roadmap/full', requireRole('mentor', 'lead'), (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(
    fullRoadmap({
      phases: store.listPhases(),
      weeks: store.listWeeks(),
      assignments: store.listAssignments(),
      challenges: store.listChallenges(),
    }),
  );
});

// --- signing in --------------------------------------------------------------

// One door for the admin, the four mentors and the programme lead; the role in the answer
// decides which panel the browser then draws.
function handleLogin(req, res) {
  const keys = loginKeys(req, req.body?.user);
  const gate = checkLogin(keys);
  if (gate.blocked) {
    res.set('Retry-After', String(gate.retryAfter));
    return res.status(429).json({ error: 'too many attempts', retryAfter: gate.retryAfter });
  }

  const session = login(req.body?.user, req.body?.password);
  if (!session) {
    loginFailed(keys);
    return res.status(401).json({ error: 'bad credentials' });
  }
  loginSucceeded(keys);
  return res.json(session);
}

app.post('/api/auth/login', handleLogin);

// ناظر ارشد بعد از ورود می‌گوید کیست، و توکن تازه‌ای با همان اسم می‌گیرد.
//
// اسم روی توکن می‌نشیند و نه روی هر درخواست، چون قاعده‌ی استقلال و یکتاییِ ردیف‌ها هر دو
// باید بدانند «کی» — و اگر کلاینت هر بار می‌فرستادش، یک درخواستِ بدون آن کافی بود تا
// ردیفِ بی‌صاحب ساخته شود.
app.post('/api/auth/persona', requireRole('mentor'), (req, res) => {
  if (req.staff.mentorRole !== 'senior_observer') return denied(res);
  const persona = store.findObserverPersona(req.body?.personaId);
  if (!persona || persona.archived) return res.status(400).json({ error: 'unknown persona' });
  return res.json(withPersona(req.staff, persona));
});
app.post('/api/admin/login', handleLogin);

// --- staff: mentors and the programme lead -----------------------------------

const staffOnly = requireRole('mentor', 'lead');
const leadOnly = requireRole('lead');
const denied = (res) => res.status(403).json({ error: 'forbidden' });

app.get('/api/staff/board', staffOnly, (req, res) => res.json(staffBoard(req.staff)));

// یک مشاهده. `mentorRole` عمداً از req.staff می‌آید و نه از body — اگر از body می‌آمد،
// یک منتور تیم می‌توانست رأیش را با برچسب ناظر ارشد ثبت کند.
app.put('/api/staff/assessments', staffOnly, (req, res) => {
  // مالکیت از روی جایی که نفر واقعاً هست حساب می‌شود، نه از teamId ای که فرستنده گفته، و
  // قبل از هر نوشتنی چک می‌شود — ۴۰۳ بعد از یک ذخیره‌ی موفق، ذخیره‌اش را پس نمی‌گیرد.
  const teamId = store.memberTeamId(req.body?.memberId);
  if (!teamId) return res.status(400).json({ error: 'unknown member' });
  if (!canAssess(req.staff, teamId, req.body?.weekId, store.sessionOpenToObserver)) return denied(res);

  const saved = store.saveAssessment(req.body ?? {}, req.staff);
  return saved ? res.json(saved) : res.status(400).json({ error: 'bad assessment' });
});

app.post('/api/staff/observations', staffOnly, (req, res) => {
  if (!ownsTeam(req.staff, req.body?.teamId)) return denied(res);
  const observation = store.addObservation(req.body ?? {}, req.staff.user);
  return observation ? res.status(201).json(observation) : res.status(400).json({ error: 'bad observation' });
});

app.delete('/api/staff/observations/:id', staffOnly, (req, res) => {
  const observation = store.listObservations().find((o) => o.id === req.params.id);
  if (observation && !ownsTeam(req.staff, observation.teamId)) return denied(res);
  return ok(res, store.removeObservation(req.params.id));
});

// A mentor may rate the people they work with; only the lead writes the verdict.
app.patch('/api/staff/members/:id', staffOnly, (req, res) => {
  const found = store.findMember(req.params.id);
  if (!found) return res.status(404).json({ error: 'not found' });
  if (!ownsTeam(req.staff, found.team.id)) return denied(res);
  const patch = { ...(req.body ?? {}) };
  if (req.staff.role === 'mentor') delete patch.verdict;
  return ok(res, store.updateMember(req.params.id, patch));
});

// --- the programme lead's own levers -----------------------------------------

app.post('/api/staff/hints', leadOnly, (req, res) => {
  const hint = store.addHint(req.body ?? {}, req.staff.user);
  return hint ? res.status(201).json(hint) : res.status(400).json({ error: 'bad hint' });
});

app.delete('/api/staff/hints/:id', leadOnly, (req, res) => ok(res, store.removeHint(req.params.id)));

// The mentor whose team it is marks it read; that is the only write a mentor makes here.
app.post('/api/staff/hints/:id/read', staffOnly, (req, res) => {
  const hint = store.listHints().find((h) => h.id === req.params.id);
  if (hint && !ownsTeam(req.staff, hint.teamId)) return denied(res);
  return ok(res, store.markHintRead(req.params.id));
});

// Everything in the panel, as a spreadsheet the lead can keep somewhere that is not this
// server. Opens by double-click in Excel and imports straight into Google Sheets.
app.get('/api/staff/export/:kind.csv', leadOnly, (req, res) => {
  const sheet = SHEETS[req.params.kind];
  if (!sheet) return res.status(404).json({ error: 'unknown sheet' });
  const csv = sheet.build({
    teams: store.listTeams(),
    accounts: store.listAccounts(),
    competencies: store.listCompetencies(),
    assessments: store.listAssessments(),
    observations: store.listObservations(),
    hints: store.listHints(),
  });
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', `attachment; filename="nimbo-${sheet.file}"`);
  return res.send(csv);
});

// The raw file, for restoring rather than reading.
app.get('/api/staff/export/backup.json', leadOnly, (req, res) => {
  res.set('Content-Disposition', `attachment; filename="nimbo-backup-${new Date().toISOString().slice(0, 10)}.json"`);
  return res.json(store.snapshot());
});

app.get('/api/staff/backups', leadOnly, (req, res) => res.json({ backups: listBackups() }));

app.post('/api/staff/backups', leadOnly, (req, res) => {
  const file = snapshotNow();
  return file ? res.status(201).json({ file, backups: listBackups() }) : res.status(500).json({ error: 'no data file' });
});

app.patch('/api/staff/teams/:id', leadOnly, (req, res) => ok(res, store.updateTeam(req.params.id, req.body ?? {})));

app.post('/api/staff/teams/:id/members', leadOnly, (req, res) => {
  const member = store.addMember(req.params.id, req.body ?? {});
  return member ? res.status(201).json(member) : res.status(404).json({ error: 'not found' });
});

app.delete('/api/staff/members/:id', leadOnly, (req, res) => ok(res, store.removeMember(req.params.id)));

// ویرایش یک معیار شناسه‌اش را عوض نمی‌کند، پس هر ratingی که تا حالا به آن داده شده
// سر جایش می‌ماند.
app.patch('/api/staff/competencies/:id', leadOnly, (req, res) => {
  if (typeof req.body?.archived === 'boolean') {
    return ok(res, store.archiveCompetency(req.params.id, req.body.archived));
  }
  return ok(res, store.updateCompetency(req.params.id, req.body ?? {}));
});

app.post('/api/staff/competencies', leadOnly, (req, res) => {
  const competency = store.addCompetency(req.body ?? {});
  return competency
    ? res.status(201).json(competency)
    : res.status(400).json({ error: 'a competency needs a label and four described levels' });
});

// --- assign کردن ناظر ارشد به یک جلسه --------------------------------------

app.get('/api/staff/personas', staffOnly, (req, res) =>
  res.json({ personas: store.listObserverPersonas().filter((p) => !p.archived) }),
);

app.post('/api/staff/personas', leadOnly, (req, res) => {
  const persona = store.addObserverPersona(req.body ?? {});
  return persona ? res.status(201).json(persona) : res.status(400).json({ error: 'a persona needs a name' });
});

app.patch('/api/staff/personas/:id', leadOnly, (req, res) =>
  ok(res, store.archiveObserverPersona(req.params.id, req.body?.archived !== false)),
);

app.post('/api/staff/observer-assignments', leadOnly, (req, res) => {
  const assignment = store.addObserverAssignment(req.body ?? {});
  return assignment ? res.status(201).json(assignment) : res.status(400).json({ error: 'bad assignment' });
});

app.delete('/api/staff/observer-assignments/:id', leadOnly, (req, res) =>
  ok(res, store.removeObserverAssignment(req.params.id)),
);

// --- admin -------------------------------------------------------------------

app.get('/api/admin/state', requireAdmin, (req, res) =>
  res.json({
    phases: store.listPhases(),
    weeks: store.listWeeks(),
    challenges: store.listChallenges(),
    assignments: store.listAssignments(),
    statuses: store.WEEK_STATUSES,
    phaseStatuses: store.PHASE_STATUSES,
  }),
);

app.patch('/api/admin/phases/:id', requireAdmin, (req, res) => ok(res, store.updatePhase(req.params.id, req.body ?? {})));

app.patch('/api/admin/weeks/:id', requireAdmin, (req, res) => ok(res, store.updateWeek(req.params.id, req.body ?? {})));

app.post('/api/admin/challenges', requireAdmin, (req, res) => {
  const { title, body, tags } = req.body ?? {};
  if (!title?.trim() || !body?.trim()) return res.status(400).json({ error: 'title and body are required' });
  return res.status(201).json(store.createChallenge({ title: title.trim(), body: body.trim(), tags: tags ?? [] }));
});

app.patch('/api/admin/challenges/:id', requireAdmin, (req, res) =>
  ok(res, store.updateChallenge(req.params.id, req.body ?? {})),
);

app.delete('/api/admin/challenges/:id', requireAdmin, (req, res) => ok(res, store.deleteChallenge(req.params.id)));

app.post('/api/admin/assignments', requireAdmin, (req, res) => {
  const assignment = store.assign(req.body?.weekId, req.body?.challengeId);
  return assignment ? res.status(201).json(assignment) : res.status(400).json({ error: 'unknown week or challenge' });
});

app.patch('/api/admin/assignments/:id', requireAdmin, (req, res) =>
  ok(res, store.updateAssignment(req.params.id, req.body ?? {})),
);

app.delete('/api/admin/assignments/:id', requireAdmin, (req, res) => ok(res, store.removeAssignment(req.params.id)));

// Point SERVE_STATIC at the built site and this one process serves everything — no nginx,
// no second container. The Docker setup leaves it unset and lets nginx do the serving.
const STATIC_DIR = process.env.SERVE_STATIC;
if (STATIC_DIR) {
  const root = resolve(STATIC_DIR);
  app.use(express.static(root));
  // Registered after the API routes, so /api never falls through to the app shell.
  app.get('*', (req, res) => res.sendFile(resolve(root, 'index.html')));
  console.log(`serving the site from ${root}`);
}

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  if (!credentialsConfigured()) {
    console.warn('ADMIN_PASSWORD is not set — the admin panel will refuse every login.');
  }
  const staff = staffConfigured(store.listAccounts());
  if (staff.length === 0) {
    console.warn('no staff password is set — set MENTOR_PASSWORD and LEAD_PASSWORD, or STAFF_PASSWORD_<USER>.');
  } else {
    console.log(`staff logins ready: ${staff.join(', ')}`);
  }
  console.log(`nimbo roadmap api on :${port}`);
});
