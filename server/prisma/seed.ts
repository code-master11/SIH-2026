import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { auditService } from '../src/services/blockchain/audit.service';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password@123', 10);

  const users = [
    { name: 'Super Admin',      email: 'super@dms.com',           role: 'SUPER_ADMIN',   password: passwordHash, department: 'IT',            badgeNumber: 'SA-001' },
    { name: 'Admin User',       email: 'admin@dms.com',           role: 'ADMIN',         password: passwordHash, department: 'HQ',            badgeNumber: 'AD-001' },
    { name: 'Investigator One', email: 'investigator@dms.com',    role: 'INVESTIGATOR',  password: passwordHash, department: 'Investigations', badgeNumber: 'IN-001' },
    { name: 'Officer John',     email: 'officer@dms.com',         role: 'OFFICER',       password: passwordHash, department: 'Patrol',        badgeNumber: 'OF-001' },
    { name: 'Legal Counsel',    email: 'legal@dms.com',           role: 'LEGAL_COUNSEL', password: passwordHash, department: 'Legal',         badgeNumber: 'LC-001' },
    { name: 'Auditor Jane',     email: 'auditor@dms.com',         role: 'AUDITOR',       password: passwordHash, department: 'Audit',         badgeNumber: 'AU-001' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, isActive: true },
    });
  }

  const createdUsers = await prisma.user.findMany();
  const investigator = createdUsers.find((u) => u.role === 'INVESTIGATOR');
  const officer = createdUsers.find((u) => u.role === 'OFFICER');

  if (!investigator || !officer) {
    console.log('Could not find investigator or officer, skipping case seed.');
    return;
  }

  const cases = [
    {
      caseNumber: 'CS-2026-0001',
      title: 'Robbery at 5th Ave',
      description: 'Armed robbery reported at 5th Avenue convenience store.',
      type: 'FIR',
      status: 'OPEN',
      priority: 'HIGH',
      createdById: officer.id,
      location: '5th Avenue, Downtown',
    },
    {
      caseNumber: 'CS-2026-0002',
      title: 'Cyber Fraud Investigation',
      description: 'Large scale phishing attack targeting government employees.',
      type: 'INVESTIGATION',
      status: 'UNDER_INVESTIGATION',
      priority: 'CRITICAL',
      createdById: investigator.id,
      location: 'Online',
    },
    {
      caseNumber: 'CS-2026-0003',
      title: 'State vs Doe',
      description: 'Criminal trial for John Doe.',
      type: 'COURT',
      status: 'PENDING_COURT',
      priority: 'MEDIUM',
      createdById: investigator.id,
      location: 'District Court, Room 12',
    },
    {
      caseNumber: 'CS-2026-0004',
      title: 'Missing Person – Jane Smith',
      description: 'Missing person report filed by family members.',
      type: 'FIR',
      status: 'OPEN',
      priority: 'HIGH',
      createdById: officer.id,
      location: 'North District',
    },
  ];

  for (const c of cases) {
    const exists = await prisma.case.findUnique({ where: { caseNumber: c.caseNumber } });
    if (!exists) {
      const newCase = await prisma.case.create({ data: c });
      // Use auditService so hash chain is always valid
      await auditService.log({
        action: 'CREATE_CASE',
        entityType: 'CASE',
        entityId: newCase.id,
        userId: officer.id,
        userName: officer.name,
        userRole: officer.role,
        details: { caseNumber: newCase.caseNumber, title: newCase.title },
        ipAddress: '127.0.0.1',
      });
    }
  }

  console.log('✅ Seed completed successfully!');
  console.log('\nTest accounts (all use password: Password@123):');
  console.log('  super@dms.com          → SUPER_ADMIN');
  console.log('  admin@dms.com          → ADMIN');
  console.log('  investigator@dms.com   → INVESTIGATOR');
  console.log('  officer@dms.com        → OFFICER');
  console.log('  auditor@dms.com        → AUDITOR');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
