function createProjectModel(db) {
  return {
    findAll() {
      return db
        .prepare('SELECT project_id, title, summary, status, created_at FROM projects ORDER BY project_id DESC')
        .all();
    },

    findById(projectId) {
      return db
        .prepare('SELECT project_id, title, summary, status, created_at FROM projects WHERE project_id = ?')
        .get(projectId);
    },

    create({ title, summary, status }) {
      const result = db
        .prepare('INSERT INTO projects (title, summary, status) VALUES (?, ?, ?)')
        .run(title, summary, status);
      return this.findById(Number(result.lastInsertRowid));
    },

    update(projectId, { title, summary, status }) {
      const result = db
        .prepare('UPDATE projects SET title = ?, summary = ?, status = ? WHERE project_id = ?')
        .run(title, summary, status, projectId);
      if (result.changes === 0) return null;
      return this.findById(projectId);
    },

    remove(projectId) {
      const result = db.prepare('DELETE FROM projects WHERE project_id = ?').run(projectId);
      return result.changes > 0;
    },
  };
}

module.exports = { createProjectModel };
