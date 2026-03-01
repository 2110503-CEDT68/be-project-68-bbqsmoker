const fs = require('fs');

// Create users data (3 Admins + 20 Users)
const users = [
  { "name": "Main Administrator", "telephone_number": "0815559999", "email": "admin@gmail.com", "password": "12345678", "role": "admin" },
  { "name": "System Supervisor", "telephone_number": "0812223333", "email": "supervisor@vacq.io", "password": "Sup3r!Visor_2026", "role": "admin" },
  { "name": "Tech Support", "telephone_number": "0814445555", "email": "support@vacq.io", "password": "Admin#Support_99", "role": "admin" },
  { "name": "Thanakrit Mungmee", "telephone_number": "0824441122", "email": "tanakrit.m@gmail.com", "password": "Tnk@987654", "role": "user" },
  { "name": "Sarah Jenkins", "telephone_number": "0912223344", "email": "s.jenkins@outlook.com", "password": "Sarah_Pass!2022", "role": "user" },
  { "name": "Kanokwan Saichon", "telephone_number": "0856667788", "email": "kanokwan.s@me.com", "password": "Knw#S_667788", "role": "user" },
  { "name": "Alex Riviero", "telephone_number": "0613334455", "email": "alex.dev@techhub.com", "password": "Dev_Runner*333", "role": "user" },
  { "name": "Pongsatorn Viriya", "telephone_number": "0891112233", "email": "pongsatorn.v@company.co.th", "password": "Pst_Viri_1122", "role": "user" },
  { "name": "Yuki Tanaka", "telephone_number": "0954445566", "email": "y.tanaka@global.jp", "password": "Yuki_Tanaka#95", "role": "user" },
  { "name": "Wiphada Rakdee", "telephone_number": "0871118899", "email": "wiphada.r@hotmail.com", "password": "Wip!_Rakdee_87", "role": "user" },
  { "name": "Marcus Aurelius", "telephone_number": "0889990011", "email": "marcus.a@history.org", "password": "Stoic_King_121", "role": "user" },
  { "name": "Nuttawut Klahan", "telephone_number": "0842223311", "email": "nuttawut.k@startup.io", "password": "Nwt!Klahan_84", "role": "user" },
  { "name": "Emily Blunt", "telephone_number": "0923334422", "email": "emily.b@cinema.com", "password": "Quiet_Place!92", "role": "user" },
  { "name": "Chonthicha Kaewsai", "telephone_number": "0835556644", "email": "chonthicha.k@freelance.th", "password": "Chon_K#Freelance", "role": "user" },
  { "name": "David Bowie", "telephone_number": "0819998877", "email": "starman@mars.com", "password": "Space_Oddity_77", "role": "user" },
  { "name": "Attapol Poonphol", "telephone_number": "0867778855", "email": "attapol.p@bank.com", "password": "Atta_Bank_8655", "role": "user" },
  { "name": "Jessica Jung", "telephone_number": "0990001122", "email": "jessica.j@kpop.kr", "password": "Jess_Ice_9911", "role": "user" },
  { "name": "Worawut Jaingam", "telephone_number": "0841112299", "email": "worawut.j@edu.th", "password": "Wor_Edu_Jaingam", "role": "user" },
  { "name": "Elena Fisher", "telephone_number": "0918887766", "email": "elena.f@journal.com", "password": "Uncharted_Elena1", "role": "user" },
  { "name": "Somying Jingjai", "telephone_number": "0852223344", "email": "somying.j@trust.com", "password": "Trust_Somying_J", "role": "user" },
  { "name": "Bruce Wayne", "telephone_number": "0890009999", "email": "bruce@wayne-ent.com", "password": "Gotham_Knight_9", "role": "user" },
  { "name": "Maneerat Suaysom", "telephone_number": "0834445511", "email": "maneerat.s@design.th", "password": "Man_Design_Suay", "role": "user" },
  { "name": "Peter Parker", "telephone_number": "0829991111", "email": "p.parker@dailybugle.com", "password": "Spidey_Parker_11", "role": "user" }
];

// Create companies data (55 companies)
const companyNames = [
  "CyberCore", "HealthVibe", "GreenLeaf", "BlueOcean", "FinFlow", "Stellar", "BaanSabai", "UrbanMove", "DeepMind", "CreativeHive",
  "Quantum", "BioPure", "NovaEd", "SonicAudio", "Zenith", "Titan", "EcoSystems", "NanoLab", "Spark", "Orbit",
  "Vortex", "Horizon", "Nebula", "Apex", "Peak", "Flux", "Core", "Synapse", "Vector", "Pulse",
  "Beacon", "Swift", "Bright", "Solid", "Liquid", "Gas", "Plasma", "SolidState", "Silicon", "Carbon",
  "Oxygen", "Hydrogen", "Nitrogen", "Argon", "Krypton", "Xenon", "Neon", "Helium", "Lithium", "Iron",
  "Gold", "Silver", "Copper", "Zinc", "Nickel"
];

const companies = companyNames.map((name, i) => ({
  name: `${name} Solutions`,
  address: `${i + 1} Business Park, Bangkok`,
  website: `https://${name.toLowerCase()}.com`,
  description: `Innovative ${name} services for global markets.`,
  telephone_number: `02${(1000000 + i).toString()}`
}));

// Create bookings data (60 entries)
const bookings = [];

for (let i = 0; i < 20; i++) {
  for (let j = 0; j < 3; j++) {
    const day = 10 + (bookings.length % 3);
    bookings.push({
      bookingDate: `2022-05-${day}T10:00:00.000Z`,
      userIndex: i + 3,
      company_id: bookings.length % 55
    });
  }
}

// Save to JSON files
fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
fs.writeFileSync('companies.json', JSON.stringify(companies, null, 2));
fs.writeFileSync('bookings.json', JSON.stringify(bookings, null, 2));

console.log('✅ Created users.json, companies.json, and bookings.json successfully!');