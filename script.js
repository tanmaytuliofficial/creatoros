/* ============================
   CREATOROS — SCRIPT.JS
   Full Vanilla JS Application
============================ */

'use strict';

// ==================
// STATE
// ==================
const DB = {
  videos: [],
  series: [],
  tasks: [],
  scripts: [],
  thumbnails: {},   // keyed by videoId
  seo: {},          // keyed by videoId
};

const STATUS_ORDER = ['Idea','Research','Script','Recording','Editing','Ready','Published'];
const STATUS_COLORS = {
  Idea:      '#5e5e78',
  Research:  '#f5c842',
  Script:    '#4ea7fc',
  Recording: '#ff8c42',
  Editing:   '#c45cfc',
  Ready:     '#22d484',
  Published: '#7c5cfc',
};
const DEFAULT_SERIES = ['Inside The Internet','Startup Exposed','Aetherix Journey','College Diaries'];

let currentPage = 'dashboard';
let calYear, calMonth;
let activeScriptId = null;
let scriptAutoSaveTimer = null;
let analyticsCharts = {};

// ==================
// STORAGE
// ==================
function save() {
  localStorage.setItem('creatoros_db', JSON.stringify(DB));
}

function load() {
  try {
    const raw = localStorage.getItem('creatoros_db');
    if (raw) {
      const parsed = JSON.parse(raw);
      Object.assign(DB, parsed);
    } else {
      seedData();
    }
  } catch (e) {
    seedData();
  }
}

function seedData() {
  DB.series = DEFAULT_SERIES.map((name, i) => ({
    id: uid(),
    name,
    description: `Content series: ${name}`,
    emoji: ['🌐','🚀','⚗️','📚'][i] || '🎬',
    color: ['#7c5cfc','#f5c842','#22d484','#4ea7fc'][i] || '#7c5cfc',
    createdAt: Date.now(),
  }));

  const sampleTitles = [
    { title: 'Why Every Startup Fails in Year 2', series: DB.series[1].name, status: 'Published', pub: '2025-04-10' },
    { title: 'Inside the Dark Web Marketplace', series: DB.series[0].name, status: 'Ready', pub: '2025-05-15' },
    { title: 'My College Routine That Changed Everything', series: DB.series[3].name, status: 'Editing', pub: '' },
    { title: 'Building an App in 24 Hours', series: DB.series[2].name, status: 'Script', pub: '' },
    { title: 'How Algorithms Actually Work', series: DB.series[0].name, status: 'Idea', pub: '' },
  ];

  DB.videos = sampleTitles.map((v, i) => ({
    id: uid(),
    title: v.title,
    series: v.series,
    hook: `Here's what nobody tells you about ${v.title.toLowerCase()}...`,
    script: '',
    description: `Deep dive into ${v.title}. This video explores the core concepts.`,
    tags: ['youtube','content','creator'],
    thumbnailText: v.title.split(' ').slice(0,3).join(' ').toUpperCase(),
    thumbnailIdea: 'Shocked face + bold text overlay',
    status: v.status,
    publishDate: v.pub,
    createdAt: Date.now() - i * 86400000,
  }));

  DB.tasks = [
    { id: uid(), text: 'Film intro segment for Dark Web video', done: false, priority: 'high', due: '', createdAt: Date.now() },
    { id: uid(), text: 'Edit college routine B-roll', done: false, priority: 'normal', due: '', createdAt: Date.now() },
    { id: uid(), text: 'Research startup failure stats', done: true, priority: 'normal', due: '', createdAt: Date.now() },
  ];

  DB.scripts = [
    {
      id: uid(),
      title: 'Inside the Dark Web',
      videoId: DB.videos[1]?.id || null,
      hook: "What if I told you there's an entire internet you've never seen?",
      intro: "Today we're going deep — literally underground into the layers of the web most people don't know exist.",
      mainContent: "The dark web is only about 6% of the internet. Most of it is boring databases and academic archives.",
      story: "I once found a marketplace that sold nothing illegal — just anonymous confessions from people around the world.",
      cta: "If this blew your mind, smash subscribe and hit the bell. New video every week.",
      updatedAt: Date.now(),
    }
  ];

  save();
}

// ==================
// UTILS
// ==================
function uid() {
  return Math.random().toString(36).slice(2,11) + Date.now().toString(36);
}

function badgeClass(status) {
  return 'badge badge-' + status.toLowerCase();
}

