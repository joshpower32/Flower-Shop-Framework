/* =====================================================================
   Bloom & Co. — Flower Shop framework
   ---------------------------------------------------------------------
   To personalise for a client:
   • Replace the PRODUCTS array (names, prices, categories, stock, image).
   • Demo photos are pinned Pexels shots (PEXELS_PHOTOS below) so they load
     instantly. Set product.image to a path like "assets/rose-bouquet.jpg"
     (your Canon photos) and it will be used instead.
   • Live payments: see placeOrder() — drop in a Stripe Payment Link or
     PayPal button where indicated.
   ===================================================================== */

const SHOP = {
  currency: "$",
  deliveryFee: 12,
  freeDeliveryOver: 75,
  etransferEmail: "payments@bloomco.example",
  ownerEmail: "hello@bloomco.example",
  // === ORDER DELIVERY (set before selling) — free key at https://web3forms.com
  // Enter the client's email, paste the key here. Each placed order then emails
  // the client the full order details. Leave as-is in the demo.
  web3formsKey: "YOUR_WEB3FORMS_ACCESS_KEY",
  paypalLink: "https://www.paypal.com/paypalme/yourbusiness", // ← client's PayPal.Me / Payment Link
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

// --- Demo photos: pinned Pexels shots, keyed by each item's `query` -----
// Direct image URLs load with the page — no API call, no key, no pop-in.
// To change a photo: browse pexels.com, copy the image address, paste here.
const PEXELS_PHOTOS = {
  "red roses bouquet": { u: "https://images.pexels.com/photos/11196806/pexels-photo-11196806.jpeg", p: "Shameel mukkath" },
  "tulips bouquet": { u: "https://images.pexels.com/photos/20155225/pexels-photo-20155225.jpeg", p: "Alina Zahorulko" },
  "sunflower bouquet": { u: "https://images.pexels.com/photos/13368214/pexels-photo-13368214.jpeg", p: "Sami  Aksu" },
  "pink peonies vase": { u: "https://images.pexels.com/photos/37805067/pexels-photo-37805067.jpeg", p: "David Kanigan" },
  "white lily arrangement": { u: "https://images.pexels.com/photos/8865105/pexels-photo-8865105.jpeg", p: "RDNE Stock project" },
  "potted succulents": { u: "https://images.pexels.com/photos/36620948/pexels-photo-36620948.jpeg", p: "Natalia Sevruk" },
  "peace lily plant": { u: "https://images.pexels.com/photos/8297857/pexels-photo-8297857.jpeg", p: "Mikhail Nilov" },
  "white flower arrangement": { u: "https://images.pexels.com/photos/20199364/pexels-photo-20199364.jpeg", p: "alirezamani wedding team" },
  "colorful flower bouquet": { u: "https://images.pexels.com/photos/31497181/pexels-photo-31497181.jpeg", p: "ilayda 0700" },
  "lavender flowers": { u: "https://images.pexels.com/photos/128883/lavender-flowers-purple-flowers-blue-flowers-128883.jpeg", p: "Pixabay" },
  "tulips colorful field": { u: "https://images.pexels.com/photos/16318392/pexels-photo-16318392.jpeg", p: "Engin Sezer" },
  "pink peonies": { u: "https://images.pexels.com/photos/8893073/pexels-photo-8893073.jpeg", p: "Dagmara Dombrovska" },
  "sunflowers field": { u: "https://images.pexels.com/photos/29278365/pexels-photo-29278365.jpeg", p: "Yavuz Solgun" },
  "colorful flower arrangement": { u: "https://images.pexels.com/photos/16935921/pexels-photo-16935921.jpeg", p: "Matheus Bertelli" },
  "florist arranging bouquet": { u: "https://images.pexels.com/photos/5409690/pexels-photo-5409690.jpeg", p: "Amina Filkins" },
};
// Size an image via Pexels CDN params (w = target width in px)
const px = (u, w) => `${u}?auto=compress&cs=tinysrgb&w=${w}`;

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
// Priority: explicit product.image (your Canon photos) > pinned Pexels photo > SVG.
const productImage = (p) => p.image || (PEXELS_PHOTOS[p.query] ? px(PEXELS_PHOTOS[p.query].u, 640) : null);

function productMedia(p) {
  const url = productImage(p);
  const credit = !p.image && PEXELS_PHOTOS[p.query]?.p;
  if (url) return `<img src="${esc(url)}" alt="${esc(p.name)}"${credit ? ` title="Photo: ${esc(credit)} / Pexels"` : ""} loading="lazy" onerror="this.outerHTML = flowerSVG(${p.hue})">`;
  return flowerSVG(p.hue);
}

function stockTag(p) {
  if (p.stock === 0) return `<span class="stock-tag out">Sold out</span>`;
  if (p.stock <= 3) return `<span class="stock-tag low">Only ${p.stock} left</span>`;
  return `<span class="stock-tag">In stock</span>`;
}

// --- Cart state (persisted) -------------------------------------------
// Cart is a list of line items so the same product can be ordered with
// different options (size / colour / recipient / note) as separate lines.
const CART_KEY = "bloomco_cart_v2";
let cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]"); // [{id,name,qty,size,color,recipient,address,note,unitPrice}]
if (!Array.isArray(cart)) cart = [];
const saveCart = () => localStorage.setItem(CART_KEY, JSON.stringify(cart));
const product = (id) => PRODUCTS.find((p) => p.id === id);
const cartCount = () => cart.reduce((a, l) => a + l.qty, 0);
const cartSubtotal = () => cart.reduce((sum, l) => sum + l.unitPrice * l.qty, 0);
function deliveryFee(sub, fulfilment = "delivery") {
  if (fulfilment === "pickup" || sub === 0) return 0;
  return sub >= SHOP.freeDeliveryOver ? 0 : SHOP.deliveryFee;
}

