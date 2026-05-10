const bcrypt = require("bcryptjs");

// Generate password hash
const password = "Password123!";
const salt = bcrypt.genSaltSync(10);
const passwordHash = bcrypt.hashSync(password, salt);

console.log("-- Supabase SQL to seed test users");
console.log("-- Password for all users: Password123!");
console.log("-- Copy and paste this into Supabase SQL Editor\n");

// Clear existing data (be careful!)
console.log("-- Clear existing data");
console.log("DELETE FROM \"CorrectiveAction\";");
console.log("DELETE FROM \"NonConformity\";");
console.log("DELETE FROM \"Document\";");
console.log("DELETE FROM \"Task\";");
console.log("DELETE FROM \"ProjectProcess\";");
console.log("DELETE FROM \"Process\";");
console.log("DELETE FROM \"Project\";");
console.log("DELETE FROM \"User\";\n");

// Insert users
console.log("-- Insert test users");
console.log(`INSERT INTO "User" ("fullName", "email", "passwordHash", "role", "createdAt", "updatedAt") VALUES`);
console.log(`  ('System Admin', 'admin@esi.edu', '${passwordHash}', 'ADMIN', NOW(), NOW()),`);
console.log(`  ('Project Manager', 'manager@esi.edu', '${passwordHash}', 'PROJECT_MANAGER', NOW(), NOW()),`);
console.log(`  ('Team Member', 'member@esi.edu', '${passwordHash}', 'TEAM_MEMBER', NOW(), NOW()),`);
console.log(`  ('Quality Assurance Coordinator', 'caq@esi.edu', '${passwordHash}', 'CAQ', NOW(), NOW());`);
