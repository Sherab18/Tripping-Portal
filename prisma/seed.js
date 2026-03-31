import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const stations = [
  { name: "Kurichhu", voltageKV: 132 },
  { name: "Kilikhar", voltageKV: 132 },
  { name: "Corlung", voltageKV: 132 },
  { name: "Kanglung", voltageKV: 132 },
  { name: "Phuntshothang", voltageKV: 132 },
  { name: "Motanga", voltageKV: 132 },
  { name: "Deothang", voltageKV: 132 },
  { name: "Nangkhor", voltageKV: 132 },
  { name: "Nganglam", voltageKV: 132 },
  { name: "Tintibi", voltageKV: 132 },
  { name: "Yurmoo", voltageKV: 132 },
  { name: "Gelephu", voltageKV: 132 },
  { name: "Jigmeling", voltageKV: 400 },
  { name: "Mangdechhu", voltageKV: 400 },
  { name: "Tala", voltageKV: 400 },
  { name: "Malbase", voltageKV: 400 },
  { name: "Basochhu", voltageKV: 220 },
  { name: "Chhukha", voltageKV: 220 },
  { name: "Dagapela", voltageKV: 220 },
  { name: "Tsirang", voltageKV: 220 },
  { name: "Dagachhu", voltageKV: 220 },
  { name: "Semtokha", voltageKV: 220 },
  { name: "Singhigon", voltageKV: 220 },
  { name: "Samtse", voltageKV: 220 },
  { name: "Lobeysa", voltageKV: 66 },
  { name: "Dechenchholing", voltageKV: 66 },
  { name: "Damji", voltageKV: 66 },
  { name: "Olakha", voltageKV: 66 },
  { name: "Changdedaphu", voltageKV: 66 },
  { name: "Jemina", voltageKV: 66 },
  { name: "Chumdo", voltageKV: 66 },
  { name: "Paro", voltageKV: 66 },
  { name: "Pangbesa", voltageKV: 66 },
  { name: "Haa", voltageKV: 66 },
  { name: "Watsa", voltageKV: 66 },
  { name: "Gedu", voltageKV: 66 },
  { name: "Phuentsholing", voltageKV: 66 },
  { name: "Gomtu", voltageKV: 66 },
  { name: "NLDC", voltageKV: 0 },
  { name: "EDC", voltageKV: 0 },
  { name: "WDC", voltageKV: 0 },
  { name: "Dochhula", voltageKV: 66 },
  { name: "Jamjee", voltageKV: 220 },
  { name: "Nikachhu", voltageKV: 132 },
  { name: "Phunatsangstangchu", voltageKV: 400 },
  { name: "Punatsangchhu-I", voltageKV: 400 },
  { name: "Norbugang(NIP)", voltageKV: 220 },
  { name: "Bitdeer(BIT)", voltageKV: 220 },
  { name: "Burgangchu", voltageKV: 132 },
  { name: "Panbang", voltageKV: 132 },
  { name: "Sipso (Jamtsholing)", voltageKV: 66 },
  { name: "Basochu-U", voltageKV: 66 }
];

