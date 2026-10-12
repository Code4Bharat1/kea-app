import axios from 'axios';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mongoose = require('C:/Users/DANISH KHAN/Desktop/Kea_Project/KEA_backend/node_modules/mongoose');

const API_BASE = 'http://localhost:7101/api';
const MONGO_URI = 'mongodb+srv://kea:kea@cluster0.wbzbala.mongodb.net/?appName=Cluster0';

async function runAuthTest() {
  console.log('--- STEP 1: REGISTER USER ---');
  const testEmail = 'khandanish909577@gmail.com';
  const testPass = 'Password123';
  const testName = 'Danish Khan';

  try {
    const regRes = await axios.post(`${API_BASE}/auth/register`, {
      name: testName,
      email: testEmail,
      password: testPass,
      role: 'user',
      profile: {
        headline: 'Senior Civil Engineer',
        phone: '+919876543210',
        company: 'KEA Engineering',
        location: 'Mumbai, India',
      },
    });

    console.log('✅ Registration Status:', regRes.status);
    console.log('✅ Registration Response Data:', regRes.data);
  } catch (err) {
    if (err.response) {
      console.log('ℹ️ Registration info:', err.response.status, err.response.data);
    } else {
      console.error('❌ Registration request error:', err.message);
    }
  }

  console.log('\n--- STEP 2: VERIFY USER EXISTS IN MONGO DB ---');
  await mongoose.connect(MONGO_URI);
  const User = mongoose.connection.collection('users');
  const dbUser = await User.findOne({ email: testEmail.toLowerCase() });

  if (dbUser) {
    console.log('✅ USER FOUND IN DB!');
    console.log('   ID:', dbUser._id);
    console.log('   Email:', dbUser.email);
    console.log('   Name:', dbUser.name);
    console.log('   Role:', dbUser.role);
    console.log('   MemberID:', dbUser.memberId);
    console.log('   MembershipStatus:', dbUser.membershipStatus);
    console.log('   Has Password Hash:', !!dbUser.password);
  } else {
    console.error('❌ USER NOT FOUND IN MONGO DB!');
  }
  await mongoose.disconnect();

  console.log('\n--- STEP 3: LOGIN WITH SAME CREDENTIALS ---');
  try {
    const loginRes = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPass,
    });

    console.log('✅ Login Status:', loginRes.status);
    console.log('✅ Login Response Keys:', Object.keys(loginRes.data));
    console.log('✅ Returned Message:', loginRes.data.message);
    console.log('✅ Returned Token Exists:', !!loginRes.data.token);
    console.log('✅ Returned User Email:', loginRes.data.user?.email);
    console.log('✅ Returned User MemberID:', loginRes.data.user?.memberId);
  } catch (err) {
    if (err.response) {
      console.error('❌ Login Failed Status:', err.response.status, err.response.data);
    } else {
      console.error('❌ Login Network Error:', err.message);
    }
  }
}

runAuthTest();
