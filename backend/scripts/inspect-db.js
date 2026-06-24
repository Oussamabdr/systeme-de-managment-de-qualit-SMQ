const prisma = require('../src/config/prisma');

(async () => {
  try {
    const result = await prisma.$queryRaw`SELECT current_database(), current_schema()`;
    console.log(JSON.stringify(result));
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
