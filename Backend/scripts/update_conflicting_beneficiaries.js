import pool from '../config/db.js';

const mapping = [
  { id: 17, firstName: 'Kaveesha', lastName: 'Gunawardena' },
  { id: 18, firstName: 'Nuwan', lastName: 'Priyantha' },
  { id: 20, firstName: 'Ishara', lastName: 'Madushanka' },
  { id: 21, firstName: 'Tharushi', lastName: 'Fernando' },
  { id: 24, firstName: 'Mevan', lastName: 'de Silva' },
  { id: 23, firstName: 'Chamara', lastName: 'Sampath' },
  { id: 29, firstName: 'Dilhani', lastName: 'Perera' },
  { id: 30, firstName: 'Sajeewa', lastName: 'Kumara' },
  { id: 25, firstName: 'Kasun', lastName: 'Kalhara' },
  { id: 26, firstName: 'Nilmini', lastName: 'Silva' },
  { id: 19, firstName: 'Buddhi', lastName: 'Prabodha' },
  { id: 22, firstName: 'Ruwan', lastName: 'Pathirana' },
  { id: 28, firstName: 'Gayantha', lastName: 'Karunathilake' },
  { id: 34, firstName: 'Nadeesha', lastName: 'Dilrukshi' },
  { id: 31, firstName: 'Dhananjaya', lastName: 'de Silva' },
  { id: 32, firstName: 'Shani', lastName: 'Jayasuriya' },
  { id: 33, firstName: 'Priyantha', lastName: 'Wijesinghe' },
];

async function update() {
  try {
    for (const item of mapping) {
      const fullName = `${item.firstName} ${item.lastName}`;
      await pool.query(
        "UPDATE beneficiary SET ben_first_name = $1, ben_last_name = $2, ben_name = $3 WHERE beneficiary_id = $4",
        [item.firstName, item.lastName, fullName, item.id]
      );
      console.log(`Updated ID ${item.id} to ${fullName}`);
    }
    console.log('All 17 records updated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Update failed:', err);
    process.exit(1);
  }
}

update();
