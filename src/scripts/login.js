import { getBaseUrl } from "../utils/api.js";
import { updateLoginLink, cartBalanceUpdate } from "../utils/functions.js";

document.addEventListener("DOMContentLoaded", function () {
  // Update cart balance display
  cartBalanceUpdate();
  
  // Update login link
  updateLoginLink();
  
  initLogin();
});

function initLogin() {
  const loginForm = document.getElementById("loginForm");

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await handleLogin();
  });
}

async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const loginData = {
    username: email,
    password: password,
  };

  try {
    const response = await fetch(`${getBaseUrl()}api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    if (response.ok) {
      const result = await response.json();
      localStorage.setItem("user", JSON.stringify(result));
      
      // Fetch the user's saved cart
      await fetchUserCart(result.token);
      
      window.location.href = "index.html";
    } else {
      alert("Fel användarnamn eller lösenord.");
    }
  } catch (error) {
    console.error("Inloggningsfel:", error);
    alert("Ett tekniskt fel uppstod vid inloggningen.");
  }
}

// Function to fetch user's saved cart
async function fetchUserCart(token) {
  try {
    const response = await fetch(`${getBaseUrl()}api/cart`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const cartData = await response.json();
      if (cartData && cartData.items) {
        localStorage.setItem("cart", JSON.stringify(cartData.items));
        cartBalanceUpdate();
      }
    }
  } catch (error) {
    console.error("Error fetching user cart:", error);
  }
}
