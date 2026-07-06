import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// read .env
const envStr = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf-8');
const env = {};
envStr.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function run() {
  console.log("Fetching programs...");
  const { data: programs, error: pErr } = await supabase.from('programs').select('*');
  if (pErr) { console.error("Programs Error:", pErr); return; }
  console.log("Programs found:", programs.length);

  const bcom = programs.find(p => p.name === 'B.Com');
  const bca = programs.find(p => p.name === 'BCA');

  const courses = [];
  if (bcom) {
    courses.push({ program_id: bcom.id, semester: 1, code: 'BC101', title: 'Financial Accounting I', credits: 4 });
    courses.push({ program_id: bcom.id, semester: 1, code: 'BC102', title: 'Business Economics', credits: 4 });
    courses.push({ program_id: bcom.id, semester: 2, code: 'BC201', title: 'Corporate Accounting', credits: 4 });
  }
  if (bca) {
    courses.push({ program_id: bca.id, semester: 1, code: 'CA101', title: 'Programming in C', credits: 4 });
    courses.push({ program_id: bca.id, semester: 2, code: 'CA201', title: 'Data Structures', credits: 4 });
  }

  console.log("Inserting courses...");
  if (courses.length > 0) {
    const { error: cErr } = await supabase.from('courses').insert(courses);
    if (cErr) console.error("Course Insert Error:", cErr);
    else console.log("Inserted courses!");
  }

  const faculty = [
    { name: 'Dr. Anjali Verma', email: 'anjali.verma@imperialcollegehisar.edu', department: 'Commerce', designation: 'HOD', phone: '+91 98100 12345' },
    { name: 'Prof. Rahul Menon', email: 'rahul.menon@imperialcollegehisar.edu', department: 'Computer Applications', designation: 'Assistant Professor', phone: '+91 98110 22334' },
  ];

  console.log("Inserting faculty...");
  const { error: fErr } = await supabase.from('faculty').insert(faculty);
  if (fErr) console.error("Faculty Insert Error:", fErr);
  else console.log("Inserted faculty!");
}

run();
