var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* POST new price data */
router.post('/api/cpi-prices', function(req, res) {
  const { date, product_name, price } = req.body;

  // Validate required fields
  if (!date || !product_name || !price) {
    return res.status(400).json({ success: false, error: "All fields are required" });
  }

  // Validate price is a number
  if (isNaN(parseFloat(price))) {
    return res.status(400).json({ success: false, error: "Price must be a number" });
  }

  // Insert the new record
  const query = "INSERT INTO cpi_prices (date, product_name, price) VALUES (?, ?, ?)";
  req.app.locals.db.run(query, [date, product_name, parseFloat(price)], function(err) {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ success: false, error: "Failed to add record to database" });
    }

    res.json({
      success: true,
      message: "Record added successfully",
      recordId: this.lastID
    });
  });
});

/* GET price data with filters */
router.get('/api/prices', function(req, res) {
  const { name, startDate, endDate, price, limit, sort = 'date_asc' } = req.query;  // Default sort to date_asc

  // Log the table structure first to debug
  req.app.locals.db.all("PRAGMA table_info(cpi_prices)", [], (err, columns) => {
    if (err) {
      console.error("Error getting table info:", err);
    } else {
      console.log("cpi_prices table columns:", columns);
    }

    // Continue with the regular query...
    // Make sure we're selecting all available fields
    let query = "SELECT rowid as id, date, product_name, price FROM cpi_prices";
    const where = [];
    const params = [];

    // Add filters if they exist
    if (name) {
      where.push("product_name = ?");
      params.push(name);
    }
    if (startDate) {
      console.log('StartDate from request:', startDate);
      // Format tanggal dari YYYY-MM-DD ke YYYY/MM/DD untuk query
      const formattedStartDate = startDate.replace(/-/g, '/');
      console.log('Formatted StartDate:', formattedStartDate);
      where.push("date >= ?");
      params.push(formattedStartDate);
    }
    if (endDate) {
      console.log('EndDate from request:', endDate);
      // Format tanggal dari YYYY-MM-DD ke YYYY/MM/DD untuk query
      const formattedEndDate = endDate.replace(/-/g, '/');
      console.log('Formatted EndDate:', formattedEndDate);
      where.push("date <= ?");
      params.push(formattedEndDate);
    }
    if (price) {
      where.push("price = ?");
      params.push(parseFloat(price));
    }

    // Add WHERE clause if filters exist
    if (where.length > 0) {
      query += " WHERE " + where.join(" AND ");
    }

    // Sorting logic
    let orderBy = '';
    console.log('Sort parameter received:', sort); // Debug log

    switch (sort) {
      case 'price_asc':
        orderBy = ' ORDER BY price ASC';
        break;
      case 'price_desc':
        orderBy = ' ORDER BY price DESC';
        break;
      case 'date_desc':
        orderBy = ' ORDER BY date DESC';
        break;
      case 'date_asc':
        orderBy = ' ORDER BY date ASC';
        break;
      default:
        orderBy = ' ORDER BY date ASC';
    }
    console.log('Selected order by:', orderBy); // Debug log
    query += orderBy;

    // Limit logic
    const limitValue = (limit || '').trim();

    // Hanya tambahkan LIMIT jika nilai bukan 'all' dan merupakan angka valid
    if (limitValue !== 'all') {
      const limitNum = parseInt(limitValue);
      if (!isNaN(limitNum) && limitNum > 0 && limitNum <= 11061) {
        query += " LIMIT ?";
        params.push(limitNum);
      }
    }

    console.log('Final Query:', query);
    console.log('Parameters:', params);

    // Execute query
    req.app.locals.db.all(query, params, (err, rows) => {
      if (err) {
        console.error("Database error:", err);
        res.status(500).json({ error: "Database error" });
        return;
      }
      if (rows.length > 0) {
        console.log('Sample data:', rows[0]);
      }
      res.json(rows);
    });
  });
});

/* DELETE price record by ID */
router.delete('/api/prices/:id', function(req, res) {
  const priceId = req.params.id;
  console.log("Attempting to delete record with ID:", priceId);

  // Execute delete operation using rowid instead of id
  const query = "DELETE FROM cpi_prices WHERE rowid = ?";
  req.app.locals.db.run(query, [priceId], function(err) {
    if (err) {
      console.error("Database error during delete:", err);
      return res.status(500).json({ success: false, error: "Failed to delete record" });
    }

    console.log("Delete operation result - changes:", this.changes);

    if (this.changes === 0) {
      return res.status(404).json({ success: false, error: "Record not found" });
    }

    res.json({
      success: true,
      message: "Record deleted successfully"
    });
  });
});

module.exports = router;