const elements = [
  "400kV THP-SIL(I)", "400kV THP-SIL(II)", "400kV THP-MAL", "400kV THP-NOR",
  "400kV NOR-SILI", "400kV MAL-SILI", "400kV MHP-JIG(I)", "400kV MHP-JIG(II)",
  "400kV MHP-JIG(III)", "400kV MHP-JIG(IV)", "400kV PHP2-ALI(I)", "400kV PHP2-ALI(II)",
  "400kV JIG-PHP2(I)", "400kV JIG-PHP2(II)", "400kV JIG-ALI(I) Direct", "400kV JIG-ALI(II) Direct",
  "220kV CHP-BIR(I)", "220kV CHP-BIR(II)", "220kV CHP-MAL", "220kV MAL-BIR",
  "220kV CHP-JAM(I)", "220kV CHP-JAM(II)", "220kV CHP-JAM(III)", "220kV CHP-GED",
  "220kV MAL-GED", "220kV JAM-SEM", "220kV SEM-BHP", "220kV BHP-TSI",
  "220kV TSI-DHP", "220kV DHP-DAG", "220kV TSI-BIT2", "220kV BIT2-DAG",
  "220kV JIG-BIT2(I)", "220kV JIG-BIT2(II)", "220kV MAL-SGO", "220kV MAL-SAM",
  "220kV MAL-NOR", "220kV NOR-SAM", "220kV SGO-SAM",
  "132kV KHP-KIL", "132kV KIL-COR", "132kV COR-KAN", "132kV KAN-PHU",
  "132kV MAT-PHU", "132kV KHP-NKO", "132kV NKO-DEO", "132kV DEO-MAT",
  "132kV MAT-SILICON", "132kV MAT-DML", "132kV MAT-RAN", "132kV MAT-NGA",
  "132kV NKO-NGA", "132kV NGA-DCP", "132kV NGA-TIN", "132kV NGA-PAN",
  "132kV PAN-TIN", "132kV MHP-TIN", "132kV TIN-YUR", "132kV TIN-JIG",
  "132kV JIG-BIT(I)", "132kV JIG-BIT(II)", "132kV JIG-GEL", "132kV GEL-SAL",
  "132kV MHP-YUR", "132kV MHP-NHP(I)", "132kV MHP-NHP(II)",
  "66kV BHPU-BHP", "66kV BHP-GEW", "66kV GEW-LSA", "66kV LSA-DOC",
  "66kV SEM-DOC", "66kV SEM-DEN", "66kV DEN-DAM", "66kV SEM-OLA",
  "66kV OLA-CHA", "66kV CHA-JEM", "66kV JEM-CHM", "66kV CHM-PRO",
  "66kV JAM-PRO", "66kV JAM-PAN", "66kV JAM-JEM", "66kV CHM-PAN",
  "66kV PAN-HAA", "66kV CHP-CHM", "66kV CHP-GED-PLG", "66kV CHP-GED",
  "66kV GED-PLG", "66kV SGO-PAS(BConcast)", "66kV MAL-PAS(I)", "66kV MAL-PAS(II)",
  "66kV MAL-PLG", "66kV MAL-PAS(IV)", "66kV PLG-GOM", "66kV SAM-GOM", "66kV SAM-JMT", 
  "ICT(s) & Transformers", "Reactors", "Generating Units", "BUSES", "Non-Compliance"
];
const creators = [
  "Kinley Wangmo", "Phub Zam", "Pema Lhamo", "Bhimla Rai", 
  "Bipal Monger", "Tempa Sangay", "Rinchen Tamang", "Sandip Rai", 
  "Karma Jurme", "Dechen Tshomo", "Amrith Subidi", "Dawa Thinley", 
  "Karma Wangda", "Tshering Zangmo", "Phub Gyem", "Dorji Gyeltshen"
];

// Inside your main() function:
for (const name of creators) {
  await prisma.creator.upsert({
    where: { name },
    update: {},
    create: { name },
  });
}

async function main() {
  console.log("Starting secure seed...");

  const adminPassword = await bcrypt.hash("Controlroom@2026!", 10);
  const operatorPassword = await bcrypt.hash("BPSO@2026", 10);

  // 1. Seed Stations and Users
  for (const s of stations) {
    const isNLDC = s.name === "NLDC";

    const substation = await prisma.substation.upsert({
      where: { name: s.name },
      update: { voltageKV: s.voltageKV },
      create: {
        name: s.name,
        voltageKV: s.voltageKV,
        type: s.voltageKV >= 132 ? "Transmission" : "Distribution"
      },
    });

    await prisma.user.upsert({
      where: { username: s.name },
      update: {
        role: isNLDC ? 'ADMIN' : 'OPERATOR',
        password: isNLDC ? adminPassword : operatorPassword
      },
      create: {
        username: s.name,
        password: isNLDC ? adminPassword : operatorPassword,
        role: isNLDC ? 'ADMIN' : 'OPERATOR',
        substationId: substation.id
      }
    });
  }

  // 2. Seed Transmission Elements (Inside main function now)
  console.log("Seeding transmission elements...");
  for (const name of elements) {
    await prisma.element.upsert({
      where: { name: name },
      update: {},
      create: { name: name },
    });
  }

  console.log("✅ Seed Complete: NLDC is ADMIN, Stations and Elements ready.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });