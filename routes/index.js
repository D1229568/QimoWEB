var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* GET price data with filters */
router.get('/api/prices', function(req, res) {
  const { name, startDate, endDate, price, limit, sort = 'date_asc' } = req.query;  // Default sort to date_asc

  let query = "SELECT * FROM cpi_prices";
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

module.exports = router;
