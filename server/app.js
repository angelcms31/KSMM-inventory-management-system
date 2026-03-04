const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const bcrypt = require("bcrypt");
const os = require("os");
const { getPool, initDB, dbQuery, invalidateCache } = require("./db");
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
    await getPool().query(
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
    const userCheck = await getPool().query(
      `SELECT u.user_id, u.user_role as role, u.password, u.failed_attempts, u.is_locked, u.is_default_password, p.status, p.firstname as firstname 
       FROM userlogin u JOIN personaldata p ON u.user_id = p.user_id 
       WHERE LOWER(u.user_account) = LOWER($1)`, [email]
    );
    if (userCheck.rows.length === 0) return res.status(401).json({ message: "Invalid credentials" });
    const user = userCheck.rows[0];
    if (user.is_locked) return res.status(403).json({ message: "Account Locked" });
    if (user.status === 'Deactivated') return res.status(403).json({ message: "Account Deactivated" });

    const match = await bcrypt.compare(password, user.password);

    if (match) {
      await getPool().query('UPDATE userlogin SET failed_attempts = 0, last_login = CURRENT_TIMESTAMP WHERE user_id = $1', [user.user_id]);
      await createAuditLog(user.user_id, "Login", user.role);
      return res.json({
        success: true,
        role: user.role,
        firstName: user.firstname,
        user_id: user.user_id,
        is_default_password: user.is_default_password ?? true
      });
    } else {
      const newAttempts = (user.failed_attempts || 0) + 1;
      if (newAttempts >= 3) {
        await getPool().query('UPDATE userlogin SET failed_attempts = $1, is_locked = TRUE WHERE user_id = $2', [newAttempts, user.user_id]);
        return res.status(403).json({ message: "Account Locked" });
      } else {
        await getPool().query('UPDATE userlogin SET failed_attempts = $1 WHERE user_id = $2', [newAttempts, user.user_id]);
        return res.status(401).json({ message: "Invalid credentials." });
      }
    }
  } catch (error) { res.status(500).json({ message: "Login error" }); }
});

app.post('/api/change_password', async (req, res) => {
  const { user_id, new_password } = req.body;
  try {
    const hashed = await bcrypt.hash(new_password, 10);
    await getPool().query(
      'UPDATE userlogin SET password = $1, is_default_password = FALSE WHERE user_id = $2',
      [hashed, user_id]
    );
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
  } catch (err) { res.status(500).send(err.message); }
});

