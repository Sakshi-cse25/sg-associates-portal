document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('enquiryForm');
  const serviceSelect = document.getElementById('service_id');
  const alertEl = document.getElementById('enquiryAlert');
  const submitBtn = document.getElementById('submitEnquiryBtn');
  const { escapeHtml, fetchJson } = sgUtils;

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^\d{10,15}$/;

  function clearErrors() {
    alertEl.innerHTML = '';
    ['name', 'email', 'phone', 'service_id', 'message'].forEach((field) => {
      const input = document.getElementById(field);
      const errSpan = document.getElementById(`${field}Error`);
      if (input) input.classList.remove('is-invalid');
      if (errSpan) errSpan.textContent = '';
    });
  }

  function showFieldError(field, message) {
    const input = document.getElementById(field);
    const errSpan = document.getElementById(`${field}Error`);
    if (input) input.classList.add('is-invalid');
    if (errSpan) errSpan.textContent = message;
  }

  // Populate services dropdown dynamically
  try {
    const { ok, payload } = await fetchJson('/api/services');
    if (ok && Array.isArray(payload.services)) {
      const preselected = new URLSearchParams(window.location.search).get('service');
      payload.services.forEach((svc) => {
        const opt = document.createElement('option');
        opt.value = String(svc.service_id);
        opt.textContent = svc.title;
        if (preselected && preselected === opt.value) {
          opt.selected = true;
        }
        serviceSelect.appendChild(opt);
      });
    }
  } catch (_) {
    // Dropdown remains functional with General Civil Enquiry option
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();

    const data = Object.fromEntries(new FormData(form));
    let valid = true;

    if (!data.name || !data.name.trim()) {
      showFieldError('name', 'Please enter your full name.');
      valid = false;
    } else if (data.name.trim().length < 2) {
      showFieldError('name', 'Name must be at least 2 characters.');
      valid = false;
    }

    if (!data.email || !emailPattern.test(data.email.trim())) {
      showFieldError('email', 'Please enter a valid e-mail address.');
      valid = false;
    }

    if (data.phone && data.phone.trim() && !phonePattern.test(data.phone.trim())) {
      showFieldError('phone', 'Phone number must contain 10 to 15 digits only.');
      valid = false;
    }

    if (!data.message || !data.message.trim()) {
      showFieldError('message', 'Please enter your enquiry message.');
      valid = false;
    } else if (data.message.trim().length < 5) {
      showFieldError('message', 'Message must be at least 5 characters.');
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const { status, payload } = await fetchJson('/api/enquiries', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (status === 201) {
        form.reset();
        alertEl.innerHTML = `<div class="alert alert-success">${escapeHtml(payload.message)}</div>`;
      } else if (status === 400 && payload.errors) {
        Object.entries(payload.errors).forEach(([field, msg]) => {
          showFieldError(field, msg);
        });
        alertEl.innerHTML = `<div class="alert alert-error">${escapeHtml(payload.error || 'Validation failed.')}</div>`;
      } else {
        alertEl.innerHTML = `<div class="alert alert-error">${escapeHtml(payload.error || 'Could not submit enquiry.')}</div>`;
      }
    } catch (err) {
      alertEl.innerHTML = '<div class="alert alert-error">Network error. Please try again.</div>';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Enquiry';
    }
  });
});
