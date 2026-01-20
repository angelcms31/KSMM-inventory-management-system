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

const createAuditLog = async (userId, action, role) => {
  try {
    await pool.query(
      "INSERT INTO audit_logs (user_id, action, role) VALUES ($1, $2, $3)",
      [userId, action, role]
    );
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCheck = await pool.query(
      `SELECT u.user_id, u.user_role as role, u.password, u.failed_attempts, u.is_locked, p.status, p.firstname as firstname 
       FROM userlogin u JOIN personaldata p ON u.user_id = p.user_id 
       WHERE LOWER(u.user_account) = LOWER($1)`, [email]
    );

    if (userCheck.rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const user = userCheck.rows[0];
    if (user.is_locked) return res.status(403).json({ message: "Account Locked" });
    if (user.status === 'Deactivated') return res.status(403).json({ message: "Account Deactivated" });

    if (user.password === password) {
      await pool.query('UPDATE userlogin SET failed_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);
      await createAuditLog(user.user_id, "Login", user.role);
      return res.json({ success: true, role: user.role, firstName: user.firstname, user_id: user.user_id });
    } else {
      const newAttempts = (user.failed_attempts || 0) + 1;
      if (newAttempts >= 3) {
        await pool.query('UPDATE userlogin SET failed_attempts = $1, is_locked = TRUE WHERE user_id = $2', [newAttempts, user.user_id]);
        return res.status(403).json({ message: "Account Locked" });
      } else {
        await pool.query('UPDATE userlogin SET failed_attempts = $1 WHERE user_id = $2', [newAttempts, user.user_id]);
        return res.status(401).json({ message: `Invalid credentials. ${3 - newAttempts} attempts left.` });
      }
    }
  } catch (error) { res.status(500).json({ message: "Login error" }); }
});

app.post("/api/logout", async (req, res) => {
  const { userId, role } = req.body;
  try {
    if (userId) {
      await createAuditLog(userId, "Logout", role);
      res.send("Logout detected and logged");
    } else {
      res.status(400).send("No user ID provided");
    }
  } catch (err) { res.status(500).send(err.message); }
});

app.post("/send_recovery_email", async (req, res) => {
  const { OTP, recipient_email } = req.body;
  try {
    const mailOptions = {
      from: process.env.MY_EMAIL,
      to: recipient_email,
      subject: "Password Recovery OTP",
      html: `<h3>Your OTP for password recovery is: <b>${OTP}</b></h3><p>This code will expire soon.</p>`
    };
    await transporter.sendMail(mailOptions);
    res.status(200).send("OTP sent successfully");
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).send("Failed to send email");
  }
});

app.post("/api/reset_password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const result = await pool.query(
      "UPDATE userlogin SET password = $1, failed_attempts = 0, is_locked = FALSE WHERE LOWER(user_account) = LOWER($2) RETURNING user_id, user_role",
      [newPassword, email]
    );

    if (result.rows.length > 0) {
      await createAuditLog(result.rows[0].user_id, "Password Reset", result.rows[0].user_role);
      res.status(200).send("Password updated successfully");
    } else {
      res.status(404).send("User not found");
    }
  } catch (err) {
    res.status(500).send("Server error during password reset");
  }
});

