// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBzEB5vLb3VAw6Tk3k6zMn78VO4scvCWow",
    authDomain: "stock-game-5c955.firebaseapp.com",
    projectId: "stock-game-5c955",
    storageBucket: "stock-game-5c955.firebasestorage.app",
    messagingSenderId: "70023379312",
    appId: "1:70023379312:web:2fbe7d23a553be3f82b7b5",
    measurementId: "G-JH4QJVYS4Z"
  };
  // Initialize Firebase
  const app = firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  const db = firebase.firestore();
  
  let currentUser = null;
  let cash = 1000; // Starting cash value
  let portfolio = {}; // User's stock portfolio
  
  // Check if the user is authenticated
  auth.onAuthStateChanged((user) => {
      if (user) {
          currentUser = user;
          checkUserData();
          showGamePage();
      } else {
          showLoginPage();
      }
  });
  
  // Login with Google
  function loginWithGoogle() {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).then((result) => {
          currentUser = result.user;
          checkUserData();
          showGamePage();
      }).catch((error) => {
          console.error(error.message);
      });
  }
  
  // Login with Email and Password
  function loginWithEmail() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      auth.signInWithEmailAndPassword(email, password).then((userCredential) => {
          currentUser = userCredential.user;
          checkUserData();
          showGamePage();
      }).catch((error) => {
          console.error(error.message);
      });
  }
  
  // Create an Account with Email and Password
  function createAccount() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      auth.createUserWithEmailAndPassword(email, password).then((userCredential) => {
          currentUser = userCredential.user;
          checkUserData();
          showGamePage();
      }).catch((error) => {
          console.error(error.message);
      });
  }
  
  // Logout
  function logout() {
      auth.signOut().then(() => {
          currentUser = null;
          showLoginPage();
      }).catch((error) => {
          console.error(error.message);
      });
  }
  
  // Show the stock game page
  function showGamePage() {
      document.getElementById('login-section').style.display = 'none';
      document.getElementById('game-section').style.display = 'block';
      loadStockList();
      loadUserPortfolio();
  }
  
  // Show the login page
  function showLoginPage() {
      document.getElementById('login-section').style.display = 'block';
      document.getElementById('game-section').style.display = 'none';
  }
  
  // Check user data in Firestore
  function checkUserData() {
      const userRef = db.collection('users').doc(currentUser.uid);
      userRef.get().then((doc) => {
          if (doc.exists) {
              const userData = doc.data();
              cash = userData.cash || 1000;
              portfolio = userData.portfolio || {};
              updateUI();
          } else {
              userRef.set({
                  cash: 1000,
                  portfolio: {}
              });
          }
      }).catch((error) => {
          console.error(error.message);
      });
  }
  
  // Update UI (cash and portfolio)
  function updateUI() {
      document.getElementById('cash').textContent = cash;
      loadUserPortfolio();
  }
  
  // Load stock list (Fake stocks for the game)
  function loadStockList() {
      const stockList = [
          { symbol: 'AAPL', name: 'Apple', price: 150 },
          { symbol: 'GOOG', name: 'Google', price: 2500 },
          { symbol: 'AMZN', name: 'Amazon', price: 3500 },
          // Add more stocks here
      ];
  
      const stockListElement = document.getElementById('stock-list');
      stockListElement.innerHTML = '';
      stockList.forEach((stock) => {
          const stockItem = document.createElement('li');
          stockItem.textContent = `${stock.name} (${stock.symbol}) - $${stock.price}`;
          const buyButton = document.createElement('button');
          buyButton.textContent = 'Buy';
          buyButton.onclick = () => buyStock(stock.symbol, stock.price);
          stockItem.appendChild(buyButton);
          stockListElement.appendChild(stockItem);
      });
  }
  
  // Load the user's portfolio
  function loadUserPortfolio() {
      const portfolioListElement = document.getElementById('portfolio-list');
      portfolioListElement.innerHTML = '';
      for (const symbol in portfolio) {
          const stock = portfolio[symbol];
          const portfolioItem = document.createElement('li');
          portfolioItem.textContent = `${stock.name} (${stock.symbol}) - Quantity: ${stock.quantity}`;
          portfolioListElement.appendChild(portfolioItem);
      }
  }
  
  // Buy Stock
  function buyStock(symbol, price) {
      if (cash >= price) {
          cash -= price;
          if (portfolio[symbol]) {
              portfolio[symbol].quantity += 1;
          } else {
              portfolio[symbol] = { symbol, name: symbol, quantity: 1 };
          }
          saveUserData();
          updateUI();
      } else {
          alert("You don't have enough cash to buy this stock.");
      }
  }
  
  // Save user data to Firestore
  function saveUserData() {
      const userRef = db.collection('users').doc(currentUser.uid);
      userRef.set({
          cash,
          portfolio
      }, { merge: true });
  }
  