import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const roles = await Promise.all(
    Object.values(UserRole).map((name) =>
      prisma.role.upsert({
        where: { name },
        update: {},
        create: {
          name,
          description: `${name.replace('_', ' ')} role`,
        },
      })
    )
  );

  console.log(`✅ Created ${roles.length} roles`);

  // Create demo tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-hospital' },
    update: {},
    create: {
      name: 'Demo General Hospital',
      slug: 'demo-hospital',
      email: 'admin@demo-hospital.com',
      phone: '+1-555-0100',
      address: '123 Medical Center Blvd, Healthcare City, HC 12345',
      timezone: 'America/New_York',
    },
  });

  console.log(`✅ Created tenant: ${tenant.name}`);

  // Create departments
  const adminRole = roles.find((r) => r.name === 'ADMIN')!;
  const adminUser = await prisma.user.upsert({
    where: { tenant_id_email: { tenant_id: tenant.id, email: 'admin@demo-hospital.com' } },
    update: {},
    create: {
      tenant_id: tenant.id,
      role_id: adminRole.id,
      email: 'admin@demo-hospital.com',
      password_hash: await bcrypt.hash('Admin@1234', 12),
      first_name: 'System',
      last_name: 'Administrator',
      status: 'ACTIVE',
      email_verified: true,
    },
  });

  // Create departments
  const departments = await Promise.all([
    { name: 'General Medicine', code: 'GM' },
    { name: 'Cardiology', code: 'CARD' },
    { name: 'Pediatrics', code: 'PED' },
    { name: 'Orthopedics', code: 'ORTH' },
    { name: 'Radiology', code: 'RAD' },
    { name: 'Laboratory', code: 'LAB' },
    { name: 'Pharmacy', code: 'PHARM' },
    { name: 'Emergency', code: 'ER' },
  ].map((dept) =>
    prisma.department.upsert({
      where: { tenant_id_code: { tenant_id: tenant.id, code: dept.code } },
      update: {},
      create: { tenant_id: tenant.id, ...dept },
    })
  ));

  // Create Pharmacy Warehouse
  const pharmacyWarehouse = await prisma.warehouse.upsert({
    where: { tenant_id_code: { tenant_id: tenant.id, code: 'PH01' } },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Main Pharmacy',
      code: 'PH01',
      type: 'PHARMACY',
    },
  });

  console.log(`✅ Created ${departments.length} departments`);

  // Create demo doctor
  const doctorRole = roles.find((r) => r.name === 'DOCTOR')!;
  const doctor = await prisma.user.upsert({
    where: { tenant_id_email: { tenant_id: tenant.id, email: 'doctor@demo-hospital.com' } },
    update: {},
    create: {
      tenant_id: tenant.id,
      role_id: doctorRole.id,
      email: 'doctor@demo-hospital.com',
      password_hash: await bcrypt.hash('Doctor@1234', 12),
      first_name: 'Dr. Sarah',
      last_name: 'Johnson',
      specialization: 'General Medicine',
      license_number: 'MD-2024-001',
      employee_id: 'EMP-001',
      department_id: departments[0].id,
      status: 'ACTIVE',
      email_verified: true,
    },
  });

  // Create demo pharmacist
  const pharmacistRole = roles.find((r) => r.name === 'PHARMACIST')!;
  await prisma.user.upsert({
    where: { tenant_id_email: { tenant_id: tenant.id, email: 'pharmacist@demo-hospital.com' } },
    update: {},
    create: {
      tenant_id: tenant.id,
      role_id: pharmacistRole.id,
      email: 'pharmacist@demo-hospital.com',
      password_hash: await bcrypt.hash('Pharma@1234', 12),
      first_name: 'Mike',
      last_name: 'Chen',
      license_number: 'RPH-2024-001',
      employee_id: 'EMP-002',
      department_id: departments[6].id,
      status: 'ACTIVE',
      email_verified: true,
    },
  });

  // Create lab tech
  const labTechRole = roles.find((r) => r.name === 'LAB_TECH')!;
  await prisma.user.upsert({
    where: { tenant_id_email: { tenant_id: tenant.id, email: 'labtech@demo-hospital.com' } },
    update: {},
    create: {
      tenant_id: tenant.id,
      role_id: labTechRole.id,
      email: 'labtech@demo-hospital.com',
      password_hash: await bcrypt.hash('LabTech@1234', 12),
      first_name: 'Emily',
      last_name: 'Rodriguez',
      employee_id: 'EMP-003',
      department_id: departments[5].id,
      status: 'ACTIVE',
      email_verified: true,
    },
  });

  console.log('✅ Created demo users');

  // Create demo patients
  const patients = await Promise.all([
    {
      mrn: 'MRN-001',
      first_name: 'John',
      last_name: 'Doe',
      date_of_birth: new Date('1985-03-15'),
      gender: 'MALE' as const,
      blood_group: 'O_POSITIVE' as const,
      phone: '+1-555-0001',
      email: 'john.doe@example.com',
      allergies: ['Penicillin', 'Aspirin'],
      chronic_conditions: ['Hypertension'],
    },
    {
      mrn: 'MRN-002',
      first_name: 'Jane',
      last_name: 'Smith',
      date_of_birth: new Date('1992-07-22'),
      gender: 'FEMALE' as const,
      blood_group: 'A_POSITIVE' as const,
      phone: '+1-555-0002',
      email: 'jane.smith@example.com',
      allergies: [],
      chronic_conditions: ['Diabetes Type 2'],
    },
  ].map((p) =>
    prisma.patient.upsert({
      where: { tenant_id_mrn: { tenant_id: tenant.id, mrn: p.mrn } },
      update: {},
      create: { tenant_id: tenant.id, ...p },
    })
  ));

  console.log(`✅ Created ${patients.length} demo patients`);

  // Create sample lab tests
  const labTests = await Promise.all([
    { name: 'Complete Blood Count (CBC)', code: 'CBC', category: 'hematology', price: 25.00, turnaround_time: 2, sample_type: 'blood' },
    { name: 'Lipid Panel', code: 'LIPID', category: 'biochemistry', price: 45.00, turnaround_time: 4, sample_type: 'blood', requires_fasting: true },
    { name: 'HbA1c', code: 'HBA1C', category: 'biochemistry', price: 35.00, turnaround_time: 4, sample_type: 'blood' },
    { name: 'Urinalysis', code: 'UA', category: 'microbiology', price: 20.00, turnaround_time: 1, sample_type: 'urine' },
    { name: 'Chest X-Ray', code: 'CXR', category: 'radiology', price: 75.00, turnaround_time: 1, sample_type: 'imaging' },
    { name: 'Blood Culture', code: 'BCULT', category: 'microbiology', price: 60.00, turnaround_time: 72, sample_type: 'blood' },
    { name: 'Thyroid Function Tests', code: 'TFT', category: 'biochemistry', price: 55.00, turnaround_time: 6, sample_type: 'blood' },
    { name: 'Liver Function Tests', code: 'LFT', category: 'biochemistry', price: 40.00, turnaround_time: 4, sample_type: 'blood' },
  ].map((test) =>
    prisma.labTest.upsert({
      where: { tenant_id_code: { tenant_id: tenant.id, code: test.code } },
      update: {},
      create: { tenant_id: tenant.id, ...test },
    })
  ));

  console.log(`✅ Created ${labTests.length} lab tests`);

  // Create sample inventory
  const supplier = await prisma.supplier.create({
    data: {
      tenant_id: tenant.id,
      name: 'MediSupply Corp',
      contact_name: 'Robert Thompson',
      email: 'orders@medisupply.com',
      phone: '+1-555-0200',
    },
  });

  const inventoryItems = await Promise.all([
    { drug_name: 'Amoxicillin', generic_name: 'Amoxicillin', sku: 'AMX-500', batch_number: 'B001', category: 'MEDICINE', formulation: '500mg capsules', stock_quantity: 500, unit_cost: 0.50, selling_price: 1.50, expiry_date: new Date('2026-06-30'), reorder_level: 100 },
    { drug_name: 'Metformin', generic_name: 'Metformin HCl', sku: 'MET-500', batch_number: 'B002', category: 'MEDICINE', formulation: '500mg tablets', stock_quantity: 300, unit_cost: 0.30, selling_price: 0.90, expiry_date: new Date('2026-12-31'), reorder_level: 50 },
    { drug_name: 'Lisinopril', generic_name: 'Lisinopril', sku: 'LIS-10', batch_number: 'B003', category: 'MEDICINE', formulation: '10mg tablets', stock_quantity: 200, unit_cost: 0.40, selling_price: 1.20, expiry_date: new Date('2026-09-30'), reorder_level: 50 },
    { drug_name: 'Paracetamol', generic_name: 'Acetaminophen', sku: 'PCM-500', batch_number: 'B004', category: 'MEDICINE', formulation: '500mg tablets', stock_quantity: 8, unit_cost: 0.10, selling_price: 0.30, expiry_date: new Date('2027-03-31'), reorder_level: 100 },
    { drug_name: 'Atorvastatin', generic_name: 'Atorvastatin Calcium', sku: 'ATV-20', batch_number: 'B005', category: 'MEDICINE', formulation: '20mg tablets', stock_quantity: 150, unit_cost: 0.80, selling_price: 2.40, expiry_date: new Date('2026-08-31'), reorder_level: 30 },
  ].map(async (item) => {
    const invItem = await prisma.inventoryItem.upsert({
      where: { tenant_id_sku: { tenant_id: tenant.id, sku: item.sku } },
      update: {},
      create: {
        tenant_id: tenant.id,
        name: item.drug_name,
        sku: item.sku,
        category: 'MEDICINE',
        description: `${item.drug_name} (${item.formulation})`,
      },
    });

    return prisma.inventoryStock.upsert({
      where: {
        warehouse_id_item_id_batch_number: {
          warehouse_id: pharmacyWarehouse.id,
          item_id: invItem.id,
          batch_number: item.batch_number,
        },
      },
      update: {
        quantity: item.stock_quantity,
        unit_cost: item.unit_cost,
        selling_price: item.selling_price,
      },
      create: {
        tenant_id: tenant.id,
        warehouse_id: pharmacyWarehouse.id,
        item_id: invItem.id,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        quantity: item.stock_quantity,
        unit_cost: item.unit_cost,
        selling_price: item.selling_price,
      },
    });
  }));

  console.log(`✅ Created ${inventoryItems.length} inventory items`);

  // Create ward and beds
  const ward = await prisma.ward.upsert({
    where: { tenant_id_code: { tenant_id: tenant.id, code: 'GWA' } },
    update: {},
    create: {
      tenant_id: tenant.id,
      department_id: departments[0].id,
      name: 'General Ward A',
      code: 'GWA',
      type: 'GENERAL',
      total_beds: 20,
    },
  });

  await Promise.all(
    Array.from({ length: 5 }, (_, i) => {
      const bedNumber = `A-${(i + 1).toString().padStart(2, '0')}`;
      return prisma.bed.upsert({
        where: { ward_id_bed_number: { ward_id: ward.id, bed_number: bedNumber } },
        update: {
          status: i === 0 ? 'OCCUPIED' : 'AVAILABLE',
        },
        create: {
          tenant_id: tenant.id,
          ward_id: ward.id,
          bed_number: bedNumber,
          status: i === 0 ? 'OCCUPIED' : 'AVAILABLE',
        },
      });
    })
  );

  console.log('✅ Created ward and beds');

  console.log('\n✅ Seeding complete!');
  console.log('\n📋 Demo Credentials:');
  console.log('  Tenant Slug: demo-hospital');
  console.log('  Admin:       admin@demo-hospital.com / Admin@1234');
  console.log('  Doctor:      doctor@demo-hospital.com / Doctor@1234');
  console.log('  Pharmacist:  pharmacist@demo-hospital.com / Pharma@1234');
  console.log('  Lab Tech:    labtech@demo-hospital.com / LabTech@1234');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
