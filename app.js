/* =====================================================================
   Bloom & Co. — Flower Shop framework
   ---------------------------------------------------------------------
   To personalise for a client:
   • Replace the PRODUCTS array (names, prices, categories, stock, image).
   • Swap the inline SVG placeholders for real photos: set product.image
     to a path like "assets/rose-bouquet.jpg" and it will be used instead.
   • Live payments: see placeOrder() — drop in a Stripe Payment Link or
     PayPal button where indicated.
   ===================================================================== */

const SHOP = {
  currency: "$",
  deliveryFee: 12,
  freeDeliveryOver: 75,
  etransferEmail: "payments@bloomco.example",
  paypalLink: "https://www.paypal.com/paypalme/yourbusiness", // ← client's PayPal.Me / Payment Link
  // Free demo photos via Pexels. Get your own key at https://www.pexels.com/api/
  // These are PLACEHOLDERS — set a product's `image:` field to a real Canon photo
  // (e.g. "assets/rose-bouquet.jpg") to override Pexels per product.
  pexelsKey: "4SuTxTJkprUsJAP1CZoSkd412wKx4EuXt7xfK5HzZf9DreiCe8Wv0twm",
};

// --- Product catalogue ------------------------------------------------
// `query` = Pexels search term for the placeholder photo. `hue` = colour of the
// instant SVG fallback shown while the photo loads (or if offline / API fails).
const PRODUCTS = [
  { id: "rose-romance",   name: "Rose Romance",        cat: "Bouquets",   price: 64, stock: 8,  desc: "A dozen long-stem red roses, hand-tied with eucalyptus.", hue: 344, query: "red roses bouquet" },
  { id: "spring-meadow",  name: "Spring Meadow",       cat: "Bouquets",   price: 48, stock: 12, desc: "Tulips, ranunculus, and seasonal wildflowers.",          hue: 14,  query: "tulips bouquet" },
  { id: "sunny-day",      name: "Sunny Day",           cat: "Bouquets",   price: 42, stock: 3,  desc: "Bright sunflowers and gerbera daisies.",                hue: 44,  query: "sunflower bouquet" },
  { id: "blush-garden",   name: "Blush Garden",        cat: "Arrangements", price: 72, stock: 6, desc: "Peonies and garden roses in a ceramic vase.",         hue: 330, query: "pink peonies vase" },
  { id: "white-elegance", name: "White Elegance",      cat: "Arrangements", price: 85, stock: 5, desc: "Lilies, orchids, and white roses for any occasion.",  hue: 200, query: "white lily arrangement" },
  { id: "succulent-trio", name: "Succulent Trio",      cat: "Plants",     price: 36, stock: 15, desc: "Three potted succulents in stoneware planters.",        hue: 120, query: "potted succulents" },
  { id: "peace-lily",     name: "Potted Peace Lily",   cat: "Plants",     price: 44, stock: 0,  desc: "An easy-care flowering houseplant.",                    hue: 150, query: "peace lily plant" },
  { id: "sympathy-white", name: "With Sympathy",       cat: "Occasions",  price: 95, stock: 4,  desc: "A serene white standing arrangement.",                  hue: 210, query: "white flower arrangement" },
  { id: "birthday-bright",name: "Birthday Brights",    cat: "Occasions",  price: 52, stock: 9,  desc: "A cheerful mix of seasonal colour.",                    hue: 280, query: "colorful flower bouquet" },
  { id: "lavender-dream", name: "Lavender Dream",      cat: "Bouquets",   price: 46, stock: 7,  desc: "Fragrant lavender, lisianthus, and stock.",             hue: 265, query: "lavender flowers" },
];