// Options offered in the product detail modal
const SIZES = [
  { id: "standard", label: "Standard", add: 0 },
  { id: "deluxe",   label: "Deluxe",   add: 15 },
  { id: "luxe",     label: "Luxe",     add: 30 },
];
const PALETTES = ["As pictured", "Soft pastels", "Bright & bold", "Whites & creams", "Pinks & blush", "Reds & romance"];

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
    const open = out ? "" : `data-open="${p.id}" role="button" tabindex="0" aria-label="${esc(p.name)} — view options and order"`;
    return `
    <article class="product-card ${out ? "is-out" : ""}" ${open}>
      <div class="product-media" data-id="${p.id}">${productMedia(p)}${stockTag(p)}</div>
      <div class="product-body">
        <h3>${esc(p.name)}</h3>
        <p class="product-desc">${esc(p.desc)}</p>
        <div class="product-foot">
          <span class="price">from ${fmt(p.price)}</span>
          <span class="btn btn-primary btn-sm">${out ? "Unavailable" : "Choose options →"}</span>
        </div>
      </div>
    </article>`;
  }).join("");
  grid.querySelectorAll(".product-card[data-open]").forEach((c) => {
    const open = () => openProductModal(c.dataset.open);
    c.addEventListener("click", open);
    c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  });
}

// --- Cart actions ------------------------------------------------------
function addLine(line) {
  cart.push(line);
  saveCart(); updateCartUI(); toast(`${line.name} added to cart`);
}
function setQtyAt(i, qty) {
  if (!cart[i]) return;
  if (qty <= 0) cart.splice(i, 1);
  else cart[i].qty = qty;
  saveCart(); updateCartUI();
}

const cartItemsEl = document.getElementById("cartItems");
const cartCountEl = document.getElementById("cartCount");

