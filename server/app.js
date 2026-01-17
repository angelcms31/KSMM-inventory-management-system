const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();

app.use(express.json({ limit: '25mb' })); 
app.use(express.urlencoded({ limit: '25mb', extended: true }));

app.use(cors({ origin: "http://localhost:5173", credentials: true }));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MY_EMAIL, pass: process.env.MY_PASSWORD }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCheck = await pool.query(
      `SELECT u.User_Role as role, p.FirstName as firstname 
       FROM UserLogin u JOIN PersonalData p ON u.User_ID = p.User_ID 
       WHERE LOWER(u.User_Account) = LOWER($1) AND u.Password = $2`, [email, password]
    );
    if (userCheck.rows.length > 0) {
      res.json({ success: true, role: userCheck.rows[0].role, firstName: userCheck.rows[0].firstname });
    } else {
      res.status(401).send("Invalid credentials");
    }
  } catch (error) { res.status(500).send("Login error"); }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.FirstName, p.LastName, p.Email, p.Contact_No, p.Gender, p.Profile_Image,
             u.User_Role, u.Is_Locked, u.Date_Added
      FROM PersonalData p JOIN UserLogin u ON p.User_ID = u.User_ID
      ORDER BY u.Date_Added DESC`);
    res.json(result.rows);
  } catch (err) { res.status(500).send("Database error"); }
});

app.post("/api/add_user", async (req, res) => {
  const { firstName, lastName, email, contactNo, role, gender, profileImage } = req.body;
  const defaultPassword = "password123"; 
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pRes = await client.query(
      "INSERT INTO PersonalData (FirstName, LastName, Email, Contact_No, Gender, Profile_Image) VALUES ($1, $2, $3, $4, $5, $6) RETURNING User_ID",
      [firstName, lastName, email, contactNo, gender, profileImage]
    );
    const userId = pRes.rows[0].user_id;
    await client.query(
      "INSERT INTO UserLogin (User_Account, Password, User_Role, User_ID) VALUES ($1, $2, $3, $4)",
      [email, defaultPassword, role, userId]
    );
    await client.query("COMMIT");

    await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Welcome to Matthew & Melka",
      html: `<h3>Account Created!</h3><p>Hi ${firstName}, use these credentials:</p>
             <p>User: ${email}<br>Pass: ${defaultPassword}</p>`
    });
    res.status(201).send("Success");
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === '23505') return res.status(400).send("Email already exists.");
    res.status(500).send(err.message);
  } finally { client.release(); }
});

app.put("/api/user/update", async (req, res) => {
  const { firstName, lastName, email, contactNo, role, gender, profileImage, originalEmail } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE PersonalData SET FirstName = $1, LastName = $2, Contact_No = $3, Gender = $4, Profile_Image = $5 
       WHERE Email = $6`,
      [firstName, lastName, contactNo, gender, profileImage, originalEmail || email]
    );
    await client.query(
      "UPDATE UserLogin SET User_Role = $1 WHERE User_Account = $2",
      [role, originalEmail || email]
    );
    await client.query("COMMIT");
    res.send("Update successful");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally { client.release(); }
});

app.post("/api/user/status", async (req, res) => {
  const { email, isLocked } = req.body;
  try {
    await pool.query(
      "UPDATE UserLogin SET Is_Locked = $1 WHERE User_Account = $2",
      [isLocked, email]
    );
    res.send("Status updated");
  } catch (err) { res.status(500).send(err.message); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));