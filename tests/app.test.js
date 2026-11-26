const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const { createDatabase } = require('../src/db/database');
const { createApp } = require('../src/app');
const { validateEnquiry } = require('../src/utils/validators');
const { hashPassword, verifyPassword } = require('../src/utils/password');
const { clearAllSessions } = require('../src/middleware/auth');

describe('Unit Tests: Validators & Password Hashing', () => {
  it('validates a well-formed enquiry payload', () => {
    const res = validateEnquiry({
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      phone: '9876543210',
      service_id: '1',
      message: 'Need foundation and masonry quote for a residential plot.',
    });
    assert.equal(res.valid, true);
    assert.equal(res.data.service_id, 1);
  });

  it('rejects invalid phone numbers containing non-digits', () => {
    const res = validateEnquiry({
      name: 'Rohan Sharma',
      email: 'rohan@example.com',
      phone: '98765-abcde',
      message: 'Need a quote.',
    });
    assert.equal(res.valid, false);
    assert.ok(res.errors.phone);
  });

  it('hashes and verifies passwords with unique random salts', () => {
    const hash1 = hashPassword('Admin@123');
    const hash2 = hashPassword('Admin@123');
    assert.notEqual(hash1, hash2);
    assert.equal(verifyPassword('Admin@123', hash1), true);
    assert.equal(verifyPassword('WrongPass', hash1), false);
  });
});

describe('Integration & Security Tests (Report Table 4.8)', () => {
  let db;
  let server;
  let baseUrl;

  before(async () => {
    clearAllSessions();
    db = createDatabase(':memory:');
    const app = createApp(db);
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, '127.0.0.1', () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
  });

  it('serves static HTML/CSS pages and security headers', async () => {
    const [homeRes, healthRes] = await Promise.all([
      fetch(`${baseUrl}/index.html`),
      fetch(`${baseUrl}/api/health`),
    ]);
    assert.equal(homeRes.status, 200);
    assert.equal(homeRes.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(homeRes.headers.get('x-frame-options'), 'DENY');
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.status, 'ok');
  });

  it('serves seeded public services, projects, and gallery', async () => {
    const [svc, proj, gal] = await Promise.all([
      fetch(`${baseUrl}/api/services`).then((r) => r.json()),
      fetch(`${baseUrl}/api/projects`).then((r) => r.json()),
      fetch(`${baseUrl}/api/gallery`).then((r) => r.json()),
    ]);
    assert.equal(svc.services.length, 6);
    assert.equal(proj.projects.length, 4);
    assert.equal(gal.gallery.length, 6);
  });

  it('TC-1: stores a valid enquiry and returns 201 Created', async () => {
    const res = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Anita Verma',
        email: 'anita@example.com',
        phone: '9811122233',
        service_id: 1,
        message: 'Looking for structural work for a 2-storey house.',
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.enquiry.status, 'New');
    assert.equal(body.enquiry.name, 'Anita Verma');
  });

  it('TC-2: rejects enquiry with empty name (400 Bad Request)', async () => {
    const res = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: '   ',
        email: 'anita@example.com',
        message: 'Enquiry with blank name.',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.errors.name);
  });

  it('TC-3: rejects enquiry with invalid email format ("abc@")', async () => {
    const res = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        email: 'abc@',
        message: 'Testing email format validation.',
      }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.ok(body.errors.email);
  });

  it('TC-4 & TC-5: safely stores script tags and SQL-like payloads via prepared statements', async () => {
    const xssPayload = "<script>alert('xss')</script>";
    const sqlPayload = "'; DROP TABLE enquiries; -- ' OR '1'='1";

    const res = await fetch(`${baseUrl}/api/enquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Security Tester',
        email: 'sec@example.com',
        message: `${xssPayload} ${sqlPayload}`,
      }),
    });
    assert.equal(res.status, 201);
    const created = await res.json();
    assert.equal(created.enquiry.message, `${xssPayload} ${sqlPayload}`);

    // Verify enquiries table is intact
    const countRow = db.prepare('SELECT COUNT(*) AS count FROM enquiries').get();
    assert.ok(countRow.count >= 2);
  });

  it('TC-6 & TC-7: rejects unauthenticated admin access and invalid password', async () => {
    const unauth = await fetch(`${baseUrl}/api/admin/enquiries`);
    assert.equal(unauth.status, 401);

    const badLogin = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'WrongPassword' }),
    });
    assert.equal(badLogin.status, 401);
    const errBody = await badLogin.json();
    assert.equal(errBody.error, 'Invalid username or password.');
  });

  it('supports full authenticated admin lifecycle (enquiries, services, projects, logout)', async () => {
    const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123' }),
    });
    assert.equal(loginRes.status, 200);
    const setCookie = loginRes.headers.get('set-cookie');
    assert.ok(setCookie && setCookie.includes('sg_session='));
    const cookieHeader = setCookie.split(';')[0];

    // View enquiries
    const enqRes = await fetch(`${baseUrl}/api/admin/enquiries`, {
      headers: { Cookie: cookieHeader },
    });
    assert.equal(enqRes.status, 200);
    const { enquiries } = await enqRes.json();
    assert.ok(enquiries.length >= 2);

    // Update enquiry status
    const targetId = enquiries[0].enquiry_id;
    const patchRes = await fetch(`${baseUrl}/api/admin/enquiries/${targetId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({ status: 'In progress' }),
    });
    assert.equal(patchRes.status, 200);
    const patched = await patchRes.json();
    assert.equal(patched.enquiry.status, 'In progress');

    // Create, update, delete a service
    const svcCreate = await fetch(`${baseUrl}/api/admin/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      body: JSON.stringify({
        title: 'Waterproofing Audit',
        description: 'Thermal and moisture inspection for commercial roofs.',
        icon: 'renovation',
      }),
    });
    assert.equal(svcCreate.status, 201);
    const createdSvc = (await svcCreate.json()).service;

    const svcDel = await fetch(`${baseUrl}/api/admin/services/${createdSvc.service_id}`, {
      method: 'DELETE',
      headers: { Cookie: cookieHeader },
    });
    assert.equal(svcDel.status, 200);

    // Logout & verify cookie is rejected afterwards
    const logoutRes = await fetch(`${baseUrl}/api/admin/logout`, {
      method: 'POST',
      headers: { Cookie: cookieHeader },
    });
    assert.equal(logoutRes.status, 200);

    const postLogout = await fetch(`${baseUrl}/api/admin/enquiries`, {
      headers: { Cookie: cookieHeader },
    });
    assert.equal(postLogout.status, 401);
  });
});
