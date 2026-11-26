document.addEventListener('DOMContentLoaded', async () => {
  const servicesGrid = document.getElementById('homeServicesGrid');
  const projectsGrid = document.getElementById('homeProjectsGrid');
  const { escapeHtml, fetchJson } = sgUtils;

  try {
    const [svcRes, projRes] = await Promise.all([
      fetchJson('/api/services'),
      fetchJson('/api/projects'),
    ]);

    const services = (svcRes.payload.services || []).slice(0, 3);
    servicesGrid.innerHTML = services.length
      ? services
          .map(
            (s) => `
          <article class="card">
            <span class="card-tag">${escapeHtml(s.icon || 'civil')}</span>
            <h3>${escapeHtml(s.title)}</h3>
            <p>${escapeHtml(s.description)}</p>
          </article>
        `
          )
          .join('')
      : '<p>No services available right now.</p>';

    const projects = (projRes.payload.projects || []).slice(0, 3);
    projectsGrid.innerHTML = projects.length
      ? projects
          .map((p) => {
            const badgeClass = p.status === 'Completed' ? 'is-completed' : 'is-ongoing';
            return `
              <article class="card">
                <span class="card-tag ${badgeClass}">${escapeHtml(p.status)}</span>
                <h3>${escapeHtml(p.title)}</h3>
                <p>${escapeHtml(p.summary)}</p>
              </article>
            `;
          })
          .join('')
      : '<p>No projects available right now.</p>';
  } catch (err) {
    servicesGrid.innerHTML = '<p class="alert alert-error">Could not load services.</p>';
    projectsGrid.innerHTML = '<p class="alert alert-error">Could not load projects.</p>';
  }
});
