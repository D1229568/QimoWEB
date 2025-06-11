document.addEventListener('DOMContentLoaded', function() {

  Chart.defaults.font.family = "'Segoe UI', 'Arial', sans-serif";
  Chart.defaults.responsive = true;
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.color = '#0c4a6e';
  Chart.defaults.borderColor = '#a5d8ff';
  Chart.defaults.backgroundColor = '#e7f5ff';
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(76, 154, 255, 0.8)';
  Chart.defaults.plugins.tooltip.titleColor = '#ffffff';
  Chart.defaults.plugins.tooltip.bodyColor = '#ffffff';
  Chart.defaults.plugins.tooltip.borderColor = '#74c0fc';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.legend.labels.color = '#0c4a6e';
  Chart.defaults.animation.duration = 1000;

  fetchProductData();

  // Set interval to check for updated data every minute (60000 ms)
  // This will ensure the charts are updated when data changes

});

async function fetchProductData() {
  try {
    // Tampilkan indikator loading
    document.querySelectorAll('.chart-card canvas').forEach(canvas => {
      const ctx = canvas.getContext('2d');
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Loading data...', canvas.width/2, canvas.height/2);
    });

    const productName = document.getElementById('productName').value;
    console.log('Fetching data for product:', productName);

    const params = new URLSearchParams();
    params.append('name', productName);
    params.append('sort', 'date_asc');

    // Add a timestamp parameter to prevent browser caching
    params.append('_t', new Date().getTime());

    // Tetapkan rentang tanggal dari 2010 hingga hari ini untuk mencakup semua data termasuk yang baru ditambahkan
    params.append('startDate', '2010-01-01');

    // Menggunakan tanggal hari ini sebagai endDate agar dapat mencakup semua data terbaru
    const today = new Date();
    const todayStr = today.getFullYear() + '-' +
                    String(today.getMonth() + 1).padStart(2, '0') + '-' +
                    String(today.getDate()).padStart(2, '0');
    params.append('endDate', todayStr);

    console.log('Using date range: 2010-01-01 to', todayStr);

    const apiUrl = '/api/prices?' + params.toString();
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Data received:', data.length, 'records');

    if (data.length === 0) {
      console.error('No data found for product:', productName);
      // Display a message in the chart area
      const ctx = document.getElementById('mainTrendChart').getContext('2d');
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e74c3c';
      ctx.fillText('No data available for this product', ctx.canvas.width/2, ctx.canvas.height/2);
      return;
    }

    // Fetch comparison data
    const comparisonData = await fetchComparisonData();

    // Buat semua chart setelah data tersedia
    updateProductStatistics(data);
    createAllCharts(data, comparisonData);
    generateInsights(data, comparisonData);

  } catch (error) {
    console.error('Error fetching data:', error);

    // Display error message on all chart canvases
    document.querySelectorAll('.chart-card canvas').forEach(canvas => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#e74c3c';
      ctx.fillText('Failed to load data: ' + error.message, canvas.width/2, canvas.height/2);
    });
  }
}

async function fetchComparisonData() {
  try {
    const productName = document.getElementById('productName').value;

    // Determine comparison products based on current product
    let comparisonProducts = {};

    // Gender counterpart comparison - add corresponding male/female product
    if (productName.includes('公')) {
      // If current product is male, get female counterpart
      const femaleCounterpart = productName.replace('公', '母');
      comparisonProducts[femaleCounterpart] = null;
    } else if (productName.includes('母')) {
      // If current product is female, get male counterpart
      const maleCounterpart = productName.replace('母', '公');
      comparisonProducts[maleCounterpart] = null;
    } else if (productName.includes('綜貨')) {
      // For mixed products, get both male and female of the same region
      const regionBase = productName.replace('綜貨', '');
      comparisonProducts[regionBase + '公上貨'] = null;
      comparisonProducts[regionBase + '母上貨'] = null;
    }

    // Always add regional comparisons for all products
    if (productName.includes('中區')) {
      // For Central products, add other regions with same gender
      if (productName.includes('公')) {
        comparisonProducts['嘉南紅羽土雞公上貨'] = null;
        comparisonProducts['高屏紅羽土雞公上貨'] = null;
      } else if (productName.includes('母')) {
        comparisonProducts['嘉南紅羽土雞母上貨'] = null;
        comparisonProducts['高屏紅羽土雞母上貨'] = null;
      }
    } else if (productName.includes('嘉南')) {
      // For Chiayi-Tainan products, add other regions with same gender
      if (productName.includes('公')) {
        comparisonProducts['中區紅羽土雞公上貨'] = null;
        comparisonProducts['高屏紅羽土雞公上貨'] = null;
      } else if (productName.includes('母')) {
        comparisonProducts['中區紅羽土雞母上貨'] = null;
        comparisonProducts['高屏紅羽土雞母上貨'] = null;
      } else if (productName.includes('綜貨')) {
        // For mix products, add other products for comparison
        comparisonProducts['嘉南紅羽土雞公上貨'] = null;
        comparisonProducts['嘉南紅羽土雞母上貨'] = null;
      }
    } else if (productName.includes('高屏')) {
      // For Kaohsiung-Pingtung products, add other regions with same gender
      if (productName.includes('公')) {
        comparisonProducts['中區紅羽土雞公上貨'] = null;
        comparisonProducts['嘉南紅羽土雞公上貨'] = null;
      } else if (productName.includes('母')) {
        comparisonProducts['中區紅羽土雞母上貨'] = null;
        comparisonProducts['嘉南紅羽土雞母上貨'] = null;
      }
    } else if (productName.includes('黑羽')) {
      // For Black Feather products, compare with Red Feather products
      if (productName.includes('公')) {
        comparisonProducts['中區紅羽土雞公上貨'] = null;
        comparisonProducts['嘉南紅羽土雞公上貨'] = null;
        comparisonProducts['高屏紅羽土雞公上貨'] = null;
      } else if (productName.includes('母')) {
        comparisonProducts['中區紅羽土雞母上貨'] = null;
        comparisonProducts['嘉南紅羽土雞母上貨'] = null;
        comparisonProducts['高屏紅羽土雞母上貨'] = null;
      }
    }

    // Fetch all comparison products data
    const fetchPromises = [];
    for (const product in comparisonProducts) {
      const params = new URLSearchParams();
      params.append('name', product);
      params.append('sort', 'date_asc');
      params.append('startDate', '2010-01-01');
      params.append('endDate', '2014-12-31');

      const fetchPromise = fetch('/api/prices?' + params.toString())
        .then(response => response.json())
        .then(data => {
          comparisonProducts[product] = data;
          console.log(`Fetched ${data.length} records for ${product}`);
        })
        .catch(error => {
          console.error(`Error fetching data for ${product}:`, error);
          comparisonProducts[product] = [];
        });

      fetchPromises.push(fetchPromise);
    }

    // Wait for all fetches to complete
    await Promise.all(fetchPromises);
    return comparisonProducts;
  } catch (error) {
    console.error('Error fetching comparison data:', error);
    return {};
  }
}

