import { fetchProducts, addProducts, checkAdmin, getCategories, updateProduct, deleteProduct } from "../utils/api.js";
import { cartBalanceUpdate, updateLoginLink } from "../utils/functions.js";
import { getBaseUrl } from "../utils/api.js";


document.addEventListener("DOMContentLoaded", async function () {
  loadProducts();
  updateCartItems();
  updateLoginLink();
  testCheckAdmin();
  addProductForm();

  const searchInput = document.querySelector(".search-container input");
  searchInput.addEventListener("keypress", async (event) => {
    if (event.key === "Enter") {
      const query = searchInput.value.trim();
      if (query) {
        await searchProducts(query);
      }else {
        loadProducts();
      }
    }
  });
});


async function searchProducts(query) {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = `
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>Söker...</p>
    </div>
  `;

  try {  
    const isAdmin = await checkAdmin();
    const response = await fetch(`${getBaseUrl()}api/products/search?q=${encodeURIComponent(query)}`);
    const products = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        productsContainer.innerHTML = `
          <div class="error-message">
            <p>${products.message}</p>
          </div>
        `;
        return;
      }
      throw new Error(products.error || "Kunde inte hämta produkter från sökningen.");
    }

    productsContainer.innerHTML = "";

    if (products.length > 0) {
      products.forEach((product) => {
        const card = isAdmin
          ? createAdminProductCard(product) 
          : createProductCard(product); 
        productsContainer.appendChild(card);
      });

      setupCategoryFilters(products, isAdmin);
      
    } else {
      productsContainer.innerHTML = "<p>Inga produkter matchar din sökning.</p>";
    }
  } catch (error) {
    console.error("Error searching for products:", error);
    productsContainer.innerHTML = `
    <div class="error-message">
      <p>Oops! Something went wrong:</p>
      <p>${error.message}</p>
    </div>
  `;
  }
}


async function testCheckAdmin() {
  let test = JSON.parse(localStorage.getItem("user"));

}

