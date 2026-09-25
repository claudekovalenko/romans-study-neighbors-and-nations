import { settings, progress } from '../store.js';
import { requestPermission, notificationsSupported, buildICS, downloadFile } from '../reminders.js';
import { ESV_COPYRIGHT } from '../esv.js';
import { config } from '../../config.js';
import { isNative, nativeNotificationPermission } from '../native.js';
import { esc, icon } from '../ui.js';

const isStandalone = () =>
  matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

function permissionNote(nativeDenied = false) {
  if (isNative()) {
    return nativeDenied
      ? 'Notifications are off for this app. Turn them on in your phone’s Settings, then try again.'
      : 'You’ll get a notification at this time on each reading day. Readings you’ve finished are skipped.';
  }
  if (!notificationsSupported()) {
    return isIOS() && !isStandalone()
      ? 'On iPhone, add this app to your Home Screen first to allow notifications.'
      : 'This browser doesn’t support notifications — use the calendar option below.';
  }
  if (Notification.permission === 'denied') return 'Notifications are blocked. Turn them on in your browser or phone settings.';
  return 'You’ll get a nudge when you open the app after this time if today’s reading isn’t done. For a reminder that always fires, add the plan to your calendar.';
}

export function settingsView(ctx) {
  const s = settings.get();
  const { series, index } = ctx;

  const native = isNative();
  const install = isStandalone()
    ? '<p class="muted">Installed — you’re using the app.</p>'
    : ctx.installPrompt
      ? `<button id="install" class="btn btn-primary">Install the app</button>`
      : isIOS()
        ? '<p>In Safari, tap <strong>Share</strong> then <strong>Add to Home Screen</strong>.</p>'
        : '<p>Use your browser menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</p>';

  const seriesPicker = index.series.length > 1 ? `
    <section class="card">
      <h2 class="section-title">Series</h2>
      <label class="field">Show
        <select id="series">
          ${index.series.map((e) => `<option value="${esc(e.id)}" ${e.id === series.id ? 'selected' : ''}>${esc(e.title ?? e.id)}</option>`).join('')}
        </select>
      </label>
    </section>` : '';

  return {
    title: 'Settings',
    html: `
      <header class="page-head"><h1>Settings</h1></header>

      <section class="card">
        <h2 class="section-title">${icon('bell')} Daily reminder</h2>
        <label class="switch">
          <input type="checkbox" id="reminders" ${s.remindersOn ? 'checked' : ''}>
          <span>Remind me to read</span>
        </label>
        <label class="field">Time <input type="time" id="reminder-time" value="${esc(s.reminderTime)}"></label>
        <p class="muted small" id="perm-note">${esc(permissionNote())}</p>
      </section>

      ${native ? '' : `<section class="card">
        <h2 class="section-title">${icon('calendar')} Add to your calendar</h2>
        <p>Puts every remaining reading on your phone’s calendar with an alert at your reminder time.</p>
        <label class="switch">
          <input type="checkbox" id="ics-sermons" checked>
          <span>Include Sunday sermons</span>
        </label>
        <button id="ics" class="btn btn-secondary">${icon('calendar')} Download calendar file</button>
      </section>`}

      <section class="card">
        <h2 class="section-title">Reading text size</h2>
        <div class="segmented" role="radiogroup" aria-label="Text size">
          ${['s', 'm', 'l', 'xl'].map((k) => `
            <label><input type="radio" name="size" value="${k}" ${s.textSize === k ? 'checked' : ''}><span>${{ s: 'Small', m: 'Medium', l: 'Large', xl: 'Larger' }[k]}</span></label>`).join('')}
        </div>
      </section>

      ${native ? '' : `<section class="card">
        <h2 class="section-title">Get the app</h2>
        ${install}
      </section>`}

      ${seriesPicker}

      <section class="card">
        <h2 class="section-title">Your data</h2>
        <p class="muted small">Progress and notes stay on this device only.</p>
        <button id="reset" class="btn btn-danger">Reset ${esc(series.title)} progress</button>
      </section>

      <footer class="about">
        <p><strong>${esc(config.appName)}</strong> · ${esc(config.church)}</p>
        <p class="copyright">${esc(ESV_COPYRIGHT)}</p>
      </footer>`,

    mount(root) {
      const note = root.querySelector('#perm-note');
      const toggle = root.querySelector('#reminders');
      toggle.addEventListener('change', async () => {
        let denied = false;
        if (toggle.checked) {
          const result = native ? await nativeNotificationPermission({ ask: true }) : await requestPermission();
          denied = native ? result !== 'granted' : result === 'denied';
          if (denied) toggle.checked = false;
        }
        settings.set({ remindersOn: toggle.checked, lastNotified: null });
        note.textContent = permissionNote(denied);
        ctx.onReminderSettingsChange();
      });

      root.querySelector('#reminder-time').addEventListener('change', (e) => {
        if (!e.target.value) return;
        settings.set({ reminderTime: e.target.value, lastNotified: null });
        ctx.onReminderSettingsChange();
      });

      root.querySelector('#ics')?.addEventListener('click', () => {
        const appUrl = location.href.split('#')[0];
        const ics = buildICS({
          series,
          schedule: ctx.schedule,
          time: settings.get().reminderTime,
          appUrl,
          sermonTime: root.querySelector('#ics-sermons').checked ? series.sermonTime || '10:00' : null,
        });
        downloadFile(`${series.id}-reading-plan.ics`, ics, 'text/calendar');
      });

      root.querySelectorAll('input[name="size"]').forEach((r) =>
        r.addEventListener('change', () => {
          settings.set({ textSize: r.value });
          ctx.applySettings();
        }),
      );

      root.querySelector('#install')?.addEventListener('click', async () => {
        ctx.installPrompt.prompt();
        await ctx.installPrompt.userChoice;
        ctx.installPrompt = null;
        ctx.rerender();
      });

      root.querySelector('#series')?.addEventListener('change', (e) => ctx.switchSeries(e.target.value));

      root.querySelector('#reset').addEventListener('click', () => {
        if (confirm(`Clear your reading progress for ${series.title}? Notes are kept.`)) {
          progress.reset(series.id);
          ctx.onProgressChange();
        }
      });
    },
  };
}