function createAllCharts(data, comparisonData) {
  if (!data) return;

  // Buat chart utama
  createMainTrendChart(data);

  // Buat chart tahunan
  createYearlyCharts(data);

  // Buat chart musiman
  createSeasonalCharts(data);

  // Buat chart perbandingan
  if (comparisonData) {
    createComparisonCharts(data, comparisonData);
  }

  // Buat chart analisis lanjutan
  createAdvancedCharts(data);
}

function updateProductStatistics(data) {
  if (!data || data.length === 0) {
    console.error("Can't update product statistics: No data available");
    return;
  }

  // Pastikan semua data adalah angka yang valid
  const prices = data
    .map(item => parseFloat(item.price))
    .filter(price => !isNaN(price)); // Filter out any NaN values

  if (prices.length === 0) {
    console.error("No valid price data found");
    return;
  }

  // Calculate statistics dengan metode yang sama seperti di chart.html
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  // Calculate standard deviation (volatility)
  const squareDiffs = prices.map(price => {
    const diff = price - avg;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  // Update stat cards langsung, mirip dengan chart.html
  if (document.getElementById('avgPrice')) {
    document.getElementById('avgPrice').textContent = avg.toFixed(2);
  }

  if (document.getElementById('priceRange')) {
    document.getElementById('priceRange').textContent = `${min.toFixed(2)} - ${max.toFixed(2)}`;
  }

  if (document.getElementById('volatility')) {
    document.getElementById('volatility').textContent = stdDev.toFixed(2);
  }

  if (document.getElementById('dataPointCount')) {
    document.getElementById('dataPointCount').textContent = data.length;
  }

  console.log(`Statistics updated: avg=${avg.toFixed(2)}, range=${min.toFixed(2)}-${max.toFixed(2)}, volatility=${stdDev.toFixed(2)}`);
}

function createMainTrendChart(data) {
  console.log("Creating main trend chart with data points:", data.length);
  const ctx = document.getElementById('mainTrendChart').getContext('2d');

  if (!data || data.length === 0) {
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('No data available for this product', ctx.canvas.width/2, ctx.canvas.height/2);
    return;
  }

  // Clear any existing chart
  if (window.mainChart instanceof Chart) {
    window.mainChart.destroy();
  }

  // Ensure canvas has proper dimensions
  const canvas = document.getElementById('mainTrendChart');
  if (canvas && (!canvas.height || canvas.height < 100)) {
    canvas.height = 300;
    canvas.style.height = '300px';
  }

  // Pre-process data to ensure consistent format
  const processedData = [];
  data.forEach(item => {
    try {
      const dateObj = new Date(item.date);
      if (!isNaN(dateObj.getTime())) {
        processedData.push({
          x: dateObj,
          y: parseFloat(item.price)
        });
      }
    } catch (err) {
      console.error(`Error processing date: ${item.date}`, err);
    }
  });

  // Sort data by date for proper line rendering
  processedData.sort((a, b) => a.x - b.x);

  // Create chart
  window.mainChart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [{
        label: document.getElementById('productName').value,
        data: processedData,
        borderColor: '#2e86de',
        backgroundColor: 'rgba(46, 134, 222, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 1.5,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#2e86de',
        pointBorderWidth: 2,
        pointHitRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'time',
          time: {
            unit: 'month',
            displayFormats: {
              month: 'MMM yyyy'
            },
            tooltipFormat: 'll'
          },
          grid: { display: false },
          ticks: {
            maxTicksLimit: 8,
            font: { size: 10 }
          },
          title: {
            display: true,
            text: 'Month/Year',
            padding: 10,
            font: { size: 12 }
          }
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 10 } },
          title: {
            display: true,
            text: 'Price',
            font: { size: 12 }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'nearest',
          intersect: false,
          callbacks: {
            title: function(tooltipItems) {
              if (tooltipItems[0]) {
                return new Date(tooltipItems[0].raw.x).toLocaleDateString();
              }
              return '';
            },
            label: function(context) {
              return `Price: ${context.parsed.y.toFixed(2)}`;
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'nearest',
        axis: 'x'
      },
      hover: {
        mode: 'nearest',
        intersect: false
      }
    }
  });

  // Add a failsafe check to resize the chart if needed
  setTimeout(() => {
    if (window.mainChart && canvas) {
      window.mainChart.resize();
    }
  }, 100);
}

function createYearlyCharts(data) {
  // Group data by year
  const yearData = {};

  data.forEach(item => {
    const year = new Date(item.date).getFullYear();
    if (!yearData[year]) {
      yearData[year] = [];
    }
    yearData[year].push({
      date: item.date,
      price: parseFloat(item.price)
    });
  });

  // Get the yearly charts container
  const yearlyChartsContainer = document.getElementById('yearly-charts-container');
  if (!yearlyChartsContainer) {
    console.error("Yearly charts container not found");
    return;
  }

  // Clear any existing year charts
  yearlyChartsContainer.innerHTML = '';

  // Create individual year charts dynamically
  for (const year in yearData) {
    if (yearData[year].length > 0) {
      // Create chart container div
      const chartCard = document.createElement('div');
      chartCard.className = 'chart-card';

      // Create header div
      const chartHeader = document.createElement('div');
      chartHeader.className = 'chart-header';

      // Create title
      const chartTitle = document.createElement('h3');
      chartTitle.className = 'chart-title';
      chartTitle.textContent = `${year} Price Trend`;

      // Create canvas for the chart
      const canvas = document.createElement('canvas');
      canvas.id = `chart${year}`;
      canvas.className = 'tiny-chart-canvas';

      // Assemble the elements
      chartHeader.appendChild(chartTitle);
      chartCard.appendChild(chartHeader);
      chartCard.appendChild(canvas);

      // Add to container
      yearlyChartsContainer.appendChild(chartCard);

      // Create the chart
      createYearChart(year, yearData[year]);
    }
  }

  // Create yearly comparison chart
  createYearlyComparisonChart(yearData);
}

function createYearChart(year, data) {
  const chartId = `chart${year}`;
  const canvas = document.getElementById(chartId);

  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Data bulanan yang disederhanakan
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyPrices = Array(12).fill(null);
  const dataCounts = Array(12).fill(0);

  // Kelompokkan berdasarkan bulan
  data.forEach(item => {
    const date = new Date(item.date);
    const month = date.getMonth();

    if (monthlyPrices[month] === null) {
      monthlyPrices[month] = 0;
    }

    monthlyPrices[month] += parseFloat(item.price);
    dataCounts[month]++;
  });

  // Hitung rata-rata
  const avgPrices = monthlyPrices.map((sum, i) =>
    dataCounts[i] > 0 ? sum / dataCounts[i] : null
  );

  // Warna dinamis berdasarkan tahun
  const hue = (parseInt(year) - 2010) * 60;
  const color = `hsl(${hue}, 70%, 50%)`;

  // Buat chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthNames,
      datasets: [{
        label: `${year}`,
        data: avgPrices,
        borderColor: color,
        backgroundColor: `hsla(${hue}, 70%, 50%, 0.1)`,
        fill: true,
        tension: 0.2,
        pointRadius: 3,
        borderWidth: 2
      }]
    },
    options: {
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: `${year} Price Trend`,
          font: { size: 13, weight: 'bold' }
        },
        // tooltip: {
        //   callbacks: {
        //     label: function(context) {
        //       return `Price: ${context.parsed.y?.toFixed(2) || 'N/A'}`;
        //     }
        //   }
        // }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 9 } }
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 9 } }
        }
      }
    }
  });
}

