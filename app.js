let ALL_BRIEFINGS = [];
let activeTag = null;

async function init() {
  const res = await fetch('data/briefings.json');
  ALL_BRIEFINGS = await res.json();
  ALL_BRIEFINGS.sort((a, b) => b.date.localeCompare(a.date));

  renderBriefing(ALL_BRIEFINGS[0]);
  renderArchive();

  document.getElementById('search').addEventListener('input', renderArchive);
  document.getElementById('sort').addEventListener('change', renderArchive);
}

function renderBriefing(b) {
  const main = document.getElementById('main-briefing');
  if (!b) {
    main.innerHTML = '<p class="empty-note">No briefing selected.</p>';
    return;
  }

  const storiesHtml = b.stories.map((s, i) => `
    <div class="story" data-index="${i}">
      <h3>${escapeHtml(s.headline)}</h3>
      <p>${escapeHtml(s.simple)}</p>
      <dl class="story-line interview">
        <dt>Say this</dt><dd>${escapeHtml(s.interview_line)}</dd>
      </dl>
      <button class="show-more" data-index="${i}">
        <span class="arrow">›</span> More detail
      </button>
      <div class="story-detail">
        <ul>${s.detail.map(d => `<li>${escapeHtml(d)}</li>`).join('')}</ul>
      </div>
      <div class="tags">
        ${s.tags.map(t => `<button class="tag ${t === activeTag ? 'active' : ''}" data-tag="${t}">${t}</button>`).join('')}
      </div>
    </div>
  `).join('');

  const ibdHtml = b.ibd_relevance.map(x => `<li>${escapeHtml(x)}</li>`).join('');

  main.innerHTML = `
    <p class="eyebrow">Today's briefing — ${formatDate(b.date)}</p>
    <div class="stories-grid">${storiesHtml}</div>
    <div class="ibd-box">
      <p class="eyebrow">IBD relevance</p>
      <ul>${ibdHtml}</ul>
    </div>
    <div class="reveal-wrap" id="leftfield-wrap">
      <p class="eyebrow" style="color:var(--claret)">Left-field question</p>
      <p class="leftfield">${escapeHtml(b.left_field_question)}</p>
      <p class="leftfield-answer">${escapeHtml(b.left_field_answer)}</p>
      <button class="reveal-btn" id="reveal-btn">Reveal answer</button>
    </div>
  `;

  main.querySelectorAll('.tag').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTag = activeTag === btn.dataset.tag ? null : btn.dataset.tag;
      renderBriefing(b);
      renderArchive();
    });
  });

  main.querySelectorAll('.show-more').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.story');
      const wasExpanded = card.classList.contains('expanded');
      card.classList.toggle('expanded');
      btn.innerHTML = wasExpanded
        ? '<span class="arrow">›</span> More detail'
        : '<span class="arrow">›</span> Less detail';
    });
  });

  const revealBtn = document.getElementById('reveal-btn');
  if (revealBtn) {
    revealBtn.addEventListener('click', () => {
      document.getElementById('leftfield-wrap').classList.add('revealed');
    });
  }
}

function renderArchive() {
  const list = document.getElementById('archive-list');
  const query = document.getElementById('search').value.toLowerCase();
  const sortMode = document.getElementById('sort').value;

  let items = ALL_BRIEFINGS.filter(b => {
    const matchesTag = !activeTag || b.stories.some(s => s.tags.includes(activeTag));
    const haystack = (b.date + ' ' + b.stories.map(s => s.headline).join(' ')).toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesTag && matchesQuery;
  });

  if (sortMode === 'oldest') {
    items = [...items].sort((a, b) => a.date.localeCompare(b.date));
  } else {
    items = [...items].sort((a, b) => b.date.localeCompare(a.date));
  }

  if (items.length === 0) {
    list.innerHTML = '<p class="empty-note">No briefings match.</p>';
    return;
  }

  list.innerHTML = items.map(b => `
    <div class="archive-item" data-id="${b.id}">
      <div class="archive-item-date">${formatDate(b.date)}</div>
      <div class="archive-item-headline">${escapeHtml(b.stories[0].headline)}</div>
    </div>
  `).join('');

  list.querySelectorAll('.archive-item').forEach(el => {
    el.addEventListener('click', () => {
      const b = ALL_BRIEFINGS.find(x => x.id === el.dataset.id);
      renderBriefing(b);
      document.querySelectorAll('.archive-item').forEach(x => x.classList.remove('selected'));
      el.classList.add('selected');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

function formatDate(iso) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

init();
