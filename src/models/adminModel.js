function createAdminModel(db) {
  return {
    findByUsername(username) {
      return db
        .prepare('SELECT admin_id, username, password_hash, last_login FROM admins WHERE username = ?')
        .get(username);
    },

    findById(adminId) {
      return db
        .prepare('SELECT admin_id, username, last_login FROM admins WHERE admin_id = ?')
        .get(adminId);
    },

    updateLastLogin(adminId) {
      db.prepare('UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE admin_id = ?').run(adminId);
    },
  };
}

module.exports = { createAdminModel };
