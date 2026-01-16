const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();

app.use(cors({
  origin: "http://localhost:5173", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCheck = await pool.query(
      `SELECT u.User_Role as role, p.FirstName as firstname 
       FROM UserLogin u 
       JOIN PersonalData p ON u.User_ID = p.User_ID 
       WHERE LOWER(u.User_Account) = LOWER($1) AND u.Password = $2`,
      [email, password]
    );

    if (userCheck.rows.length > 0) {
      res.json({ 
        success: true, 
        role: userCheck.rows[0].role,
        firstName: userCheck.rows[0].firstname 
      });
    } else {
      res.status(401).send("Invalid email or password.");
    }
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).send("Database error");
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.FirstName, p.LastName, p.Email, p.Contact_No, u.User_Role, u.Is_Locked 
      FROM PersonalData p
      JOIN UserLogin u ON p.User_ID = u.User_ID
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));