function createYearlyComparisonChart(yearData) {
  const ctx = document.getElementById('yearlyComparison').getContext('2d');

  const datasets = [];
  const years = Object.keys(yearData).sort();

  years.forEach((year, index) => {
    // Convert data to month-based format for better comparison
    const monthlyData = Array(12).fill(null);
    const monthlyCounts = Array(12).fill(0);

    // Kelompokkan berdasarkan bulan dan jumlahkan nilai
    yearData[year].forEach(item => {
      const month = new Date(item.date).getMonth();
      if (monthlyData[month] === null) monthlyData[month] = 0;
      monthlyData[month] += item.price;
      monthlyCounts[month]++;
    });

    // Hitung rata-rata bulanan
    for (let i = 0; i < 12; i++) {
      if (monthlyCounts[i] > 0) {
        monthlyData[i] = monthlyData[i] / monthlyCounts[i];
      }
    }

    // Generate a color based on the year
    const hue = index * 60;

    datasets.push({
      label: year,
      data: monthlyData,
      borderColor: `hsl(${hue}, 70%, 50%)`,
      backgroundColor: `hsla(${hue}, 70%, 50%, 0.1)`,
      tension: 0.2,
      pointRadius: 3,
      pointHitRadius: 5
    });
  });

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 9 } }
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 9 } }
        }
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 8, font: { size: 9 } }
        }
      }
    }
  });
}

