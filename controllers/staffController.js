const bcrypt = require('bcryptjs');
const supabase = require('../supabase/client');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/emailService');

// const {
//   generateAuthenticationOptions,
//   generateRegistrationOptions,
//   verifyAuthenticationResponse,
//   verifyRegistrationResponse
// } = require('@simplewebauthn/server');

// const rpName = 'Trackar';
// const rpID = 'localhost'; // Change to your domain in prod
// const origin = 'http://localhost:3000'; // Or your frontend domain

// // Store challenge in memory for demo (in production use Redis or DB)
// const challengeStore = new Map();

function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}


exports.registerStaff = async (req, res) => {
  const { name, gender, phone, email, department, jobTitle, qr_code_id, role } = req.body;
  const orgId = req.user.organization_id

  const pin  = generatePin();
  const hashedPin = await bcrypt.hash(pin, 10);

  const { error } = await supabase
    .from('staff')
    .insert([{ name, gender, phone, email, department, job_title: jobTitle, role, organization_id: orgId,  qr_code: qr_code_id, password: hashedPin, is_first_login: true }]);


  if (error) return res.status(400).json({ error: error.message });

  console.log(`Temporary PIN for ${name}: ${pin}`); // For debugging, remove in production

  await sendEmail(email, 'Your Trakar Staff Login', `<p>Welcome ${name}, your temporary pin is <strong>${pin}</strong>. Please change it on first login.</p>`);

  res.json({ message: 'Staff created and password emailed.' });
};

exports.staffLogin = async (req, res) => {
  const { identifier, pin } = req.body;

  // identifier could be qr_code_id, phone, or email
  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .or(`phone.eq.${identifier},email.eq.${identifier},qr_code.eq.${identifier}`)
    .maybeSingle();

  console.log(`Staff : ${JSON.stringify(staff)}`); // For debugging, remove in production

  if (!staff) return res.status(404).json({ error: ' unknown credentials' });

  const isMatch = await bcrypt.compare(pin, staff.password);
  if (!isMatch) return res.status(401).json({ error: 'Invalid ID or unknown credentials' });

  await supabase
    .from('logs')
    .insert([{ phone: staff.phone, email : staff.email, type: 'staff', organization_id: staff.organization_id, sign_in: new Date().toISOString() }]);

  const token = generateToken({ id: staff.id, role: staff.role, orgId: staff.organization_id });

  res.json({
    staff,
    message: 'Staff signed in successfully',
    token,
    is_first_login: staff.is_first_login,
  });
};

exports.staffLogout = async (req, res) => {
  const { identifier } = req.body;

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .or(`phone.eq.${identifier},email.eq.${identifier},qr_code.eq.${identifier}`)
    .maybeSingle();

  if (!staff) return res.status(404).json({ error: 'Staff not found' });

  const { data: activeLog } = await supabase
    .from('logs')
    .select('*')
    .eq('phone', staff.phone)
    .eq('type', 'staff')
    .is('sign_out', null)
    .order('sign_in', { ascending: false })
    .limit(1)
    .single();

  if (!activeLog) return res.status(400).json({ error: 'User not currently signed in' });

  await supabase
    .from('logs')
    .update({ sign_out: new Date().toISOString() })
    .eq('id', activeLog.id);

  res.json({ message: 'Staff signed out successfully' });

};

exports.changePassword = async (req, res) => {
  const { identifier, oldPin, newPin } = req.body;

  const { data: staff, error } = await supabase
    .from('staff')
    .select('*')
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .maybeSingle();

  if (error || !staff) return res.status(404).json({ error: 'Staff not found' });

  const isMatch = await bcrypt.compare(oldPin, staff.password);
  if (!isMatch) return res.status(401).json({ error: 'Old PIN is incorrect' });

  const newHashedPin = await bcrypt.hash(newPin, 10);

  const { error: updateError } = await supabase
    .from('staff')
    .update({ password: newHashedPin, is_first_login: false })
    .eq('id', staff.id);

  if (updateError) return res.status(500).json({ error: updateError.message });

  res.json({ message: 'Password updated successfully. You can now log in normally.' });
};


exports.getAllUsers = async (req, res) => {
  const orgId = req.user.organization_id;

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('organization_id', orgId);

  if (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }

  res.json(data);
};

//face recognition login

// function cosineSimilarity(vecA, vecB) {
//   const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
//   const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
//   const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
//   return dot / (magA * magB);
// }

// exports.faceLogin = async (req, res) => {
//   const { face_descriptor } = req.body;

//   if (!face_descriptor) return res.status(400).json({ error: 'No face descriptor received' });

