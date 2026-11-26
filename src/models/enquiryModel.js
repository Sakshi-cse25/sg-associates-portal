function createEnquiryModel(db) {
  return {
    findAll() {
      return db
        .prepare(
          `SELECT e.enquiry_id, e.name, e.email, e.phone, e.service_id,
                  s.title AS service_title, e.message, e.status, e.created_at
           FROM enquiries e
           LEFT JOIN services s ON e.service_id = s.service_id
           ORDER BY e.enquiry_id DESC`
        )
        .all();
    },

    findById(enquiryId) {
      return db
        .prepare(
          `SELECT e.enquiry_id, e.name, e.email, e.phone, e.service_id,
                  s.title AS service_title, e.message, e.status, e.created_at
           FROM enquiries e
           LEFT JOIN services s ON e.service_id = s.service_id
           WHERE e.enquiry_id = ?`
        )
        .get(enquiryId);
    },

    create({ name, email, phone, service_id, message }) {
      const result = db
        .prepare(
          'INSERT INTO enquiries (name, email, phone, service_id, message) VALUES (?, ?, ?, ?, ?)'
        )
        .run(name, email, phone, service_id, message);
      return this.findById(Number(result.lastInsertRowid));
    },

    updateStatus(enquiryId, status) {
      const result = db
        .prepare('UPDATE enquiries SET status = ? WHERE enquiry_id = ?')
        .run(status, enquiryId);
      if (result.changes === 0) return null;
      return this.findById(enquiryId);
    },
  };
}

module.exports = { createEnquiryModel };
