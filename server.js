const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('ecommerce.db');

// Initialize database tables
db.serialize(() => {
  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image TEXT,
    category TEXT,
    stock INTEGER DEFAULT 100,
    rating REAL DEFAULT 4.5,
    reviews INTEGER DEFAULT 0
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT UNIQUE NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    shipping_address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT NOT NULL,
    total_amount REAL NOT NULL,
    items TEXT NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending'
  )`);

  // Insert sample products if table is empty
  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (row.count === 0) {
      const sampleProducts = [
        {
          name: "Wireless Bluetooth Headphones",
          description: "Premium noise-cancelling headphones with 30-hour battery life",
          price: 79.99,
          image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500",
          category: "Electronics",
          stock: 50,
          rating: 4.5,
          reviews: 234
        },
        {
          name: "Smart Watch Pro",
          description: "Fitness tracker with heart rate monitor and GPS",
          price: 199.99,
          image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500",
          category: "Electronics",
          stock: 30,
          rating: 4.7,
          reviews: 189
        },
        {
          name: "Laptop Backpack",
          description: "Water-resistant backpack with USB charging port",
          price: 49.99,
          image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500",
          category: "Accessories",
          stock: 75,
          rating: 4.3,
          reviews: 156
        },
        {
          name: "Wireless Mouse",
          description: "Ergonomic wireless mouse with 2-year battery life",
          price: 29.99,
          image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=500",
          category: "Electronics",
          stock: 100,
          rating: 4.4,
          reviews: 312
        },
        {
          name: "Mechanical Keyboard",
          description: "RGB backlit mechanical keyboard with blue switches",
          price: 89.99,
          image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500",
          category: "Electronics",
          stock: 45,
          rating: 4.6,
          reviews: 278
        },
        {
          name: "USB-C Hub",
          description: "7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader",
          price: 39.99,
          image: "https://images.unsplash.com/photo-1587825147138-346c006b1e98?w=500",
          category: "Accessories",
          stock: 60,
          rating: 4.2,
          reviews: 145
        },
        {
          name: "Phone Stand",
          description: "Adjustable aluminum phone stand for desk",
          price: 19.99,
          image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=500",
          category: "Accessories",
          stock: 90,
          rating: 4.1,
          reviews: 98
        },
        {
          name: "Power Bank 20000mAh",
          description: "Fast charging power bank with dual USB ports",
          price: 34.99,
          image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c8?w=500",
          category: "Electronics",
          stock: 55,
          rating: 4.5,
          reviews: 201
        }
      ];

      const stmt = db.prepare(`INSERT INTO products (name, description, price, image, category, stock, rating, reviews) 
                               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
      
      sampleProducts.forEach(product => {
        stmt.run(
          product.name,
          product.description,
          product.price,
          product.image,
          product.category,
          product.stock,
          product.rating,
          product.reviews
        );
      });
      stmt.finalize();
    }
  });
});

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'shophub660@gmail.com',
    pass: 'pnuglkqnfvkizjba'
  }
});

// Function to send order email
function sendOrderEmail(orderData) {
  const mailOptions = {
    from: 'shophub660@gmail.com',
    to: 'pranavbadal@gmail.com',
    subject: `New Order #${orderData.order_number}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #232f3e; color: white; padding: 20px; text-align: center; }
          .content { background-color: #f9f9f9; padding: 20px; }
          .order-info { background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
          .item { border-bottom: 1px solid #ddd; padding: 10px 0; }
          .total { font-size: 18px; font-weight: bold; color: #e67e22; margin-top: 15px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛒 New Order Received</h1>
          </div>
          <div class="content">
            <div class="order-info">
              <h2>Order Details</h2>
              <p><strong>Order Number:</strong> ${orderData.order_number}</p>
              <p><strong>Order Date:</strong> ${new Date(orderData.order_date).toLocaleString()}</p>
            </div>
            
            <div class="order-info">
              <h2>Customer Information</h2>
              <p><strong>Name:</strong> ${orderData.customer_name}</p>
              <p><strong>Email:</strong> ${orderData.customer_email}</p>
              <p><strong>Phone:</strong> ${orderData.customer_phone || 'N/A'}</p>
            </div>
            
            <div class="order-info">
              <h2>Shipping Address</h2>
              <p>${orderData.shipping_address}</p>
              <p>${orderData.city}, ${orderData.state} ${orderData.zip_code}</p>
            </div>
            
            <div class="order-info">
              <h2>Order Items</h2>
              ${JSON.parse(orderData.items).map(item => `
                <div class="item">
                  <p><strong>${item.name}</strong></p>
                  <p>Quantity: ${item.quantity} × ₹${item.price.toFixed(2)} = ₹${(item.quantity * item.price).toFixed(2)}</p>
                </div>
              `).join('')}
              <div class="total">
                <p>Total Amount: ₹${parseFloat(orderData.total_amount).toFixed(2)}</p>
              </div>
            </div>
            
            <div class="order-info">
              <p><strong>Status:</strong> ${orderData.status}</p>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated email from your e-commerce website.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error sending email:', error);
    } else {
      console.log('Order email sent:', info.response);
    }
  });
}

// API Routes

// Get all products
app.get('/api/products', (req, res) => {
  db.all("SELECT * FROM products ORDER BY id", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
  db.get("SELECT * FROM products WHERE id = ?", [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    res.json(row);
  });
});

// Create product
app.post('/api/products', (req, res) => {
  const {
    name,
    description = '',
    price,
    image = '',
    category = 'General',
    stock = 0,
    rating = 0,
    reviews = 0
  } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Product name and price are required' });
  }

  const normalizedPrice = parseFloat(price);
  if (Number.isNaN(normalizedPrice)) {
    return res.status(400).json({ error: 'Price must be a valid number' });
  }

  db.run(
    `INSERT INTO products (name, description, price, image, category, stock, rating, reviews)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name.trim(), description, normalizedPrice, image, category, parseInt(stock) || 0, parseFloat(rating) || 0, parseInt(reviews) || 0],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.get("SELECT * FROM products WHERE id = ?", [this.lastID], (selectErr, row) => {
        if (selectErr) {
          res.status(500).json({ error: selectErr.message });
          return;
          }
        res.status(201).json({ success: true, product: row });
      });
    }
  );
});