const fmt = (n) => SHOP.currency + n.toFixed(2);
const esc = (s = "") => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// --- Self-contained SVG placeholder (swap for real photos later) -------
function flowerSVG(hue) {
  const bg1 = `hsl(${hue}, 46%, 90%)`, bg2 = `hsl(${(hue + 28) % 360}, 38%, 82%)`;
  const petal = `hsl(${hue}, 58%, 64%)`, petal2 = `hsl(${hue}, 60%, 54%)`, center = `hsl(${(hue + 35) % 360}, 65%, 60%)`;
  let petals = "";
  for (let i = 0; i < 8; i++) {
    petals += `<ellipse cx="100" cy="58" rx="15" ry="34" fill="${i % 2 ? petal2 : petal}" transform="rotate(${i * 45} 100 92)"/>`;
  }
  return `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Flower illustration">
    <defs><linearGradient id="g${hue}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
    <rect width="200" height="150" fill="url(#g${hue})"/>
    <g opacity="0.96">${petals}<circle cx="100" cy="92" r="15" fill="${center}"/></g>
    <path d="M100 107 L100 138" stroke="hsl(140,30%,45%)" stroke-width="5" stroke-linecap="round"/>
  </svg>`;
}
// --- Product imagery: real photo if available, else SVG fallback ------
// Priority: explicit product.image (your Canon photos) > cached Pexels photo > SVG.
const IMG_CACHE_KEY = "bloomco_imgcache";
let imgCache = JSON.parse(localStorage.getItem(IMG_CACHE_KEY) || "{}"); // { id: {url, photographer} }
const productImage = (p) => p.image || imgCache[p.id]?.url || null;

function productMedia(p) {
  const url = productImage(p);
  const credit = imgCache[p.id]?.photographer;
  if (url) return `<img src="${esc(url)}" alt="${esc(p.name)}"${credit ? ` title="Photo: ${esc(credit)} / Pexels"` : ""} loading="lazy">`;
  return flowerSVG(p.hue);
}

function stockTag(p) {
  if (p.stock === 0) return `<span class="stock-tag out">Sold out</span>`;
  if (p.stock <= 3) return `<span class="stock-tag low">Only ${p.stock} left</span>`;
  return `<span class="stock-tag">In stock</span>`;
}

// Fetch a placeholder photo per product from Pexels, cache it, and swap it in
// over the SVG once loaded. Gracefully no-ops if offline or the API fails.
async function hydratePexelsImages() {
  for (const p of PRODUCTS) {
    if (productImage(p)) continue; // already have a Canon photo or cached one
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(p.query)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: SHOP.pexelsKey } }
      );
      if (!res.ok) continue;
      const photo = (await res.json()).photos?.[0];
      if (!photo) continue;
      imgCache[p.id] = { url: photo.src.large, photographer: photo.photographer };
      localStorage.setItem(IMG_CACHE_KEY, JSON.stringify(imgCache));
      updateCardMedia(p);
    } catch (_) { /* keep the SVG fallback */ }
  }
  updateCartUI(); // refresh any cart thumbnails with the new photos
}

function updateCardMedia(p) {
  const el = document.querySelector(`.product-media[data-id="${p.id}"]`);
  if (el) el.innerHTML = productMedia(p) + stockTag(p);
}

// --- Cart state (persisted) -------------------------------------------
const CART_KEY = "bloomco_cart";
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "{}"); // { id: qty }
const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const product = (id) => PRODUCTS.find((p) => p.id === id);
const cartCount = () => Object.values(cart).reduce((a, b) => a + b, 0);
const cartSubtotal = () => Object.entries(cart).reduce((sum, [id, q]) => sum + (product(id)?.price || 0) * q, 0);
function deliveryFee(sub, fulfilment = "delivery") {
  if (fulfilment === "pickup" || sub === 0) return 0;
  return sub >= SHOP.freeDeliveryOver ? 0 : SHOP.deliveryFee;
}

// --- Render: filters + product grid -----------------------------------
const grid = document.getElementById("productGrid");
const filtersEl = document.getElementById("filters");
let activeCat = "All";

function renderFilters() {
  const cats = ["All", ...new Set(PRODUCTS.map((p) => p.cat))];
  filtersEl.innerHTML = cats.map((c) =>
    `<button class="filter-chip ${c === activeCat ? "active" : ""}" data-cat="${c}">${c}</button>`).join("");
  filtersEl.querySelectorAll(".filter-chip").forEach((b) =>
    b.addEventListener("click", () => { activeCat = b.dataset.cat; renderFilters(); renderGrid(); }));
}

