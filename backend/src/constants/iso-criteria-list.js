// Generated fallback list of 118 ISO criteria (codes and titles)
function generateIsoCriteria() {
  const list = [];
  for (let i = 1; i <= 118; i++) {
    const code = `ISO-CR-${String(i).padStart(3, "0")}`;
    const title = `ISO 9001 Criterion ${i}`;
    list.push({ code, title, description: "" });
  }
  return list;
}

module.exports = { generateIsoCriteria };
