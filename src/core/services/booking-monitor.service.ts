import { Injectable, computed, inject, signal } from '@angular/core';
import { EMPTY, Subscription, catchError, finalize, switchMap, tap, timer } from 'rxjs';
import {
  LiveAgent,
  LiveJob,
  MonitorAgent,
  MonitorBoard,
  MonitorJob,
  MonitorRules,
  MonitorSeverity,
  STEP_META,
} from '@core/models';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';

const POLL_MS = 60_000;
const SOUND_KEY = 'clearit.admin.monitorSound';
const RANK: Record<MonitorSeverity, number> = { ok: 0, orange: 1, red: 2 };

/**
 * One poll of the booking monitor for the whole admin panel: the header pill,
 * the sidebar badge and the monitor page all read it. Colours are worked out
 * every second from the step times the API sends (on the server's clock), so
 * a job turns orange or red on the dot, not at the next poll. A job or agent
 * that newly turns red beeps (if sound is on) and shows a toast.
 */
@Injectable({ providedIn: 'root' })
export class BookingMonitorService {
  private readonly api = inject(ApiService);
  private readonly notifications = inject(NotificationService);

  private readonly boardSignal = signal<MonitorBoard | null>(null);
  readonly board = this.boardSignal.asReadonly();
  readonly loading = signal(false);
  /** The last poll failed; what's on screen is from `lastUpdated`. */
  readonly failed = signal(false);
  readonly lastUpdated = signal<number | null>(null);
  /** Now, on the server's clock; ticks every second. */
  readonly now = signal(Date.now());
  readonly soundOn = signal(localStorage.getItem(SOUND_KEY) !== 'off');

  readonly rules = computed(() => this.board()?.rules ?? null);

  readonly jobs = computed<LiveJob[]>(() => {
    const now = this.now();
    return (this.board()?.jobs ?? [])
      .map((job) => liveJob(job, now))
      .sort(
        (a, b) =>
          RANK[b.live.severity] - RANK[a.live.severity] ||
          Number(b.live.running) - Number(a.live.running) ||
          Date.parse(a.clockStartsAt) - Date.parse(b.clockStartsAt),
      );
  });

  readonly agents = computed<LiveAgent[]>(() => {
    const now = this.now();
    const order = { red: 0, orange: 1, ok: 2, idle: 3 };
    return (this.board()?.agents ?? [])
      .map((agent) => liveAgent(agent, now))
      .sort((a, b) => order[a.live.severity] - order[b.live.severity]);
  });

  readonly counts = computed(() => {
    const jobs = this.jobs();
    const agents = this.agents();
    return {
      red: jobs.filter((job) => job.live.severity === 'red').length,
      orange: jobs.filter((job) => job.live.severity === 'orange').length,
      ok: jobs.filter((job) => job.live.severity === 'ok').length,
      agents: agents.length,
      online: agents.filter((agent) => agent.presence === 'online').length,
      busy: agents.filter((agent) => !!agent.currentJob).length,
      agentRed: agents.filter((agent) => agent.live.severity === 'red').length,
      agentOrange: agents.filter((agent) => agent.live.severity === 'orange').length,
    };
  });

  /** Jobs and agents together, for the header pill and sidebar badge. */
  readonly attention = computed(() => {
    const counts = this.counts();
    const red = counts.red + counts.agentRed;
    const orange = counts.orange + counts.agentOrange;
    return { red, orange, total: red + orange };
  });

  private offsetMs = 0;
  private poll: Subscription | null = null;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private audio: AudioContext | null = null;
  /** Reds already announced; null until the first board, so reds already there on load don't beep. */
  private announced: Set<string> | null = null;
  private readonly unlockAudio = () => this.ensureAudio();

  /** Starts polling; the admin shell calls this once the admin is signed in. */
  start() {
    if (this.poll) return;
    this.poll = timer(0, POLL_MS)
      .pipe(switchMap(() => this.fetch()))
      .subscribe();
    this.ticker = setInterval(() => this.tick(), 1000);
    // Browsers only let a page play sound after the user has interacted with it.
    document.addEventListener('pointerdown', this.unlockAudio, { once: true });
  }