function createSeasonalCharts(data) {
  // Group data by month across years
  const monthlyData = Array(12).fill().map(() => []);
  const quarterlyData = Array(4).fill().map(() => []);

  data.forEach(item => {
    const date = new Date(item.date);
    const month = date.getMonth();
    const quarter = Math.floor(month / 3);

    monthlyData[month].push(parseFloat(item.price));
    quarterlyData[quarter].push(parseFloat(item.price));
  });

  // Calculate monthly averages
  const monthlyAverages = monthlyData.map(prices => {
    if (prices.length === 0) return null;
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  });

  // Calculate quarterly averages
  const quarterlyAverages = quarterlyData.map(prices => {
    if (prices.length === 0) return null;
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  });

  // Monthly distribution chart (box plot style)
  createMonthlyDistributionChart(monthlyData);

  // Quarterly trends chart
  createQuarterlyTrendsChart(quarterlyAverages);

  // Seasonal patterns chart
  createSeasonalPatternsChart(monthlyAverages);
}

function createMonthlyDistributionChart(monthlyData) {
  const ctx = document.getElementById('monthlyDistribution').getContext('2d');

  // Calculate monthly statistics for visualization
  const monthlyStats = monthlyData.map(prices => {
    if (prices.length === 0) return { avg: null, min: null, max: null };

    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = sum / prices.length;
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    return { avg, min, max };
  });

  const avgData = monthlyStats.map(stat => stat.avg);
  const minData = monthlyStats.map(stat => stat.min);
  const maxData = monthlyStats.map(stat => stat.max);

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Average',
          data: avgData,
          backgroundColor: '#2e86de',
          borderColor: '#2e86de',
          borderWidth: 1
        },
        {
          label: 'Min-Max Range',
          data: maxData.map((max, i) => max - minData[i]),
          backgroundColor: 'rgba(46, 134, 222, 0.2)'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 9 } }
        },
        y: {
          title: {
            display: true,
            text: 'Price',
            font: { size: 12 }
          },
          beginAtZero: false,
          ticks: { font: { size: 9 } }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const datasetLabel = context.dataset.label || '';
              const value = context.parsed.y;

              if (datasetLabel === 'Average') {
                return `Average: ${value.toFixed(2)}`;
              } else {
                const monthIndex = context.dataIndex;
                return `Range: ${minData[monthIndex].toFixed(2)} - ${maxData[monthIndex].toFixed(2)}`;
              }
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    }
  });
}

function createQuarterlyTrendsChart(quarterlyAverages) {
  const ctx = document.getElementById('quarterlyTrends').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: 'Quarterly Average Price',
        data: quarterlyAverages,
        backgroundColor: [
          'rgba(46, 134, 222, 0.7)',
          'rgba(46, 204, 113, 0.7)',
          'rgba(241, 196, 15, 0.7)',
          'rgba(231, 76, 60, 0.7)'
        ],
        borderColor: [
          '#2e86de',
          '#2ecc71',
          '#f1c40f',
          '#e74c3c'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          ticks: { font: { size: 9 } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { size: 9 } }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function createSeasonalPatternsChart(monthlyAverages) {
  const ctx = document.getElementById('seasonalPatterns').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [{
        label: 'Monthly Price Pattern',
        data: monthlyAverages,
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#e74c3c',
        pointBorderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 9 } }
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 9 } }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
}

function createComparisonCharts(productData, comparisonData) {
  const productName = document.getElementById('productName').value;

  // Create gender comparison chart
  createGenderComparisonChart(productData, comparisonData);

  // Create regional comparison chart
  createRegionalComparisonChart(productData, comparisonData);

  // Create market average comparison
  createMarketComparisonChart(productData, comparisonData);
}

