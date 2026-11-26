const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10,15}$/;

const ALLOWED_ENQUIRY_STATUSES = ['New', 'In progress', 'Closed'];
const ALLOWED_PROJECT_STATUSES = ['Completed', 'Ongoing'];

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function parseOptionalPositiveInt(value) {
  if (value === undefined || value === null || value === '') {
    return { valid: true, value: null };
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { valid: false, value: null };
  }
  return { valid: true, value: parsed };
}

/**
 * Validates and normalizes enquiry form payloads on the server side.
 * Returns field-level error messages matching the documented API data contract.
 */
function validateEnquiry(body = {}) {
  const errors = {};
  const name = cleanString(body.name);
  const email = cleanString(body.email);
  const phone = cleanString(body.phone);
  const message = cleanString(body.message);
  const serviceCheck = parseOptionalPositiveInt(body.service_id);

  if (!name) {
    errors.name = 'Please enter your full name.';
  } else if (name.length < 2 || name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters.';
  }

  if (!email) {
    errors.email = 'Please enter your e-mail address.';
  } else if (!EMAIL_PATTERN.test(email) || email.length > 150) {
    errors.email = 'Please enter a valid e-mail address.';
  }

  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = 'Phone number must contain 10 to 15 digits only.';
  }

  if (!serviceCheck.valid) {
    errors.service_id = 'Selected service is invalid.';
  }

  if (!message) {
    errors.message = 'Please enter your enquiry message.';
  } else if (message.length < 5 || message.length > 2000) {
    errors.message = 'Message must be between 5 and 2000 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      name,
      email,
      phone: phone || null,
      service_id: serviceCheck.value,
      message,
    },
  };
}

function validateService(body = {}) {
  const errors = {};
  const title = cleanString(body.title);
  const description = cleanString(body.description);
  const icon = cleanString(body.icon);

  if (!title || title.length < 2 || title.length > 120) {
    errors.title = 'Title is required (2 to 120 characters).';
  }
  if (!description || description.length < 5 || description.length > 2000) {
    errors.description = 'Description is required (5 to 2000 characters).';
  }
  if (icon.length > 100) {
    errors.icon = 'Icon value must be at most 100 characters.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { title, description, icon: icon || 'building' },
  };
}

function validateProject(body = {}) {
  const errors = {};
  const title = cleanString(body.title);
  const summary = cleanString(body.summary);
  const status = cleanString(body.status) || 'Completed';

  if (!title || title.length < 2 || title.length > 150) {
    errors.title = 'Project title is required (2 to 150 characters).';
  }
  if (!summary || summary.length < 5 || summary.length > 2000) {
    errors.summary = 'Project summary is required (5 to 2000 characters).';
  }
  if (!ALLOWED_PROJECT_STATUSES.includes(status)) {
    errors.status = 'Status must be Completed or Ongoing.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { title, summary, status },
  };
}

function isSafeImagePath(value) {
  if (!value) return false;
  const lower = value.toLowerCase();
  if (lower.startsWith('javascript:') || lower.startsWith('data:')) {
    return false;
  }
  return (
    value.startsWith('/images/') ||
    value.startsWith('images/') ||
    value.startsWith('https://') ||
    value.startsWith('http://')
  );
}

function validateGalleryItem(body = {}) {
  const errors = {};
  const projectCheck = parseOptionalPositiveInt(body.project_id);
  const filePath = cleanString(body.file_path);
  const caption = cleanString(body.caption);

  if (!projectCheck.valid) {
    errors.project_id = 'Related project ID is invalid.';
  }
  if (!filePath || filePath.length > 255 || !isSafeImagePath(filePath)) {
    errors.file_path = 'Image path must start with /images/, images/, or http(s)://.';
  }
  if (!caption || caption.length < 2 || caption.length > 150) {
    errors.caption = 'Caption is required (2 to 150 characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      project_id: projectCheck.value,
      file_path: filePath.startsWith('images/') ? `/${filePath}` : filePath,
      caption,
    },
  };
}

module.exports = {
  ALLOWED_ENQUIRY_STATUSES,
  ALLOWED_PROJECT_STATUSES,
  cleanString,
  validateEnquiry,
  validateService,
  validateProject,
  validateGalleryItem,
};
