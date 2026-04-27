const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bcrypt = require("bcrypt");
const os = require("os");
const { getPool, initDB, dbQuery } = require("./db");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  socket.on("disconnect", () => console.log("Client disconnected:", socket.id));
});

module.exports = { app, server, io };

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.MY_EMAIL, pass: process.env.MY_PASSWORD }
});

const createAuditLog = async (userId, action, role) => {
  try {
    await getPool().query(
      "INSERT INTO audit_logs (user_id, action, role) VALUES ($1, $2, $3)",
      [userId, action, role]
    );
  } catch (err) {
    console.error("Audit log failed:", err.message);
  }
};

const createTransaction = async (client, { ref, type, category, desc, amount, status, sourceTable, sourceId, userId }) => {
    await client.query(
        `INSERT INTO transactions (reference_no, transaction_type, category, description, amount, status, source_table, source_id, user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [ref, type, category, desc, amount, status || 'Pending', sourceTable, sourceId, userId]
    );
};

const checkUserDuplicate = async (email, contactNo, excludeId = null) => {
  const pool = getPool();

  const userRes = await pool.query(
    `SELECT 1 FROM personaldata WHERE (LOWER(email) = LOWER($1) OR contact_no = $2)${excludeId ? ' AND user_id != $3' : ''}`,
    excludeId ? [email, contactNo, excludeId] : [email, contactNo]
  );
  if (userRes.rows.length > 0) {
    return { conflict: true, message: 'Email or contact is already used by a System User.' };
  }

  const artisanRes = await pool.query(
    `SELECT 1 FROM artisan WHERE LOWER(email) = LOWER($1) OR contact_no = $2`,
    [email, contactNo]
  );
  if (artisanRes.rows.length > 0) {
    return { conflict: true, message: 'Email or contact is already used by an Artisan.' };
  }

  const supplierRes = await pool.query(
    `SELECT 1 FROM supplier WHERE LOWER(email) = LOWER($1) OR contact_no = $2`,
    [email, contactNo]
  );
  if (supplierRes.rows.length > 0) {
    return { conflict: true, message: 'Email or contact is already used by a Supplier.' };
  }

  return { conflict: false };
};

const checkArtisanDuplicate = async (email, contactNo, excludeId = null) => {
  const pool = getPool();

  const artisanRes = await pool.query(
    `SELECT 1 FROM artisan WHERE (LOWER(email) = LOWER($1) OR contact_no = $2)${excludeId ? ' AND artisan_id != $3' : ''}`,
    excludeId ? [email, contactNo, excludeId] : [email, contactNo]
  );
  if (artisanRes.rows.length > 0) {
    return { conflict: true, message: 'Email or contact is already registered to another Artisan.' };
  }

  const userRes = await pool.query(
    `SELECT 1 FROM personaldata WHERE LOWER(email) = LOWER($1) OR contact_no = $2`,
    [email, contactNo]
  );
  if (userRes.rows.length > 0) {
    return { conflict: true, message: 'Email or contact is already used by a System User.' };
  }

  const supplierRes = await pool.query(
    `SELECT 1 FROM supplier WHERE LOWER(email) = LOWER($1) OR contact_no = $2`,
    [email, contactNo]
  );
  if (supplierRes.rows.length > 0) {
    return { conflict: true, message: 'Email or contact is already used by a Supplier.' };
  }

  return { conflict: false };
};

const checkSupplierDuplicate = async (email, contactNo, excludeId = null) => {
  const pool = getPool();

  const supplierRes = await pool.query(
    `SELECT 1 FROM supplier WHERE (LOWER(email) = LOWER($1) OR contact_no = $2)${excludeId ? ' AND supplier_id != $3' : ''}`,
    excludeId ? [email, contactNo, excludeId] : [email, contactNo]
  );
  if (supplierRes.rows.length > 0) {
    return { conflict: true, message: 'Email or contact is already registered to another Supplier.' };
  }

  const userRes = await pool.query(
    `SELECT 1 FROM personaldata WHERE LOWER(email) = LOWER($1) OR contact_no = $2`,
    [email, contactNo]
  );
  if (userRes.rows.length > 0) {
    return { conflict: true, message: 'Email or contact is already used by a System User.' };
  }

  const artisanRes = await pool.query(
    `SELECT 1 FROM artisan WHERE LOWER(email) = LOWER($1) OR contact_no = $2`,
    [email, contactNo]
  );
  if (artisanRes.rows.length > 0) {
    return { conflict: true, message: 'Email or contact is already used by an Artisan.' };
  }

  return { conflict: false };
};
// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const userCheck = await getPool().query(
      `SELECT u.user_id, u.user_role as role, u.password, u.failed_attempts, 
              u.is_locked, u.is_default_password, u.is_approved, u.is_head_admin,
              p.status, p.firstname as firstname 
       FROM userlogin u JOIN personaldata p ON u.user_id = p.user_id 
       WHERE LOWER(u.user_account) = LOWER($1)`, [email]
    );

    if (userCheck.rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });

    const user = userCheck.rows[0];

    if (user.status === 'Deactivated') return res.status(403).json({ message: "Account Deactivated" });
    if (user.is_locked && !user.is_head_admin) return res.status(403).json({ message: "Account Locked" });
    if (user.role === 'Admin' && !user.is_approved && !user.is_head_admin) {
      return res.status(403).json({ message: "Your Admin account is pending approval from the Head Admin." });
    }

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      await getPool().query('UPDATE userlogin SET failed_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);
      await createAuditLog(user.user_id, "Login", user.role);
      return res.json({
        success: true,
        role: user.role,
        firstName: user.firstname,
        user_id: user.user_id,
        is_head_admin: user.is_head_admin || false,
        is_default_password: user.is_default_password ?? true
      });
    } else {
      if (user.is_head_admin) return res.status(401).json({ message: "Invalid credentials." });
      const newAttempts = (user.failed_attempts || 0) + 1;
      if (newAttempts >= 3) {
        await getPool().query('UPDATE userlogin SET failed_attempts = $1, is_locked = TRUE WHERE user_id = $2', [newAttempts, user.user_id]);
        return res.status(403).json({ message: "Account Locked" });
      } else {
        await getPool().query('UPDATE userlogin SET failed_attempts = $1 WHERE user_id = $2', [newAttempts, user.user_id]);
        return res.status(401).json({ message: "Invalid credentials." });
      }
    }
  } catch (error) {
    res.status(500).json({ message: "Login error" });
  }
});

app.post('/api/change_password', async (req, res) => {
  const { user_id, new_password } = req.body;
  try {
    const result = await getPool().query('SELECT password FROM userlogin WHERE user_id = $1', [user_id]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    const isSame = await bcrypt.compare(new_password, result.rows[0].password);
    if (isSame) return res.status(400).json({ message: 'Please enter a different password.' });
    const hashed = await bcrypt.hash(new_password, 10);
    await getPool().query('UPDATE userlogin SET password = $1, is_default_password = FALSE WHERE user_id = $2', [hashed, user_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update password.' });
  }
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
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/send_recovery_email", async (req, res) => {
  const { OTP, recipient_email } = req.body;
  try {
    await transporter.sendMail({
      from: process.env.MY_EMAIL, to: recipient_email,
      subject: "Password Recovery OTP",
      html: `<h3>Your OTP for password recovery is: <b>${OTP}</b></h3><p>This code will expire soon.</p>`
    });
    res.status(200).send("OTP sent successfully");
  } catch (error) {
    res.status(500).send("Failed to send email");
  }
});

app.post("/api/reset_password", async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const hashed = await bcrypt.hash(newPassword, 10);
    const result = await getPool().query(
      "UPDATE userlogin SET password = $1, failed_attempts = 0, is_locked = FALSE WHERE LOWER(user_account) = LOWER($2) RETURNING user_id, user_role",
      [hashed, email]
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

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────

app.get("/api/users", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;
    
    const result = await getPool().query(`
      WITH numbered_users AS (
        SELECT p.*, u.user_role, u.is_locked, u.is_head_admin, u.is_approved, u.date_added,
               ROW_NUMBER() OVER(ORDER BY u.date_added ASC) as permanent_id,
               COUNT(*) OVER() as total_count
        FROM personaldata p JOIN userlogin u ON p.user_id = u.user_id
      )
      SELECT * FROM numbered_users
      WHERE (
        firstname ILIKE $1 
        OR lastname ILIKE $1 
        OR email ILIKE $1
        OR COALESCE(middlename, '') ILIKE $1
        OR (firstname || ' ' || lastname) ILIKE $1
        OR (firstname || ' ' || COALESCE(middlename, '') || ' ' || lastname) ILIKE $1
        OR CONCAT(SUBSTRING(user_role, 1, 2), '-', permanent_id::TEXT) ILIKE $1
      )
      ORDER BY CASE WHEN is_locked = TRUE THEN 1 ELSE 2 END ASC,
               CASE WHEN is_approved = FALSE AND user_role = 'Admin' THEN 1 ELSE 2 END ASC,
               CASE WHEN status = 'Active' THEN 1 ELSE 2 END ASC, 
               date_added DESC
      LIMIT $2 OFFSET $3`, [`%${search}%`, limit, offset]);

    res.json({ 
      users: result.rows, 
      totalUsers: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0 
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.get("/api/user/profile/:email", async (req, res) => {
  try {
    const result = await getPool().query("SELECT Profile_Image FROM PersonalData WHERE Email = $1", [req.params.email]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/user/name/:id", async (req, res) => {
  try {
    const result = await getPool().query(
      "SELECT CONCAT(firstname, ' ', lastname) as name FROM personaldata WHERE user_id = $1", [req.params.id]
    );
    res.json(result.rows.length > 0 ? { name: result.rows[0].name } : { name: "Unknown User" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/user/:id", async (req, res) => {
  try {
    const result = await getPool().query(
      "SELECT profile_image, firstname, lastname FROM personaldata WHERE user_id = $1", [req.params.id]
    );
    res.json(result.rows.length > 0 ? result.rows[0] : { message: "User not found" });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/add_user", async (req, res) => {
  const { firstName, middleName, lastName, email, contactNo, role, gender, profileImage, creatorId } = req.body;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const dup = await checkUserDuplicate(email, contactNo);
    if (dup.conflict) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: dup.message });
    }

    const creatorRes = await client.query("SELECT is_head_admin FROM userlogin WHERE user_id = $1", [creatorId]);
    const isHeadAdminCreator = creatorRes.rows[0]?.is_head_admin || false;

    const pRes = await client.query(
      `INSERT INTO personaldata (firstname, middlename, lastname, email, contact_no, gender, profile_image, status) VALUES ($1,$2,$3,$4,$5,$6,$7,'Active') RETURNING user_id`,
      [firstName, middleName || '', lastName, email, contactNo, gender, profileImage]
    );

    const needsApproval = role === 'Admin' && !isHeadAdminCreator;
    const hashedPassword = needsApproval ? null : await bcrypt.hash("password123", 10);

    await client.query(
      `INSERT INTO userlogin (user_account, password, user_role, user_id, failed_attempts, is_locked, is_default_password, is_approved, is_head_admin) 
       VALUES ($1,$2,$3,$4,0,FALSE,$5,$6,FALSE)`,
      [email, hashedPassword, role, pRes.rows[0].user_id, !needsApproval, !needsApproval]
    );

    await client.query("COMMIT");
    io.emit("users:updated");

    if (needsApproval) {
      await transporter.sendMail({
        from: process.env.MY_EMAIL,
        to: email,
        subject: "Admin Account Pending Approval - Matthew & Melka",
        html: `<h3>Admin Account Request Received</h3>
               <p>Hi ${firstName}, your Admin account has been submitted for approval.</p>
               <p>You will receive your login credentials once the Head Admin approves your account.</p>
               <p>Please wait for further notification.</p>`
      });
      return res.status(201).send("Admin created and pending approval");
    }

    await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Welcome to Matthew & Melka",
      html: `<h3>Account Created!</h3>
             <p>Hi ${firstName}, use these credentials:</p>
             <p>User: ${email}<br>Pass: password123</p>
             <p>You will be required to change your password upon first login.</p>`
    });

    res.status(201).send("User created successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.put("/api/user/update", async (req, res) => {
  const { firstName, middleName, lastName, email, contactNo, role, gender, profileImage, originalEmail } = req.body;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");

    const userRes = await client.query(
      "SELECT user_id FROM personaldata WHERE LOWER(email) = LOWER($1)",
      [originalEmail || email]
    );
    const userId = userRes.rows[0]?.user_id;

    const userCheck = await client.query(
      `SELECT 1 FROM personaldata WHERE (LOWER(email) = LOWER($1) OR contact_no = $2) AND user_id != $3`,
      [email, contactNo, userId]
    );
    if (userCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: 'Email or contact is already used by a System User.' });
    }

    const artisanCheck = await client.query(
      `SELECT 1 FROM artisan WHERE LOWER(email) = LOWER($1) OR contact_no = $2`,
      [email, contactNo]
    );
    if (artisanCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: 'Email or contact is already used by an Artisan.' });
    }

    const supplierCheck = await client.query(
      `SELECT 1 FROM supplier WHERE LOWER(email) = LOWER($1) OR contact_no = $2`,
      [email, contactNo]
    );
    if (supplierCheck.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: 'Email or contact is already used by a Supplier.' });
    }

    await client.query(
      'UPDATE personaldata SET firstname=$1, middlename=$2, lastname=$3, contact_no=$4, gender=$5, profile_image=$6 WHERE email=$7',
      [firstName, middleName || '', lastName, contactNo, gender, profileImage, originalEmail || email]
    );
    await client.query('UPDATE userlogin SET user_role=$1 WHERE user_account=$2', [role, originalEmail || email]);
    await client.query("COMMIT");
    io.emit("users:updated");
    res.send("Update successful");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.put("/api/user/status", async (req, res) => {
  const { userId, status, adminId, adminRole } = req.body;
  try {
    const adminCheck = await getPool().query('SELECT is_head_admin FROM userlogin WHERE user_id = $1', [adminId]);
    if (!adminCheck.rows[0]?.is_head_admin) {
      return res.status(403).json({ message: 'Only the Head Admin can deactivate accounts.' });
    }
    if (String(userId) === String(adminId)) return res.status(400).json({ message: 'You cannot deactivate your own account.' });
    await getPool().query('UPDATE personaldata SET status = $1 WHERE user_id = $2', [status, userId]);
    await createAuditLog(adminId, `User ${status}: ID ${userId}`, adminRole);
    io.emit("users:updated");
    res.send(`User status updated to ${status}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/api/admin/approve", async (req, res) => {
  const { userId, adminId } = req.body;
  const client = await getPool().connect();
  try {
    const adminCheck = await client.query('SELECT is_head_admin FROM userlogin WHERE user_id = $1', [adminId]);
    if (!adminCheck.rows[0]?.is_head_admin) {
      return res.status(403).json({ message: 'Only the Head Admin can approve Admin accounts.' });
    }

    const userRes = await client.query(
      `SELECT p.firstname, p.email, u.user_account 
       FROM personaldata p 
       JOIN userlogin u ON p.user_id = u.user_id 
       WHERE p.user_id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const { firstname, email } = userRes.rows[0];
    const hashedPassword = await bcrypt.hash("password123", 10);

    await client.query('BEGIN');
    await client.query(
      'UPDATE userlogin SET is_approved = TRUE, password = $1, is_default_password = TRUE WHERE user_id = $2',
      [hashedPassword, userId]
    );
    await createAuditLog(adminId, `Approved Admin Account: ID ${userId}`, 'Head Admin');
    await client.query('COMMIT');

    io.emit("users:updated");

    await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Admin Account Approved - Matthew & Melka",
      html: `<h3>Your Admin Account Has Been Approved!</h3>
             <p>Hi ${firstname}, your Admin account has been approved by the Head Admin.</p>
             <p>You can now log in using the following credentials:</p>
             <p><strong>Username:</strong> ${email}<br><strong>Password:</strong> password123</p>
             <p>You will be required to change your password upon first login.</p>`
    });

    res.send("Admin account approved and credentials sent");
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.delete("/api/admin/reject/:id", async (req, res) => {
  const userId = req.params.id;
  const { adminId } = req.body;
  const client = await getPool().connect();

  try {
    const adminCheck = await client.query(
      'SELECT is_head_admin FROM userlogin WHERE user_id = $1',
      [adminId]
    );

    if (!adminCheck.rows[0]?.is_head_admin) {
      return res.status(403).json({ message: 'Only the Head Admin can reject Admin accounts.' });
    }

    const userCheck = await client.query(
      'SELECT firstname, lastname FROM personaldata WHERE user_id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const targetName = `${userCheck.rows[0].firstname} ${userCheck.rows[0].lastname}`;

    await client.query('BEGIN');
    await client.query('DELETE FROM userlogin WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM personaldata WHERE user_id = $1', [userId]);
    await createAuditLog(adminId, `Rejected Admin Request: ${targetName} (ID ${userId})`, 'Head Admin');
    await client.query('COMMIT');

    io.emit("users:updated");
    res.send("Admin account request rejected and deleted successfully.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.put("/api/user/unlock", async (req, res) => {
  const { userId, adminId } = req.body;
  try {
    await getPool().query('UPDATE userlogin SET is_locked = FALSE, failed_attempts = 0 WHERE user_id = $1', [userId]);
    const adminRes = await getPool().query('SELECT user_role FROM userlogin WHERE user_id = $1', [adminId]);
    await createAuditLog(adminId, `Unlocked User: ID ${userId}`, adminRes.rows[0]?.user_role || 'Admin');
    io.emit("users:updated");
    res.send("User account unlocked");
  } catch (err) {
    res.status(500).send(err.message);
  }
});
app.get("/api/artisans", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 9 } = req.query;
    const offset = (page - 1) * limit;
    const result = await getPool().query(`
      SELECT *, COUNT(*) OVER() as total_count FROM artisan
      WHERE (
        first_name ILIKE $1
        OR middle_name ILIKE $1
        OR last_name ILIKE $1
        OR CONCAT('AR-', artisan_id) ILIKE $1
        OR CONCAT(first_name, ' ', last_name) ILIKE $1
        OR CONCAT(first_name, ' ', middle_name, ' ', last_name) ILIKE $1
      )
      ORDER BY CASE WHEN status='Active' THEN 1 WHEN status='Deactivated' THEN 2 ELSE 3 END ASC, artisan_id DESC
      LIMIT $2 OFFSET $3`, [`%${search}%`, limit, offset]);
    res.json({ artisans: result.rows, totalArtisans: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0 });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/add_artisan", async (req, res) => {
  const { first_name, middle_name, last_name, email, contact_no, department, profile_image } = req.body;
  try {
    const dup = await checkArtisanDuplicate(email, contact_no);
    if (dup.conflict) return res.status(400).json({ message: dup.message });

    const result = await getPool().query(
      `INSERT INTO artisan (first_name, middle_name, last_name, email, contact_no, profile_image, department, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active') RETURNING *`,
      [first_name, middle_name || '', last_name, email, contact_no, profile_image, department]
    );
    io.emit("artisans:updated");
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Server Error: " + err.message);
  }
});

app.put("/api/artisans/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, middle_name, last_name, email, contact_no, profile_image, department, status } = req.body;
  try {
    const dup = await checkArtisanDuplicate(email, contact_no, id);
    if (dup.conflict) return res.status(400).json({ message: dup.message });

    const result = await getPool().query(
      `UPDATE artisan SET first_name=$1, middle_name=$2, last_name=$3, email=$4, contact_no=$5, profile_image=$6, department=$7, status=$8 WHERE artisan_id=$9 RETURNING *`,
      [first_name, middle_name, last_name, email, contact_no, profile_image, department, status, id]
    );
    io.emit("artisans:updated");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/artisan/status", async (req, res) => {
  const { email, status } = req.body;
  try {
    const result = await getPool().query("UPDATE artisan SET status = $1 WHERE email = $2", [status, email]);
    if (result.rowCount === 0) return res.status(404).send("Artisan not found with that email.");
    io.emit("artisans:updated");
    res.status(200).send(`Artisan status updated to ${status}`);
  } catch (err) {
    res.status(500).send("Database error: " + err.message);
  }
});

app.get("/api/suppliers", async (req, res) => {
  try {
    const result = await getPool().query('SELECT * FROM supplier ORDER BY supplier_id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/add_supplier", async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const dup = await checkSupplierDuplicate(email, phone);
    if (dup.conflict) return res.status(400).json({ message: dup.message });

    await getPool().query("INSERT INTO Supplier (name, contact_no, email, status) VALUES ($1,$2,$3, 'Active')", [name, phone, email]);
    io.emit("suppliers:updated");
    res.status(201).send("Success");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, contact_no } = req.body;
  try {
    const dup = await checkSupplierDuplicate(email, contact_no, id);
    if (dup.conflict) return res.status(400).json({ message: dup.message });

    const result = await getPool().query(
      "UPDATE supplier SET name=$1, email=$2, contact_no=$3 WHERE supplier_id=$4 RETURNING *",
      [name, email, contact_no, id]
    );
    io.emit("suppliers:updated");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.patch("/api/suppliers/status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await getPool().query('UPDATE supplier SET status = $1 WHERE supplier_id = $2', [status, id]);
    io.emit("suppliers:updated");
    res.status(200).send("Status updated");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/supplier/orders/:id", async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT order_id, product_name, total_value, status FROM orders WHERE supplier_id = $1 ORDER BY order_id DESC`, [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/audit_logs", async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT l.log_id, l.user_id, l.action, l.role, l.timestamp,
        COALESCE(
        (SELECT TRIM(CONCAT_WS(' ', firstname, NULLIF(TRIM(middlename), ''), lastname)) FROM personaldata WHERE user_id = l.user_id),
        (SELECT TRIM(CONCAT_WS(' ', first_name, NULLIF(TRIM(middle_name), ''), last_name)) FROM artisan WHERE artisan_id = l.user_id)
      ) as merged_name
      FROM audit_logs l ORDER BY l.timestamp DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/audit_logs", async (req, res) => {
  try {
    const { user_id, action } = req.body; 

    const userResult = await getPool().query(
      "SELECT user_role FROM userlogin WHERE user_id = $1",
      [user_id]
    );
    const userRole = userResult.rows[0]?.user_role || 'User';

    const result = await getPool().query(
      `INSERT INTO audit_logs (user_id, action, role, timestamp) 
       VALUES ($1, $2, $3, NOW()) 
       RETURNING *`,
      [user_id, action, userRole]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ─────────────────────────────────────────────
// SALES
// ─────────────────────────────────────────────

app.get("/api/products", async (req, res) => {
  try {
    const { search = "" } = req.query;
    const result = await getPool().query(
      `SELECT * FROM FinishedGoods WHERE sku ILIKE $1 OR name ILIKE $1 OR collection ILIKE $1 OR brand ILIKE $1 ORDER BY sku ASC`,
      [`%${search}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/products/unique-list", async (req, res) => {
  try {
    const result = await dbQuery(
      "SELECT sku, name, collection, brand, base_cost, selling_price, current_stock, status, product_image FROM FinishedGoods ORDER BY sku ASC",
      [], 'finishedgoods'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/api/products/:sku", async (req, res) => {
  const { sku } = req.params;
  const { name, collection, brand, selling_price, product_image, location, category, quantity, min_stocks, stock_unit } = req.body;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE FinishedGoods SET name=$1, collection=$2, brand=$3, selling_price=$4, product_image=$5, warehouse_location=$6, category=$7, current_stock=$8, min_stocks=$9, stock_unit=$10 WHERE sku=$11`,
      [name, collection, brand, selling_price, product_image, location, category, quantity, min_stocks || 0, stock_unit || null, sku]
    );
    if (parseInt(quantity) <= parseInt(min_stocks || 0)) {
      const existingRequest = await client.query(
        `SELECT work_order_id FROM workorder WHERE sku = $1 AND status IN ('Pending', 'In Production') LIMIT 1`, [sku]
      );
      if (existingRequest.rowCount === 0) {
        await client.query(
          `INSERT INTO workorder (sku, quantity_needed, category, status, target_date) VALUES ($1,$2,$3,'Pending',CURRENT_DATE + INTERVAL '7 days')`,
          [sku, (parseInt(min_stocks) || 5) * 2, category]
        );
      }
    }
    await client.query("COMMIT");
    io.emit("products:updated");
    io.emit("work_orders:updated");
    res.status(200).send("Product updated and demand check complete");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send("Database Error: " + err.message);
  } finally {
    client.release();
  }
});

app.post("/api/sales_Add_inventory", async (req, res) => {
  const { sku, name, location, quantity, selling_price, product_image, collection, brand, category, min_stocks, stock_unit } = req.body;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO FinishedGoods (sku, name, collection, brand, selling_price, product_image, current_stock, warehouse_location, category, min_stocks, stock_unit)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (sku) DO UPDATE SET
         name=EXCLUDED.name,
         category=EXCLUDED.category,
         min_stocks=EXCLUDED.min_stocks,
         current_stock=FinishedGoods.current_stock+EXCLUDED.current_stock,
         stock_unit=EXCLUDED.stock_unit`,
      [sku, name, collection, brand || '', selling_price || 0, product_image, quantity || 0, location, category, min_stocks || 0, stock_unit || null]
    );
    const warehouseRes = await client.query("SELECT warehouse_id FROM Warehouse WHERE name = $1 LIMIT 1", [location]);
    if (warehouseRes.rows.length === 0) throw new Error(`Warehouse location '${location}' not found.`);
    await client.query(
      `INSERT INTO WarehouseInventory (warehouse_id, sku, quantity) VALUES ($1,$2,$3)
       ON CONFLICT (warehouse_id, sku) DO UPDATE SET quantity=WarehouseInventory.quantity+EXCLUDED.quantity`,
      [warehouseRes.rows[0].warehouse_id, sku, quantity || 0]
    );
    await client.query("COMMIT");
    io.emit("products:updated");
    io.emit("warehouses:updated");
    res.status(200).send("Success");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send("Database Error: " + err.message);
  } finally {
    client.release();
  }
});

app.get("/api/warehouses", async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT w.warehouse_id, w.name, w.location, w.capacity_total, w.manager_name,
        (SELECT COUNT(DISTINCT sku) FROM WarehouseInventory WHERE warehouse_id = w.warehouse_id) as product_types,
        COALESCE((SELECT SUM(quantity) FROM WarehouseInventory WHERE warehouse_id = w.warehouse_id), 0) as current_utilization,
        (SELECT COUNT(*) FROM FinishedGoods fg JOIN WarehouseInventory wi ON fg.sku = wi.sku WHERE wi.warehouse_id = w.warehouse_id AND wi.quantity <= fg.min_stocks) as low_stock_count
      FROM Warehouse w ORDER BY w.name ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/warehouses/all", async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT w.*,
        (SELECT COUNT(DISTINCT sku) FROM WarehouseInventory WHERE warehouse_id = w.warehouse_id) as product_types,
        (SELECT SUM(quantity) FROM WarehouseInventory WHERE warehouse_id = w.warehouse_id) as current_utilization
      FROM Warehouse w ORDER BY w.warehouse_id ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/warehouses/add", async (req, res) => {
  const { name, location, capacity, manager } = req.body;
  try {
    await getPool().query("INSERT INTO Warehouse (name, location, capacity_total, manager_name) VALUES ($1,$2,$3,$4)", [name, location, capacity, manager]);
    io.emit("warehouses:updated");
    res.status(201).send("Warehouse added successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/api/warehouses/:id", async (req, res) => {
  const { id } = req.params;
  const { name, location, capacity_total, manager_name } = req.body;
  try {
    await getPool().query("UPDATE Warehouse SET name=$1, location=$2, capacity_total=$3, manager_name=$4 WHERE warehouse_id=$5", [name, location, capacity_total, manager_name, id]);
    io.emit("warehouses:updated");
    res.status(200).send("Warehouse updated successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/warehouses/:id/inventory", async (req, res) => {
  try {
    const result = await getPool().query(
      `SELECT m.* FROM material m JOIN warehouseinventory wi ON m.material_id = wi.material_id WHERE wi.warehouse_id = $1 ORDER BY m.material_name ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sales_orders", async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT so.*, fg.name AS product_name, fg.selling_price, fg.product_image,
        (so.quantity * fg.selling_price) AS total_amount
      FROM sales_orders so
      LEFT JOIN finishedgoods fg ON so.sku = fg.sku
      ORDER BY so.order_id DESC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/sales_orders", async (req, res) => {
  const { client_name, platform, courier, sku, quantity, order_date, user_id } = req.body;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const stockRes = await client.query("SELECT current_stock, name, selling_price FROM finishedgoods WHERE sku = $1", [sku]);
    if (stockRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Product not found." });
    }
    const currentStock = Number(stockRes.rows[0].current_stock);
    const orderedQty = Number(quantity);
    if (orderedQty > currentStock) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: `Insufficient stock. Available: ${currentStock} units.` });
    }
    const orderRes = await client.query(
      `INSERT INTO sales_orders (client_name, platform, courier, sku, quantity, order_date, status, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, 'Pending', $7) RETURNING *`,
      [client_name, platform, courier, sku, orderedQty, order_date, user_id]
    );
    await client.query("UPDATE finishedgoods SET current_stock = current_stock - $1 WHERE sku = $2", [orderedQty, sku]);
    const totalAmount = orderedQty * Number(stockRes.rows[0].selling_price);
    await createTransaction(client, {
      ref: `SL-${orderRes.rows[0].order_id}`,
      type: 'Revenue',
      category: 'Product Sale',
      desc: `Sale of ${stockRes.rows[0].name} (${orderedQty} units)`,
      amount: totalAmount,
      status: 'Completed',
      sourceTable: 'sales_orders',
      sourceId: orderRes.rows[0].order_id,
      userId: user_id
    });
    await client.query("COMMIT");
    io.emit("sales_orders:updated");
    io.emit("products:updated");
    io.emit("transactions:updated");
    res.status(201).json(orderRes.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.patch("/api/sales_orders/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, user_id } = req.body;
  const validStatuses = ["Pending", "Shipped", "Delivered"];

  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE sales_orders SET status = $1 WHERE order_id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Order not found." });
    }

    const order = result.rows[0];

    if (status === "Delivered") {
      const productRes = await client.query(
        "SELECT name, selling_price FROM finishedgoods WHERE sku = $1",
        [order.sku]
      );
      
      const productName = productRes.rows[0]?.name || "Product";
      const sellingPrice = productRes.rows[0]?.selling_price || 0;
      const totalRevenue = order.quantity * sellingPrice;

      await client.query(
        `INSERT INTO transactions (
          reference_no, transaction_type, category, description, 
          amount, status, source_table, source_id, user_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          `SO-${id}`,
          'Revenue',
          'Product Sale',
          `Sold ${order.quantity} units of ${productName}`,
          totalRevenue,
          'Completed',
          'sales_orders',
          id,
          user_id || order.user_id
        ]
      );
    }

    await client.query("COMMIT");
    io.emit("sales_orders:updated");
    io.emit("transactions:updated");

    res.json(result.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────
// FINANCE
// ─────────────────────────────────────────────

app.get("/api/all_orders", async (req, res) => {
  try {
    const result = await dbQuery(`
      SELECT po.*, po.assignment_id AS purchase_order_id,
        COALESCE(s.name, 'Unknown Supplier') AS supplier_name,
        COALESCE(m.material_name, 'Unknown Material') AS material_name,
        COALESCE(CONCAT(p.firstname, ' ', p.lastname), 'Unknown Requisitioner') AS requisitioner_name,
        COALESCE(po.total_amount, po.ordered_quantity * m.cost_per_unit) AS total_amount
      FROM purchaseorder po
      LEFT JOIN supplier s ON po.supplier_id = s.supplier_id
      LEFT JOIN material m ON po.material_id = m.material_id
      LEFT JOIN personaldata p ON po.user_id = p.user_id
      ORDER BY po.assignment_id DESC`, [], 'all_orders');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/create_order", async (req, res) => {
  const { supplier_id, material_id, ordered_quantity, expected_delivery, user_id, status } = req.body;
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const matRes = await client.query(
      "SELECT cost_per_unit, material_name FROM material WHERE material_id = $1", 
      [material_id]
    );
    
    const costPerUnit = matRes.rows.length > 0 ? Number(matRes.rows[0].cost_per_unit) : 0;
    const materialName = matRes.rows[0]?.material_name || "Material";
    const computedTotal = costPerUnit * parseInt(ordered_quantity || 0);

    const newOrder = await client.query(
      `INSERT INTO purchaseorder (supplier_id, material_id, ordered_quantity, total_amount, expected_delivery, user_id, status, order_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [supplier_id, material_id, ordered_quantity, computedTotal, expected_delivery, user_id, status || 'Pending']
    );

    const poId = newOrder.rows[0].assignment_id;

    await client.query(
      `INSERT INTO transactions (reference_no, transaction_type, category, description, amount, status, source_table, source_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        `PO-${poId}`, 
        'Expense', 
        'Material Procurement', 
        `Purchase of ${materialName} (${ordered_quantity} units)`, 
        computedTotal, 
        'Pending', 
        'purchaseorder', 
        poId, 
        user_id
      ]
    );

    await client.query("COMMIT");
    io.emit("purchase_orders:updated");
    io.emit("transactions:updated");
    res.json(newOrder.rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.put("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { supplier_id, material_id, ordered_quantity, expected_delivery, status } = req.body;
  try {
    const matRes = await getPool().query('SELECT cost_per_unit FROM material WHERE material_id = $1', [material_id]);
    const costPerUnit = matRes.rows.length > 0 ? Number(matRes.rows[0].cost_per_unit) : 0;
    const computedTotal = costPerUnit * parseInt(ordered_quantity || 0);
    const result = await getPool().query(
      `UPDATE purchaseorder SET supplier_id=$1, material_id=$2, ordered_quantity=$3, total_amount=$4, expected_delivery=$5, status=$6 WHERE assignment_id=$7 RETURNING *`,
      [supplier_id, material_id, ordered_quantity, computedTotal, expected_delivery, status, id]
    );
    io.emit("purchase_orders:updated");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.patch("/api/orders/receive/:id", async (req, res) => {
  const { id } = req.params;
  const client = await getPool().connect();
  try {
    const order = await client.query("SELECT * FROM purchaseorder WHERE assignment_id = $1", [id]);
    
    if (order.rows.length === 0) return res.status(404).send("Order not found.");
    if (order.rows[0].status === 'Delivered') return res.status(400).send("Order already received.");

    await client.query("BEGIN");

    await client.query("UPDATE purchaseorder SET status = 'Delivered' WHERE assignment_id = $1", [id]);

    await client.query(
      "UPDATE material SET stock_quantity = stock_quantity + $1 WHERE material_id = $2", 
      [order.rows[0].ordered_quantity, order.rows[0].material_id]
    );

    await client.query(
      "UPDATE transactions SET status = 'Completed' WHERE source_id = $1 AND source_table = 'purchaseorder'", 
      [id]
    );

    await client.query("COMMIT");

    io.emit("purchase_orders:updated");
    io.emit("materials:updated");
    io.emit("transactions:updated");

    res.send("Inventory and Ledger updated successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.patch("/api/transactions/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      "UPDATE transactions SET status = $1 WHERE transaction_id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Transaction not found." });
    }

    const tx = result.rows[0];

    if (status === "Cancelled" && tx.source_table && tx.source_id) {
      if (tx.source_table === 'purchaseorder') {
        await client.query(
          "UPDATE purchaseorder SET status = 'Cancelled' WHERE assignment_id = $1",
          [tx.source_id]
        );
      } else if (tx.source_table === 'sales_orders') {
        await client.query(
          "UPDATE sales_orders SET status = 'Cancelled' WHERE order_id = $1",
          [tx.source_id]
        );
      }
    }

    await client.query("COMMIT");

    io.emit("transactions:updated");
    io.emit("purchase_orders:updated");
    io.emit("sales_orders:updated");

    res.json(tx);
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    client.release();
  }
});

app.post("/api/procurement/approve/:id", async (req, res) => {
  const { id } = req.params;
  const { finance_id } = req.body;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const reqData = await client.query(
      "UPDATE procurement_requests SET status = 'Approved', approved_by = $1 WHERE request_id = $2 RETURNING *", [finance_id, id]
    );
    const { material_id, requested_qty } = reqData.rows[0];
    await client.query("UPDATE material SET stock_quantity = stock_quantity + $1 WHERE material_id = $2", [requested_qty, material_id]);
    await client.query("COMMIT");
    io.emit("purchase_orders:updated");
    io.emit("materials:updated");
    res.send("Material stock updated via Finance approval.");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.get("/api/variance_logs", async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT
        mvl.varlog_id AS log_id,
        mvl.work_order_id, mvl.material_id, mvl.artisan_id,
        mvl.expected_qty, mvl.actual_qty, mvl.variance, mvl.recorded_at AS timestamp,
        m.material_name, m.stock_quantity AS current_stock, m.reorder_threshold,
        CASE WHEN m.stock_quantity <= m.reorder_threshold THEN true ELSE false END AS is_low_stock,
        COALESCE(
          (SELECT firstname || ' ' || lastname FROM personaldata WHERE user_id = mvl.artisan_id),
          (SELECT first_name || ' ' || last_name FROM artisan WHERE artisan_id = mvl.artisan_id),
          'Unknown'
        ) AS merged_name
      FROM material_variance_logs mvl
      LEFT JOIN material m ON mvl.material_id = m.material_id
      ORDER BY mvl.recorded_at DESC`);
    res.json(result.rows);
  } catch (err) {
    console.error("variance_logs error:", err.message);
    res.status(500).send(err.message);
  }
});

app.get("/api/low_stock_logs", async (req, res) => {
  try {
    const materials = await getPool().query(`
      SELECT m.material_id, m.material_name, m.stock_quantity, m.reorder_threshold,
        m.unique_code, 'raw_material' AS item_type, NULL AS sku, NOW() AS timestamp
      FROM material m WHERE m.stock_quantity <= m.reorder_threshold
      UNION ALL
      SELECT NULL AS material_id, fg.name AS material_name, fg.current_stock AS stock_quantity,
        fg.min_stocks AS reorder_threshold, fg.sku AS unique_code,
        'finished_good' AS item_type, fg.sku, NOW() AS timestamp
      FROM finishedgoods fg WHERE fg.current_stock <= fg.min_stocks
      ORDER BY stock_quantity ASC`);
    res.json(materials.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/finance/transactions", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const offset = (page - 1) * limit;
        const { search, type, month, year } = req.query;

        let conditions = ["1=1"];
        let params = [];
        let i = 1;

        if (search) {
            conditions.push(`(t.reference_no ILIKE $${i} OR t.description ILIKE $${i} OR t.category ILIKE $${i})`);
            params.push(`%${search}%`);
            i++;
        }
        if (type && type !== 'All') {
            conditions.push(`t.transaction_type = $${i}`);
            params.push(type);
            i++;
        }
        if (year) {
            conditions.push(`EXTRACT(YEAR FROM t.transaction_date) = $${i}`);
            params.push(parseInt(year));
            i++;
        }
        if (month) {
            conditions.push(`EXTRACT(MONTH FROM t.transaction_date) = $${i}`);
            params.push(parseInt(month));
            i++;
        }

        const dataParams = [...params, limit, offset];
        const query = `
            SELECT t.*, p.firstname, p.lastname, COUNT(*) OVER() AS total_count
            FROM transactions t
            LEFT JOIN personaldata p ON t.user_id = p.user_id
            WHERE ${conditions.join(" AND ")}
            ORDER BY t.transaction_date DESC
            LIMIT $${i} OFFSET $${i+1}
        `;

        const result = await getPool().query(query, dataParams);
        
        const stats = await getPool().query(`
            SELECT 
                COALESCE(SUM(CASE WHEN transaction_type = 'Revenue' THEN amount ELSE 0 END), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN transaction_type = 'Expense' THEN amount ELSE 0 END), 0) as total_expense
            FROM transactions 
            WHERE status = 'Completed'
        `);

        res.json({
            transactions: result.rows,
            total: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0,
            stats: stats.rows[0]
        });
    } catch (err) {
        console.error("Finance API Error:", err.message);
        res.status(500).send(err.message);
    }
});

app.patch("/api/purchase_orders/:id/verify", async (req, res) => {
    const poId = req.params.id;
    const { adminId, amount, supplierName } = req.body;
    const client = await getPool().connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE purchaseorder SET status = $1 WHERE assignment_id = $2', ['Paid', poId]);
        await createTransaction(client, {
            ref: `PO-${poId}`,
            type: 'Expense',
            category: 'Material Procurement',
            desc: `Payment to ${supplierName}`,
            amount: amount,
            status: 'Completed',
            sourceTable: 'purchaseorder',
            sourceId: poId,
            userId: adminId
        });
        await client.query('COMMIT');
        io.emit("transactions:updated");
        res.send("Transaction recorded");
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).send(err.message);
    } finally { client.release(); }
});

// ─────────────────────────────────────────────
// PRODUCTION
// ─────────────────────────────────────────────

app.get("/api/materials", async (req, res) => {
  try {
    const result = await dbQuery(`
      SELECT m.*, s.name as supplier_name FROM material m
      LEFT JOIN supplier s ON m.supplier_id = s.supplier_id
      ORDER BY m.material_id DESC`, [], 'materials');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/add_material", async (req, res) => {
  const { unique_code, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image, material_name, stock_unit } = req.body;
  try {
    const result = await getPool().query(
      `INSERT INTO material (unique_code, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image, material_name, stock_unit) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [unique_code, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image, material_name, stock_unit || null]
    );
    io.emit("materials:updated");
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

app.put("/api/materials/:id", async (req, res) => {
  const { id } = req.params;
  const { material_name, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image, stock_unit } = req.body;
  try {
    const result = await getPool().query(
      `UPDATE material SET material_name=$1, supplier_id=$2, cost_per_unit=$3, stock_quantity=$4, reorder_threshold=$5, material_image=$6, stock_unit=$7 WHERE material_id=$8 RETURNING *`,
      [material_name, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image, stock_unit || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Material not found" });
    io.emit("materials:updated");
    res.json({ success: true, message: "Material updated!", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Server error during update: " + err.message });
  }
});

app.get("/api/finished_goods", async (req, res) => {
  try {
    const result = await dbQuery(
      `SELECT sku, name, collection, brand, work_order_id, product_image,
              current_stock, min_stocks, selling_price, category, warehouse_location, stock_unit
       FROM finishedgoods ORDER BY sku ASC`,
      [], 'finishedgoods_full'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/artisan_work_orders", async (req, res) => {
  try {
    const result = await dbQuery(`
      SELECT wo.*, COALESCE(wo.product_image, fg.product_image) AS product_image,
        a.first_name, a.last_name, a.department, a.email, a.contact_no, a.profile_image as artisan_image
      FROM workorder wo
      LEFT JOIN artisan a ON wo.artisan_id = a.artisan_id
      LEFT JOIN finishedgoods fg ON wo.sku = fg.sku
      ORDER BY wo.work_order_id DESC`, [], 'work_orders');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/artisan_work_orders", async (req, res) => {
  const { sku, quantity_needed, status, product_image, category } = req.body;
  try {
    const existing = await getPool().query(
      `SELECT work_order_id FROM workorder WHERE sku = $1 AND status IN ('Pending', 'In Production') LIMIT 1`, [sku]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({ message: "Active work order already exists.", work_order_id: existing.rows[0].work_order_id });
    }
    const result = await getPool().query(
      `INSERT INTO workorder (sku, quantity_needed, category, status, product_image, target_date) VALUES ($1,$2,$3,'Pending',$4,CURRENT_DATE + INTERVAL '7 days') RETURNING work_order_id`,
      [sku, quantity_needed || 1, category || null, product_image || null]
    );
    io.emit("work_orders:updated");
    res.status(201).json({ success: true, work_order_id: result.rows[0].work_order_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/work_orders/trigger", async (req, res) => {
  const { sku, quantity_needed, category } = req.body;
  try {
    const existing = await getPool().query(
      `SELECT work_order_id FROM workorder WHERE sku = $1 AND status IN ('Pending', 'In Production', 'Quality Control') LIMIT 1`, [sku]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({ message: "Active work order already exists.", work_order_id: existing.rows[0].work_order_id });
    }
    const result = await getPool().query(
      `INSERT INTO workorder (sku, quantity_needed, category, status, target_date) VALUES ($1,$2,$3,'Pending',CURRENT_DATE + INTERVAL '7 days') RETURNING work_order_id`,
      [sku, quantity_needed || 10, category || null]
    );
    io.emit("work_orders:updated");
    res.status(201).json({ message: "Work order created successfully.", work_order_id: result.rows[0].work_order_id });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/work_orders", async (req, res) => {
  const { sku, quantity, target_date, artisan_id, status, total_cost, selectedMaterials } = req.body;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO workorder (sku, quantity_needed, status, target_date, artisan_id, total_cost) VALUES ($1,$2,$3,$4,$5,$6) RETURNING work_order_id`,
      [sku, parseInt(quantity), status || 'In Production', target_date, parseInt(artisan_id), parseFloat(total_cost)]
    );
    const newOrderId = result.rows[0].work_order_id;
    if (selectedMaterials && selectedMaterials.length > 0) {
      for (const mat of selectedMaterials) {
        const matId = parseInt(mat.material_id);
        const qtyToUse = parseInt(mat.qty);
        const subtotal = Number(mat.total) || (qtyToUse * (Number(mat.cost) || 0));
        await client.query(
          `INSERT INTO work_order_materials (work_order_id, material_id, material_qty, subtotal) VALUES ($1,$2,$3,$4)`,
          [newOrderId, matId, qtyToUse, subtotal]
        );
        const checkStock = await client.query(
          "UPDATE material SET stock_quantity = stock_quantity - $1 WHERE material_id = $2 AND stock_quantity >= $1 RETURNING stock_quantity",
          [qtyToUse, matId]
        );
        if (checkStock.rows.length === 0) throw new Error(`Insufficient stock for Material ID: ${matId}`);
      }
    }
    await client.query('COMMIT');
    io.emit("work_orders:updated");
    io.emit("materials:updated");
    res.status(201).json({ success: true, work_order_id: newOrderId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/work_order_materials/:id', async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT m.material_id, m.material_name, m.cost_per_unit, wom.material_qty, wom.subtotal
      FROM work_order_materials wom
      JOIN material m ON wom.material_id = m.material_id
      WHERE wom.work_order_id = $1`, [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/work_orders/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { actualMaterials = [] } = req.body;
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');

    const woResult = await client.query(
      'SELECT sku, quantity_needed, artisan_id, status, total_cost FROM workorder WHERE work_order_id = $1',
      [id]
    );

    if (woResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Work order not found.' });
    }

    if (woResult.rows[0].status === 'Complete') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Work order is already completed.' });
    }

    const { sku, quantity_needed, artisan_id, total_cost } = woResult.rows[0];

    const userRes = await client.query(
      'SELECT user_id FROM userlogin WHERE user_id = (SELECT user_id FROM personaldata LIMIT 1) LIMIT 1'
    );
    const fallbackUserId = userRes.rows[0]?.user_id || null;

    await client.query(
      `UPDATE workorder SET status = 'Complete' WHERE work_order_id = $1`,
      [id]
    );

    for (const mat of actualMaterials) {
      const { material_id, expected_qty, actual_qty } = mat;
      const variance = Number(actual_qty) - Number(expected_qty);

      await client.query(
        `UPDATE work_order_materials
         SET actual_qty_used = $1, variance_qty = $2
         WHERE work_order_id = $3 AND material_id = $4`,
        [actual_qty, variance, id, material_id]
      );

      if (variance !== 0) {
        await client.query(
          `UPDATE material SET stock_quantity = stock_quantity - $1 WHERE material_id = $2`,
          [variance, material_id]
        );
      }

      await client.query(
        `INSERT INTO material_variance_logs
           (work_order_id, material_id, artisan_id, expected_qty, actual_qty, variance, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (work_order_id, material_id) DO UPDATE SET
           actual_qty  = EXCLUDED.actual_qty,
           variance    = EXCLUDED.variance,
           recorded_at = NOW()`,
        [id, material_id, artisan_id, expected_qty, actual_qty, variance]
      );
    }

    await client.query(
      `UPDATE finishedgoods SET current_stock = current_stock + $1 WHERE sku = $2`,
      [quantity_needed, sku]
    );

    if (total_cost > 0) {
      await createTransaction(client, {
        ref: `WO-${id}`,
        type: 'Expense',
        category: 'Labor Pay',
        desc: `Production labor for Work Order #${id}`,
        amount: total_cost,
        status: 'Pending',
        sourceTable: 'workorder',
        sourceId: id,
        userId: fallbackUserId
      });
    }

    await client.query('COMMIT');

    io.emit('work_orders:updated');
    io.emit('materials:updated');
    io.emit('products:updated');
    io.emit('transactions:updated');

    res.json({ message: 'Work order completed, variance logged, stock updated.' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/work_orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status, artisan_id, quantity, sku, target_date, selectedMaterials, product_image } = req.body;

  const parsedArtisanId = artisan_id ? parseInt(artisan_id) : null;

  const rawList = selectedMaterials || [];
  const materialsMap = new Map();

  for (const m of rawList) {
    const matId = parseInt(m.material_id);
    if (!matId) continue;

    if (materialsMap.has(matId)) {
      const existing = materialsMap.get(matId);
      existing.qty += Number(m.qty) || 0;
      existing.total = existing.qty * existing.cost;
    } else {
      materialsMap.set(matId, {
        material_id: matId,
        qty: Number(m.qty) || 0,
        cost: Number(m.cost) || 0,
        total: (Number(m.qty) || 0) * (Number(m.cost) || 0)
      });
    }
  }

  const materialsList = Array.from(materialsMap.values());

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');

    const exists = await client.query(
      'SELECT work_order_id, artisan_id, total_cost FROM workorder WHERE work_order_id = $1',
      [id]
    );
    if (exists.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: `Work order ${id} not found.` });
    }

    const currentArtisanId = exists.rows[0].artisan_id;
    const currentTotalCost = exists.rows[0].total_cost;
    const resolvedArtisanId = parsedArtisanId || currentArtisanId || null;

    if (resolvedArtisanId) {
      const artisanExists = await client.query(
        'SELECT artisan_id FROM artisan WHERE artisan_id = $1',
        [resolvedArtisanId]
      );
      if (artisanExists.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Artisan not found. Please select a valid artisan.` });
      }
    }

    const calculatedTotalCost = materialsList.length > 0
      ? materialsList.reduce((sum, m) => sum + m.qty * m.cost, 0)
      : currentTotalCost;

    await client.query(
      `UPDATE workorder
       SET status=$1, artisan_id=$2, quantity_needed=$3, sku=$4,
           target_date=$5, total_cost=$6, product_image=$7
       WHERE work_order_id=$8`,
      [status, resolvedArtisanId, quantity, sku, target_date, calculatedTotalCost, product_image, id]
    );

    if (materialsList.length > 0) {
      const oldMaterials = await client.query(
        'SELECT material_id, material_qty FROM work_order_materials WHERE work_order_id = $1',
        [id]
      );
      for (const oldMat of oldMaterials.rows) {
        await client.query(
          'UPDATE material SET stock_quantity = stock_quantity + $1 WHERE material_id = $2',
          [oldMat.material_qty, oldMat.material_id]
        );
      }

      await client.query('DELETE FROM work_order_materials WHERE work_order_id = $1', [id]);

      for (const m of materialsList) {
        await client.query(
          'INSERT INTO work_order_materials (work_order_id, material_id, material_qty, subtotal) VALUES ($1,$2,$3,$4)',
          [id, m.material_id, m.qty, m.total]
        );

        const updateStock = await client.query(
          'UPDATE material SET stock_quantity = stock_quantity - $1 WHERE material_id = $2 RETURNING stock_quantity, material_name',
          [m.qty, m.material_id]
        );

        if (updateStock.rows[0].stock_quantity < 0) {
          throw new Error(`INSUFFICIENT_STOCK::${updateStock.rows[0].material_name}::${m.qty}::${updateStock.rows[0].stock_quantity + m.qty}`);
        }
      }
    }

    await client.query('COMMIT');

    io.emit('work_orders:updated');
    io.emit('materials:updated');

    res.status(200).json({ success: true, message: 'Order and Stock Updated Successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/clear-gmail-tokens', async (req, res) => {
  try {
    await dbQuery("DELETE FROM gmail_tokens");
    res.send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #10b981;">Tokens Cleared Successfully!</h1>
        <p>The expired Gmail session has been removed from the database.</p>
        <p><strong>Next Step:</strong> Go back to your dashboard, refresh the page, and click the <b>Connect Gmail</b> button.</p>
      </div>
    `);
  } catch (err) {
    res.status(500).send("Error clearing tokens: " + err.message);
  }
});

const { registerGmailRoutes } = require('./gmailroutes');
registerGmailRoutes(app, dbQuery);

const PORT = 5000;
initDB();
const networkInterfaces = os.networkInterfaces();
const localIP = Object.values(networkInterfaces).flat().find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local network access: http://${localIP}:${PORT}`);
});