function createGenderComparisonChart(productData, comparisonData) {
  const productName = document.getElementById('productName').value;
  const canvas = document.getElementById('centralGenderComparison');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let region = '中區';

  if (productName.includes('中區')) {
    region = '中區';
  } else if (productName.includes('嘉南')) {
    region = '嘉南';
  } else if (productName.includes('高屏')) {
    region = '高屏';
  } else if (productName.includes('黑羽')) {
    region = '黑羽';
  }

  let genderData = {};

  // Set current product data
  const dateToPrice = {};
  productData.forEach(item => {
    const date = item.date.substring(0, 7); // Format: YYYY-MM
    dateToPrice[date] = parseFloat(item.price);
  });

  // Find counterpart product
  let counterpartName = '';
  if (productName.includes('公')) {
    counterpartName = productName.replace('公', '母');
  } else if (productName.includes('母')) {
    counterpartName = productName.replace('母', '公');
  } else if (productName.includes('綜貨')) {
    // For mixed gender products, compare with both male and female
    const baseName = productName.replace('綜貨', '');
    counterpartName = baseName + '公上貨';
  }

  const counterpartData = comparisonData[counterpartName] || [];

  // Create comparison datasets
  const currentProductLabel = productName.includes('公') ? `${region} 公雞` :
                             productName.includes('母') ? `${region} 母雞` : `${region} 綜合`;

  const counterpartLabel = counterpartName.includes('公') ? `${region} 公雞` :
                          counterpartName.includes('母') ? `${region} 母雞` : `${region} 綜合`;

  // Prepare data for chart
  const months = [];
  const currentPrices = [];
  const counterpartPrices = [];

  // Get all unique months
  const allDates = new Set();
  productData.forEach(item => allDates.add(item.date.substring(0, 7)));
  counterpartData.forEach(item => allDates.add(item.date.substring(0, 7)));

  // Sort dates
  const sortedDates = Array.from(allDates).sort();

  // Create monthlyData object for current product
  const currentMonthlyData = {};
  productData.forEach(item => {
    const month = item.date.substring(0, 7);
    if (!currentMonthlyData[month]) currentMonthlyData[month] = [];
    currentMonthlyData[month].push(parseFloat(item.price));
  });

  // Create monthlyData object for counterpart
  const counterpartMonthlyData = {};
  if (counterpartData && counterpartData.length) {
    counterpartData.forEach(item => {
      const month = item.date.substring(0, 7);
      if (!counterpartMonthlyData[month]) counterpartMonthlyData[month] = [];
      counterpartMonthlyData[month].push(parseFloat(item.price));
    });
  }

  // Calculate monthly averages
  sortedDates.forEach(month => {
    months.push(month);

    // Calculate current product average for this month
    if (currentMonthlyData[month] && currentMonthlyData[month].length) {
      const sum = currentMonthlyData[month].reduce((a, b) => a + b, 0);
      currentPrices.push(sum / currentMonthlyData[month].length);
    } else {
      currentPrices.push(null);
    }

    // Calculate counterpart average for this month
    if (counterpartMonthlyData[month] && counterpartMonthlyData[month].length) {
      const sum = counterpartMonthlyData[month].reduce((a, b) => a + b, 0);
      counterpartPrices.push(sum / counterpartMonthlyData[month].length);
    } else {
      counterpartPrices.push(null);
    }
  });

  // Create chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: months,
      datasets: [
        {
          label: currentProductLabel,
          data: currentPrices,
          borderColor: '#2e86de',
          backgroundColor: 'rgba(46, 134, 222, 0.1)',
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: counterpartLabel,
          data: counterpartPrices,
          borderColor: '#e74c3c',
          backgroundColor: 'rgba(231, 76, 60, 0.1)',
          borderWidth: 2,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 6,
            font: { size: 8 }
          }
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 8 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 10 } }
        }
      }
    }
  });
}

function createRegionalComparisonChart(productData, comparisonData) {
  const productName = document.getElementById('productName').value;

  // Determine if we're comparing male or female products
  let isMale = productName.includes('公');
  let isFemale = productName.includes('母');
  let isMix = productName.includes('綜貨');
  let isBlack = productName.includes('黑羽');

  // Find the correct canvas
  let canvas;
  if (isMale) {
    canvas = document.getElementById('regionalMaleComparison');
  } else if (isFemale) {
    canvas = document.getElementById('regionalFemaleComparison');
  } else if (isMix) {
    canvas = document.getElementById('regionalMixComparison');
  } else if (isBlack) {
    canvas = document.getElementById('featherTypeComparison');
  }

  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Get all regions
  const regions = {};

  if (isBlack) {
    // For black feather products, compare with all red feather products
    const isBlackFeatherMale = productName.includes('公');
    const isBlackFeatherFemale = productName.includes('母');

    regions.blackFeather = productData;
    regions.centralRed = comparisonData['中區紅羽土雞' + (isBlackFeatherMale ? '公' : '母') + '上貨'] || [];
    regions.chiayiTainanRed = comparisonData['嘉南紅羽土雞' + (isBlackFeatherMale ? '公' : '母') + '上貨'] || [];
    regions.kaohsiungPingtungRed = comparisonData['高屏紅羽土雞' + (isBlackFeatherMale ? '公' : '母') + '上貨'] || [];
  } else if (isMix) {
    // For mixed gender products, compare with other regional mix products AND gender-specific products
    if (productName.includes('嘉南')) {
      regions.chiayiTainanMix = productData;
      regions.chiayiTainanMale = comparisonData['嘉南紅羽土雞公上貨'] || [];
      regions.chiayiTainanFemale = comparisonData['嘉南紅羽土雞母上貨'] || [];
    }
  } else {
    // Regular regional comparison
    regions.central = productName.includes('中區') ? productData : (comparisonData['中區紅羽土雞' + (isMale ? '公' : '母') + '上貨'] || []);
    regions.chiayiTainan = productName.includes('嘉南') ? productData : (comparisonData['嘉南紅羽土雞' + (isMale ? '公' : '母') + '上貨'] || []);
    regions.kaohsiungPingtung = productName.includes('高屏') ? productData : (comparisonData['高屏紅羽土雞' + (isMale ? '公' : '母') + '上貨'] || []);
  }

  // Get all unique months
  const allDates = new Set();
  Object.values(regions).forEach(regionData => {
    if (regionData && regionData.length) {
      regionData.forEach(item => allDates.add(item.date.substring(0, 7)));
    }
  });

  // Sort dates
  const sortedDates = Array.from(allDates).sort();

  // Process monthly data for each region
  const datasets = [];
  const colors = ['#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f39c12', '#16a085'];

  Object.entries(regions).forEach(([regionKey, regionData], index) => {
    if (!regionData || !regionData.length) return;

    // Create monthly averages for this region
    const monthlyData = {};
    regionData.forEach(item => {
      const month = item.date.substring(0, 7);
      if (!monthlyData[month]) monthlyData[month] = [];
      monthlyData[month].push(parseFloat(item.price));
    });

    // Calculate averages
    const regionPrices = sortedDates.map(month => {
      if (monthlyData[month] && monthlyData[month].length) {
        const sum = monthlyData[month].reduce((a, b) => a + b, 0);
        return sum / monthlyData[month].length;
      }
      return null;
    });

    // Generate label based on region and product type
    let label;

    if (isBlack) {
      // Labels for black feather comparison
      if (regionKey === 'blackFeather') label = '黑羽土雞';
      else if (regionKey === 'centralRed') label = '中區紅羽土雞';
      else if (regionKey === 'chiayiTainanRed') label = '嘉南紅羽土雞';
      else if (regionKey === 'kaohsiungPingtungRed') label = '高屏紅羽土雞';

      // Add gender info to label for black feather
      label += (productName.includes('公') ? ' 公雞' : ' 母雞');
    } else if (isMix) {
      // Labels for mix product comparison
      if (regionKey === 'chiayiTainanMix') label = '嘉南綜合';
      else if (regionKey === 'chiayiTainanMale') label = '嘉南公雞';
      else if (regionKey === 'chiayiTainanFemale') label = '嘉南母雞';
    } else {
      // Labels for regular regional comparison
      if (regionKey === 'central') label = '中區';
      else if (regionKey === 'chiayiTainan') label = '嘉南';
      else if (regionKey === 'kaohsiungPingtung') label = '高屏';

      // Add gender info to label
      label += (isMale ? ' 公雞' : isFemale ? ' 母雞' : ' 混合');
    }

    // Add dataset
    datasets.push({
      label: label,
      data: regionPrices,
      borderColor: colors[index % colors.length],
      backgroundColor: `${colors[index % colors.length]}33`,
      borderWidth: 2,
      tension: 0.1
    });
  });

  // Create chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 6,
            font: { size: 8 }
          }
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 8 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 10 } }
        }
      }
    }
  });
}

