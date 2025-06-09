document.addEventListener('DOMContentLoaded', function() {
    fetchOverviewData();
});

async function fetchOverviewData() {
    try {
        // Fetch data for all products for overview comparison
        const productNames = [
            '中區紅羽土雞公上貨', '中區紅羽土雞母上貨',
            '嘉南紅羽土雞公上貨', '嘉南紅羽土雞母上貨',
            '高屏紅羽土雞公上貨', '高屏紅羽土雞母上貨',
            '嘉南紅羽土雞綜貨', '黑羽土雞公舍飼', '黑羽土雞母舍飼'
        ];

        let allProductsData = {};

        for (const product of productNames) {
            const params = new URLSearchParams();
            params.append('name', product);
            params.append('sort', 'date_asc');

            const response = await fetch('/api/prices?' + params.toString());
            const data = await response.json();

            if (data.length > 0) {
                allProductsData[product] = data;
            }
        }

        updateMarketStatistics(allProductsData);
        createGenderComparisonChart(allProductsData);
        createRegionalComparisonChart(allProductsData);
        createYearlyTrendChart(allProductsData);
        createSeasonalPatternChart(allProductsData);

    } catch (error) {
        console.error('Error fetching overview data:', error);
    }
}

function updateMarketStatistics(allProductsData) {
    // Calculate market-wide statistics
    let allPrices = [];

    for (const product in allProductsData) {
        const prices = allProductsData[product].map(item => parseFloat(item.price));
        allPrices = allPrices.concat(prices);
    }

    if (allPrices.length > 0) {
        const avg = allPrices.reduce((a, b) => a + b, 0) / allPrices.length;
        const min = Math.min(...allPrices);
        const max = Math.max(...allPrices);

        // Calculate standard deviation (volatility)
        const squareDiffs = allPrices.map(price => {
            const diff = price - avg;
            return diff * diff;
        });
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
        const stdDev = Math.sqrt(avgSquareDiff);

        document.getElementById('marketAvg').textContent = avg.toFixed(2);
        document.getElementById('marketRange').textContent = `${min.toFixed(2)} - ${max.toFixed(2)}`;
        document.getElementById('marketVolatility').textContent = stdDev.toFixed(2);
    }
}

function createGenderComparisonChart(allProductsData) {
    // Group male vs female products for comparison
    const maleProducts = ['中區紅羽土雞公上貨', '嘉南紅羽土雞公上貨', '高屏紅羽土雞公上貨', '黑羽土雞公舍飼'];
    const femaleProducts = ['中區紅羽土雞母上貨', '嘉南紅羽土雞母上貨', '高屏紅羽土雞母上貨', '黑羽土雞母舍飼'];
    const mixProducts = ['嘉南紅羽土雞綜貨'];

    // Calculate monthly averages for each gender
    const monthlyData = processMonthlyAverages(allProductsData, maleProducts, femaleProducts, mixProducts);

    const ctx = document.getElementById('genderComparisonChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: monthlyData.labels,
            datasets: [
                {
                    label: 'Male Average',
                    data: monthlyData.maleAvg,
                    borderColor: '#2e86de',
                    backgroundColor: 'rgba(46, 134, 222, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#2e86de',
                    pointBorderWidth: 2,
                    pointHitRadius: 5
                },
                {
                    label: 'Female Average',
                    data: monthlyData.femaleAvg,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#ff6b6b',
                    pointBorderWidth: 2,
                    pointHitRadius: 5
                },
                {
                    label: 'Mixed Average',
                    data: monthlyData.mixAvg,
                    borderColor: '#28a745',
                    backgroundColor: 'rgba(40, 167, 69, 0.1)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#28a745',
                    pointBorderWidth: 2,
                    pointHitRadius: 5
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 10 } }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 6, font: { size: 10 } },
                    title: {
                        display: true,
                        // text: 'Month/Year',
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
            }
        }
    });
}