function dotClass(status) {
  return 'dot-' + status.toLowerCase();
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function wordCount(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateDuration(words) {
  const wpm = 150;
  const mins = Math.ceil(words / wpm);
  if (mins < 1) return '<1 min';
  return `~${mins} min`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// ==================
// NAVIGATION
// ==================
function navigateTo(page) {
  currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  document.querySelectorAll('.bnav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.page === page);
  });

  const titles = {
    dashboard: 'Dashboard', videos: 'Videos', kanban: 'Kanban Board',
    scripts: 'Scripts', series: 'Series', thumbnails: 'Thumbnails',
    seo: 'SEO Manager', calendar: 'Calendar', tasks: 'Tasks',
    analytics: 'Analytics', backup: 'Backup',
  };
  document.getElementById('topbarTitle').textContent = titles[page] || page;

  renderPage(page);

  // Close sidebar on mobile
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  }
}

function renderPage(page) {
  switch (page) {
    case 'dashboard':   renderDashboard();   break;
    case 'videos':      renderVideos();      break;
    case 'kanban':      renderKanban();      break;
    case 'scripts':     renderScripts();     break;
    case 'series':      renderSeries();      break;
    case 'thumbnails':  renderThumbnails();  break;
    case 'seo':         renderSEO();         break;
    case 'calendar':    renderCalendar();    break;
    case 'tasks':       renderTasks();       break;
    case 'analytics':   renderAnalytics();   break;
    case 'backup':      renderBackup();      break;
  }
}

// ==================
// DASHBOARD
// ==================
function renderDashboard() {
  const stats = {
    total:      DB.videos.length,
    idea:       DB.videos.filter(v => v.status === 'Idea').length,
    script:     DB.videos.filter(v => v.status === 'Script').length,
    ready:      DB.videos.filter(v => v.status === 'Ready').length,
    editing:    DB.videos.filter(v => v.status === 'Editing').length,
    published:  DB.videos.filter(v => v.status === 'Published').length,
    tasks:      DB.tasks.filter(t => !t.done).length,
  };

  const statGrid = document.getElementById('dashboardStats');
  statGrid.innerHTML = [
    { label: 'Total Ideas', value: stats.total, sub: 'all videos', color: '#7c5cfc' },
    { label: 'In Script', value: stats.script, sub: 'writing phase', color: '#4ea7fc' },
    { label: 'Ready to Record', value: stats.ready, sub: 'awaiting camera', color: '#22d484' },
    { label: 'Editing', value: stats.editing, sub: 'in post', color: '#c45cfc' },
    { label: 'Published', value: stats.published, sub: 'live videos', color: '#7c5cfc' },
    { label: 'Open Tasks', value: stats.tasks, sub: 'pending', color: '#f5c842' },
  ].map(s => `
    <div class="stat-card">
      <div class="stat-label">${s.label}</div>
      <div class="stat-value" style="color:${s.color}">${s.value}</div>
      <div class="stat-sub">${s.sub}</div>
    </div>
  `).join('');

  // Recent
  const recent = [...DB.videos].sort((a,b) => b.createdAt - a.createdAt).slice(0,5);
  const recentEl = document.getElementById('recentVideos');
  if (recent.length === 0) {
    recentEl.innerHTML = emptyState('No videos yet');
  } else {
    recentEl.innerHTML = recent.map(v => `
      <div class="item-row" onclick="openVideoModal('${v.id}')">
        <div class="item-dot ${dotClass(v.status)}"></div>
        <div class="item-info">
          <div class="item-title">${escHtml(v.title)}</div>
          <div class="item-meta">${escHtml(v.series)}</div>
        </div>
        <span class="${badgeClass(v.status)}">${v.status}</span>
      </div>
    `).join('');
  }

  // Upcoming
  const upcoming = DB.videos
    .filter(v => v.publishDate && new Date(v.publishDate) >= new Date())
    .sort((a,b) => new Date(a.publishDate) - new Date(b.publishDate))
    .slice(0,5);
  const upcomingEl = document.getElementById('upcomingVideos');
  if (upcoming.length === 0) {
    upcomingEl.innerHTML = emptyState('No scheduled videos');
  } else {
    upcomingEl.innerHTML = upcoming.map(v => `
      <div class="item-row" onclick="openVideoModal('${v.id}')">
        <div class="item-dot ${dotClass(v.status)}"></div>
        <div class="item-info">
          <div class="item-title">${escHtml(v.title)}</div>
          <div class="item-meta">${formatDate(v.publishDate)}</div>
        </div>
        <span class="${badgeClass(v.status)}">${v.status}</span>
      </div>
    `).join('');
  }

  // Pipeline bar
  const total = DB.videos.length || 1;
  const pipeline = document.getElementById('pipelineBar');
  const segments = STATUS_ORDER.map(s => ({
    status: s,
    count: DB.videos.filter(v => v.status === s).length,
    color: STATUS_COLORS[s],
  })).filter(s => s.count > 0);

  pipeline.innerHTML = `
    <div style="display:flex;gap:4px;width:100%;flex-wrap:wrap;align-items:center;">
      ${segments.map(s => `
        <div class="pipeline-segment" title="${s.status}: ${s.count}"
          style="width:${(s.count/total)*100}%;background:${s.color};min-width:4px;"></div>
      `).join('')}
    </div>
    <div class="pipeline-legend">
      ${STATUS_ORDER.map(s => {
        const c = DB.videos.filter(v => v.status === s).length;
        return `<div class="legend-item"><div class="legend-dot" style="background:${STATUS_COLORS[s]}"></div>${s}: ${c}</div>`;
      }).join('')}
    </div>
  `;
}

function emptyState(msg) {
  return `<div class="empty-state">
    <div class="empty-state-icon">◌</div>
    <div class="empty-state-title">${msg}</div>
  </div>`;
}

// ==================
// VIDEOS
// ==================
function renderVideos() {
  populateSeriesFilter();
  filterAndRenderVideos();
}

function populateSeriesFilter() {
  const sel = document.getElementById('videoSeriesFilter');
  const current = sel.value;
  sel.innerHTML = '<option value="">All Series</option>' +
    DB.series.map(s => `<option value="${escHtml(s.name)}" ${s.name === current ? 'selected' : ''}>${escHtml(s.name)}</option>`).join('');
}

function filterAndRenderVideos() {
  const search = document.getElementById('videoSearch')?.value.toLowerCase() || '';
  const status = document.getElementById('videoStatusFilter')?.value || '';
  const series = document.getElementById('videoSeriesFilter')?.value || '';

  let videos = DB.videos.filter(v => {
    const matchSearch = !search || v.title.toLowerCase().includes(search) || v.hook?.toLowerCase().includes(search);
    const matchStatus = !status || v.status === status;
    const matchSeries = !series || v.series === series;
    return matchSearch && matchStatus && matchSeries;
  });

  const grid = document.getElementById('videoGrid');
  if (videos.length === 0) {
    grid.innerHTML = `<div style="grid-column:1/-1">${emptyState('No videos found')}</div>`;
    return;
  }

  grid.innerHTML = videos.map(v => videoCard(v)).join('');
}

function videoCard(v) {
  return `
  <div class="video-card" data-id="${v.id}">
    <div class="video-card-top">
      <div class="video-card-title">${escHtml(v.title)}</div>
      <span class="${badgeClass(v.status)}">${v.status}</span>
    </div>
    <div class="video-card-body">
      <div class="video-card-hook">${escHtml(v.hook) || '<em style="opacity:0.4">No hook written</em>'}</div>
      <div class="video-card-meta">
        <span class="video-card-series">${escHtml(v.series) || 'No series'}</span>
        ${v.publishDate ? `<span style="font-size:11px;color:var(--text3)">📅 ${formatDate(v.publishDate)}</span>` : ''}
      </div>
    </div>
    <div class="video-card-actions">
      <button class="action-btn" onclick="openVideoModal('${v.id}')">✏ Edit</button>
      <button class="action-btn" onclick="navigateTo('scripts');selectScriptByVideo('${v.id}')">📝 Script</button>
      <button class="action-btn del" onclick="deleteVideo('${v.id}')">✕</button>
    </div>
  </div>`;
}

function openAddVideoModal() {
  const seriesOptions = DB.series.map(s => `<option value="${escHtml(s.name)}">${escHtml(s.name)}</option>`).join('');
  showModal('Add New Video', `
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input id="f_title" class="form-input" placeholder="Video title..." />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Series</label>
        <select id="f_series" class="form-select">
          <option value="">None</option>${seriesOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="f_status" class="form-select">
          ${STATUS_ORDER.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Hook</label>
      <textarea id="f_hook" class="form-textarea" placeholder="The first thing viewers hear..."></textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Thumbnail Text</label>
      <input id="f_thumbtext" class="form-input" placeholder="Bold overlay text..." />
    </div>
    <div class="form-group">
      <label class="form-label">Thumbnail Idea</label>
      <input id="f_thumbidea" class="form-input" placeholder="Visual concept..." />
    </div>
    <div class="form-group">
      <label class="form-label">Publish Date</label>
      <input id="f_pubdate" class="form-input" type="date" />
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', action: closeModal },
    { label: 'Add Video', cls: 'btn-primary', action: () => {
      const title = document.getElementById('f_title').value.trim();
      if (!title) { toast('Please enter a title', 'error'); return; }
      const video = {
        id: uid(),
        title,
        series: document.getElementById('f_series').value,
        status: document.getElementById('f_status').value,
        hook: document.getElementById('f_hook').value.trim(),
        script: '',
        description: '',
        tags: [],
        thumbnailText: document.getElementById('f_thumbtext').value.trim(),
        thumbnailIdea: document.getElementById('f_thumbidea').value.trim(),
        publishDate: document.getElementById('f_pubdate').value,
        createdAt: Date.now(),
      };
      DB.videos.push(video);
      save();
      closeModal();
      toast('Video added!', 'success');
      filterAndRenderVideos();
    }}
  ]);
}

function openVideoModal(id) {
  const v = DB.videos.find(x => x.id === id);
  if (!v) return;
  const seriesOptions = DB.series.map(s =>
    `<option value="${escHtml(s.name)}" ${s.name === v.series ? 'selected' : ''}>${escHtml(s.name)}</option>`
  ).join('');
  showModal('Edit Video', `
    <div class="form-group">
      <label class="form-label">Title *</label>
      <input id="f_title" class="form-input" value="${escHtml(v.title)}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Series</label>
        <select id="f_series" class="form-select">
          <option value="">None</option>${seriesOptions}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select id="f_status" class="form-select">
          ${STATUS_ORDER.map(s => `<option value="${s}" ${s === v.status ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Hook</label>
      <textarea id="f_hook" class="form-textarea">${escHtml(v.hook)}</textarea>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea id="f_desc" class="form-textarea">${escHtml(v.description)}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Thumbnail Text</label>
        <input id="f_thumbtext" class="form-input" value="${escHtml(v.thumbnailText)}" />
      </div>
      <div class="form-group">
        <label class="form-label">Thumbnail Idea</label>
        <input id="f_thumbidea" class="form-input" value="${escHtml(v.thumbnailIdea)}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Publish Date</label>
      <input id="f_pubdate" class="form-input" type="date" value="${v.publishDate || ''}" />
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', action: closeModal },
    { label: 'Save Changes', cls: 'btn-primary', action: () => {
      const title = document.getElementById('f_title').value.trim();
      if (!title) { toast('Title required', 'error'); return; }
      v.title = title;
      v.series = document.getElementById('f_series').value;
      v.status = document.getElementById('f_status').value;
      v.hook = document.getElementById('f_hook').value.trim();
      v.description = document.getElementById('f_desc').value.trim();
      v.thumbnailText = document.getElementById('f_thumbtext').value.trim();
      v.thumbnailIdea = document.getElementById('f_thumbidea').value.trim();
      v.publishDate = document.getElementById('f_pubdate').value;
      save();
      closeModal();
      toast('Video updated!', 'success');
      if (currentPage === 'videos') filterAndRenderVideos();
      if (currentPage === 'dashboard') renderDashboard();
    }}
  ]);
}

function deleteVideo(id) {
  showConfirm('Delete this video? This cannot be undone.', () => {
    DB.videos = DB.videos.filter(v => v.id !== id);
    save();
    toast('Video deleted', 'info');
    filterAndRenderVideos();
  });
}

// ==================
// KANBAN
// ==================
function renderKanban() {
  const board = document.getElementById('kanbanBoard');
  board.innerHTML = STATUS_ORDER.map(status => {
    const cards = DB.videos.filter(v => v.status === status);
    return `
      <div class="kanban-col">
        <div class="kanban-col-head">
          <span class="kanban-col-title" style="color:${STATUS_COLORS[status]}">${status}</span>
          <span class="kanban-count">${cards.length}</span>
        </div>
        <div class="kanban-cards" data-status="${status}"
          ondragover="kanbanDragOver(event)" ondrop="kanbanDrop(event,this)">
          ${cards.map(v => `
            <div class="kanban-card" draggable="true"
              data-id="${v.id}"
              ondragstart="kanbanDragStart(event,this)">
              <div class="kanban-card-title">${escHtml(v.title)}</div>
              <div class="kanban-card-series" style="color:${STATUS_COLORS[status]}">${escHtml(v.series) || 'No series'}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }).join('');
}

let draggedId = null;
let dragEl = null;

function kanbanDragStart(e, el) {
  draggedId = el.dataset.id;
  dragEl = el;
  setTimeout(() => el.classList.add('dragging'), 0);
  e.dataTransfer.effectAllowed = 'move';
}

function kanbanDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  document.querySelectorAll('.kanban-cards').forEach(c => c.classList.remove('drag-over'));
  e.currentTarget.classList.add('drag-over');
}

function kanbanDrop(e, col) {
  e.preventDefault();
  col.classList.remove('drag-over');
  if (dragEl) dragEl.classList.remove('dragging');

  const newStatus = col.dataset.status;
  const video = DB.videos.find(v => v.id === draggedId);
  if (video && video.status !== newStatus) {
    video.status = newStatus;
    save();
    toast(`Moved to ${newStatus}`, 'success');
    renderKanban();
    if (currentPage === 'dashboard') renderDashboard();
  }
  draggedId = null;
  dragEl = null;
}

// Also clear on dragend
document.addEventListener('dragend', () => {
  document.querySelectorAll('.kanban-cards').forEach(c => c.classList.remove('drag-over'));
  document.querySelectorAll('.kanban-card').forEach(c => c.classList.remove('dragging'));
});

// ==================
// SCRIPTS
// ==================
function renderScripts() {
  const list = document.getElementById('scriptList');
  if (DB.scripts.length === 0) {
    list.innerHTML = emptyState('No scripts');
    return;
  }
  list.innerHTML = DB.scripts.map(s => `
    <div class="script-list-item ${s.id === activeScriptId ? 'active' : ''}"
      onclick="openScript('${s.id}')">
      <div class="script-list-title">${escHtml(s.title)}</div>
      <div class="script-list-meta">${wordCount([s.hook,s.intro,s.mainContent,s.story,s.cta].join(' '))} words</div>
    </div>
  `).join('');

  if (activeScriptId) {
    const s = DB.scripts.find(x => x.id === activeScriptId);
    if (s) renderScriptEditor(s);
  }
}

function openScript(id) {
  activeScriptId = id;
  const s = DB.scripts.find(x => x.id === id);
  if (!s) return;
  document.querySelectorAll('.script-list-item').forEach(el => {
    el.classList.toggle('active', el.getAttribute('onclick').includes(id));
  });
  renderScriptEditor(s);
}

function renderScriptEditor(s) {
  const area = document.getElementById('scriptEditorArea');
  const sections = [
    { key: 'hook', label: 'Hook — The Opening Punch' },
    { key: 'intro', label: 'Intro — Set the Scene' },
    { key: 'mainContent', label: 'Main Content' },
    { key: 'story', label: 'Story / Example' },
    { key: 'cta', label: 'CTA — Call to Action' },
  ];

  const totalWords = wordCount([s.hook,s.intro,s.mainContent,s.story,s.cta].join(' '));

  area.innerHTML = `
    <div class="script-editor">
      <div class="script-editor-head">
        <input class="script-title-input" id="scriptTitle" value="${escHtml(s.title)}" placeholder="Script title..." />
        <div class="script-stats">${totalWords} words · ${estimateDuration(totalWords)}</div>
        <button class="btn-danger btn-small" onclick="deleteScript('${s.id}')">Delete</button>
      </div>
      <div class="script-body" id="scriptBody">
        ${sections.map(sec => `
          <div>
            <div class="script-section-label">${sec.label}</div>
            <textarea class="script-textarea" data-key="${sec.key}" rows="4"
              oninput="scheduleScriptSave('${s.id}')"
              placeholder="Write ${sec.key}...">${escHtml(s[sec.key] || '')}</textarea>
          </div>
        `).join('')}
      </div>
      <div class="autosave-indicator" id="autosaveIndicator">Auto-saved</div>
    </div>
  `;

  document.getElementById('scriptTitle').addEventListener('input', () => scheduleScriptSave(s.id));
}

function scheduleScriptSave(id) {
  clearTimeout(scriptAutoSaveTimer);
  const indicator = document.getElementById('autosaveIndicator');
  if (indicator) indicator.textContent = 'Saving...';
  scriptAutoSaveTimer = setTimeout(() => saveScriptContent(id), 800);
}

function saveScriptContent(id) {
  const s = DB.scripts.find(x => x.id === id);
  if (!s) return;
  const titleEl = document.getElementById('scriptTitle');
  if (titleEl) s.title = titleEl.value.trim() || 'Untitled';
  document.querySelectorAll('[data-key]').forEach(el => {
    s[el.dataset.key] = el.value;
  });
  s.updatedAt = Date.now();
  save();

  const totalWords = wordCount([s.hook,s.intro,s.mainContent,s.story,s.cta].join(' '));
  const statsEl = document.querySelector('.script-stats');
  if (statsEl) statsEl.textContent = `${totalWords} words · ${estimateDuration(totalWords)}`;

  const indicator = document.getElementById('autosaveIndicator');
  if (indicator) indicator.textContent = `Auto-saved at ${new Date().toLocaleTimeString()}`;

  renderScripts();
}

function createNewScript() {
  showModal('New Script', `
    <div class="form-group">
      <label class="form-label">Script Title</label>
      <input id="f_stitle" class="form-input" placeholder="Script name..." />
    </div>
    <div class="form-group">
      <label class="form-label">Link to Video (optional)</label>
      <select id="f_svideo" class="form-select">
        <option value="">None</option>
        ${DB.videos.map(v => `<option value="${v.id}">${escHtml(v.title)}</option>`).join('')}
      </select>
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', action: closeModal },
    { label: 'Create', cls: 'btn-primary', action: () => {
      const title = document.getElementById('f_stitle').value.trim() || 'Untitled Script';
      const s = { id: uid(), title, videoId: document.getElementById('f_svideo').value,
        hook: '', intro: '', mainContent: '', story: '', cta: '', updatedAt: Date.now() };
      DB.scripts.push(s);
      save();
      closeModal();
      activeScriptId = s.id;
      renderScripts();
    }}
  ]);
}

function deleteScript(id) {
  showConfirm('Delete this script?', () => {
    DB.scripts = DB.scripts.filter(s => s.id !== id);
    if (activeScriptId === id) activeScriptId = null;
    save();
    toast('Script deleted', 'info');
    const area = document.getElementById('scriptEditorArea');
    area.innerHTML = '<div class="script-placeholder">Select a script or create a new one</div>';
    renderScripts();
  });
}

function selectScriptByVideo(videoId) {
  const s = DB.scripts.find(x => x.videoId === videoId);
  if (s) { activeScriptId = s.id; renderScripts(); }
}

// ==================
// SERIES
// ==================
function renderSeries() {
  const grid = document.getElementById('seriesGrid');
  if (DB.series.length === 0) {
    grid.innerHTML = emptyState('No series created yet');
    return;
  }
  grid.innerHTML = DB.series.map(s => {
    const videos = DB.videos.filter(v => v.series === s.name);
    const published = videos.filter(v => v.status === 'Published').length;
    const pct = videos.length > 0 ? Math.round((published / videos.length) * 100) : 0;
    return `
      <div class="series-card">
        <div class="series-header">
          <div>
            <div class="series-name">${escHtml(s.name)}</div>
            <div style="margin-top:4px;font-size:12px;color:var(--text3)">${videos.length} video${videos.length !== 1 ? 's' : ''}</div>
          </div>
          <div class="series-emoji">${s.emoji}</div>
        </div>
        <div class="series-description">${escHtml(s.description)}</div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:${pct}%;background:${s.color}"></div>
        </div>
        <div style="font-size:11px;color:var(--text3);margin-top:4px">${pct}% published · ${published}/${videos.length}</div>
        <div class="series-stats">
          ${STATUS_ORDER.filter(st => videos.filter(v => v.status === st).length > 0).map(st => `
            <div class="series-stat-item">
              <span class="series-stat-value">${videos.filter(v => v.status === st).length}</span> ${st}
            </div>
          `).join('')}
        </div>
        <div class="series-actions">
          <button class="btn-ghost" onclick="editSeries('${s.id}')">Edit</button>
          <button class="btn-ghost" style="color:var(--red)" onclick="deleteSeries('${s.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function openAddSeriesModal() {
  showModal('Add New Series', `
    <div class="form-group">
      <label class="form-label">Series Name *</label>
      <input id="f_sname" class="form-input" placeholder="e.g. Inside The Internet" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Emoji</label>
        <input id="f_semoji" class="form-input" placeholder="🎬" maxlength="4" />
      </div>
      <div class="form-group">
        <label class="form-label">Accent Color</label>
        <input id="f_scolor" class="form-input" type="color" value="#7c5cfc" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea id="f_sdesc" class="form-textarea" placeholder="What this series is about..."></textarea>
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', action: closeModal },
    { label: 'Create Series', cls: 'btn-primary', action: () => {
      const name = document.getElementById('f_sname').value.trim();
      if (!name) { toast('Name required', 'error'); return; }
      DB.series.push({
        id: uid(),
        name,
        emoji: document.getElementById('f_semoji').value || '🎬',
        color: document.getElementById('f_scolor').value,
        description: document.getElementById('f_sdesc').value.trim(),
        createdAt: Date.now(),
      });
      save();
      closeModal();
      toast('Series created!', 'success');
      renderSeries();
    }}
  ]);
}

function editSeries(id) {
  const s = DB.series.find(x => x.id === id);
  if (!s) return;
  showModal('Edit Series', `
    <div class="form-group">
      <label class="form-label">Series Name *</label>
      <input id="f_sname" class="form-input" value="${escHtml(s.name)}" />
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Emoji</label>
        <input id="f_semoji" class="form-input" value="${s.emoji}" maxlength="4" />
      </div>
      <div class="form-group">
        <label class="form-label">Accent Color</label>
        <input id="f_scolor" class="form-input" type="color" value="${s.color}" />
      </div>
    </div>
    <div class="form-group">
      <label class="form-label">Description</label>
      <textarea id="f_sdesc" class="form-textarea">${escHtml(s.description)}</textarea>
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', action: closeModal },
    { label: 'Save', cls: 'btn-primary', action: () => {
      const name = document.getElementById('f_sname').value.trim();
      if (!name) { toast('Name required', 'error'); return; }
      // Update series name in videos
      if (s.name !== name) {
        DB.videos.forEach(v => { if (v.series === s.name) v.series = name; });
      }
      s.name = name;
      s.emoji = document.getElementById('f_semoji').value || '🎬';
      s.color = document.getElementById('f_scolor').value;
      s.description = document.getElementById('f_sdesc').value.trim();
      save();
      closeModal();
      toast('Series updated!', 'success');
      renderSeries();
    }}
  ]);
}

function deleteSeries(id) {
  showConfirm('Delete this series? Videos will not be deleted but will lose their series.', () => {
    const s = DB.series.find(x => x.id === id);
    if (s) DB.videos.forEach(v => { if (v.series === s.name) v.series = ''; });
    DB.series = DB.series.filter(x => x.id !== id);
    save();
    toast('Series deleted', 'info');
    renderSeries();
  });
}

// ==================
// THUMBNAILS
// ==================
function renderThumbnails() {
  const grid = document.getElementById('thumbnailGrid');
  if (DB.videos.length === 0) {
    grid.innerHTML = emptyState('No videos yet');
    return;
  }
  grid.innerHTML = DB.videos.map(v => {
    const thumb = DB.thumbnails[v.id] || {};
    const checks = ['Face Ready','Background Ready','Text Ready','Exported'];
    const done = checks.filter(c => thumb[c]).length;
    return `
      <div class="video-card">
        <div class="video-card-top">
          <div class="video-card-title">${escHtml(v.title)}</div>
          <span class="${badgeClass(v.status)}">${v.status}</span>
        </div>
        <div class="video-card-body">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--text3);margin-bottom:4px">Thumb Text</div>
          <div style="font-size:14px;font-weight:700;margin-bottom:10px">${escHtml(v.thumbnailText) || '<span style="opacity:.3">Not set</span>'}</div>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--text3);margin-bottom:4px">Concept</div>
          <div style="font-size:13px;color:var(--text2)">${escHtml(v.thumbnailIdea) || '<span style="opacity:.3">Not set</span>'}</div>
          ${thumb.notes ? `<div style="margin-top:10px;font-size:12px;color:var(--text3);background:var(--surface);padding:8px 10px;border-radius:6px">${escHtml(thumb.notes)}</div>` : ''}
          <div style="margin-top:10px;font-size:11px;color:var(--text3)">${done}/${checks.length} checklist</div>
        </div>
        <div class="thumb-card-checklist">
          ${checks.map(c => `
            <div class="check-pill ${thumb[c] ? 'checked' : ''}" onclick="toggleThumbCheck('${v.id}','${c}',this)">
              ${thumb[c] ? '✓ ' : ''}${c}
            </div>
          `).join('')}
        </div>
        <div class="video-card-actions">
          <button class="action-btn" onclick="editThumbNotes('${v.id}')">📝 Notes</button>
        </div>
      </div>
    `;
  }).join('');
}

function toggleThumbCheck(videoId, checkName, el) {
  if (!DB.thumbnails[videoId]) DB.thumbnails[videoId] = {};
  DB.thumbnails[videoId][checkName] = !DB.thumbnails[videoId][checkName];
  save();
  el.classList.toggle('checked', DB.thumbnails[videoId][checkName]);
  el.textContent = (DB.thumbnails[videoId][checkName] ? '✓ ' : '') + checkName;
}

function editThumbNotes(videoId) {
  const thumb = DB.thumbnails[videoId] || {};
  showModal('Thumbnail Notes', `
    <div class="form-group">
      <label class="form-label">Notes</label>
      <textarea id="f_tnotes" class="form-textarea" style="min-height:120px">${escHtml(thumb.notes || '')}</textarea>
    </div>
  `, [
    { label: 'Cancel', cls: 'btn-ghost', action: closeModal },
    { label: 'Save', cls: 'btn-primary', action: () => {
      if (!DB.thumbnails[videoId]) DB.thumbnails[videoId] = {};
      DB.thumbnails[videoId].notes = document.getElementById('f_tnotes').value.trim();
      save();
      closeModal();
      renderThumbnails();
    }}
  ]);
}

// ==================
// SEO
// ==================
function renderSEO() {
  const sel = document.getElementById('seoVideoSelect');
  const current = sel.value;
  sel.innerHTML = '<option value="">Select a video to optimize...</option>' +
    DB.videos.map(v => `<option value="${v.id}" ${v.id === current ? 'selected' : ''}>${escHtml(v.title)}</option>`).join('');

  if (current) loadSEOEditor(current);
}

function loadSEOEditor(videoId) {
  const v = DB.videos.find(x => x.id === videoId);
  if (!v) return;
  const seo = DB.seo[videoId] || {};
  const tags = seo.tags || v.tags || [];

  const editor = document.getElementById('seoEditor');
  editor.classList.remove('hidden');
  editor.innerHTML = `
    <div class="seo-field-group">
      <div class="seo-field-label">
        <span>Title</span>
        <span class="seo-counter" id="titleCounter">0/100</span>
      </div>
      <input class="seo-input" id="seoTitle" maxlength="100"
        value="${escHtml(seo.title || v.title || '')}"
        oninput="updateSEOCounter('seoTitle','titleCounter',100)" />
    </div>
    <div class="seo-field-group">
      <div class="seo-field-label">
        <span>Description</span>
        <span class="seo-counter" id="descCounter">0/5000</span>
      </div>
      <textarea class="seo-textarea" id="seoDesc" maxlength="5000"
        oninput="updateSEOCounter('seoDesc','descCounter',5000)">${escHtml(seo.description || v.description || '')}</textarea>
    </div>
    <div class="seo-field-group">
      <div class="seo-field-label">
        <span>Tags</span>
        <span class="seo-counter" id="tagCounter">0 tags</span>
      </div>
      <div class="tags-input-wrap" id="tagsWrap" onclick="focusTagInput()">
        <div id="tagChips"></div>
        <input class="tags-bare-input" id="tagInput" placeholder="Add tag, press Enter"
          onkeydown="handleTagInput(event,'${videoId}')" />
      </div>
    </div>
    <div class="seo-field-group">
      <div class="seo-field-label"><span>Keywords / Focus</span></div>
      <input class="seo-input" id="seoKeywords"
        value="${escHtml(seo.keywords || '')}"
        placeholder="comma separated keywords" />
    </div>
    <div class="seo-actions">
      <button class="btn-primary" onclick="saveSEO('${videoId}')">Save SEO</button>
      <button class="btn-ghost" onclick="copySEO('${videoId}')">Copy All</button>
    </div>
  `;

  // Render existing tags
  window._seoTags = [...tags];
  renderTagChips(videoId);
  updateSEOCounter('seoTitle','titleCounter',100);
  updateSEOCounter('seoDesc','descCounter',5000);
}

function updateSEOCounter(inputId, counterId, max) {
  const el = document.getElementById(inputId);
  const cEl = document.getElementById(counterId);
  if (!el || !cEl) return;
  const len = el.value.length;
  cEl.textContent = `${len}/${max}`;
  cEl.className = 'seo-counter' + (len > max * 0.9 ? ' over' : '');
}

window._seoTags = [];

function renderTagChips(videoId) {
  const wrap = document.getElementById('tagChips');
  const counter = document.getElementById('tagCounter');
  if (!wrap) return;
  wrap.innerHTML = window._seoTags.map((t, i) => `
    <div class="tag-chip">
      ${escHtml(t)}
      <span class="tag-chip-remove" onclick="removeTag(${i},'${videoId}')">✕</span>
    </div>
  `).join('');
  if (counter) counter.textContent = `${window._seoTags.length} tags`;
}

function removeTag(i, videoId) {
  window._seoTags.splice(i, 1);
  renderTagChips(videoId);
}

function handleTagInput(e, videoId) {
  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault();
    const val = e.target.value.replace(',','').trim();
    if (val && !window._seoTags.includes(val)) {
      window._seoTags.push(val);
      renderTagChips(videoId);
    }
    e.target.value = '';
  } else if (e.key === 'Backspace' && e.target.value === '' && window._seoTags.length > 0) {
    window._seoTags.pop();
    renderTagChips(videoId);
  }
}

function focusTagInput() {
  const el = document.getElementById('tagInput');
  if (el) el.focus();
}

function saveSEO(videoId) {
  if (!DB.seo[videoId]) DB.seo[videoId] = {};
  DB.seo[videoId].title = document.getElementById('seoTitle')?.value.trim() || '';
  DB.seo[videoId].description = document.getElementById('seoDesc')?.value.trim() || '';
  DB.seo[videoId].tags = [...window._seoTags];
  DB.seo[videoId].keywords = document.getElementById('seoKeywords')?.value.trim() || '';
  const v = DB.videos.find(x => x.id === videoId);
  if (v) {
    v.description = DB.seo[videoId].description;
    v.tags = DB.seo[videoId].tags;
  }
  save();
  toast('SEO saved!', 'success');
}

function copySEO(videoId) {
  const seo = DB.seo[videoId] || {};
  const text = `TITLE:\n${seo.title || ''}\n\nDESCRIPTION:\n${seo.description || ''}\n\nTAGS:\n${(seo.tags || []).join(', ')}\n\nKEYWORDS:\n${seo.keywords || ''}`;
  navigator.clipboard.writeText(text).then(() => toast('Copied to clipboard!', 'success'));
}

// ==================
// CALENDAR
// ==================
function renderCalendar() {
  const now = new Date();
  if (!calYear) calYear = now.getFullYear();
  if (calMonth === undefined) calMonth = now.getMonth();

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  document.getElementById('calTitle').textContent = `${monthNames[calMonth]} ${calYear}`;

  const first = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const scheduled = {};
  DB.videos.forEach(v => {
    if (v.publishDate) {
      const d = new Date(v.publishDate);
      if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
        const key = d.getDate();
        if (!scheduled[key]) scheduled[key] = [];
        scheduled[key].push(v);
      }
    }
  });

  const cells = [];
  // Blank cells before
  for (let i = 0; i < first; i++) {
    cells.push(`<div class="cal-cell other-month"></div>`);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const today = new Date();
    const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    const events = scheduled[d] || [];
    cells.push(`
      <div class="cal-cell ${isToday ? 'today' : ''}">
        <div class="cal-date">${d}</div>
        ${events.map(v => `<div class="cal-event" title="${escHtml(v.title)}" onclick="openVideoModal('${v.id}')">${escHtml(v.title)}</div>`).join('')}
      </div>
    `);
  }
  // Fill remaining
  const remaining = 7 - ((first + daysInMonth) % 7);
  if (remaining < 7) {
    for (let i = 0; i < remaining; i++) cells.push(`<div class="cal-cell other-month"></div>`);
  }

  document.getElementById('calendarGrid').innerHTML = `
    <div class="cal-days-header">
      ${dayNames.map(d => `<div class="cal-day-name">${d}</div>`).join('')}
    </div>
    <div class="cal-cells">
      ${cells.join('')}
    </div>
  `;
}

// ==================
// TASKS
// ==================
function renderTasks() {
  const list = document.getElementById('taskList');
  if (DB.tasks.length === 0) {
    list.innerHTML = emptyState('No tasks yet');
    return;
  }
  const sorted = [...DB.tasks].sort((a,b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const pr = { high: 0, normal: 1, low: 2 };
    return (pr[a.priority] || 1) - (pr[b.priority] || 1);
  });
  list.innerHTML = sorted.map(t => `
    <div class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
      <div class="task-checkbox ${t.done ? 'checked' : ''}" onclick="toggleTask('${t.id}')">
        ${t.done ? '✓' : ''}
      </div>
      <div class="task-text">${escHtml(t.text)}</div>
      ${t.priority !== 'normal' ? `<span class="task-priority-badge priority-${t.priority}">${t.priority}</span>` : ''}
      ${t.due ? `<span class="task-due">${formatDate(t.due)}</span>` : ''}
      <button class="task-delete" onclick="deleteTask('${t.id}')">✕</button>
    </div>
  `).join('');
}

function toggleTask(id) {
  const t = DB.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  save();
  renderTasks();
  if (currentPage === 'dashboard') renderDashboard();
}

function deleteTask(id) {
  DB.tasks = DB.tasks.filter(x => x.id !== id);
  save();
  renderTasks();
}

function showTaskInput() {
  const area = document.getElementById('taskInputArea');
  area.style.display = 'flex';
  document.getElementById('taskInputField').focus();
}

function saveNewTask() {
  const text = document.getElementById('taskInputField').value.trim();
  if (!text) { toast('Enter task text', 'error'); return; }
  DB.tasks.push({
    id: uid(),
    text,
    done: false,
    priority: document.getElementById('taskPriority').value,
    due: document.getElementById('taskDueDate').value,
    createdAt: Date.now(),
  });
  save();
  document.getElementById('taskInputArea').style.display = 'none';
  document.getElementById('taskInputField').value = '';
  document.getElementById('taskDueDate').value = '';
  renderTasks();
  toast('Task added!', 'success');
}

// ==================
// ANALYTICS
// ==================
function renderAnalytics() {
  // Destroy old
  Object.values(analyticsCharts).forEach(c => { try { c.destroy(); } catch(e){} });
  analyticsCharts = {};

  const statusCounts = STATUS_ORDER.map(s => DB.videos.filter(v => v.status === s).length);

  // Status chart
  analyticsCharts.status = new Chart(document.getElementById('statusChart'), {
    type: 'bar',
    data: {
      labels: STATUS_ORDER,
      datasets: [{
        label: 'Videos by Status',
        data: statusCounts,
        backgroundColor: STATUS_ORDER.map(s => STATUS_COLORS[s] + '99'),
        borderColor: STATUS_ORDER.map(s => STATUS_COLORS[s]),
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: chartOptions('Videos by Status')
  });

  // Series chart
  const seriesLabels = DB.series.map(s => s.name);
  const seriesCounts = DB.series.map(s => DB.videos.filter(v => v.series === s.name).length);
  analyticsCharts.series = new Chart(document.getElementById('seriesChart'), {
    type: 'doughnut',
    data: {
      labels: seriesLabels,
      datasets: [{
        data: seriesCounts,
        backgroundColor: DB.series.map(s => s.color + '99'),
        borderColor: DB.series.map(s => s.color),
        borderWidth: 2,
      }]
    },
    options: {
      ...chartOptions('Videos per Series'),
      cutout: '65%',
    }
  });

  // Completion chart
  const total = DB.videos.length || 1;
  const published = DB.videos.filter(v => v.status === 'Published').length;
  const pct = Math.round((published / total) * 100);
  analyticsCharts.completion = new Chart(document.getElementById('completionChart'), {
    type: 'doughnut',
    data: {
      labels: ['Published', 'In Progress'],
      datasets: [{
        data: [published, total - published],
        backgroundColor: ['rgba(34,212,132,0.8)', 'rgba(255,255,255,0.06)'],
        borderColor: ['#22d484', 'rgba(255,255,255,0.1)'],
        borderWidth: 2,
      }]
    },
    options: {
      ...chartOptions(`Completion Rate: ${pct}%`),
      cutout: '65%',
    }
  });

  // Timeline (videos created per month)
  const months = {};
  DB.videos.forEach(v => {
    const d = new Date(v.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    months[key] = (months[key] || 0) + 1;
  });
  const sortedMonths = Object.keys(months).sort();
  analyticsCharts.timeline = new Chart(document.getElementById('timelineChart'), {
    type: 'line',
    data: {
      labels: sortedMonths,
      datasets: [{
        label: 'Videos Created',
        data: sortedMonths.map(k => months[k]),
        borderColor: '#7c5cfc',
        backgroundColor: 'rgba(124,92,252,0.15)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#7c5cfc',
        pointRadius: 5,
      }]
    },
    options: chartOptions('Content Timeline')
  });
}

function chartOptions(title) {
  return {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#9191a8', font: { family: 'DM Sans', size: 12 } } },
      title: { display: true, text: title, color: '#f0f0f8', font: { family: 'Syne', size: 14, weight: '700' } },
    },
    scales: {
      x: { ticks: { color: '#9191a8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
      y: { ticks: { color: '#9191a8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
    },
  };
}

// ==================
// BACKUP
// ==================
function renderBackup() {
  const info = document.getElementById('backupInfo');
  const total = JSON.stringify(DB).length;
  info.innerHTML = `
    <div style="font-family:var(--font-head);font-size:14px;font-weight:700;margin-bottom:10px">Storage Summary</div>
    <div>📹 Videos: <strong>${DB.videos.length}</strong></div>
    <div>📚 Series: <strong>${DB.series.length}</strong></div>
    <div>📝 Scripts: <strong>${DB.scripts.length}</strong></div>
    <div>✅ Tasks: <strong>${DB.tasks.length}</strong></div>
    <div style="margin-top:10px;color:var(--text3);font-size:12px">Total storage: ~${(total/1024).toFixed(1)} KB</div>
  `;
}

function exportData() {
  const data = JSON.stringify(DB, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `creatoros-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Data exported!', 'success');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      showConfirm('This will replace all your current data. Continue?', () => {
        Object.assign(DB, parsed);
        save();
        toast('Data imported!', 'success');
        renderBackup();
        renderDashboard();
      });
    } catch {
      toast('Invalid JSON file', 'error');
    }
  };
  reader.readAsText(file);
}