  stop() {
    this.poll?.unsubscribe();
    this.poll = null;
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
    document.removeEventListener('pointerdown', this.unlockAudio);
    this.boardSignal.set(null);
    this.announced = null;
  }

  refresh() {
    this.fetch().subscribe();
  }

  toggleSound() {
    const on = !this.soundOn();
    this.soundOn.set(on);
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
    if (on) this.beep();
  }

  updateRules(rules: Partial<MonitorRules>) {
    return this.api
      .put<MonitorRules>('admin/booking-monitor/rules', rules)
      .pipe(tap(() => this.refresh()));
  }

  /** Push to one agent; the API checks they're in this admin's zones (or on `bookingId` there). */
  nudge(payload: { agentId: string; bookingId?: string; title: string; message: string }) {
    return this.api.post<{ sent: boolean }>('admin/booking-monitor/nudge', payload);
  }

  private fetch() {
    this.loading.set(true);
    const sentAt = Date.now();
    return this.api.get<MonitorBoard>('admin/booking-monitor', undefined, { silent: true }).pipe(
      tap((board) => {
        const receivedAt = Date.now();
        // The server stamped its time somewhere in the round trip; assume the middle.
        this.offsetMs = Date.parse(board.serverTime) - (sentAt + receivedAt) / 2;
        this.boardSignal.set(board);
        this.failed.set(false);
        this.lastUpdated.set(receivedAt);
        this.tick();
      }),
      catchError(() => {
        this.failed.set(true);
        return EMPTY;
      }),
      finalize(() => this.loading.set(false)),
    );
  }

  private tick() {
    this.now.set(Date.now() + this.offsetMs);
    this.announceNewReds();
  }

  private announceNewReds() {
    if (!this.board()) return;
    const redJobs = this.jobs().filter((job) => job.live.severity === 'red');
    const redAgents = this.agents().filter((agent) => agent.live.severity === 'red');
    const keys = new Set([
      ...redJobs.map((job) => `job:${job.id}:${job.step}`),
      ...redAgents.map((agent) => `agent:${agent.id}:${agent.nextJob?.bookingId ?? ''}`),
    ]);
    const before = this.announced;
    // Forget reds that cleared, so they announce again if they come back.
    this.announced = keys;
    if (!before) return;

    const freshJob = redJobs.find((job) => !before.has(`job:${job.id}:${job.step}`));
    const freshAgent = redAgents.find(
      (agent) => !before.has(`agent:${agent.id}:${agent.nextJob?.bookingId ?? ''}`),
    );
    if (!freshJob && !freshAgent) return;

    if (this.soundOn()) this.beep();
    this.notifications.error(
      freshJob
        ? `${freshJob.bookingNumber} is critical: ${STEP_META[freshJob.step].label.toLowerCase()}`
        : `${freshAgent!.name} isn't online and should be heading to ${freshAgent!.nextJob?.bookingNumber ?? 'a job'}`,
    );
  }

  private ensureAudio() {
    try {
      this.audio ??= new AudioContext();
      if (this.audio.state === 'suspended') void this.audio.resume();
      return this.audio;
    } catch {
      return null;
    }
  }

  /** Two short tones; no audio file to ship. */
  private beep() {
    const ctx = this.ensureAudio();
    if (!ctx) return;
    const start = ctx.currentTime;
    for (const [offset, frequency] of [
      [0, 880],
      [0.22, 660],
    ]) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start + offset);
      oscillator.stop(start + offset + 0.2);
    }
  }
}

export function liveJob(job: MonitorJob, now: number): LiveJob {
  const start = Date.parse(job.clockStartsAt);
  const own: MonitorSeverity =
    now >= Date.parse(job.redAt) ? 'red' : now >= Date.parse(job.orangeAt) ? 'orange' : 'ok';
  const severity = job.floor && RANK[job.floor] > RANK[own] ? job.floor : own;
  return { ...job, live: { severity, running: now >= start, ms: Math.abs(now - start) } };
}

export function liveAgent(agent: MonitorAgent, now: number): LiveAgent {
  const severity = agent.alert
    ? now >= Date.parse(agent.alert.redAt)
      ? 'red'
      : 'orange'
    : agent.severity;
  return { ...agent, live: { severity } };
}