function createMarketComparisonChart(productData, comparisonData) {
  const canvas = document.getElementById('marketComparison');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Calculate market average from all products
  const allProducts = [productData];
  Object.values(comparisonData).forEach(data => {
    if (data && data.length) {
      allProducts.push(data);
    }
  });

  // Get all unique months across all products
  const allDates = new Set();
  allProducts.forEach(productData => {
    productData.forEach(item => allDates.add(item.date.substring(0, 7)));
  });

  // Sort dates
  const sortedDates = Array.from(allDates).sort();

  // Calculate market average prices
  const marketMonthlyData = {};
  allProducts.forEach(productData => {
    productData.forEach(item => {
      const month = item.date.substring(0, 7);
      if (!marketMonthlyData[month]) marketMonthlyData[month] = [];
      marketMonthlyData[month].push(parseFloat(item.price));
    });
  });

  // Calculate current product monthly data
  const currentProductMonthlyData = {};
  productData.forEach(item => {
    const month = item.date.substring(0, 7);
    if (!currentProductMonthlyData[month]) currentProductMonthlyData[month] = [];
    currentProductMonthlyData[month].push(parseFloat(item.price));
  });

  // Calculate averages
  const marketPrices = sortedDates.map(month => {
    if (marketMonthlyData[month] && marketMonthlyData[month].length) {
      const sum = marketMonthlyData[month].reduce((a, b) => a + b, 0);
      return sum / marketMonthlyData[month].length;
    }
    return null;
  });

  const currentPrices = sortedDates.map(month => {
    if (currentProductMonthlyData[month] && currentProductMonthlyData[month].length) {
      const sum = currentProductMonthlyData[month].reduce((a, b) => a + b, 0);
      return sum / currentProductMonthlyData[month].length;
    }
    return null;
  });

  // Create chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: sortedDates,
      datasets: [
        {
          label: '本產品',
          data: currentPrices,
          borderColor: '#2e86de',
          backgroundColor: 'rgba(46, 134, 222, 0.1)',
          borderWidth: 2,
          tension: 0.1
        },
        {
          label: '市場平均',
          data: marketPrices,
          borderColor: '#f39c12',
          backgroundColor: 'rgba(243, 156, 18, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 6,
            font: { size: 8 }
          }
        },
        y: {
          beginAtZero: false,
          ticks: { font: { size: 8 } }
        }
      },
      plugins: {
        legend: {
          position: 'top',
          labels: { font: { size: 10 } }
        }
      }
    }
  });
}

function createAdvancedCharts(data) {
  createPriceDistributionChart(data);
}

