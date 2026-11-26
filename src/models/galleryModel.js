function createGalleryModel(db) {
  return {
    findAll() {
      return db
        .prepare(
          `SELECT g.image_id, g.project_id, p.title AS project_title, g.file_path, g.caption, g.created_at
           FROM gallery g
           LEFT JOIN projects p ON g.project_id = p.project_id
           ORDER BY g.image_id DESC`
        )
        .all();
    },

    findById(imageId) {
      return db
        .prepare(
          `SELECT g.image_id, g.project_id, p.title AS project_title, g.file_path, g.caption, g.created_at
           FROM gallery g
           LEFT JOIN projects p ON g.project_id = p.project_id
           WHERE g.image_id = ?`
        )
        .get(imageId);
    },

    create({ project_id, file_path, caption }) {
      const result = db
        .prepare('INSERT INTO gallery (project_id, file_path, caption) VALUES (?, ?, ?)')
        .run(project_id, file_path, caption);
      return this.findById(Number(result.lastInsertRowid));
    },

    remove(imageId) {
      const result = db.prepare('DELETE FROM gallery WHERE image_id = ?').run(imageId);
      return result.changes > 0;
    },
  };
}

module.exports = { createGalleryModel };