function updateCartUI() {
  const count = cartCount();
  cartCountEl.textContent = count;
  cartCountEl.hidden = count === 0;

  if (!cart.length) {
    cartItemsEl.innerHTML = `<p class="cart-empty">Your cart is empty.<br>Add a bouquet to get started. 🌸</p>`;
  } else {
    cartItemsEl.innerHTML = cart.map((l, i) => {
      const p = product(l.id);
      const thumb = p ? productMedia(p) : flowerSVG(330);
      const bits = [
        l.size && l.size !== "Standard" ? l.size : null,
        l.color && l.color !== "As pictured" ? l.color : null,
      ].filter(Boolean).join(" · ");
      return `
      <div class="cart-item">
        <div class="thumb">${thumb}</div>
        <div>
          <h4>${esc(l.name)}</h4>
          ${bits ? `<div class="ci-opts">${esc(bits)}</div>` : ""}
          ${l.recipient ? `<div class="ci-opts">For: ${esc(l.recipient)}</div>` : ""}
          ${l.note ? `<div class="ci-opts">Note: “${esc(l.note)}”</div>` : ""}
          <div class="ci-price">${fmt(l.unitPrice)}</div>
          <div class="qty" data-i="${i}">
            <button class="q-dec" aria-label="Decrease">−</button>
            <span>${l.qty}</span>
            <button class="q-inc" aria-label="Increase">+</button>
          </div>
        </div>
        <button class="ci-remove" data-i="${i}">Remove</button>
      </div>`;
    }).join("");
    cartItemsEl.querySelectorAll(".qty").forEach((row) => {
      const i = +row.dataset.i;
      row.querySelector(".q-dec").addEventListener("click", () => setQtyAt(i, cart[i].qty - 1));
      row.querySelector(".q-inc").addEventListener("click", () => setQtyAt(i, cart[i].qty + 1));
    });
    cartItemsEl.querySelectorAll(".ci-remove").forEach((b) =>
      b.addEventListener("click", () => setQtyAt(+b.dataset.i, 0)));
  }

  const sub = cartSubtotal();
  const del = deliveryFee(sub);
  document.getElementById("cartSubtotal").textContent = fmt(sub);
  document.getElementById("cartDelivery").textContent = del === 0 ? "Free" : fmt(del);
  document.getElementById("cartTotal").textContent = fmt(sub + del);
  document.getElementById("checkoutBtn").disabled = cart.length === 0;
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

// Email the full order to the shop owner via Web3Forms (when a key is set).
async function sendOrderEmail(data, total) {
  if (!SHOP.web3formsKey || SHOP.web3formsKey === "YOUR_WEB3FORMS_ACCESS_KEY") return;
  const itemsText = cart.map((l) => {
    const opts = [l.size && l.size !== "Standard" ? l.size : null, l.color && l.color !== "As pictured" ? l.color : null].filter(Boolean).join(", ");
    return `• ${l.qty} x ${l.name}${opts ? ` (${opts})` : ""} — ${fmt(l.unitPrice)} each` +
      `${l.recipient ? ` | For: ${l.recipient}` : ""}${l.address ? ` | Deliver to: ${l.address}` : ""}${l.note ? ` | Note: ${l.note}` : ""}`;
  }).join("\n");
  const fd = new FormData();
  fd.append("access_key", SHOP.web3formsKey);
  fd.append("subject", `🛒 NEW ORDER — ${data.get("name") || "website"} (${fmt(total)})`);
  fd.append("from_name", "Bloom & Co. website");
  fd.append("Customer", data.get("name") || "");
  fd.append("Email", data.get("email") || "");
  fd.append("Phone", data.get("phone") || "");
  fd.append("Fulfilment", data.get("fulfilment") || "");
  fd.append("Address", data.get("address") || "");
  fd.append("Requested date", data.get("date") || "");
  fd.append("Payment method", data.get("payment") || "");
  fd.append("Gift message", data.get("message") || "");
  fd.append("Order", itemsText);
  fd.append("Order total", fmt(total));
  try { await fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: fd }); } catch (_) {}
}

function placeOrder(data) {
  const sub = cartSubtotal();
  const total = sub + deliveryFee(sub, data.get("fulfilment"));
  const payment = data.get("payment");
  sendOrderEmail(data, total); // notify the shop owner (when a Web3Forms key is set)

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

  cart = []; saveCart(); updateCartUI();
}