function createPriceDistributionChart(data) {
  const ctx = document.getElementById('priceDistribution').getContext('2d');

  const prices = data.map(item => parseFloat(item.price));

  // Create price distribution histogram
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min;
  const binCount = 15;
  const binSize = range / binCount;

  const bins = Array(binCount).fill(0);

  prices.forEach(price => {
    const binIndex = Math.min(Math.floor((price - min) / binSize), binCount - 1);
    bins[binIndex]++;
  });

  const binLabels = Array(binCount).fill(0).map((_, i) => {
    const lowerBound = (min + i * binSize).toFixed(1);
    const upperBound = (min + (i + 1) * binSize).toFixed(1);
    return `${lowerBound}-${upperBound}`;
  });

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: binLabels,
      datasets: [{
        label: 'Frequency',
        data: bins,
        backgroundColor: 'rgba(87, 88, 187, 0.7)',
        borderColor: '#5758BB',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Price Range',
            font: { size: 12 }
          },
          ticks: {
            maxTicksLimit: 10,
            font: { size: 9 },
            callback: function(val, index) {
              // Only show some labels for clarity
              return index % 3 === 0 ? this.getLabelForValue(val) : '';
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Frequency',
            font: { size: 12 }
          },
          beginAtZero: true,
          ticks: { font: { size: 9 } }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            title: function(tooltipItems) {
              return tooltipItems[0].label;
            },
            label: function(context) {
              return `Count: ${context.parsed.y}`;
            }
          }
        }
      },
      interaction: {
        intersect: false,
        mode: 'nearest'
      }
    }
  });
}



function generateInsights(data, comparisonData) {
  // Generate volatility insight
  const prices = data.map(item => parseFloat(item.price));
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;

  // Calculate standard deviation (volatility)
  const squareDiffs = prices.map(price => {
    const diff = price - avg;
    return diff * diff;
  });
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
  const stdDev = Math.sqrt(avgSquareDiff);

  // Calculate price trends
  const latestPrice = prices[prices.length - 1];
  const startPrice = prices[0];
  const priceChange = ((latestPrice - startPrice) / startPrice * 100).toFixed(1);

  // Find most volatile periods
  let volatilePeriods = [];
  for (let i = 1; i < prices.length; i++) {
    const change = Math.abs(prices[i] - prices[i-1]) / prices[i-1] * 100;
    if (change > 3) { // 3% threshold for significant change
      volatilePeriods.push({
        date: data[i].date,
        change: change.toFixed(1),
        isIncrease: prices[i] > prices[i-1]
      });
    }
  }
  volatilePeriods.sort((a, b) => parseFloat(b.change) - parseFloat(a.change));
  volatilePeriods = volatilePeriods.slice(0, 3); // Top 3 most volatile periods

  const productName = document.getElementById('productName').value;

  // Generate volatility insight text
  let volatilityText = `
    <p>Over the analyzed period, ${productName} showed a volatility (standard deviation) of ${stdDev.toFixed(2)},
    which represents ${stdDev > avg * 0.1 ? 'significant' : 'moderate'} price fluctuations.</p>

    <p>The overall price trend shows a ${priceChange >= 0 ? 'gain' : 'decrease'} of ${Math.abs(priceChange)}%
    from ${startPrice.toFixed(2)} at the beginning to ${latestPrice.toFixed(2)} at the end of the period.</p>
  `;

  if (volatilePeriods.length > 0) {
    volatilityText += `<p>The most significant price changes occurred on:</p><ul>`;

    volatilePeriods.forEach(period => {
      volatilityText += `
        <li>${period.date}: ${period.change}% ${period.isIncrease ? 'increase' : 'decrease'} in price</li>
      `;
    });

    volatilityText += `</ul>`;
  }

  document.getElementById('volatilityInsight').innerHTML = volatilityText;

  // Generate seasonal insight
  const monthlyData = Array(12).fill().map(() => []);

  data.forEach(item => {
    const month = new Date(item.date).getMonth();
    monthlyData[month].push(parseFloat(item.price));
  });

  const monthlyAvgs = monthlyData.map(prices => {
    if (prices.length === 0) return null;
    return prices.reduce((a, b) => a + b, 0) / prices.length;
  });

  // Find highest and lowest months
  let highestMonth = 0;
  let lowestMonth = 0;

  for (let i = 0; i < monthlyAvgs.length; i++) {
    if (monthlyAvgs[i] !== null) {
      if (monthlyAvgs[i] > monthlyAvgs[highestMonth] || monthlyAvgs[highestMonth] === null) {
        highestMonth = i;
      }
      if (monthlyAvgs[i] < monthlyAvgs[lowestMonth] || monthlyAvgs[lowestMonth] === null) {
        lowestMonth = i;
      }
    }
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];

  const seasonalText = `
    <p>Analysis of historical price data reveals distinct seasonal patterns for ${productName}.</p>

    <p>Prices tend to be highest during ${monthNames[highestMonth]},
    where the average price reaches ${monthlyAvgs[highestMonth]?.toFixed(2) || 'N/A'}.</p>

    <p>Conversely, the lowest prices typically occur in ${monthNames[lowestMonth]},
    with an average of ${monthlyAvgs[lowestMonth]?.toFixed(2) || 'N/A'}.</p>

    <p>This seasonal variation suggests optimal purchasing and inventory management strategies
    based on the time of year. For businesses, planning purchases during low-price seasons can
    significantly impact profitability.</p>
  `;

  document.getElementById('seasonalInsight').innerHTML = seasonalText;

  // Generate market position insight
  // Compare with market average
  let allProductPrices = [];
  for (const product in comparisonData) {
    allProductPrices = allProductPrices.concat(
      comparisonData[product].map(item => parseFloat(item.price))
    );
  }

  // Add current product prices
  allProductPrices = allProductPrices.concat(prices);

  // Calculate market average
  const marketAvg = allProductPrices.reduce((a, b) => a + b, 0) / allProductPrices.length;
  const productAvg = avg;
  const pricePremium = ((productAvg - marketAvg) / marketAvg * 100).toFixed(1);

  const marketPositionText = `
    <p>Compared to the overall market average of ${marketAvg.toFixed(2)},
    ${productName} is priced at a ${pricePremium >= 0 ? 'premium' : 'discount'} of
    ${Math.abs(pricePremium)}%.</p>

    <p>This positions the product in the ${pricePremium > 5 ? 'premium' : (pricePremium < -5 ? 'value' : 'mid-range')}
    segment of the market.</p>

    <p>When comparing regional differences, the Central region's pricing for male chicken shows
    ${compareToRegionalPrices(data, comparisonData)}.</p>

    <p>The pricing relative to female chicken of the same region shows
    ${compareToFemalePrices(data, comparisonData)}.</p>
  `;

  document.getElementById('marketPositionInsight').innerHTML = marketPositionText;
}