app.post("/send_recovery_email", async (req, res) => {
  const { OTP, recipient_email } = req.body;
  try {
    await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: recipient_email,
      subject: "Password Recovery OTP",
      html: `<h3>Your OTP for password recovery is: <b>${OTP}</b></h3><p>This code will expire soon.</p>`
    });
    res.status(200).send("OTP sent successfully");
  } catch (error) {
    console.error("Email error:", error);
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

app.get("/api/users", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 6 } = req.query;
    const offset = (page - 1) * limit;
    const result = await getPool().query(`
      WITH numbered_users AS (
        SELECT p.*, u.user_role, u.is_locked, u.date_added,
               ROW_NUMBER() OVER(ORDER BY u.date_added ASC) as permanent_id,
               COUNT(*) OVER() as total_count
        FROM personaldata p 
        JOIN userlogin u ON p.user_id = u.user_id
      )
      SELECT * FROM numbered_users
      WHERE firstname ILIKE $1 
         OR lastname ILIKE $1 
         OR email ILIKE $1
         OR CONCAT(SUBSTRING(user_role, 1, 2), '-', permanent_id::TEXT) ILIKE $1
      ORDER BY 
        CASE WHEN is_locked = TRUE THEN 1 ELSE 2 END ASC, 
        CASE WHEN status = 'Active' THEN 1 ELSE 2 END ASC, 
        date_added DESC 
      LIMIT $2 OFFSET $3`, [`%${search}%`, limit, offset]);
    res.json({ users: result.rows, totalUsers: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

app.get("/api/user/profile/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const result = await getPool().query(
      "SELECT Profile_Image FROM PersonalData WHERE Email = $1", [email]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/add_user", async (req, res) => {
  const { firstName, lastName, email, contactNo, role, gender, profileImage } = req.body;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const pRes = await client.query(
      `INSERT INTO personaldata (firstname, lastname, email, contact_no, gender, profile_image, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'Active') RETURNING user_id`,
      [firstName, lastName, email, contactNo, gender, profileImage]
    );
    const userId = pRes.rows[0].user_id;
    const hashedPassword = await bcrypt.hash("password123", 10);
    await client.query(
      `INSERT INTO userlogin (user_account, password, user_role, user_id, failed_attempts, is_locked, is_default_password) 
       VALUES ($1, $2, $3, $4, 0, FALSE, TRUE)`,
      [email, hashedPassword, role, userId]
    );
    await client.query("COMMIT");
    await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Welcome to Matthew & Melka",
      html: `<h3>Account Created!</h3><p>Hi ${firstName}, use these credentials:</p><p>User: ${email}<br>Pass: password123</p><p>You will be required to change your password upon first login.</p>`
    });
    res.status(201).send("User created successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Transaction Error:", err.message);
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

app.put("/api/user/update", async (req, res) => {
  const { firstName, lastName, email, contactNo, role, gender, profileImage, originalEmail } = req.body;
  const client = await getPool().connect();
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

app.put("/api/user/status", async (req, res) => {
  const { userId, status, adminId, adminRole } = req.body;
  try {
    await getPool().query('UPDATE personaldata SET status = $1 WHERE user_id = $2', [status, userId]);
    await createAuditLog(adminId, `User ${status}: ID ${userId}`, adminRole);
    res.send(`User status updated to ${status}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/api/user/unlock", async (req, res) => {
  const { userId, adminId } = req.body;
  try {
    await getPool().query(
      'UPDATE userlogin SET is_locked = FALSE, failed_attempts = 0 WHERE user_id = $1', [userId]
    );
    const adminRes = await getPool().query(
      'SELECT user_role FROM userlogin WHERE user_id = $1', [adminId]
    );
    const adminRole = adminRes.rows[0]?.user_role || 'Admin';
    await createAuditLog(adminId, `Unlocked User: ID ${userId}`, adminRole);
    res.send("User account unlocked");
  } catch (err) {
    console.error("Unlock Error:", err);
    res.status(500).send(err.message);
  }
});

app.get("/api/artisans", async (req, res) => {
  try {
    const { search = "", page = 1, limit = 9 } = req.query;
    const offset = (page - 1) * limit;
    const result = await getPool().query(`
      SELECT *, COUNT(*) OVER() as total_count 
      FROM artisan 
      WHERE (
        first_name ILIKE $1 OR 
        middle_name ILIKE $1 OR 
        last_name ILIKE $1 OR 
        CONCAT('AR-', artisan_id) ILIKE $1
      )
      ORDER BY 
        CASE WHEN status = 'Active' THEN 1 WHEN status = 'Deactivated' THEN 2 ELSE 3 END ASC, 
        artisan_id DESC 
      LIMIT $2 OFFSET $3`,
      [`%${search}%`, limit, offset]
    );
    res.json({
      artisans: result.rows,
      totalArtisans: result.rows.length > 0 ? parseInt(result.rows[0].total_count) : 0
    });
  } catch (err) {
    console.error("Search Error:", err.message);
    res.status(500).send(err.message);
  }
});

app.post("/api/add_artisan", async (req, res) => {
  const { first_name, middle_name, last_name, email, contact_no, department, profile_image } = req.body;
  try {
    const result = await getPool().query(
      `INSERT INTO artisan (first_name, middle_name, last_name, email, contact_no, profile_image, department, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Active') RETURNING *`,
      [first_name, middle_name, last_name, email, contact_no, profile_image, department]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).send(err.message);
  }
});

app.put("/api/artisans/:id", async (req, res) => {
  const { id } = req.params;
  const { first_name, middle_name, last_name, email, contact_no, profile_image, department, status } = req.body;
  try {
    const result = await getPool().query(
      `UPDATE artisan 
       SET first_name = $1, middle_name = $2, last_name = $3, email = $4, contact_no = $5, profile_image = $6, department = $7, status = $8 
       WHERE artisan_id = $9 RETURNING *`,
      [first_name, middle_name, last_name, email, contact_no, profile_image, department, status, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/artisan/status", async (req, res) => {
  const { email, status } = req.body;
  try {
    const result = await getPool().query(
      "UPDATE artisan SET status = $1 WHERE email = $2", [status, email]
    );
    if (result.rowCount === 0) return res.status(404).send("Artisan not found with that email.");
    res.status(200).send(`Artisan status updated to ${status}`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Database error: " + err.message);
  }
});

app.get("/api/suppliers", async (req, res) => {
  try {
    const result = await dbQuery('SELECT * FROM supplier ORDER BY supplier_id DESC', [], 'suppliers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/suppliers/status/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await getPool().query('UPDATE supplier SET status = $1 WHERE supplier_id = $2', [status, id]);
    invalidateCache('suppliers');
    res.status(200).send("Status updated");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/suppliers/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, contact_no } = req.body;
  try {
    const result = await getPool().query(
      "UPDATE supplier SET name = $1, email = $2, contact_no = $3 WHERE supplier_id = $4 RETURNING *",
      [name, email, contact_no, id]
    );
    if (result.rows.length === 0) return res.status(404).send("Supplier not found");
    invalidateCache('suppliers');
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/add_supplier", async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    await getPool().query("INSERT INTO Supplier (name, contact_no, email) VALUES ($1, $2, $3)", [name, phone, email]);
    invalidateCache('suppliers');
    res.status(201).send("Success");
  } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/supplier/orders/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getPool().query(
      `SELECT order_id, product_name, total_value, status FROM orders WHERE supplier_id = $1 ORDER BY order_id DESC`, [id]
    );
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/user/name/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await getPool().query(
      "SELECT CONCAT(firstname, ' ', lastname) as name FROM personaldata WHERE user_id = $1", [id]
    );
    if (result.rows.length > 0) {
      res.json({ name: result.rows[0].name });
    } else {
      res.status(404).json({ name: "Unknown User" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get("/api/all_orders", async (req, res) => {
  try {
    const result = await dbQuery(`
      SELECT 
        po.*, po.assignment_id AS purchase_order_id, 
        COALESCE(s.name, 'Unknown Supplier') AS supplier_name, 
        COALESCE(m.material_name, 'Unknown Material') AS material_name, 
        COALESCE(CONCAT(p.firstname, ' ', p.lastname), 'Unknown Requisitioner') AS requisitioner_name
      FROM purchaseorder po
      LEFT JOIN supplier s ON po.supplier_id = s.supplier_id
      LEFT JOIN material m ON po.material_id = m.material_id
      LEFT JOIN personaldata p ON po.user_id = p.user_id
      ORDER BY po.assignment_id DESC
    `, [], 'all_orders');
    res.json(result.rows);
  } catch (err) {
    console.error("Database Error:", err.message);
    res.status(500).send(err.message);
  }
});

app.post("/api/create_order", async (req, res) => {
  const { supplier_id, material_id, ordered_quantity, total_amount, expected_delivery, user_id, status } = req.body;
  try {
    const newOrder = await getPool().query(
      `INSERT INTO purchaseorder (supplier_id, material_id, ordered_quantity, total_amount, expected_delivery, user_id, status, order_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
      [supplier_id, material_id, ordered_quantity, total_amount, expected_delivery, user_id, status || 'Pending']
    );
    invalidateCache('all_orders');
    res.json(newOrder.rows[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put("/api/orders/:id", async (req, res) => {
  const { id } = req.params;
  const { supplier_id, material_id, ordered_quantity, total_amount, expected_delivery, status } = req.body;
  try {
    const result = await getPool().query(
      `UPDATE purchaseorder 
       SET supplier_id = $1, material_id = $2, ordered_quantity = $3, total_amount = $4, expected_delivery = $5, status = $6
       WHERE assignment_id = $7 RETURNING *`,
      [supplier_id, material_id, ordered_quantity, total_amount, expected_delivery, status, id]
    );
    invalidateCache('all_orders');
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update Order Error:", err.message);
    res.status(500).send(err.message);
  }
});

app.patch("/api/orders/receive/:id", async (req, res) => {
  const { id } = req.params;
  const client = await getPool().connect();
  try {
    const order = await client.query("SELECT * FROM purchaseorder WHERE assignment_id = $1", [id]);
    if (order.rows[0].status === 'Delivered') return res.status(400).send("Order already received.");
    await client.query("BEGIN");
    await client.query("UPDATE purchaseorder SET status = 'Delivered' WHERE assignment_id = $1", [id]);
    await client.query(
      "UPDATE material SET stock_quantity = stock_quantity + $1 WHERE material_id = $2",
      [order.rows[0].ordered_quantity, order.rows[0].material_id]
    );
    await client.query("COMMIT");
    invalidateCache('all_orders');
    invalidateCache('materials');
    res.send("Inventory updated successfully!");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally {
    client.release();
  }
});

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
  } catch (err) { res.status(500).send(err.message); }
});

app.put("/api/products/:sku", async (req, res) => {
  const { sku } = req.params;
  const { name, collection, brand, selling_price, product_image, location, category, quantity, min_stocks } = req.body;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `UPDATE FinishedGoods SET name=$1, collection=$2, brand=$3, selling_price=$4, product_image=$5, warehouse_location=$6, category=$7, current_stock=$8, min_stocks=$9 WHERE sku=$10`,
      [name, collection, brand, selling_price, product_image, location, category, quantity, min_stocks || 0, sku]
    );
    if (parseInt(quantity) <= parseInt(min_stocks || 0)) {
      const existingRequest = await client.query(
        `SELECT work_order_id FROM workorder WHERE sku = $1 AND status IN ('Pending Request', 'In Production') LIMIT 1`, [sku]
      );
      if (existingRequest.rowCount === 0) {
        await client.query(
          `INSERT INTO workorder (sku, quantity_needed, category, status, target_date) VALUES ($1, $2, $3, 'Pending Request', CURRENT_DATE + INTERVAL '7 days')`,
          [sku, (parseInt(min_stocks) || 5) * 2, category]
        );
      }
    }
    await client.query("COMMIT");
    invalidateCache('finishedgoods');
    res.status(200).send("Product updated and demand check complete");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("PUT /api/products/:sku Error:", err.message);
    res.status(500).send("Database Error: " + err.message);
  } finally {
    client.release();
  }
});

app.post("/api/work_orders/trigger", async (req, res) => {
  const { sku, quantity_needed, category } = req.body;
  try {
    const existing = await getPool().query(
      `SELECT work_order_id FROM workorder WHERE sku = $1 AND status IN ('Pending', 'In Production', 'Quality Control') LIMIT 1`, [sku]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({ message: "Active work order already exists for this SKU.", work_order_id: existing.rows[0].work_order_id });
    }
    const result = await getPool().query(
      `INSERT INTO workorder (sku, quantity_needed, category, status, target_date) VALUES ($1, $2, $3, 'Pending', CURRENT_DATE + INTERVAL '7 days') RETURNING work_order_id`,
      [sku, quantity_needed || 10, category || null]
    );
    invalidateCache('work_orders');
    res.status(201).json({ message: "Work order created successfully.", work_order_id: result.rows[0].work_order_id });
  } catch (err) {
    console.error("WO Trigger Error:", err.message);
    res.status(500).send(err.message);
  }
});

app.get("/api/materials", async (req, res) => {
  try {
    const result = await dbQuery(`
      SELECT m.*, s.name as supplier_name 
      FROM material m 
      LEFT JOIN supplier s ON m.supplier_id = s.supplier_id 
      ORDER BY m.material_id DESC
    `, [], 'materials');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/add_material", async (req, res) => {
  const { unique_code, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image, material_name } = req.body;
  try {
    const result = await getPool().query(
      `INSERT INTO material (unique_code, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image, material_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [unique_code, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image, material_name]
    );
    invalidateCache('materials');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Add Error:", err.message);
    res.status(500).json({ error: "Database error: " + err.message });
  }
});

app.put("/api/materials/:id", async (req, res) => {
  const { id } = req.params;
  const { material_name, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image } = req.body;
  try {
    const result = await getPool().query(
      `UPDATE material SET material_name=$1, supplier_id=$2, cost_per_unit=$3, stock_quantity=$4, reorder_threshold=$5, material_image=$6 WHERE material_id=$7 RETURNING *`,
      [material_name, supplier_id, cost_per_unit, stock_quantity, reorder_threshold, material_image, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Material not found" });
    invalidateCache('materials');
    res.json({ success: true, message: "Material updated!", data: result.rows[0] });
  } catch (err) {
    console.error("Update Error:", err.message);
    res.status(500).json({ error: "Server error during update: " + err.message });
  }
});

app.post("/api/sales_Add_inventory", async (req, res) => {
  const { sku, name, location, quantity, selling_price, product_image, collection, brand, category, min_stocks } = req.body;
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO FinishedGoods (sku, name, collection, brand, selling_price, product_image, current_stock, warehouse_location, category, min_stocks) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (sku) DO UPDATE SET name=EXCLUDED.name, category=EXCLUDED.category, min_stocks=EXCLUDED.min_stocks, current_stock=FinishedGoods.current_stock+EXCLUDED.current_stock`,
      [sku, name, collection, brand || '', selling_price || 0, product_image, quantity || 0, location, category, min_stocks || 0]
    );
    const warehouseRes = await client.query("SELECT warehouse_id FROM Warehouse WHERE name = $1 LIMIT 1", [location]);
    if (warehouseRes.rows.length === 0) throw new Error(`Warehouse location '${location}' not found.`);
    const warehouseId = warehouseRes.rows[0].warehouse_id;
    await client.query(
      `INSERT INTO WarehouseInventory (warehouse_id, sku, quantity) VALUES ($1, $2, $3)
       ON CONFLICT (warehouse_id, sku) DO UPDATE SET quantity=WarehouseInventory.quantity+EXCLUDED.quantity`,
      [warehouseId, sku, quantity || 0]
    );
    await client.query("COMMIT");
    invalidateCache('finishedgoods');
    res.status(200).send("Success");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Database Error:", err.message);
    res.status(500).send("Database Error: " + err.message);
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
      "UPDATE procurement_requests SET status = 'Approved', approved_by = $1 WHERE request_id = $2 RETURNING *",
      [finance_id, id]
    );
    const { material_id, requested_qty } = reqData.rows[0];
    await client.query(
      "UPDATE material SET stock_quantity = stock_quantity + $1 WHERE material_id = $2",
      [requested_qty, material_id]
    );
    await client.query("COMMIT");
    invalidateCache('materials');
    res.send("Material stock updated via Finance approval.");
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).send(err.message);
  } finally { client.release(); }
});

app.get("/api/warehouses", async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT w.warehouse_id, w.name, w.location, w.capacity_total, w.manager_name, 
        (SELECT COUNT(DISTINCT sku) FROM WarehouseInventory WHERE warehouse_id = w.warehouse_id) as product_types,
        COALESCE((SELECT SUM(quantity) FROM WarehouseInventory WHERE warehouse_id = w.warehouse_id), 0) as current_utilization,
        (SELECT COUNT(*) FROM FinishedGoods fg JOIN WarehouseInventory wi ON fg.sku = wi.sku WHERE wi.warehouse_id = w.warehouse_id AND wi.quantity <= fg.min_stocks) as low_stock_count
      FROM Warehouse w ORDER BY w.name ASC
    `);
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
      FROM Warehouse w ORDER BY w.warehouse_id ASC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.post("/api/warehouses/add", async (req, res) => {
  const { name, location, capacity, manager } = req.body;
  try {
    await getPool().query(
      "INSERT INTO Warehouse (name, location, capacity_total, manager_name) VALUES ($1, $2, $3, $4)",
      [name, location, capacity, manager]
    );
    res.status(201).send("Warehouse added successfully");
  } catch (err) { res.status(500).send(err.message); }
});

app.put("/api/warehouses/:id", async (req, res) => {
  const { id } = req.params;
  const { name, location, capacity_total, manager_name } = req.body;
  try {
    await getPool().query(
      "UPDATE Warehouse SET name=$1, location=$2, capacity_total=$3, manager_name=$4 WHERE warehouse_id=$5",
      [name, location, capacity_total, manager_name, id]
    );
    res.status(200).send("Warehouse updated successfully");
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
      ORDER BY wo.work_order_id DESC
    `, [], 'work_orders');
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch WorkOrders Error:", err.message);
    res.status(500).send(err.message);
  }
});

app.post("/api/work_orders", async (req, res) => {
  const { sku, quantity, target_date, artisan_id, status, total_cost, selectedMaterials } = req.body;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO workorder (sku, quantity_needed, status, target_date, artisan_id, total_cost) VALUES ($1, $2, $3, $4, $5, $6) RETURNING work_order_id`,
      [sku, parseInt(quantity), status || 'In Production', target_date, parseInt(artisan_id), parseFloat(total_cost)]
    );
    const newOrderId = result.rows[0].work_order_id;
    if (selectedMaterials && selectedMaterials.length > 0) {
      for (const mat of selectedMaterials) {
        const matId = parseInt(mat.material_id);
        const qtyToUse = parseInt(mat.qty);
        const subtotal = Number(mat.total) || (qtyToUse * (Number(mat.cost) || 0));
        await client.query(
          `INSERT INTO work_order_materials (work_order_id, material_id, material_qty, subtotal) VALUES ($1, $2, $3, $4)`,
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
    invalidateCache('work_orders');
    invalidateCache('materials');
    res.status(201).json({ success: true, work_order_id: newOrderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Create WO Error:", err.message);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get("/api/finished_goods", async (req, res) => {
  try {
    const result = await dbQuery(
      "SELECT sku, name, collection, brand, work_order_id, product_image FROM finishedgoods",
      [], 'finishedgoods_simple'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.put('/api/work_orders/:id/complete', async (req, res) => {
  const { id } = req.params;
  const { actualMaterials = [] } = req.body;
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const woResult = await client.query(
      'SELECT sku, quantity_needed, artisan_id FROM workorder WHERE work_order_id = $1', [id]
    );
    if (woResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Work order not found.' });
    }
    const { sku, quantity_needed, artisan_id } = woResult.rows[0];
    await client.query(`UPDATE workorder SET status = 'Complete' WHERE work_order_id = $1`, [id]);
    for (const mat of actualMaterials) {
      const { material_id, expected_qty, actual_qty } = mat;
      const variance = Number(actual_qty) - Number(expected_qty);
      await client.query(
        `UPDATE work_order_materials SET actual_qty_used=$1, variance_qty=$2 WHERE work_order_id=$3 AND material_id=$4`,
        [actual_qty, variance, id, material_id]
      );
      await client.query(
        `UPDATE material SET stock_quantity = stock_quantity - $1 WHERE material_id = $2`,
        [actual_qty, material_id]
      );
      await client.query(
        `INSERT INTO material_variance_logs (work_order_id, material_id, artisan_id, expected_qty, actual_qty, variance) VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, material_id, artisan_id, expected_qty, actual_qty, variance]
      );
    }
    await client.query(
      `UPDATE finishedgoods SET current_stock = current_stock + $1 WHERE sku = $2`,
      [quantity_needed, sku]
    );
    await client.query('COMMIT');
    invalidateCache('work_orders');
    invalidateCache('materials');
    invalidateCache('finishedgoods');
    res.json({ message: 'Work order completed, variance logged, stock updated.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/work_orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status, artisan_id, quantity, sku, target_date, selectedMaterials, product_image } = req.body;
  const materialsList = selectedMaterials || [];
  const calculatedTotalCost = materialsList.reduce((sum, m) => sum + ((Number(m.qty) || 0) * (Number(m.cost) || 0)), 0);
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const oldMaterials = await client.query(
      'SELECT material_id, material_qty FROM work_order_materials WHERE work_order_id = $1', [id]
    );
    for (const oldMat of oldMaterials.rows) {
      await client.query(
        'UPDATE material SET stock_quantity = stock_quantity + $1 WHERE material_id = $2',
        [oldMat.material_qty, oldMat.material_id]
      );
    }
    await client.query(
      'UPDATE workorder SET status=$1, artisan_id=$2, quantity_needed=$3, sku=$4, target_date=$5, total_cost=$6, product_image=$7 WHERE work_order_id=$8',
      [status, artisan_id, quantity, sku, target_date, calculatedTotalCost, product_image, id]
    );
    await client.query('DELETE FROM work_order_materials WHERE work_order_id = $1', [id]);
    for (const m of materialsList) {
      const qty = Number(m.qty) || 0;
      const cost = Number(m.cost) || 0;
      await client.query(
        'INSERT INTO work_order_materials (work_order_id, material_id, material_qty, subtotal) VALUES ($1, $2, $3, $4)',
        [id, m.material_id, qty, qty * cost]
      );
      const updateStock = await client.query(
        'UPDATE material SET stock_quantity = stock_quantity - $1 WHERE material_id = $2 RETURNING stock_quantity',
        [qty, m.material_id]
      );
      if (updateStock.rows[0].stock_quantity < 0) throw new Error(`Insufficient stock for material ID: ${m.material_id}`);
    }
    await client.query('COMMIT');
    invalidateCache('work_orders');
    invalidateCache('materials');
    res.status(200).json({ success: true, message: "Order and Stock Updated Successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Transaction Error:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/work_order_materials/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await getPool().query(`
      SELECT m.material_id, m.material_name, m.cost_per_unit, wom.material_qty, wom.subtotal 
      FROM work_order_materials wom
      JOIN material m ON wom.material_id = m.material_id
      WHERE wom.work_order_id = $1`, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error("GET Materials Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/audit_logs", async (req, res) => {
  try {
    const result = await getPool().query(`
      SELECT l.log_id, l.user_id, l.action, l.role, l.timestamp, 
        COALESCE(
          (SELECT CONCAT(firstname, ' ', middlename, ' ', lastname) FROM personaldata WHERE user_id = l.user_id),
          (SELECT CONCAT(first_name, ' ', middle_name, ' ', last_name) FROM artisan WHERE artisan_id = l.user_id)
        ) as merged_name
      FROM audit_logs l ORDER BY l.timestamp DESC
    `);
    res.json(result.rows);
  } catch (err) { res.status(500).send(err.message); }
});

app.get("/api/user/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await getPool().query(
      "SELECT profile_image, firstname, lastname FROM personaldata WHERE user_id = $1", [id]
    );
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const PORT = 5000;
initDB();
const networkInterfaces = os.networkInterfaces();
const localIP = Object.values(networkInterfaces).flat().find(i => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local network access: http://${localIP}:${PORT}`);
});