function createServiceModel(db) {
  return {
    findAll() {
      return db
        .prepare('SELECT service_id, title, description, icon, created_at FROM services ORDER BY service_id ASC')
        .all();
    },

    findById(serviceId) {
      return db
        .prepare('SELECT service_id, title, description, icon, created_at FROM services WHERE service_id = ?')
        .get(serviceId);
    },

    create({ title, description, icon }) {
      const result = db
        .prepare('INSERT INTO services (title, description, icon) VALUES (?, ?, ?)')
        .run(title, description, icon);
      return this.findById(Number(result.lastInsertRowid));
    },

    update(serviceId, { title, description, icon }) {
      const result = db
        .prepare('UPDATE services SET title = ?, description = ?, icon = ? WHERE service_id = ?')
        .run(title, description, icon, serviceId);
      if (result.changes === 0) return null;
      return this.findById(serviceId);
    },

    remove(serviceId) {
      const result = db.prepare('DELETE FROM services WHERE service_id = ?').run(serviceId);
      return result.changes > 0;
    },
  };
}

module.exports = { createServiceModel };
