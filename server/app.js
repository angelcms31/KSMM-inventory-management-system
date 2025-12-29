const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const pool = require("./db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

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

    const expiry = new Date(Date.now() + 5 * 60000); // 5 minutes
    await pool.query(
      "UPDATE UserLogin SET OTP_Code = $1, OTP_Expiry = $2 WHERE User_Account = $3",
      [OTP, expiry, recipient_email]
    );

    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.MY_EMAIL, pass: process.env.MY_PASSWORD },
    });

    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: recipient_email,
      subject: "Password Recovery OTP",
      text: `Your OTP is ${OTP}. It expires in 5 minutes.`
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
      "UPDATE UserLogin SET Password = $1, OTP_Code = NULL WHERE User_Account = $2",
      [password, email]
    );
    res.send("Password updated successfully");
  } catch (error) {
    res.status(500).send("Database error");
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));