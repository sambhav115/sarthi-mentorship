const { standardizeDate } = require('./dateStandardizer');

/**
 * Cleans the messy student dataset:
 * 1. Removes duplicate records (by id)
 * 2. Standardizes date fields to ISO 8601
 * 3. Removes redundant fields (createdAt vs created_at)
 * 4. Removes unnecessary meta fields
 */
function cleanStudentData(rawData) {
  const cleaned = {
    students: [],
    meta: {
      page: rawData.meta?.page || 1,
      limit: rawData.meta?.limit || 100,
      // "unusedField" removed — serves no purpose
    },
  };

  // Deduplicate by student id + email combination, keeping the first occurrence
  const seen = new Set();

  for (const student of rawData.students) {
    const uniqueKey = `${student.id}::${student.email}`;
    if (seen.has(uniqueKey)) continue;

    // Standardize: pick created_at, drop the duplicate createdAt field
    const dateSource = student.created_at || student.createdAt;

    const cleanStudent = {
      id: student.id,
      name: student.name,
      email: student.email,
      createdAt: standardizeDate(dateSource),
      status: student.status,
    };

    seen.add(uniqueKey);
    cleaned.students.push(cleanStudent);
  }

  cleaned.meta.total = cleaned.students.length;
  return cleaned;
}

module.exports = { cleanStudentData };