function renderGrid() {
  const list = PRODUCTS.filter((p) => activeCat === "All" || p.cat === activeCat);
  grid.innerHTML = list.map((p) => {
    const out = p.stock === 0;
    return `
    <article class="product-card">
      <div class="product-media" data-id="${p.id}">${productMedia(p)}${stockTag(p)}</div>
      <div class="product-body">
        <h3>${esc(p.name)}</h3>
        <p class="product-desc">${esc(p.desc)}</p>
        <div class="product-foot">
          <span class="price">${fmt(p.price)}</span>
          <button class="btn btn-primary btn-sm add-btn" data-id="${p.id}" ${out ? "disabled style='opacity:.5;cursor:not-allowed'" : ""}>
            ${out ? "Unavailable" : "Add to cart"}
          </button>
        </div>
      </div>
    </article>`;
  }).join("");
  grid.querySelectorAll(".add-btn:not([disabled])").forEach((b) =>
    b.addEventListener("click", () => addToCart(b.dataset.id)));
}

// --- Cart actions ------------------------------------------------------
function addToCart(id) {
  const p = product(id);
  if (!p || p.stock === 0) return;
  cart[id] = Math.min((cart[id] || 0) + 1, p.stock);
  saveCart(); updateCartUI(); toast(`${p.name} added to cart`);
}
function setQty(id, qty) {
  const p = product(id);
  if (qty <= 0) delete cart[id];
  else cart[id] = Math.min(qty, p.stock);
  saveCart(); updateCartUI();
}

const cartItemsEl = document.getElementById("cartItems");
const cartCountEl = document.getElementById("cartCount");

function updateCartUI() {
  const count = cartCount();
  cartCountEl.textContent = count;
  cartCountEl.hidden = count === 0;

  const entries = Object.entries(cart);
  if (!entries.length) {
    cartItemsEl.innerHTML = `<p class="cart-empty">Your cart is empty.<br>Add a bouquet to get started. 🌸</p>`;
  } else {
    cartItemsEl.innerHTML = entries.map(([id, q]) => {
      const p = product(id);
      return `
      <div class="cart-item">
        <div class="thumb">${productMedia(p)}</div>
        <div>
          <h4>${esc(p.name)}</h4>
          <div class="ci-price">${fmt(p.price)}</div>
          <div class="qty" data-id="${id}">
            <button class="q-dec" aria-label="Decrease">−</button>
            <span>${q}</span>
            <button class="q-inc" aria-label="Increase">+</button>
          </div>
        </div>
        <button class="ci-remove" data-id="${id}">Remove</button>
      </div>`;
    }).join("");
    cartItemsEl.querySelectorAll(".qty").forEach((row) => {
      const id = row.dataset.id;
      row.querySelector(".q-dec").addEventListener("click", () => setQty(id, cart[id] - 1));
      row.querySelector(".q-inc").addEventListener("click", () => setQty(id, cart[id] + 1));
    });
    cartItemsEl.querySelectorAll(".ci-remove").forEach((b) =>
      b.addEventListener("click", () => setQty(b.dataset.id, 0)));
  }

  const sub = cartSubtotal();
  const del = deliveryFee(sub);
  document.getElementById("cartSubtotal").textContent = fmt(sub);
  document.getElementById("cartDelivery").textContent = del === 0 ? "Free" : fmt(del);
  document.getElementById("cartTotal").textContent = fmt(sub + del);
  document.getElementById("checkoutBtn").disabled = entries.length === 0;
}

// --- Drawer open/close -------------------------------------------------
const drawer = document.getElementById("cartDrawer");
const overlay = document.getElementById("drawerOverlay");
function openCart() { drawer.classList.add("open"); overlay.hidden = false; drawer.setAttribute("aria-hidden", "false"); }
function closeCart() { drawer.classList.remove("open"); overlay.hidden = true; drawer.setAttribute("aria-hidden", "true"); }
document.getElementById("cartBtn").addEventListener("click", openCart);
document.getElementById("cartClose").addEventListener("click", closeCart);
overlay.addEventListener("click", () => { closeCart(); });