async function loadProducts() {
  let isAdmin = await checkAdmin();
  
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "<div class='spinner'></div>";
  

  try {
    const products = await fetchProducts();
    productsContainer.innerHTML = "";

    if (products.length > 0) {
      // Vänd på produktlistan för att visa de senaste först
      const reversedProducts = [...products].reverse();
      
      reversedProducts.forEach((product) => {
        const card = isAdmin
          ? createAdminProductCard(product)
          : createProductCard(product);
        productsContainer.appendChild(card);
      });

      // Setup kategori-filter efter att produkter laddats
      setupCategoryFilters(products, isAdmin);
    } else {
      productsContainer.innerHTML = "<p>No products available.</p>";
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    productsContainer.innerHTML = "<p>Failed to load products.</p>";
  }
}


function createAdminProductCard(product) {
  const element = document.createElement("div");
  let productStock = "Lager: " + product.stock + "st";
  element.className = "product-card";
  element.innerHTML = `
    <img src="${product.imageUrl}" alt="Bild på ${product.name}" class="prod-card-img">
  
    <p class="price">${product.price.toFixed(0)}:-</p>
    <h3>${product.name}</h3>
    <p>${productStock}</p>
    <button class="edit-product-btn">Redigera produkt</button>
    <button class="delete-product-btn">Ta bort produkt</button>
    <button class="add-to-cart-btn">Köp</button>
  `;

  element.querySelector(".add-to-cart-btn").addEventListener("click", (event) => {
    event.stopPropagation(); 
    addToCart(product);
  });

  element.querySelector(".edit-product-btn").addEventListener("click", (event) => {
    event.stopPropagation(); 
    editProduct(product);
  });

  element.querySelector(".delete-product-btn").addEventListener("click", (event) => {
    event.stopPropagation(); 
    deleteProductHandler(product);
  });


  element.addEventListener("click", () => {
    window.location.href = `product.html?id=${product._id}`;
  });

  return element;
}

function createProductCard(product) {
  const element = document.createElement("div");
  let productStock = "Lager: " + product.stock + "st";
  element.className = "product-card";
  element.innerHTML = `
    <img src="${product.imageUrl}" alt="Bild på ${product.name}" class="prod-card-img">
    <p class="price">${product.price.toFixed(0)}:-</p>    
    <h3>${product.name}</h3>
    <p>${productStock}</p>
    <button class="add-to-cart-btn">Köp</button>
  `;

  element.querySelector(".add-to-cart-btn").addEventListener("click", (event) => {
    event.stopPropagation(); 
    addToCart(product);
  });

  element.addEventListener("click", () => {
    window.location.href = `product.html?id=${product._id}`;
  });

  return element;
}


async function addProductForm() {
  let isAdmin = await checkAdmin();
  if (isAdmin) {
    try {
      let formContainer = document.getElementById("addProductContainer");
      let form = document.createElement("form")
      form.setAttribute("id", "addProduct");
      form.innerHTML = `
        <label for="name">Namn på produkt</label>
        <input type="text" name="name" id="name" class="prodInp" required>
        <label for="ImgUrl">Bild url</label>
        <input type="text" class="prodInp" id="imageUrl" required>
        <label for="price">Pris</label>
        <input type="number" name="price" id="price" class="prodInp" min="0.01" value="0" step="any" required>
        <label for="category">Kategori</label>
        <select name="category" id="category" class="prodInp">
        <option value=""></option>
        </select>
        <label for="description">Beskrivning</label>
        <textarea name="description" id="description" class="prodInp"></textarea>
        <label for="stock">Lager</label>
        <input type="number" name="stock" id="stock" class="prodInp" min="0" value="0">
        <button type="submit">Lägg till</button>
    `
      formContainer.innerHTML = ""
      formContainer.appendChild(form);
      fillCategory();

      document.getElementById("addProduct").addEventListener("submit", function (e) {
        e.preventDefault();
        addProduct();
        loadProducts();
      });

    } catch (error) {
      console.error("Error showing product form: ", error)
    }
  }

}
/* Ändrat lite för kategorier */
async function fillCategory() {
  try {
    let categories = await getCategories();
    let categoryContainer = document.getElementById("category")
    categories.forEach(category => {
      let element = document.createElement("option");
      element.innerHTML = `${category.name}`;
      element.value = `${category._id}`
      categoryContainer.appendChild(element);
    });
  } catch (error) {
    console.error("Error storing categories", error)
  }
}

async function addProduct() {
  try {
    const product = {
      name: document.getElementById("name").value,
      price: document.getElementById("price").value,
      description: document.getElementById("description").value,
      imageUrl: document.getElementById("imageUrl").value,
      category: document.getElementById("category").value,
      stock: document.getElementById("stock").value
    };
    addProducts(product);
    loadProducts();
    document.getElementById("addProduct").reset();
  } catch (error) {
    console.error("Error adding product: ", error);
  }
}

async function editProduct(product) {
  let name = product.name;
  let description = product.description;
  let price = product.price;
  let stock = product.stock;
  let imageUrl = product.imageUrl;
  let category = product.category;

  if (confirm("Vill du byta namn på produkten?")) {
    let newName = prompt(`Skriv in nytt namn för produkten. ${product.name}`, product.name);
    if (newName) {
      name = newName;
    }
  }
  if (confirm("Vill du byta beskrivning för produkten?")) {
    let newDesc = prompt(`Skriv in ny beskrivning för produkten. ${product.description}`, product.description);
    if (newDesc) {
      description = newDesc;
    }
  }
  if (confirm("Vill du byta pris på produkten?")) {
    let newPrice = prompt(`Skriv in nytt pris för produkten. ${product.price}`, product.price);
    if (newPrice && !isNaN(newPrice)) {
      price = parseFloat(newPrice);
    }
  }

  if (confirm("Vill du byta bild-url för produkten?")) {
    let newImgUrl = prompt(`Skriv in ny bild-url för produkten. ${product.imageUrl}`, product.imageUrl);
    if (newImgUrl) {
      imageUrl = newImgUrl;
    }
  }


  if (confirm("Vill du byta lager för produkten?")) {
    let newStock = prompt(`Skriv in nytt lager för produkten. ${product.stock}`, product.stock);
    if (newStock && !isNaN(newStock)) {
      stock = parseInt(newStock);
    }
  }

  if (confirm("Vill du byta kategori för produkten?")) {
    const categories = await getCategories(); 
    const categoryOptions = categories.map((cat, index) => `${index + 1}. ${cat.name}`).join("\n");
    const selectedCategoryIndex = prompt(`Välj en ny kategori:\n${categoryOptions}`, "1");

    if (selectedCategoryIndex && !isNaN(selectedCategoryIndex)) {
      const selectedIndex = parseInt(selectedCategoryIndex, 10) - 1;
      if (categories[selectedIndex]) {
        category = categories[selectedIndex]._id;
      }
    }
  }

  let editedProduct = { name, description, price, imageUrl, category, stock };
  await updateProduct(editedProduct, product._id,);
  loadProducts();
}

function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existingProductId = cart.findIndex(item => JSON.stringify(item.product) === JSON.stringify(product));
  console.log(cart)
  if (existingProductId !== -1) {
    let existingProduct = cart[existingProductId];
    let updatedQuantity = existingProduct.quantity + 1;
    if (updatedQuantity > product.stock) {
      alert("You already have all the stock in your cart");
      existingProduct.quantity = product.stock;
    } else {
      existingProduct.quantity = updatedQuantity;
    }
    cart[existingProductId] = existingProduct;
    console.log(cart)
  } else {
    if (product.stock > 0) {
      cart.push({
        product: product,
        quantity: 1
      });
      console.log(cart)
    } else {
      alert("out of stock")
    }
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  cartBalanceUpdate();
}
/* Fixed for Category---------------------- */
async function updateCartItems() {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const products = await fetchProducts();

  cart = cart.filter(item => {
    let exists = products.some(product => item.product._id === product._id);
    return exists;
  });

  cart.forEach(item => {
    products.forEach(product => {
      if (item.product._id === product._id) {
        item.product = product;
        if (item.quantity > item.product.stock) {
          item.quantity = item.product.stock;
        }
      }
    });
  });

  localStorage.setItem('cart', JSON.stringify(cart));
  cartBalanceUpdate();
}

// Filtrera produkter utifrån kategori
function setupCategoryFilters(products, isAdmin) {
  const categoryLinks = document.querySelectorAll(".category-menu a");

  categoryLinks.forEach(link => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const selectedCategory = link.dataset.category;

      const productsContainer = document.getElementById("products");
      productsContainer.innerHTML = "";

      let filtered = selectedCategory === "Alla"
        ? products
        : products.filter(product => product.category?.name === selectedCategory);
      
      // Vänd på produktlistan ENDAST för "Alla varumärken" och "Alla produkter"
      if (selectedCategory === "Alla") {
        filtered = [...filtered].reverse();
      }

      if (filtered.length > 0) {
        filtered.forEach((product) => {
          const card = isAdmin
            ? createAdminProductCard(product)
            : createProductCard(product);
          productsContainer.appendChild(card);
        });
      } else {
        productsContainer.innerHTML = "<p>Inga produkter i den kategorin.</p>";
      }
    });
  });
}

async function deleteProductHandler(product) {
  if (confirm(`Är du säker på att du vill ta bort produkten "${product.name}"?`)) {
    try {
      const success = await deleteProduct(product._id);
      
      if (success) {
        alert(`Produkten "${product.name}" har tagits bort.`);
        // Ladda om produktlistan för att visa uppdateringen
        loadProducts();
      } else {
        alert("Det gick inte att ta bort produkten. Försök igen senare.");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Ett fel uppstod när produkten skulle tas bort.");
    }
  }
}
