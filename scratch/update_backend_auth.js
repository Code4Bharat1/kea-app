import fs from 'fs';

const filePath = 'C:/Users/DANISH KHAN/Desktop/Kea_Project/KEA_backend/controllers/auth.controller.js';
let code = fs.readFileSync(filePath, 'utf8');

const oldLogin = code.substring(code.indexOf('export const login ='), code.indexOf('export const adminLogin ='));

const newLogin = `export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Missing credentials" });

    const cleanEmail = email.trim().toLowerCase();
    console.log("EMAIL RECEIVED:", cleanEmail);

    const user = await User.findOne({ email: cleanEmail });
    console.log("USER FOUND:", !!user);

    if (user) {
      console.log("USER ID:", user._id);
      console.log("USER EMAIL:", user.email);
      console.log("PASSWORD FIELD EXISTS:", !!user.password);
      console.log("PASSWORD HASH:", user.password ? "EXISTS" : "MISSING");
    }

    if (!user) {
      console.log("PASSWORD MATCH: false");
      console.log("LOGIN RESULT: INVALID_CREDENTIALS - Account not registered in database");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      console.log("LOGIN RESULT: INVALID_CREDENTIALS - Password comparison failed");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Admin block check
    if (user.role === "admin") {
      console.log("LOGIN RESULT: BLOCKED_ADMIN");
      return res.status(403).json({ message: "Admins must use the admin login portal" });
    }

    console.log("LOGIN RESULT: SUCCESS");
    const token = signToken(user);

    res.json({
      message: "Login successful",
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

`;

code = code.replace(oldLogin, newLogin);
fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated backend login controller!');
