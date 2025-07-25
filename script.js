const stocksDiv = document.getElementById('stocks');
const tickers = [];
const API_KEY = 'YOUR_ALPHA_VANTAGE_API_KEY'; // Replace with your API key!

// Chart.js setup
const ctx = document.getElementById('stockChart').getContext('2d');
const stockChart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: [], // timestamps
    datasets: []
  },
  options: {
    responsive: true,
    scales: {
      x: { display: true, title: { display: true, text: 'Time' }},
      y: { display: true, title: { display: true, text: 'Price ($)' }}
    }
  }
});

async function fetchStock(ticker) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  return data['Global Quote'];
}

async function updateStocks() {
  stocksDiv.innerHTML = '';
  for (const ticker of tickers) {
    const stock = await fetchStock(ticker);
    const price = stock['05. price'];
    const change = stock['10. change percent'];
    const el = document.createElement('div');
    el.className = 'stock';
    el.innerText = `${ticker}: $${parseFloat(price).toFixed(2)} (${change})`;
    stocksDiv.appendChild(el);

    // Update chart dataset for this ticker
    let dataset = stockChart.data.datasets.find(ds => ds.label === ticker);
    if (!dataset) {
      dataset = {
        label: ticker,
        data: [],
        borderColor: getRandomColor(),
        fill: false,
        tension: 0.1
      };
      stockChart.data.datasets.push(dataset);
    }

    const timestamp = new Date().toLocaleTimeString();
    if (!stockChart.data.labels.includes(timestamp)) {
      stockChart.data.labels.push(timestamp);
    }

    dataset.data.push(parseFloat(price));
    if (dataset.data.length > 20) {
      dataset.data.shift();
    }
  }

  if (stockChart.data.labels.length > 20) {
    stockChart.data.labels.shift();
  }

  stockChart.update();
}

function addTicker() {
  const input = document.getElementById('tickerInput');
  const ticker = input.value.trim().toUpperCase();
  if (ticker && !tickers.includes(ticker)) {
    tickers.push(ticker);
    input.value = '';
    updateStocks();
  }
}

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Refresh every minute
setInterval(updateStocks, 60 * 1000);
