// Import Firebase SDK modules
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue } from "firebase/database";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDAEo9yYddRDmPierUcFLl--i8NWCLDX_M",
  authDomain: "stockgame-60441.firebaseapp.com",
  projectId: "stockgame-60441",
  storageBucket: "stockgame-60441.firebasestorage.app",
  messagingSenderId: "1071328147119",
  appId: "1:1071328147119:web:5895e48959e22560cf465a",
  measurementId: "G-DRH2X244WP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

let currentChart = null; // Track the current chart instance

const stocks = [
    { name: "TechCorp", price: 100, history: [], volatility: 0.1, dividend: 2 },
    { name: "HealthInc", price: 150, history: [], volatility: 0.05, dividend: 3 },
    { name: "EcoEnergy", price: 75, history: [], volatility: 0.15, dividend: 1 },
    { name: "AutoWorks", price: 200, history: [], volatility: 0.2, dividend: 5 },
];

let cash = 1000;
let portfolio = {};
let selectedStock = null;
let totalDebt = 0;

// Function to update price history
function updatePriceHistory() {
    stocks.forEach(stock => {
        const change = (Math.random() - 0.5) * stock.volatility * stock.price;
        stock.price = Math.max(1, stock.price + change);
        stock.history.push(stock.price);
        if (stock.history.length > 20) stock.history.shift(); // Limit history to 20 entries
    });
}

// Function to show stock details in modal
function showStockDetails(stockName) {
    const stock = stocks.find(s => s.name === stockName);
    selectedStock = stock;
    document.getElementById("modal-stock-name").textContent = stock.name;

    const ctx = document.getElementById("stock-chart").getContext("2d");

    // Destroy the old chart instance if it exists
    if (currentChart) {
        currentChart.destroy();
    }

    // Render the new chart
    currentChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: stock.history.map((_, i) => `T-${stock.history.length - i}`),
            datasets: [
                {
                    label: "Price ($)",
                    data: stock.history,
                    borderColor: "rgba(75, 192, 192, 1)",
                    borderWidth: 2,
                    fill: false,
                },
            ],
        },
        options: {
            scales: {
                x: { display: true, title: { display: true, text: "Time (Ticks)" } },
                y: { display: true, title: { display: true, text: "Price ($)" } },
            },
            responsive: true, // Ensure the chart is responsive
            maintainAspectRatio: false // Allow the chart to fill the modal
        },
    });

    // Show the modal
    document.getElementById("stock-modal").style.display = "block";
}

// Close the modal
function closeModal() {
    document.getElementById("stock-modal").style.display = "none";

    // Destroy the chart instance to free up resources
    if (currentChart) {
        currentChart.destroy();
        currentChart = null;
    }
}

// Buy stock
function buyStock(stockName, event) {
    event.stopPropagation();  // Prevent modal from opening

    const stock = stocks.find(s => s.name === stockName);
    if (cash >= stock.price) {
        cash -= stock.price;
        if (!portfolio[stock.name]) portfolio[stock.name] = 0;
        portfolio[stock.name]++;
        updatePortfolio();

        // Save updated data to Firebase
        saveUserData('user123', cash, portfolio);
    } else {
        alert("Not enough cash!");
    }
}

// Sell stock
function sellStock(stockName, event) {
    event.stopPropagation();  // Prevent modal from opening

    const stock = stocks.find(s => s.name === stockName);
    if (portfolio[stock.name] > 0) {
        cash += stock.price;
        portfolio[stock.name]--;
        if (portfolio[stock.name] === 0) delete portfolio[stock.name];
        updatePortfolio();

        // Save updated data to Firebase
        saveUserData('user123', cash, portfolio);
    } else {
        alert("You don't own this stock!");
    }
}

// Update portfolio UI
function updatePortfolio() {
    const portfolioList = document.getElementById("stocks-owned");
    portfolioList.innerHTML = "";
    Object.keys(portfolio).forEach(stock => {
        portfolioList.innerHTML += `<li>${stock}: ${portfolio[stock]} shares</li>`;
    });
    document.getElementById("cash").textContent = cash.toFixed(2);
}

// Update stock market UI
function updateMarket() {
    const stockList = document.getElementById("stock-list");
    stockList.innerHTML = "";
    stocks.forEach(stock => {
        stockList.innerHTML += `
            <div onclick="showStockDetails('${stock.name}')">
                <h3>${stock.name}</h3>
                <p>Price: $${stock.price.toFixed(2)}</p>
                <button onclick="buyStock('${stock.name}', event)">Buy</button>
                <button onclick="sellStock('${stock.name}', event)">Sell</button>
            </div>
        `;
    });
}

// Fluctuate stock prices and update history
function fluctuatePrices() {
    updatePriceHistory();
    updateMarket();

    // If a stock chart is open, update its data
    if (selectedStock && currentChart) {
        currentChart.data.datasets[0].data = selectedStock.history;
        currentChart.update();
    }
}

// Initialize the game
updateMarket();
setInterval(fluctuatePrices, 5000); // Update stock prices every 5 seconds

// Function to save user data to Firebase
function saveUserData(userId, cash, portfolio) {
    const userRef = ref(database, 'users/' + userId);
    set(userRef, {
        cash: cash,
        portfolio: portfolio
    }).then(() => {
        console.log('User data saved successfully');
    }).catch((error) => {
        console.error('Error saving user data: ', error);
    });
}

// Function to save stock data to Firebase
function saveStockData(stockName, price, history) {
    const stockRef = ref(database, 'stocks/' + stockName);
    set(stockRef, {
        price: price,
        history: history
    }).then(() => {
        console.log('Stock data saved successfully');
    }).catch((error) => {
        console.error('Error saving stock data: ', error);
    });
}

// Optional: Listening to real-time updates for user data and stock data
function listenToStockData(stockName) {
    const stockRef = ref(database, 'stocks/' + stockName);
    onValue(stockRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            const stock = stocks.find(s => s.name === stockName);
            stock.price = data.price;
            stock.history = data.history;
            updateMarket();  // Update stock price and history in your UI
        }
    });
}
