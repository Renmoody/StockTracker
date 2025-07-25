const stocksDiv = document.getElementById('stocks');
const tickers = [];
const chartContainer = document.querySelector('.chart-container');
const charts = {};

import { API_KEY } from './config.js';

// Fetch stock data from Alpha Vantage API
async function fetchStock(ticker) {
  console.log(`Fetching stock data for: ${ticker}`);
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(`Raw data for ${ticker}:`, data);
    return data['Global Quote'];
  } catch (error) {
    console.error(`Error fetching ${ticker}:`, error);
    return null;
  }
}

// Update prices and charts for all tickers
async function updateStocks() {
  for (const ticker of tickers) {
    const stock = await fetchStock(ticker);
    if (!stock || !stock['05. price']) continue;

    const price = parseFloat(stock['05. price']);
    const timestamp = new Date().toLocaleTimeString();

    const chart = charts[ticker];
    if (!chart) continue;

    // Update chart labels & data
    if (!chart.data.labels.includes(timestamp)) {
      chart.data.labels.push(timestamp);
    }
    chart.data.datasets[0].data.push(price);

    // Keep last 20 data points max
    if (chart.data.labels.length > 20) chart.data.labels.shift();
    if (chart.data.datasets[0].data.length > 20) chart.data.datasets[0].data.shift();

    chart.update();

    // Update textual stock info
    updateStockInfo(ticker, price, stock['10. change percent']);
  }
}

// Update or create textual stock info for a ticker
function updateStockInfo(ticker, price, changePercent) {
  let el = document.querySelector(`.stock[data-ticker="${ticker}"]`);
  if (!el) {
    el = document.createElement('div');
    el.className = 'stock';
    el.dataset.ticker = ticker;
    stocksDiv.appendChild(el);
  }
  el.innerText = `${ticker}: $${price.toFixed(2)} (${changePercent})`;
}

// Add a chart for a ticker with a remove button
function addChartForTicker(ticker) {
  // Wrapper div
  const chartWrapper = document.createElement('div');
  chartWrapper.className = 'chart-item';
  chartWrapper.style.position = 'relative'; // for absolute remove btn

  // Remove button
  const removeBtn = document.createElement('button');
  removeBtn.innerText = '×';
  removeBtn.title = 'Remove this ticker';
  removeBtn.className = 'remove-btn'; // style via CSS if you want


  removeBtn.addEventListener('click', () => {
    // Remove ticker from list
    const index = tickers.indexOf(ticker);
    if (index > -1) tickers.splice(index, 1);

    // Destroy chart instance and delete ref
    if (charts[ticker]) {
      charts[ticker].destroy();
      delete charts[ticker];
    }

    // Remove chart element
    chartWrapper.remove();

    // Remove textual stock info element
    const stockInfo = document.querySelector(`.stock[data-ticker="${ticker}"]`);
    if (stockInfo) stockInfo.remove();

    console.log(`Removed ticker: ${ticker}`);
  });

  // Canvas for Chart.js
  const canvas = document.createElement('canvas');

  // Append elements
  chartWrapper.appendChild(removeBtn);
  chartWrapper.appendChild(canvas);
  chartContainer.appendChild(chartWrapper);

  // Create Chart.js instance
  const ctx = canvas.getContext('2d');
  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: ticker,
        data: [],
        borderColor: getRandomColor(),
        fill: false,
        tension: 0.1,
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { title: { display: true, text: 'Time' }},
        y: { title: { display: true, text: 'Price ($)' }}
      }
    }
  });

  charts[ticker] = chart;
}

// Add ticker handler exposed globally (for HTML button onclick)
window.addTicker = async function() {
  const input = document.getElementById('tickerInput');
  const ticker = input.value.trim().toUpperCase();
  if (!ticker) {
    console.log("Please enter a ticker symbol.");
    return;
  }
  if (tickers.includes(ticker)) {
    console.log(`Ticker "${ticker}" already added.`);
    return;
  }

  tickers.push(ticker);
  input.value = '';

  addChartForTicker(ticker);

  console.log(`Added ticker: ${ticker}`);
  await updateStocks();
};

// Generate a random hex color for chart lines
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  console.log(`Generated color: ${color}`);
  return color;
}

// Auto-refresh every 60 seconds
setInterval(updateStocks, 60 * 1000);
console.log('Auto-refresh set up to run every 60 seconds.');