function resetData() {
  showConfirm('⚠️ DELETE ALL DATA? This is permanent and cannot be undone!', () => {
    localStorage.removeItem('creatoros_db');
    DB.videos = [];
    DB.series = [];
    DB.tasks = [];
    DB.scripts = [];
    DB.thumbnails = {};
    DB.seo = {};
    seedData();
    toast('Data reset. Fresh start!', 'info');
    renderPage(currentPage);
  });
}

// ==================
// MODAL SYSTEM
// ==================
function showModal(title, body, buttons = []) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  document.getElementById('modalFooter').innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = b.cls || 'btn-ghost';
    btn.textContent = b.label;
    btn.onclick = b.action;
    document.getElementById('modalFooter').appendChild(btn);
  });
  document.getElementById('overlay').classList.add('active');
  setTimeout(() => document.getElementById('modalBox').classList.add('active'), 10);
}

function closeModal() {
  document.getElementById('modalBox').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

function showConfirm(msg, onConfirm) {
  showModal('Confirm', `<p class="confirm-text">${escHtml(msg)}</p>`, [
    { label: 'Cancel', cls: 'btn-ghost', action: closeModal },
    { label: 'Confirm', cls: 'btn-danger', action: () => { closeModal(); onConfirm(); } },
  ]);
}

// ==================
// GLOBAL ADD BUTTON
// ==================
function handleGlobalAdd() {
  switch (currentPage) {
    case 'dashboard':
    case 'videos':    openAddVideoModal(); break;
    case 'series':    openAddSeriesModal(); break;
    case 'tasks':     showTaskInput(); break;
    case 'scripts':   createNewScript(); break;
    default: toast('Select a section to add content', 'info');
  }
}

// ==================
// EVENT LISTENERS
// ==================
function initEvents() {
  // Sidebar nav
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Bottom nav
  document.querySelectorAll('.bnav-item').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });

  // Mobile sidebar toggle
  document.getElementById('menuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('overlay').classList.toggle('active');
  });

  document.getElementById('sidebarClose').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('overlay').classList.remove('active');
  });

  // Overlay click
  document.getElementById('overlay').addEventListener('click', () => {
    // Close sidebar or modal
    if (document.getElementById('sidebar').classList.contains('open')) {
      document.getElementById('sidebar').classList.remove('open');
    } else {
      closeModal();
    }
    document.getElementById('overlay').classList.remove('active');
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);

  // Global add
  document.getElementById('globalAddBtn').addEventListener('click', handleGlobalAdd);

  // Video page
  document.getElementById('addVideoBtn').addEventListener('click', openAddVideoModal);
  document.getElementById('videoSearch').addEventListener('input', filterAndRenderVideos);
  document.getElementById('videoStatusFilter').addEventListener('change', filterAndRenderVideos);
  document.getElementById('videoSeriesFilter').addEventListener('change', filterAndRenderVideos);

  // Script page
  document.getElementById('newScriptBtn').addEventListener('click', createNewScript);

  // Series page
  document.getElementById('addSeriesBtn').addEventListener('click', openAddSeriesModal);

  // Calendar nav
  document.getElementById('calPrev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });

  // Tasks
  document.getElementById('addTaskBtn').addEventListener('click', showTaskInput);
  document.getElementById('saveTaskBtn').addEventListener('click', saveNewTask);
  document.getElementById('cancelTaskBtn').addEventListener('click', () => {
    document.getElementById('taskInputArea').style.display = 'none';
    document.getElementById('taskInputField').value = '';
  });
  document.getElementById('taskInputField').addEventListener('keydown', e => {
    if (e.key === 'Enter') saveNewTask();
  });

  // SEO
  document.getElementById('seoVideoSelect').addEventListener('change', e => {
    if (e.target.value) loadSEOEditor(e.target.value);
    else document.getElementById('seoEditor').classList.add('hidden');
  });

  // Backup
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', e => {
    if (e.target.files[0]) importData(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', resetData);

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
}

// ==================
// INIT
// ==================
function init() {
  load();
  initEvents();
  navigateTo('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