app.get("/api/users", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT * FROM (
        SELECT p.*, u.user_role, u.is_locked, u.date_added,
               ROW_NUMBER() OVER(ORDER BY u.date_added ASC) as permanent_id,
               COUNT(*) OVER() as total_count
        FROM personaldata p JOIN userlogin u ON p.user_id = u.user_id
        WHERE p.firstname ILIKE $1 OR p.lastname ILIKE $1 OR p.email ILIKE $1
      ) sub
      ORDER BY 
        CASE WHEN is_locked = TRUE THEN 1 ELSE 2 END ASC, 
        CASE WHEN status = 'Active' THEN 1 ELSE 2 END ASC, 
        date_added DESC 
      LIMIT $2 OFFSET $3`, [`%${search}%`, limit, offset]);
    res.json({ users: result.rows, totalUsers: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0 });
  } catch (err) { res.status(500).send("Database error"); }
});

app.post("/api/add_user", async (req, res) => {
  const { firstName, lastName, email, contactNo, role, gender, profileImage } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pRes = await client.query(
      'INSERT INTO personaldata (firstname, lastname, email, contact_no, gender, profile_image, status) VALUES ($1, $2, $3, $4, $5, $6, \'Active\') RETURNING user_id',
      [firstName, lastName, email, contactNo, gender, profileImage]
    );
    await client.query(
      'INSERT INTO userlogin (user_account, password, user_role, user_id, failed_attempts, is_locked) VALUES ($1, $2, $3, $4, 0, FALSE)',
      [email, "password123", role, pRes.rows[0].user_id]
    );
    await client.query("COMMIT");
    await transporter.sendMail({
      from: process.env.MY_EMAIL, to: email, subject: "Welcome to Matthew & Melka",
      html: `<h3>Account Created!</h3><p>Hi ${firstName}, use these credentials:</p><p>User: ${email}<br>Pass: password123</p>`
    });
    res.status(201).send("Success");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally { client.release(); }
});

app.put("/api/user/update", async (req, res) => {
  const { firstName, lastName, email, contactNo, role, gender, profileImage, originalEmail } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      'UPDATE personaldata SET firstname=$1, lastname=$2, contact_no=$3, gender=$4, profile_image=$5 WHERE email=$6',
      [firstName, lastName, contactNo, gender, profileImage, originalEmail || email]
    );
    await client.query('UPDATE userlogin SET user_role=$1 WHERE user_account=$2', [role, originalEmail || email]);
    await client.query("COMMIT");
    res.send("Update successful");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally { client.release(); }
});

app.get("/api/artisans", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT *, COUNT(*) OVER() as total_count FROM artisan 
      WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
      ORDER BY 
        CASE WHEN status = 'Active' THEN 1 ELSE 2 END ASC, 
        artisan_id DESC 
      LIMIT $2 OFFSET $3`, [`%${search}%`, limit, offset]);
    res.json({ artisans: result.rows, totalArtisans: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0 });
  } catch (err) { res.status(500).send(err.message); }
});

app.post("/api/add_artisan", async (req, res) => {
  const { firstName, middleName, lastName, email, contactNo, department, profileImage } = req.body;
  try {
    await pool.query(
      `INSERT INTO artisan (first_name, middle_name, last_name, email, contact_no, department, profile_image, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active')`,
      [firstName, middleName, lastName, email, contactNo, department, profileImage]
    );
    res.status(201).send("Success");
  } catch (err) { res.status(500).send(err.message); }
});

app.put("/api/artisan/update", async (req, res) => {
  const { artisan_id, firstName, middleName, lastName, email, contactNo, department, profileImage } = req.body;
  try {
    await pool.query(
      `UPDATE artisan SET first_name=$1, middle_name=$2, last_name=$3, email=$4, contact_no=$5, department=$6, profile_image=$7 
       WHERE artisan_id=$8`,
      [firstName, middleName, lastName, email, contactNo, department, profileImage, artisan_id]
    );
    res.send("Success");
  } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/suppliers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Supplier WHERE name ILIKE $1 OR email ILIKE $1 ORDER BY supplier_id DESC", [`%${req.query.search || ""}%`]);
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.post("/api/add_supplier", async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    await pool.query("INSERT INTO Supplier (name, contact_no, email) VALUES ($1, $2, $3)", [name, phone, email]);
    res.status(201).send("Success");
  } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/supplier/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT order_id, product_name, total_value, status 
      FROM orders 
      WHERE supplier_id = $1 
      ORDER BY order_id DESC
    `, [id]);
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/all_orders", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.order_id, o.total_value, o.status, s.name as supplier_name 
      FROM orders o 
      LEFT JOIN supplier s ON o.supplier_id = s.supplier_id 
      ORDER BY o.order_id DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/audit_logs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        l.log_id, l.user_id, l.action, l.role, 
        l.timestamp, 
        COALESCE(
          (SELECT CONCAT(firstname, ' ', middlename, ' ', lastname) FROM personaldata WHERE user_id = l.user_id),
          (SELECT CONCAT(first_name, ' ', middle_name, ' ', last_name) FROM artisan WHERE artisan_id = l.user_id)
        ) as merged_name
      FROM audit_logs l 
      ORDER BY l.timestamp DESC 
      LIMIT 100
    `);
    res.json(result.rows); 
  } catch (err) { res.status(500).send(err.message); }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));