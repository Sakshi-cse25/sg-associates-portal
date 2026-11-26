document.addEventListener('DOMContentLoaded', async () => {
  const grid = document.getElementById('projectsGrid');
  const statusEl = document.getElementById('projectsStatus');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const { escapeHtml, fetchJson } = sgUtils;

  let allProjects = [];

  function renderProjects(statusFilter) {
    const filtered =
      statusFilter === 'all'
        ? allProjects
        : allProjects.filter((p) => p.status === statusFilter);

    if (filtered.length === 0) {
      grid.innerHTML = '<p>No projects match this filter.</p>';
      return;
    }

    grid.innerHTML = filtered
      .map((project) => {
        const badgeClass = project.status === 'Completed' ? 'is-completed' : 'is-ongoing';
        return `
          <article class="card">
            <span class="card-tag ${badgeClass}">${escapeHtml(project.status)}</span>
            <h3>${escapeHtml(project.title)}</h3>
            <p>${escapeHtml(project.summary)}</p>
          </article>
        `;
      })
      .join('');
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filterButtons.forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      renderProjects(btn.dataset.status);
    });
  });

  statusEl.textContent = 'Loading projects...';
  try {
    const { ok, payload } = await fetchJson('/api/projects');
    if (!ok) throw new Error(payload.error || 'Failed to load projects');
    allProjects = payload.projects || [];
    statusEl.textContent = '';
    renderProjects('all');
  } catch (err) {
    statusEl.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
  }
});
