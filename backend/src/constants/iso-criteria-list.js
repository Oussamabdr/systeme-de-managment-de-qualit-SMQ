const { ISO_CRITERIA } = require("./iso-criteria-data");

function generateIsoCriteria() {
  return ISO_CRITERIA.map((item) => ({ ...item }));
}

module.exports = { generateIsoCriteria, ISO_CRITERIA };
