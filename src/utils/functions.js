export function getBaseUrl() {
  if (!window.location.href.includes('localhost')) {
    return "https://webshop-2025-be-g7-temp.vercel.app/";
  }
  return "http://localhost:3000/";
}

export function updateLoginLink() {
  const user = JSON.parse(localStorage.getItem("user"));
  const loginLink = document.querySelector("a[href='login.html']");

  if (user && loginLink) {
    loginLink.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="nav-icon" fill="none" viewBox="0 0 32 32">
        <path d="M6 27v-2s0-5 5-5h10c5 0 5 5 5 5v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
        <circle cx="16" cy="10" r="5" stroke="currentColor" stroke-width="2"></circle>
      </svg>
      <span>Logga ut</span>
    `;
    loginLink.href = "#";

    loginLink.addEventListener("click", async function (e) {
      e.preventDefault();
      
      // Save the current cart to the server
      await saveUserCart(user.token);
      
      // Log the user out
      localStorage.removeItem("user");
      
      // Clear the local cart
      localStorage.setItem("cart", "[]");
      cartBalanceUpdate();
      
      // Redirect to login page
      window.location.href = "login.html";
    });
  }
}

// Function to save the user's cart to the server
async function saveUserCart(token) {
  try {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    
    if (cart.length > 0) {
      const response = await fetch(`${getBaseUrl()}api/cart`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: cart }),
      });
      
      if (!response.ok) {
        console.error("Failed to save cart to server");
      }
    }
  } catch (error) {
    console.error("Error saving cart:", error);
  }
}

export function cartBalanceUpdate() {
  const storedCart = localStorage.getItem("cart");
  if (storedCart && storedCart.length > 0) {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];
    let sum = 0;
    cart.forEach(item => {
      sum += item.product.price * item.quantity;
    });

    const cartBalanceEl = document.getElementById("cartBalance");
    if (cartBalanceEl) {
      cartBalanceEl.textContent = `${Math.floor(sum)},00 kr`;
      
      const meterFill = document.querySelector('.meter-fill');
      if (meterFill) {
        const fillPercentage = Math.min(sum / 600 * 100, 100);
        meterFill.style.width = `${fillPercentage}%`;
        
        if (sum >= 500) {
          meterFill.style.backgroundColor = '#91DD4C';
        } else {
          meterFill.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
        }
        
        const checkBadge = document.querySelector('.check-badge');
        if (checkBadge) {
          if (sum >= 500) {
            checkBadge.style.display = 'flex';
          } else {
            checkBadge.style.display = 'none';
          }
        }
      }
    }
  } else {
    const cartBalanceEl = document.getElementById("cartBalance");
    if (cartBalanceEl) {
      cartBalanceEl.textContent = `0,00 kr`;
      
      const meterFill = document.querySelector('.meter-fill');
      if (meterFill) {
        meterFill.style.width = '0%';
        meterFill.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
      }
      
      const checkBadge = document.querySelector('.check-badge');
      if (checkBadge) {
        checkBadge.style.display = 'none';
      }
    }
  }
}