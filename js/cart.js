/* ==========================================================================
   IRON AGE COMPANY — cart.js
   Client-side shopping cart. No backend required (works on GitHub Pages /
   any static host). Cart is stored in the visitor's own browser
   (localStorage), so it's private to them and persists between pages.

   CHECKOUT: uses PayPal's classic "cart upload" checkout (Website Payments
   Standard). This requires NO API keys — just a PayPal business email.
   Set PAYPAL_BUSINESS_EMAIL below before going live.
   ========================================================================== */

// ⚠️ REPLACE THIS before launch — this is a placeholder only.
const PAYPAL_BUSINESS_EMAIL = "PAYPAL-EMAIL-GOES-HERE@example.com";

const CART_STORAGE_KEY = "iac_cart";

/* ---------- core storage helpers ---------- */

function getCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Cart read error:", e);
    return {};
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    console.error("Cart save error:", e);
  }
  renderCartBadge();
}

function addToCart(id, name, price, qty) {
  qty = Math.max(1, parseInt(qty, 10) || 1);
  const cart = getCart();
  if (cart[id]) {
    cart[id].qty += qty;
  } else {
    cart[id] = { name: name, price: price, qty: qty };
  }
  saveCart(cart);
  return cart;
}

function updateQty(id, qty) {
  const cart = getCart();
  qty = parseInt(qty, 10);
  if (!cart[id]) return;
  if (!qty || qty < 1) {
    delete cart[id];
  } else {
    cart[id].qty = qty;
  }
  saveCart(cart);
  if (document.getElementById("cart-page")) renderCartPage();
}

function removeFromCart(id) {
  const cart = getCart();
  delete cart[id];
  saveCart(cart);
  if (document.getElementById("cart-page")) renderCartPage();
}

function clearCart() {
  saveCart({});
  if (document.getElementById("cart-page")) renderCartPage();
}

function getCartCount() {
  const cart = getCart();
  return Object.values(cart).reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  const cart = getCart();
  return Object.values(cart).reduce((sum, item) => sum + item.price * item.qty, 0);
}

/* ---------- nav badge (runs on every page) ---------- */

function renderCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-flex" : "none";
}

/* ---------- add-to-cart buttons (used on product pages) ---------- */

function initAddToCartButtons() {
  document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const id = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      const price = parseFloat(btn.getAttribute("data-price"));
      const qtyInput = document.querySelector('[data-qty-for="' + id + '"]');
      const qty = qtyInput ? qtyInput.value : 1;

      addToCart(id, name, price, qty);

      const originalText = btn.textContent;
      btn.textContent = "Added ✓";
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 1200);
    });
  });
}

/* ---------- cart page rendering ---------- */

function renderCartPage() {
  const container = document.getElementById("cart-page");
  if (!container) return;

  const cart = getCart();
  const ids = Object.keys(cart);

  if (ids.length === 0) {
    container.innerHTML =
      '<div class="plate"><p style="margin:0;">Your cart is empty. Head over to <a href="cage-nuts.html">Cage Nuts</a> to add something.</p></div>';
    const checkoutBtn = document.getElementById("checkout-btn");
    if (checkoutBtn) checkoutBtn.style.display = "none";
    return;
  }

  let rows = "";
  ids.forEach(function (id) {
    const item = cart[id];
    const lineTotal = (item.price * item.qty).toFixed(2);
    rows +=
      '<tr>' +
      '<td class="part">' + id + '</td>' +
      '<td>' + item.name + '</td>' +
      '<td style="white-space:nowrap;">$' + item.price.toFixed(2) + ' ea</td>' +
      '<td>' +
        '<input type="number" min="1" value="' + item.qty + '" ' +
        'class="qty-input" data-cart-qty="' + id + '" style="width:64px;">' +
      '</td>' +
      '<td class="price">$' + lineTotal + '</td>' +
      '<td><button class="btn ghost" type="button" data-cart-remove="' + id + '" style="padding:8px 12px;">Remove</button></td>' +
      '</tr>';
  });

  const total = getCartTotal().toFixed(2);

  container.innerHTML =
    '<div class="plate" style="padding:0; overflow-x:auto;">' +
      '<table class="spec">' +
        '<thead><tr><th>Part #</th><th>Description</th><th>Price</th><th>Qty</th><th class="price">Total</th><th></th></tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table>' +
    '</div>' +
    '<div style="display:flex; justify-content:flex-end; margin-top:18px;">' +
      '<div class="pricetag">$' + total + '<small>+ shipping / tax at checkout</small></div>' +
    '</div>';

  // wire up qty changes + remove buttons
  container.querySelectorAll("[data-cart-qty]").forEach(function (input) {
    input.addEventListener("change", function () {
      updateQty(input.getAttribute("data-cart-qty"), input.value);
    });
  });
  container.querySelectorAll("[data-cart-remove]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      removeFromCart(btn.getAttribute("data-cart-remove"));
    });
  });

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) checkoutBtn.style.display = "inline-flex";
}

/* ---------- PayPal checkout (Website Payments Standard "cart upload") ----------
   This builds a hidden form and POSTs it straight to PayPal — no API key,
   no backend. PayPal handles the actual payment page. Shipping cost and
   sales tax are calculated by PayPal using the rates configured in the
   business account's Profile → Shipping & Tax settings.
   ------------------------------------------------------------------------- */

function checkoutWithPayPal() {
  const cart = getCart();
  const ids = Object.keys(cart);
  if (ids.length === 0) return;

  if (PAYPAL_BUSINESS_EMAIL.indexOf("EMAIL-GOES-HERE") !== -1) {
    alert(
      "Checkout isn't live yet — the PayPal business email hasn't been set. " +
      "(Developer: set PAYPAL_BUSINESS_EMAIL in js/cart.js)"
    );
    return;
  }

  const form = document.createElement("form");
  form.method = "post";
  form.action = "https://www.paypal.com/cgi-bin/webscr";
  form.target = "_blank";

  function addField(name, value) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  addField("cmd", "_cart");
  addField("upload", "1");
  addField("business", PAYPAL_BUSINESS_EMAIL);
  addField("currency_code", "USD");

  ids.forEach(function (id, index) {
    const n = index + 1;
    const item = cart[id];
    addField("item_name_" + n, item.name);
    addField("item_number_" + n, id);
    addField("amount_" + n, item.price.toFixed(2));
    addField("quantity_" + n, item.qty);
  });

  document.body.appendChild(form);
  form.submit();
  document.body.removeChild(form);
}

/* ---------- init on every page ---------- */

document.addEventListener("DOMContentLoaded", function () {
  renderCartBadge();
  initAddToCartButtons();
  renderCartPage();

  const checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) checkoutBtn.addEventListener("click", checkoutWithPayPal);

  const clearBtn = document.getElementById("clear-cart-btn");
  if (clearBtn) clearBtn.addEventListener("click", clearCart);
});
