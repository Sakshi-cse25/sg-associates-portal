document.addEventListener('DOMContentLoaded', async () => {
  const { escapeHtml, fetchJson } = sgUtils;
  const welcomeEl = document.getElementById('adminWelcome');
  const alertEl = document.getElementById('adminAlert');
  const logoutBtn = document.getElementById('logoutBtn');

  function showAlert(message, type = 'success') {
    alertEl.innerHTML = `<div class="alert alert-${type}">${escapeHtml(message)}</div>`;
  }

  // Verify valid session on load (TC-7: unauthenticated visitors redirect to login)
  try {
    const authRes = await fetchJson('/api/admin/me');
    if (!authRes.ok) {
      window.location.href = '/admin-login.html';
      return;
    }
    const admin = authRes.payload.admin;
    welcomeEl.textContent = `Signed in as ${admin.username}${admin.last_login ? ` (Last login: ${admin.last_login})` : ''}`;
  } catch (_) {
    window.location.href = '/admin-login.html';
    return;
  }

  logoutBtn.addEventListener('click', async () => {
    await fetchJson('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin-login.html';
  });

  // Tab switching
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      tabPanels.forEach((p) => {
        p.hidden = true;
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      document.getElementById(`tab-${btn.dataset.tab}`).hidden = false;
    });
  });

  // --- ENQUIRIES ---
  const enquiriesBody = document.getElementById('enquiriesTableBody');

  async function loadEnquiries() {
    const { ok, payload } = await fetchJson('/api/admin/enquiries');
    if (!ok) return;
    const rows = payload.enquiries || [];
    enquiriesBody.innerHTML = rows.length
      ? rows
          .map(
            (e) => `
          <tr>
            <td>#${e.enquiry_id}</td>
            <td><strong>${escapeHtml(e.name)}</strong></td>
            <td>
              <div>${escapeHtml(e.email)}</div>
              ${e.phone ? `<small>${escapeHtml(e.phone)}</small>` : ''}
            </td>
            <td>${escapeHtml(e.service_title || 'General')}</td>
            <td>${escapeHtml(e.message)}</td>
            <td>
              <select class="form-control enquiry-status-select" data-id="${e.enquiry_id}" aria-label="Status for enquiry ${e.enquiry_id}">
                <option value="New" ${e.status === 'New' ? 'selected' : ''}>New</option>
                <option value="In progress" ${e.status === 'In progress' ? 'selected' : ''}>In progress</option>
                <option value="Closed" ${e.status === 'Closed' ? 'selected' : ''}>Closed</option>
              </select>
            </td>
            <td><small>${escapeHtml(e.created_at)}</small></td>
          </tr>
        `
          )
          .join('')
      : '<tr><td colspan="7">No enquiries submitted yet.</td></tr>';

    enquiriesBody.querySelectorAll('.enquiry-status-select').forEach((sel) => {
      sel.addEventListener('change', async () => {
        const res = await fetchJson(`/api/admin/enquiries/${sel.dataset.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: sel.value }),
        });
        showAlert(
          res.ok ? res.payload.message : res.payload.error || 'Update failed.',
          res.ok ? 'success' : 'error'
        );
      });
    });
  }

  // --- SERVICES CRUD ---
  const serviceForm = document.getElementById('serviceForm');
  const serviceEditId = document.getElementById('serviceEditId');
  const serviceTitle = document.getElementById('serviceTitle');
  const serviceDescription = document.getElementById('serviceDescription');
  const serviceIcon = document.getElementById('serviceIcon');
  const serviceFormHeading = document.getElementById('serviceFormHeading');
  const cancelServiceEditBtn = document.getElementById('cancelServiceEditBtn');
  const adminServicesBody = document.getElementById('adminServicesBody');

  function resetServiceForm() {
    serviceEditId.value = '';
    serviceForm.reset();
    serviceFormHeading.textContent = 'Add Service';
    cancelServiceEditBtn.hidden = true;
  }

  cancelServiceEditBtn.addEventListener('click', resetServiceForm);

  async function loadServices() {
    const { ok, payload } = await fetchJson('/api/services');
    if (!ok) return;
    const services = payload.services || [];
    adminServicesBody.innerHTML = services
      .map(
        (s) => `
        <tr>
          <td>#${s.service_id}</td>
          <td><strong>${escapeHtml(s.title)}</strong></td>
          <td>${escapeHtml(s.description)}</td>
          <td class="actions-cell">
            <button type="button" class="btn btn-secondary btn-sm edit-service-btn" data-id="${s.service_id}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm delete-service-btn" data-id="${s.service_id}">Delete</button>
          </td>
        </tr>
      `
      )
      .join('');

    adminServicesBody.querySelectorAll('.edit-service-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const svc = services.find((x) => x.service_id === Number(btn.dataset.id));
        if (!svc) return;
        serviceEditId.value = String(svc.service_id);
        serviceTitle.value = svc.title;
        serviceDescription.value = svc.description;
        serviceIcon.value = svc.icon || '';
        serviceFormHeading.textContent = `Edit Service #${svc.service_id}`;
        cancelServiceEditBtn.hidden = false;
      });
    });

    adminServicesBody.querySelectorAll('.delete-service-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const res = await fetchJson(`/api/admin/services/${btn.dataset.id}`, { method: 'DELETE' });
        showAlert(res.payload.message || res.payload.error, res.ok ? 'success' : 'error');
        if (res.ok) loadServices();
      });
    });
  }

  serviceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = serviceEditId.value;
    const body = {
      title: serviceTitle.value,
      description: serviceDescription.value,
      icon: serviceIcon.value,
    };
    const res = await fetchJson(id ? `/api/admin/services/${id}` : '/api/admin/services', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body),
    });
    if (res.ok) {
      showAlert(res.payload.message, 'success');
      resetServiceForm();
      loadServices();
    } else {
      const firstErr = res.payload.errors ? Object.values(res.payload.errors)[0] : res.payload.error;
      showAlert(firstErr || 'Could not save service.', 'error');
    }
  });

  // --- PROJECTS CRUD ---
  const projectForm = document.getElementById('projectForm');
  const projectEditId = document.getElementById('projectEditId');
  const projectTitle = document.getElementById('projectTitle');
  const projectSummary = document.getElementById('projectSummary');
  const projectStatus = document.getElementById('projectStatus');
  const projectFormHeading = document.getElementById('projectFormHeading');
  const cancelProjectEditBtn = document.getElementById('cancelProjectEditBtn');
  const adminProjectsBody = document.getElementById('adminProjectsBody');
  const galleryProjectIdSelect = document.getElementById('galleryProjectId');

  function resetProjectForm() {
    projectEditId.value = '';
    projectForm.reset();
    projectFormHeading.textContent = 'Add Project';
    cancelProjectEditBtn.hidden = true;
  }

  cancelProjectEditBtn.addEventListener('click', resetProjectForm);

  async function loadProjects() {
    const { ok, payload } = await fetchJson('/api/projects');
    if (!ok) return;
    const projects = payload.projects || [];

    galleryProjectIdSelect.innerHTML = '<option value="">-- None --</option>';
    projects.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = String(p.project_id);
      opt.textContent = p.title;
      galleryProjectIdSelect.appendChild(opt);
    });

    adminProjectsBody.innerHTML = projects
      .map(
        (p) => `
        <tr>
          <td>#${p.project_id}</td>
          <td><strong>${escapeHtml(p.title)}</strong></td>
          <td>${escapeHtml(p.status)}</td>
          <td class="actions-cell">
            <button type="button" class="btn btn-secondary btn-sm edit-project-btn" data-id="${p.project_id}">Edit</button>
            <button type="button" class="btn btn-danger btn-sm delete-project-btn" data-id="${p.project_id}">Delete</button>
          </td>
        </tr>
      `
      )
      .join('');

    adminProjectsBody.querySelectorAll('.edit-project-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const proj = projects.find((x) => x.project_id === Number(btn.dataset.id));
        if (!proj) return;
        projectEditId.value = String(proj.project_id);
        projectTitle.value = proj.title;
        projectSummary.value = proj.summary;
        projectStatus.value = proj.status;
        projectFormHeading.textContent = `Edit Project #${proj.project_id}`;
        cancelProjectEditBtn.hidden = false;
      });
    });

    adminProjectsBody.querySelectorAll('.delete-project-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const res = await fetchJson(`/api/admin/projects/${btn.dataset.id}`, { method: 'DELETE' });
        showAlert(res.payload.message || res.payload.error, res.ok ? 'success' : 'error');
        if (res.ok) {
          loadProjects();
          loadGallery();
        }
      });
    });
  }

  projectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = projectEditId.value;
    const body = {
      title: projectTitle.value,
      summary: projectSummary.value,
      status: projectStatus.value,
    };
    const res = await fetchJson(id ? `/api/admin/projects/${id}` : '/api/admin/projects', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(body),
    });
    if (res.ok) {
      showAlert(res.payload.message, 'success');
      resetProjectForm();
      loadProjects();
    } else {
      const firstErr = res.payload.errors ? Object.values(res.payload.errors)[0] : res.payload.error;
      showAlert(firstErr || 'Could not save project.', 'error');
    }
  });

  // --- GALLERY CRUD ---
  const galleryForm = document.getElementById('galleryForm');
  const adminGalleryBody = document.getElementById('adminGalleryBody');

  async function loadGallery() {
    const { ok, payload } = await fetchJson('/api/gallery');
    if (!ok) return;
    const items = payload.gallery || [];
    adminGalleryBody.innerHTML = items
      .map(
        (item) => `
        <tr>
          <td>#${item.image_id}</td>
          <td>${escapeHtml(item.caption)}</td>
          <td>${escapeHtml(item.project_title || 'General')}</td>
          <td class="actions-cell">
            <button type="button" class="btn btn-danger btn-sm delete-gallery-btn" data-id="${item.image_id}">Delete</button>
          </td>
        </tr>
      `
      )
      .join('');

    adminGalleryBody.querySelectorAll('.delete-gallery-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const res = await fetchJson(`/api/admin/gallery/${btn.dataset.id}`, { method: 'DELETE' });
        showAlert(res.payload.message || res.payload.error, res.ok ? 'success' : 'error');
        if (res.ok) loadGallery();
      });
    });
  }

  galleryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const body = {
      project_id: document.getElementById('galleryProjectId').value || null,
      file_path: document.getElementById('galleryFilePath').value,
      caption: document.getElementById('galleryCaption').value,
    };
    const res = await fetchJson('/api/admin/gallery', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (res.ok) {
      showAlert(res.payload.message, 'success');
      galleryForm.reset();
      document.getElementById('galleryFilePath').value = '/images/site-structural.svg';
      loadGallery();
    } else {
      const firstErr = res.payload.errors ? Object.values(res.payload.errors)[0] : res.payload.error;
      showAlert(firstErr || 'Could not add gallery item.', 'error');
    }
  });

  await Promise.all([loadEnquiries(), loadServices(), loadProjects(), loadGallery()]);
});
