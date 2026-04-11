// Run: node server/src/data/generate-messy-data.js
// Generates messy-data.json with ~115 entries (100 unique + 15 duplicates)

const fs = require('fs');
const path = require('path');

const firstNames = [
  'Aarav', 'Aditi', 'Aditya', 'Akash', 'Amita', 'Ananya', 'Anjali', 'Arjun', 'Aruna', 'Ashwin',
  'Bhavna', 'Chandra', 'Deepak', 'Deepika', 'Devika', 'Dhruv', 'Divya', 'Gaurav', 'Gayatri', 'Hari',
  'Harsh', 'Ishaan', 'Ishita', 'Jaya', 'Kabir', 'Karan', 'Kavya', 'Kishore', 'Kriti', 'Lakshmi',
  'Manish', 'Meera', 'Mohit', 'Nandini', 'Naveen', 'Neha', 'Nikhil', 'Nisha', 'Pallavi', 'Pooja',
  'Pradeep', 'Pranav', 'Priya', 'Rahul', 'Rajesh', 'Ravi', 'Rekha', 'Riya', 'Rohit', 'Sakshi',
  'Sameer', 'Sandeep', 'Sanjay', 'Sapna', 'Sarika', 'Shikha', 'Shivam', 'Shreya', 'Sneha', 'Sonia',
  'Sunil', 'Sunita', 'Suresh', 'Swati', 'Tanvi', 'Tarun', 'Tina', 'Uday', 'Uma', 'Varun',
  'Vidya', 'Vijay', 'Vikram', 'Vinay', 'Vinita', 'Vishal', 'Yash', 'Yogesh', 'Zara', 'Zubin',
  'Aakash', 'Abhishek', 'Amrita', 'Ankita', 'Aparna', 'Ayush', 'Bharat', 'Chetan', 'Disha', 'Ekta',
  'Gaurika', 'Himanshu', 'Ira', 'Jatin', 'Komal', 'Lavanya', 'Manas', 'Neeraj', 'Omkar', 'Pankaj',
];

const lastNames = [
  'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Reddy', 'Nair', 'Iyer', 'Joshi',
  'Mishra', 'Yadav', 'Chauhan', 'Agarwal', 'Banerjee', 'Chatterjee', 'Das', 'Dutta', 'Ghosh', 'Mehta',
  'Pandey', 'Rao', 'Saxena', 'Sinha', 'Tiwari', 'Thakur', 'Kulkarni', 'Deshmukh', 'Patil', 'Bhatt',
  'Chopra', 'Kapoor', 'Malhotra', 'Menon', 'Mukherjee', 'Prasad', 'Rajan', 'Sen', 'Shah', 'Trivedi',
];

const months = ['January', 'February', 'March', 'April'];
const statuses = ['active', 'active', 'active', 'active', 'active', 'active', 'active', 'active', 'inactive', 'active'];

function randomDate(year, month, day) {
  const formats = [
    `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
    `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`,
    `${months[month - 1]} ${day}, ${year}`,
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  ];
  return formats[Math.floor(Math.random() * formats.length)];
}

const students = [];
const usedNames = new Set();

for (let i = 1; i <= 100; i++) {
  let firstName, lastName, fullName;
  do {
    firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    fullName = `${firstName} ${lastName}`;
  } while (usedNames.has(fullName));
  usedNames.add(fullName);

  const id = `stu_${String(i).padStart(3, '0')}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
  const month = Math.floor(Math.random() * 4) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const status = statuses[Math.floor(Math.random() * statuses.length)];

  const entry = {
    id,
    name: fullName,
    email,
    created_at: randomDate(2026, month, day),
    status,
  };

  // Randomly add messy duplicate field (createdAt alongside created_at)
  if (Math.random() > 0.5) {
    entry.createdAt = `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-2026`;
  }

  // Randomly add junk fields
  if (Math.random() > 0.7) {
    entry.phone = '';
    entry.notes = '';
  }

  students.push(entry);
}

// Add 15 duplicates with slightly different date formats
for (let i = 0; i < 15; i++) {
  const original = students[Math.floor(Math.random() * 50)];
  const dupe = {
    id: original.id,
    name: original.name,
    email: original.email,
    created_at: randomDate(2026, Math.floor(Math.random() * 4) + 1, Math.floor(Math.random() * 28) + 1),
    status: original.status,
  };
  students.push(dupe);
}

// Shuffle
for (let i = students.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [students[i], students[j]] = [students[j], students[i]];
}

const messyData = {
  status: 'success',
  timestamp: '04-04-2026 10:30 AM',
  meta: {
    page: 1,
    limit: 200,
    unusedField: 'remove_this',
    internalNote: 'do_not_expose',
    debugMode: true,
  },
  students,
};

fs.writeFileSync(
  path.join(__dirname, 'messy-data.json'),
  JSON.stringify(messyData, null, 2)
);

console.log(`Generated ${students.length} entries (${usedNames.size} unique students + ${students.length - usedNames.size} duplicates)`);