// --- Checkout ----------------------------------------------------------
const modal = document.getElementById("checkoutModal");
const checkoutForm = document.getElementById("checkoutForm");
const fulfilmentSel = document.getElementById("fulfilment");
const addressField = document.getElementById("addressField");

function openCheckout() {
  if (cartCount() === 0) return;
  updateCheckoutTotal();
  modal.classList.add("open"); modal.setAttribute("aria-hidden", "false");
  closeCart();
}
function closeCheckout() { modal.classList.remove("open"); modal.setAttribute("aria-hidden", "true"); }
function updateCheckoutTotal() {
  const sub = cartSubtotal();
  document.getElementById("checkoutTotal").textContent = fmt(sub + deliveryFee(sub, fulfilmentSel.value));
}
document.getElementById("checkoutBtn").addEventListener("click", openCheckout);
document.getElementById("checkoutClose").addEventListener("click", closeCheckout);
modal.addEventListener("click", (e) => { if (e.target === modal) closeCheckout(); });
fulfilmentSel.addEventListener("change", () => {
  addressField.style.display = fulfilmentSel.value === "pickup" ? "none" : "block";
  addressField.querySelector("input").required = fulfilmentSel.value !== "pickup";
  updateCheckoutTotal();
});

checkoutForm.addEventListener("submit", (e) => { e.preventDefault(); placeOrder(new FormData(checkoutForm)); });

function placeOrder(data) {
  const sub = cartSubtotal();
  const total = sub + deliveryFee(sub, data.get("fulfilment"));
  const payment = data.get("payment");

  // === LIVE PAYMENTS PLUG IN HERE =====================================
  // Replace the confirmation below with a real handoff, e.g.:
  //   window.location.href = SHOP.paypalLink + "/" + total;     // PayPal
  //   or redirect to a Stripe Payment Link / Checkout Session.
  // ====================================================================
  const payHtml = payment === "etransfer"
    ? `<div class="pay-box"><b>Pay by Interac e-Transfer</b><p>Send <b>${fmt(total)}</b> to <code>${SHOP.etransferEmail}</code> and include your name in the message. We’ll confirm by email.</p></div>`
    : `<div class="pay-box"><b>Pay by PayPal / Card</b><p>You’d be redirected to a secure PayPal or Stripe checkout for <b>${fmt(total)}</b>. <em>(Demo — payment not processed.)</em></p><a class="btn btn-primary btn-sm" href="${SHOP.paypalLink}" target="_blank" rel="noopener">Continue to payment</a></div>`;

  document.getElementById("checkoutBody").innerHTML = `
    <div class="confirm">
      <div class="check">✓</div>
      <h3>Thank you, ${esc(data.get("name").split(" ")[0] || "")}!</h3>
      <p class="muted">Your order has been received. A confirmation will be sent to ${esc(data.get("email"))}.</p>
      ${payHtml}
      <button class="btn btn-ghost btn-sm" id="confirmClose">Close</button>
    </div>`;
  document.getElementById("confirmClose").addEventListener("click", () => { closeCheckout(); location.reload(); });

  cart = {}; saveCart(); updateCartUI();
}

// --- Mobile nav + misc -------------------------------------------------
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => navLinks.classList.remove("open")));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeCart(); closeCheckout(); }
});

let toastTimer;
function toast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg; t.hidden = false;
  requestAnimationFrame(() => t.classList.add("show"));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove("show"); setTimeout(() => (t.hidden = true), 250); }, 1800);
}

document.getElementById("year").textContent = new Date().getFullYear();

// --- Init --------------------------------------------------------------
renderFilters();
renderGrid();
updateCartUI();
hydratePexelsImages(); // swap SVG placeholders for real Pexels flower photos