// Update product
app.put('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  const allowedFields = ['name', 'description', 'price', 'image', 'category', 'stock', 'rating', 'reviews'];
  const updates = [];
  const values = [];

  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      if (field === 'price') {
        const normalized = parseFloat(req.body[field]);
        if (Number.isNaN(normalized)) {
          return res.status(400).json({ error: 'Price must be a valid number' });
        }
        updates.push(`${field} = ?`);
        values.push(normalized);
      } else if (field === 'stock' || field === 'reviews') {
        updates.push(`${field} = ?`);
        values.push(parseInt(req.body[field]) || 0);
      } else if (field === 'rating') {
        updates.push(`${field} = ?`);
        values.push(parseFloat(req.body[field]) || 0);
      } else {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
  });

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No fields provided to update' });
  }

  values.push(productId);

  db.run(
    `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      db.get("SELECT * FROM products WHERE id = ?", [productId], (selectErr, row) => {
        if (selectErr) {
          res.status(500).json({ error: selectErr.message });
          return;
        }
        res.json({ success: true, product: row });
      });
    }
  );
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  const productId = req.params.id;
  db.run(
    'DELETE FROM products WHERE id = ?',
    [productId],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json({ success: true, message: 'Product deleted successfully' });
    }
  );
});

// Generate UPI QR Code
app.get('/api/payment/qrcode', async (req, res) => {
  const amount = req.query.amount;
  const upiId = 'priyankjain2047@fam';
  
  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  // UPI payment URL format
  const upiUrl = `upi://pay?pa=${upiId}&am=${amount}&cu=INR&tn=Order Payment`;
  
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(upiUrl, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2
    });
    
    res.json({
      qrCode: qrCodeDataUrl,
      upiId: upiId,
      amount: parseFloat(amount),
      upiUrl: upiUrl
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Create order
app.post('/api/orders', (req, res) => {
  const {
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    city,
    state,
    zip_code,
    items,
    total_amount
  } = req.body;

  // Generate order number
  const order_number = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();

  const orderData = {
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    city,
    state,
    zip_code,
    total_amount,
    items: JSON.stringify(items),
    order_date: new Date().toISOString(),
    status: 'pending'
  };

  db.run(
    `INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, 
     shipping_address, city, state, zip_code, total_amount, items, order_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      orderData.order_number,
      orderData.customer_name,
      orderData.customer_email,
      orderData.customer_phone,
      orderData.shipping_address,
      orderData.city,
      orderData.state,
      orderData.zip_code,
      orderData.total_amount,
      orderData.items,
      orderData.order_date,
      orderData.status
    ],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      orderData.id = this.lastID;
      orderData.items = JSON.parse(orderData.items);
      
      // Send email notification
      sendOrderEmail({
        ...orderData,
        items: JSON.stringify(orderData.items)
      });

      res.json({
        success: true,
        order: orderData
      });
    }
  );
});

// Get all orders
app.get('/api/orders', (req, res) => {
  db.all("SELECT * FROM orders ORDER BY order_date DESC", (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Delete a single order
app.delete('/api/orders/:orderNumber', (req, res) => {
  const orderNumber = req.params.orderNumber;
  db.run(
    'DELETE FROM orders WHERE order_number = ?',
    [orderNumber],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      res.json({ success: true, message: 'Order deleted successfully' });
    }
  );
});

// Reset all sales data (orders table)
app.post('/api/orders/reset', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM orders', (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      db.run("DELETE FROM sqlite_sequence WHERE name='orders'", (seqErr) => {
        if (seqErr) {
          console.error('Warning: could not reset order ID sequence', seqErr.message);
        }
        res.json({ success: true, message: 'All orders and sales totals have been reset' });
      });
    });
  });
});

// Serve frontend
app.get('/', (req, res) => {
  res.redirect('/home');
});

app.get(['/home', '/index', '/index.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Products page route
app.get(['/maal', '/maal.html', '/products', '/products.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'maal.html'));
});

// Cart page route
app.get(['/cart', '/cart.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.html'));
});

// Cart page script
app.get('/cart.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'cart.js'));
});

// Checkout page
app.get(['/checkout', '/checkout.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.html'));
});

// Payment page
app.get(['/payment', '/payment.html'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.html'));
});

// Checkout script
app.get('/checkout.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'checkout.js'));
});

// Payment script
app.get('/payment.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'payment.js'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