// Helper functions
function processToMonthlyData(data) {
  const monthlyData = {};

  data.forEach(item => {
    const date = new Date(item.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = [];
    }

    monthlyData[monthYear].push(parseFloat(item.price));
  });

  // Calculate average for each month
  const monthlyAvgs = {};
  for (const month in monthlyData) {
    monthlyAvgs[month] = monthlyData[month].reduce((a, b) => a + b, 0) / monthlyData[month].length;
  }

  return monthlyAvgs;
}

function processToQuarterlyData(data) {
  const quarterlyData = {};

  data.forEach(item => {
    const date = new Date(item.date);
    const year = date.getFullYear();
    const quarter = Math.floor(date.getMonth() / 3) + 1;
    const yearQuarter = `${year}-Q${quarter}`;

    if (!quarterlyData[yearQuarter]) {
      quarterlyData[yearQuarter] = [];
    }

    quarterlyData[yearQuarter].push(parseFloat(item.price));
  });

  // Calculate average for each quarter
  const quarterlyAvgs = {};
  for (const quarter in quarterlyData) {
    quarterlyAvgs[quarter] = quarterlyData[quarter].reduce((a, b) => a + b, 0) / quarterlyData[quarter].length;
  }

  return quarterlyAvgs;
}

function compareToRegionalPrices(centralData, comparisonData) {
  const centralPrices = centralData.map(item => parseFloat(item.price));
  const centralAvg = centralPrices.reduce((a, b) => a + b, 0) / centralPrices.length;

  const chiayiKey = Object.keys(comparisonData).find(key => key.includes('嘉南') && key.includes('公上貨'));
  const kaohsiungKey = Object.keys(comparisonData).find(key => key.includes('高屏') && key.includes('公上貨'));

  const chiayiData = chiayiKey ? comparisonData[chiayiKey] : [];
  const kaohsiungData = kaohsiungKey ? comparisonData[kaohsiungKey] : [];

  if (chiayiData.length === 0 && kaohsiungData.length === 0) {
    return 'no comparable regional data available';
  }

  let comparisons = [];

  if (chiayiData.length > 0) {
    const chiayiPrices = chiayiData.map(item => parseFloat(item.price));
    const chiayiAvg = chiayiPrices.reduce((a, b) => a + b, 0) / chiayiPrices.length;

    const diff = ((centralAvg - chiayiAvg) / chiayiAvg * 100).toFixed(1);
    comparisons.push(`${diff > 0 ? 'higher' : 'lower'} prices than Chiayi-Tainan by ${Math.abs(diff)}%`);
  }

  if (kaohsiungData.length > 0) {
    const kaohsiungPrices = kaohsiungData.map(item => parseFloat(item.price));
    const kaohsiungAvg = kaohsiungPrices.reduce((a, b) => a + b, 0) / kaohsiungPrices.length;

    const diff = ((centralAvg - kaohsiungAvg) / kaohsiungAvg * 100).toFixed(1);
    comparisons.push(`${diff > 0 ? 'higher' : 'lower'} prices than Kaohsiung-Pingtung by ${Math.abs(diff)}%`);
  }

  return comparisons.join(' and ');
}

function compareToFemalePrices(maleData, comparisonData) {
  const malePrices = maleData.map(item => parseFloat(item.price));
  const maleAvg = malePrices.reduce((a, b) => a + b, 0) / malePrices.length;

  const productName = document.getElementById('productName').value;
  const femaleKey = productName.includes('公') ?
                    productName.replace('公', '母') :
                    Object.keys(comparisonData).find(key => key.includes('母'));

  const femaleData = femaleKey && comparisonData[femaleKey] ? comparisonData[femaleKey] : [];

  if (femaleData.length === 0) {
    return 'no comparable female chicken data available';
  }

  const femalePrices = femaleData.map(item => parseFloat(item.price));
  const femaleAvg = femalePrices.reduce((a, b) => a + b, 0) / femalePrices.length;

  const diff = ((maleAvg - femaleAvg) / femaleAvg * 100).toFixed(1);

  if (Math.abs(diff) < 1) {
    return 'approximately equal pricing to female chicken';
  } else {
    return `${diff > 0 ? 'a premium of' : 'a discount of'} ${Math.abs(diff)}% compared to female chicken`;
  }
}