// === Product detail modal (choose options before adding to cart) ========
const pModal = document.getElementById("productModal");
const pBody = document.getElementById("productModalBody");
let pmState = null;
function openProductModal(id) {
  const p = product(id);
  if (!p) return;
  pmState = { id, sizeId: "standard", color: PALETTES[0] };
  renderProductModal();
  pModal.classList.add("open"); pModal.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
}
function closeProductModal() { pModal.classList.remove("open"); pModal.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
function pmUnitPrice() {
  const p = product(pmState.id);
  const size = SIZES.find((s) => s.id === pmState.sizeId) || SIZES[0];
  return p.price + size.add;
}
function renderProductModal() {
  const p = product(pmState.id);
  pBody.innerHTML = `
    <div class="pm-media">${productMedia(p)}</div>
    <div class="pm-body">
      <span class="pm-cat">${esc(p.cat)}</span>
      <h3>${esc(p.name)}</h3>
      <p class="pm-desc">${esc(p.desc)}</p>
      <div class="pm-field"><label>Size</label>
        <div class="pm-chips" id="pmSizes">${SIZES.map((s) => `<button class="pm-chip ${s.id === pmState.sizeId ? "active" : ""}" data-size="${s.id}">${s.label}${s.add ? ` +${fmt(s.add)}` : ""}</button>`).join("")}</div>
      </div>
      <div class="pm-field"><label>Colour palette</label>
        <div class="pm-chips" id="pmColors">${PALETTES.map((c) => `<button class="pm-chip ${c === pmState.color ? "active" : ""}" data-color="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      </div>
      <div class="pm-field"><label for="pmRecipient">Recipient name <span>(optional)</span></label><input id="pmRecipient" type="text" placeholder="Who is it for?"></div>
      <div class="pm-field"><label for="pmAddress">Delivery address <span>(optional)</span></label><input id="pmAddress" type="text" placeholder="Street, city — or choose pickup at checkout"></div>
      <div class="pm-field"><label for="pmNote">Card message / custom notes <span>(optional)</span></label><textarea id="pmNote" rows="2" placeholder="e.g. Happy Birthday, Mom! — or any special requests"></textarea></div>
      <div class="pm-foot"><span class="pm-price" id="pmPrice">${fmt(pmUnitPrice())}</span><button class="btn btn-primary" id="pmAdd">Add to cart</button></div>
    </div>`;
  pBody.querySelectorAll("#pmSizes .pm-chip").forEach((b) => b.addEventListener("click", () => {
    pmState.sizeId = b.dataset.size;
    pBody.querySelectorAll("#pmSizes .pm-chip").forEach((x) => x.classList.toggle("active", x === b));
    document.getElementById("pmPrice").textContent = fmt(pmUnitPrice());
  }));
  pBody.querySelectorAll("#pmColors .pm-chip").forEach((b) => b.addEventListener("click", () => {
    pmState.color = b.dataset.color;
    pBody.querySelectorAll("#pmColors .pm-chip").forEach((x) => x.classList.toggle("active", x === b));
  }));
  document.getElementById("pmAdd").addEventListener("click", () => {
    const size = SIZES.find((s) => s.id === pmState.sizeId) || SIZES[0];
    addLine({
      id: p.id, name: p.name, qty: 1, size: size.label, color: pmState.color,
      recipient: document.getElementById("pmRecipient").value.trim(),
      address: document.getElementById("pmAddress").value.trim(),
      note: document.getElementById("pmNote").value.trim(),
      unitPrice: pmUnitPrice(),
    });
    closeProductModal(); openCart();
  });
}
document.getElementById("productClose").addEventListener("click", closeProductModal);
pModal.addEventListener("click", (e) => { if (e.target === pModal) closeProductModal(); });

// === Custom order builder modal =========================================
const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Sympathy", "Get well", "Corporate", "Just because"];
const BUDGETS = [50, 75, 100, 150, 200];
const cModal = document.getElementById("customModal");
let cmState = null;
function openCustomModal() {
  cmState = { occasion: OCCASIONS[0], palette: PALETTES[0], budget: 75 };
  renderCustomModal();
  cModal.classList.add("open"); cModal.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden";
}
function closeCustomModal() { cModal.classList.remove("open"); cModal.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
function renderCustomModal() {
  document.getElementById("customModalBody").innerHTML = `
    <div class="pm-body">
      <span class="pm-cat">Custom arrangement</span>
      <h3>Build your custom order</h3>
      <p class="pm-desc">Tell us the vibe and budget — our florist designs it to match, made fresh for your date.</p>
      <div class="pm-field"><label>Occasion</label><div class="pm-chips" id="cmOcc">${OCCASIONS.map((o) => `<button class="pm-chip ${o === cmState.occasion ? "active" : ""}" data-occ="${esc(o)}">${esc(o)}</button>`).join("")}</div></div>
      <div class="pm-field"><label>Colour palette</label><div class="pm-chips" id="cmPal">${PALETTES.map((c) => `<button class="pm-chip ${c === cmState.palette ? "active" : ""}" data-pal="${esc(c)}">${esc(c)}</button>`).join("")}</div></div>
      <div class="pm-field"><label>Budget</label><div class="pm-chips" id="cmBud">${BUDGETS.map((b) => `<button class="pm-chip ${b === cmState.budget ? "active" : ""}" data-bud="${b}">${fmt(b)}</button>`).join("")}</div></div>
      <div class="pm-field"><label for="cmRecipient">Recipient name <span>(optional)</span></label><input id="cmRecipient" type="text" placeholder="Who is it for?"></div>
      <div class="pm-field"><label for="cmNote">Details / special requests <span>(optional)</span></label><textarea id="cmNote" rows="2" placeholder="Favourite flowers, things to avoid, delivery date..."></textarea></div>
      <div class="pm-foot"><span class="pm-price" id="cmPrice">${fmt(cmState.budget)}</span><button class="btn btn-primary" id="cmAdd">Add custom order to cart</button></div>
    </div>`;
  const body = document.getElementById("customModalBody");
  body.querySelectorAll("#cmOcc .pm-chip").forEach((b) => b.addEventListener("click", () => { cmState.occasion = b.dataset.occ; body.querySelectorAll("#cmOcc .pm-chip").forEach((x) => x.classList.toggle("active", x === b)); }));
  body.querySelectorAll("#cmPal .pm-chip").forEach((b) => b.addEventListener("click", () => { cmState.palette = b.dataset.pal; body.querySelectorAll("#cmPal .pm-chip").forEach((x) => x.classList.toggle("active", x === b)); }));
  body.querySelectorAll("#cmBud .pm-chip").forEach((b) => b.addEventListener("click", () => { cmState.budget = +b.dataset.bud; body.querySelectorAll("#cmBud .pm-chip").forEach((x) => x.classList.toggle("active", x === b)); document.getElementById("cmPrice").textContent = fmt(cmState.budget); }));
  document.getElementById("cmAdd").addEventListener("click", () => {
    addLine({
      id: "custom", name: `Custom ${cmState.occasion} Arrangement`, qty: 1, size: "Custom", color: cmState.palette,
      recipient: document.getElementById("cmRecipient").value.trim(), address: "",
      note: document.getElementById("cmNote").value.trim(), unitPrice: cmState.budget,
    });
    closeCustomModal(); openCart();
  });
}
document.getElementById("customClose").addEventListener("click", closeCustomModal);
cModal.addEventListener("click", (e) => { if (e.target === cModal) closeCustomModal(); });
document.querySelectorAll("[data-custom-open]").forEach((b) => b.addEventListener("click", (e) => { e.preventDefault(); openCustomModal(); }));

// === Clickable trust badges (scroll to the matching section) ============
document.querySelectorAll(".badge[data-target]").forEach((b) => {
  const go = () => { const t = document.querySelector(b.dataset.target); if (t) t.scrollIntoView({ behavior: "smooth" }); };
  b.addEventListener("click", go);
  b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
});

// === Hero background carousel ===========================================
const HERO_BG = [
  { query: "red roses bouquet" },
  { query: "tulips colorful field" },
  { query: "pink peonies" },
  { query: "sunflowers field" },
  { query: "colorful flower arrangement" },
];
let heroIndex = 0;
const heroEl = document.querySelector(".hero");
const heroDotsEl = document.getElementById("heroDots");
function setHero(i) {
  heroIndex = (i + HERO_BG.length) % HERO_BG.length;
  const photo = PEXELS_PHOTOS[HERO_BG[heroIndex].query];
  if (photo) heroEl.style.backgroundImage = `linear-gradient(rgba(34,18,28,.5), rgba(34,18,28,.62)), url("${px(photo.u, 1600)}")`;
  if (heroDotsEl) heroDotsEl.querySelectorAll("button").forEach((d, di) => d.classList.toggle("active", di === heroIndex));
}
function initHero() {
  if (heroDotsEl) {
    heroDotsEl.innerHTML = HERO_BG.map((_, i) => `<button aria-label="Show background ${i + 1}"></button>`).join("");
    heroDotsEl.querySelectorAll("button").forEach((d, di) => d.addEventListener("click", () => setHero(di)));
  }
  setHero(0);
}
document.getElementById("heroPrev")?.addEventListener("click", () => setHero(heroIndex - 1));
document.getElementById("heroNext")?.addEventListener("click", () => setHero(heroIndex + 1));

// --- Mobile nav + misc -------------------------------------------------
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => navLinks.classList.remove("open")));
document.addEventListener("click", (e) => {
  if (navLinks.classList.contains("open") && !navLinks.contains(e.target) && !navToggle.contains(e.target)) {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { closeCart(); closeCheckout(); closeProductModal(); closeCustomModal(); }
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

// --- About photo (swap for a real photo of the shop / owner) -----------
function renderAboutPhoto() {
  const el = document.querySelector(".about-art");
  const photo = PEXELS_PHOTOS["florist arranging bouquet"];
  if (el && photo) el.innerHTML = `<img src="${px(photo.u, 900)}" alt="Florist hand-tying a fresh bouquet" title="Photo: ${esc(photo.p)} / Pexels" loading="lazy">`;
}

// --- Init --------------------------------------------------------------
renderFilters();
renderGrid();
updateCartUI();
initHero();        // hero background photo + clickable carousel
renderAboutPhoto();
