const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173", 
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCheck = await pool.query(
      `SELECT u.User_Role, p.FirstName 
       FROM UserLogin u 
       JOIN PersonalData p ON u.User_ID = p.User_ID 
       WHERE u.User_Account = $1 AND u.Password = $2`,
      [email, password]
    );

    console.log("Database Result:", userCheck.rows);

    if (userCheck.rows.length > 0) {
      const user = userCheck.rows[0];
      res.json({ 
        success: true, 
        role: user.User_Role || user.user_role,
        firstName: user.FirstName || user.firstname 
      });
    } else {
      res.status(401).send("Invalid email or password.");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Database error");
  }
});

app.post("/send_recovery_email", async (req, res) => {
  const { recipient_email, OTP } = req.body;

  try {
    const userCheck = await pool.query(
      "SELECT * FROM UserLogin WHERE User_Account = $1",
      [recipient_email]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).send("Email not found in our records.");
    }

    const expiry = new Date(Date.now() + 5 * 60000); 
    await pool.query(
      "UPDATE UserLogin SET OTP_Code = $1, OTP_Expiry = $2 WHERE User_Account = $3",
      [OTP, expiry, recipient_email]
    );

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { 
        user: process.env.MY_EMAIL, 
        pass: process.env.MY_PASSWORD 
      },
    });

    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: recipient_email,
      subject: "Password Recovery OTP",
      html: `
        <div style="font-family: serif; border: 1px solid #e5e7eb; padding: 20px; border-radius: 10px;">
          <h2 style="color: #8B6B4A; text-transform: uppercase;">Matthew & Melka</h2>
          <p>Your Verification Code is:</p>
          <h1 style="letter-spacing: 5px; color: #262221;">${OTP}</h1>
          <p style="color: #9ca3af; font-size: 12px;">This code will expire in 5 minutes.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.send("OTP sent successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/update_password", async (req, res) => {
  const { email, password } = req.body;
  try {
    await pool.query(
      "UPDATE UserLogin SET Password = $1, OTP_Code = NULL, OTP_Expiry = NULL WHERE User_Account = $2",
      [password, email]
    );
    res.send("Password updated successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Database error");
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));