function createRegionalComparisonChart(allProductsData) {
    // Group by region for comparison
    const centralProducts = ['中區紅羽土雞公上貨', '中區紅羽土雞母上貨'];
    const chiayiTainanProducts = ['嘉南紅羽土雞公上貨', '嘉南紅羽土雞母上貨', '嘉南紅羽土雞綜貨'];
    const kaohsiungPingtungProducts = ['高屏紅羽土雞公上貨', '高屏紅羽土雞母上貨'];

    // Calculate regional averages
    const regionalData = processRegionalAverages(
        allProductsData,
        centralProducts,
        chiayiTainanProducts,
        kaohsiungPingtungProducts
    );

    const ctx = document.getElementById('regionalComparisonChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: regionalData.labels,
            datasets: [
                {
                    label: 'Central',
                    data: regionalData.centralAvg,
                    backgroundColor: '#2e86de'
                },
                {
                    label: 'Chiayi-Tainan',
                    data: regionalData.chiayiTainanAvg,
                    backgroundColor: '#20bf6b'
                },
                {
                    label: 'Kaohsiung-Pingtung',
                    data: regionalData.kaohsiungPingtungAvg,
                    backgroundColor: '#f39c12'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 10 } }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { maxTicksLimit: 6, font: { size: 10 } },
                    title: {
                        display: true,
                        // text: 'Year-Quarter',
                        padding: 10,
                        font: { size: 12 }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: { font: { size: 10 } },
                    title: {
                        display: true,
                        text: 'Average Price',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function createYearlyTrendChart(allProductsData) {
    // Calculate yearly averages for all products
    const yearlyData = processYearlyAverages(allProductsData);

    const ctx = document.getElementById('yearlyTrendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: yearlyData.years,
            datasets: [
                {
                    label: 'Yearly Average Price',
                    data: yearlyData.averages,
                    borderColor: '#5758BB',
                    backgroundColor: 'rgba(87, 88, 187, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#5758BB',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 10 } }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                    title: {
                        display: true,
                        // text: 'Year',
                        padding: 10,
                        font: { size: 12 }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: { font: { size: 10 } },
                    title: {
                        display: true,
                        text: 'Average Price',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function createSeasonalPatternChart(allProductsData) {
    // Calculate seasonal patterns (monthly averages across all years)
    const seasonalData = processSeasonalPatterns(allProductsData);

    const ctx = document.getElementById('seasonalPatternChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Monthly Average (All Years)',
                    data: seasonalData,
                    borderColor: '#e74c3c',
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 3,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#e74c3c',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { boxWidth: 12, font: { size: 10 } }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { font: { size: 10 } },
                    title: {
                        display: true,
                        // text: 'Month',
                        padding: 10,
                        font: { size: 12 }
                    }
                },
                y: {
                    beginAtZero: false,
                    ticks: { font: { size: 10 } },
                    title: {
                        display: true,
                        text: 'Average Price',
                        font: { size: 12 }
                    }
                }
            }
        }
    });
}

function processMonthlyAverages(allProductsData, maleProducts, femaleProducts, mixProducts) {
    // Process data to get monthly averages for male, female, and mixed products
    const monthlyMale = {};
    const monthlyFemale = {};
    const monthlyMix = {};

    // Process male products
    for (const product of maleProducts) {
        if (!allProductsData[product]) continue;

        allProductsData[product].forEach(item => {
            const date = new Date(item.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyMale[monthYear]) {
                monthlyMale[monthYear] = [];
            }

            monthlyMale[monthYear].push(parseFloat(item.price));
        });
    }

    // Process female products
    for (const product of femaleProducts) {
        if (!allProductsData[product]) continue;

        allProductsData[product].forEach(item => {
            const date = new Date(item.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyFemale[monthYear]) {
                monthlyFemale[monthYear] = [];
            }

            monthlyFemale[monthYear].push(parseFloat(item.price));
        });
    }

    // Process mixed products
    for (const product of mixProducts) {
        if (!allProductsData[product]) continue;

        allProductsData[product].forEach(item => {
            const date = new Date(item.date);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!monthlyMix[monthYear]) {
                monthlyMix[monthYear] = [];
            }

            monthlyMix[monthYear].push(parseFloat(item.price));
        });
    }

    // Calculate averages
    const months = [...new Set([...Object.keys(monthlyMale), ...Object.keys(monthlyFemale), ...Object.keys(monthlyMix)])].sort();
    const maleAvg = months.map(month => {
        if (!monthlyMale[month] || monthlyMale[month].length === 0) return null;
        return monthlyMale[month].reduce((a, b) => a + b, 0) / monthlyMale[month].length;
    });

    const femaleAvg = months.map(month => {
        if (!monthlyFemale[month] || monthlyFemale[month].length === 0) return null;
        return monthlyFemale[month].reduce((a, b) => a + b, 0) / monthlyFemale[month].length;
    });

    const mixAvg = months.map(month => {
        if (!monthlyMix[month] || monthlyMix[month].length === 0) return null;
        return monthlyMix[month].reduce((a, b) => a + b, 0) / monthlyMix[month].length;
    });

    // Format labels for display
    const labels = months.map(month => {
        const [year, monthNum] = month.split('-');
        return `${monthNum}/${year.slice(2)}`;
    });

    return { labels, maleAvg, femaleAvg, mixAvg };
}

function processRegionalAverages(
    allProductsData,
    centralProducts,
    chiayiTainanProducts,
    kaohsiungPingtungProducts
) {
    // Process data to get quarterly regional averages
    const centralQuarterly = {};
    const chiayiTainanQuarterly = {};
    const kaohsiungPingtungQuarterly = {};

    // Helper function to process products by region
    function processRegionProducts(products, quarterlyData) {
        for (const product of products) {
            if (!allProductsData[product]) continue;

            allProductsData[product].forEach(item => {
                const date = new Date(item.date);
                const year = date.getFullYear();
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                const yearQuarter = `${year}-Q${quarter}`;

                if (!quarterlyData[yearQuarter]) {
                    quarterlyData[yearQuarter] = [];
                }

                quarterlyData[yearQuarter].push(parseFloat(item.price));
            });
        }
    }

    // Process each region
    processRegionProducts(centralProducts, centralQuarterly);
    processRegionProducts(chiayiTainanProducts, chiayiTainanQuarterly);
    processRegionProducts(kaohsiungPingtungProducts, kaohsiungPingtungQuarterly);

    // Get all quarters
    const quarters = [...new Set([
        ...Object.keys(centralQuarterly),
        ...Object.keys(chiayiTainanQuarterly),
        ...Object.keys(kaohsiungPingtungQuarterly)
    ])].sort();

    // Calculate averages
    const centralAvg = quarters.map(quarter => {
        if (!centralQuarterly[quarter] || centralQuarterly[quarter].length === 0) return null;
        return centralQuarterly[quarter].reduce((a, b) => a + b, 0) / centralQuarterly[quarter].length;
    });

    const chiayiTainanAvg = quarters.map(quarter => {
        if (!chiayiTainanQuarterly[quarter] || chiayiTainanQuarterly[quarter].length === 0) return null;
        return chiayiTainanQuarterly[quarter].reduce((a, b) => a + b, 0) / chiayiTainanQuarterly[quarter].length;
    });

    const kaohsiungPingtungAvg = quarters.map(quarter => {
        if (!kaohsiungPingtungQuarterly[quarter] || kaohsiungPingtungQuarterly[quarter].length === 0) return null;
        return kaohsiungPingtungQuarterly[quarter].reduce((a, b) => a + b, 0) / kaohsiungPingtungQuarterly[quarter].length;
    });

    return {
        labels: quarters,
        centralAvg,
        chiayiTainanAvg,
        kaohsiungPingtungAvg
    };
}

function processYearlyAverages(allProductsData) {
    // Process data to get yearly averages across all products
    const yearlyPrices = {};

    // Collect all prices by year
    for (const product in allProductsData) {
        allProductsData[product].forEach(item => {
            const year = new Date(item.date).getFullYear();

            if (!yearlyPrices[year]) {
                yearlyPrices[year] = [];
            }

            yearlyPrices[year].push(parseFloat(item.price));
        });
    }

    // Calculate yearly averages
    const years = Object.keys(yearlyPrices).sort();
    const averages = years.map(year => {
        return yearlyPrices[year].reduce((a, b) => a + b, 0) / yearlyPrices[year].length;
    });

    return { years, averages };
}

function processSeasonalPatterns(allProductsData) {
    // Process data to get monthly averages across all years and products
    const monthlyPrices = Array(12).fill(0).map(() => []);

    // Collect all prices by month
    for (const product in allProductsData) {
        allProductsData[product].forEach(item => {
            const month = new Date(item.date).getMonth();
            monthlyPrices[month].push(parseFloat(item.price));
        });
    }

    // Calculate monthly averages
    return monthlyPrices.map(prices => {
        if (prices.length === 0) return null;
        return prices.reduce((a, b) => a + b, 0) / prices.length;
    });
}