//   const { data: staffList } = await supabase.from('staff').select('id, name, email, face_descriptor');

//   for (const staff of staffList) {
//     if (!staff.face_descriptor) continue;

//     const storedVector = JSON.parse(staff.face_descriptor);
//     const similarity = cosineSimilarity(face_descriptor, storedVector);

//     if (similarity >= 0.95) {
//       const token = generateToken({ id: staff.id, role: 'staff', orgId: staff.organization_id });
//       return res.json({ verified: true, staff, token });
//     }
//   }

//   res.json({ verified: false });
// };

// exports.faceRegister = async (req, res) => {
//   const { email, face_descriptor } = req.body;

//   if (!email || !face_descriptor) {
//     return res.status(400).json({ error: 'Missing email or face descriptor' });
//   }

//   const { error } = await supabase
//     .from('staff')
//     .update({
//       face_descriptor: JSON.stringify(face_descriptor),
//     })
//     .eq('email', email);

//   if (error) {
//     console.error('Supabase error:', error);
//     return res.status(500).json({ registered: false });
//   }

//   res.json({ registered: true });
// };







//webauthn registration and authentication


// exports.generateRegistrationOptions = async (req, res) => {
//   const { email } = req.body;

//   const { data: staff } = await supabase.from('staff').select('*').eq('email', email).maybeSingle();

//   if (!staff) return res.status(404).json({ error: 'Staff not found' });

//   const options = generateRegistrationOptions({
//     rpName,
//     rpID,
//     userID: staff.id,
//     userName: staff.email,
//     timeout: 60000,
//     attestationType: 'indirect',
//     authenticatorSelection: {
//       userVerification: 'required',
//       authenticatorAttachment: 'platform', // biometric
//     },
//   });

//   challengeStore.set(staff.email, options.challenge);
//   res.json(options);
// };

// exports.verifyRegistration = async (req, res) => {
//   const { email, attestationResponse } = req.body;

//   const expectedChallenge = challengeStore.get(email);
//   const verification = await verifyRegistrationResponse({
//     response: attestationResponse,
//     expectedChallenge,
//     expectedOrigin: origin,
//     expectedRPID: rpID,
//   });

//   const { verified, registrationInfo } = verification;

//   if (verified) {
//     const { credentialPublicKey, credentialID, counter } = registrationInfo;

//     await supabase.from('staff')
//       .update({
//         credential_id: credentialID.toString('base64url'),
//         credential_public_key: credentialPublicKey.toString('base64url'),
//         credential_counter: counter,
//       })
//       .eq('email', email);

//     return res.json({ verified: true });
//   }

//   res.status(400).json({ verified: false });
// };

// exports.generateAuthenticationOptions = async (req, res) => {
//   const { email } = req.body;

//   const { data: staff } = await supabase.from('staff').select('*').eq('email', email).maybeSingle();
//   if (!staff || !staff.credential_id) return res.status(404).json({ error: 'Biometric not registered' });

//   const options = generateAuthenticationOptions({
//     timeout: 60000,
//     allowCredentials: [
//       {
//         id: Buffer.from(staff.credential_id, 'base64url'),
//         type: 'public-key',
//       },
//     ],
//     userVerification: 'required',
//     rpID,
//   });

//   challengeStore.set(email, options.challenge);
//   res.json(options);
// };

// exports.verifyAuthentication = async (req, res) => {
//   const { email, assertionResponse } = req.body;

//   const { data: staff } = await supabase.from('staff').select('*').eq('email', email).maybeSingle();

//   if (!staff) return res.status(404).json({ error: 'Staff not found' });

//   const expectedChallenge = challengeStore.get(email);

//   const verification = await verifyAuthenticationResponse({
//     response: assertionResponse,
//     expectedChallenge,
//     expectedOrigin: origin,
//     expectedRPID: rpID,
//     authenticator: {
//       credentialID: Buffer.from(staff.credential_id, 'base64url'),
//       credentialPublicKey: Buffer.from(staff.credential_public_key, 'base64url'),
//       counter: staff.credential_counter,
//     },
//   });

//   const { verified, authenticationInfo } = verification;

//   if (verified) {
//     // Update the counter to prevent replay
//     await supabase.from('staff').update({
//       credential_counter: authenticationInfo.newCounter,
//     }).eq('email', email);

//     // Sign JWT
//     const token = generateToken({ id: staff.id, role: 'staff' });

//     return res.json({
//       verified: true,
//       token,
//       staff: { id: staff.id, name: staff.name, email: staff.email }
//     });
//   }

//   res.status(401).json({ verified: false });
// };