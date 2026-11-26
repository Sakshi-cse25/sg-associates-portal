const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config/env');
const { hashPassword } = require('../utils/password');

const SCHEMA_PATH = path.join(__dirname, 'schema.sqlite.sql');

/**
 * Seeds initial services (aligned with Table 1.1 of the internship report),
 * representative civil projects, gallery items, and a default demo admin user.
 * Only inserts seed data when tables are empty so user changes persist.
 * @param {import('node:sqlite').DatabaseSync} db
 */
function seedInitialData(db) {
  const serviceCount = db.prepare('SELECT COUNT(*) AS count FROM services').get().count;
  if (serviceCount === 0) {
    const insertService = db.prepare(
      'INSERT INTO services (title, description, icon) VALUES (?, ?, ?)'
    );
    const initialServices = [
      [
        'Structural and Foundation Work',
        'Excavation, footing, columns, beams, and RCC slabs executed strictly according to approved structural drawings.',
        'structural',
      ],
      [
        'Masonry and Plastering',
        'Brick and AAC block work, internal and external cement plastering, and precision surface preparation.',
        'masonry',
      ],
      [
        'Flooring and Finishing',
        'Vitrified tiling, granite and stone work, interior/exterior painting, polishing, and architectural finishing.',
        'flooring',
      ],
      [
        'Repair and Renovation',
        'Structural strengthening, terrace and bathroom waterproofing, and complete refurbishment of existing buildings.',
        'renovation',
      ],
      [
        'Boundary Walls and Drainage',
        'Compound walls, security gates, storm-water drains, and site grading infrastructure.',
        'boundary',
      ],
      [
        'Maintenance Contracts',
        'Scheduled periodic civil upkeep and preventive repair contracts for residential and commercial premises.',
        'maintenance',
      ],
    ];
    for (const row of initialServices) {
      insertService.run(...row);
    }
  }

  const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
  if (projectCount === 0) {
    const insertProject = db.prepare(
      'INSERT INTO projects (title, summary, status) VALUES (?, ?, ?)'
    );
    const p1 = insertProject.run(
      'Ganga Vihar Residential Block',
      'Four-storey RCC framed residential building including excavation, foundation, masonry, and complete interior finishing in Gurugram.',
      'Completed'
    );
    const p2 = insertProject.run(
      'Udyog Vihar Commercial Office Fit-Out',
      'Structural retrofitting, granite flooring, false ceiling coordination, and waterproofing for a 6,500 sq. ft. commercial facility.',
      'Completed'
    );
    const p3 = insertProject.run(
      'Institutional Campus Boundary & Storm Drain',
      '420-meter reinforced brick boundary wall with precast coping and connected storm-water drainage channel in Sector 14, Gurugram.',
      'Ongoing'
    );
    const p4 = insertProject.run(
      'Palam Vihar Villa Renovation',
      'Complete structural repair, terrace waterproofing, external texture plastering, and courtyard stone paving.',
      'Ongoing'
    );

    const galleryCount = db.prepare('SELECT COUNT(*) AS count FROM gallery').get().count;
    if (galleryCount === 0) {
      const insertGallery = db.prepare(
        'INSERT INTO gallery (project_id, file_path, caption) VALUES (?, ?, ?)'
      );
      const initialGallery = [
        [p1.lastInsertRowid, '/images/site-structural.svg', 'RCC column reinforcement & slab shuttering'],
        [p1.lastInsertRowid, '/images/site-masonry.svg', 'External brick masonry and curing stage'],
        [p2.lastInsertRowid, '/images/site-flooring.svg', 'Granite & vitrified tile finishing work'],
        [p4.lastInsertRowid, '/images/site-renovation.svg', 'Terrace waterproofing & structural repair'],
        [p3.lastInsertRowid, '/images/site-boundary.svg', 'Compound boundary wall & storm-water drain'],
        [p2.lastInsertRowid, '/images/site-maintenance.svg', 'Annual commercial civil maintenance inspection'],
      ];
      for (const item of initialGallery) {
        insertGallery.run(...item);
      }
    }
  }

  const adminCount = db.prepare('SELECT COUNT(*) AS count FROM admins').get().count;
  if (adminCount === 0) {
    const hashed = hashPassword(config.defaultAdminPassword);
    db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run(
      config.defaultAdminUser,
      hashed
    );
  }
}

/**
 * Opens or creates the SQLite database, enforces foreign keys,
 * applies schema migrations, and seeds sample records if empty.
 * @param {string} [dbPath]
 * @returns {import('node:sqlite').DatabaseSync}
 */
function createDatabase(dbPath = config.dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schemaSql);
  seedInitialData(db);
  return db;
}

module.exports = { createDatabase };
