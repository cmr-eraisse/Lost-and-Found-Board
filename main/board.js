import { db, ref, update, remove, onValue } from "./firebase.js";

function updateItem(id, data) {
	const itemRef = ref(db, `lostFoundItems/${id}`);
	return update(itemRef, data);
}

function deleteItem(id) {
	const itemRef = ref(db, `lostFoundItems/${id}`);
	return remove(itemRef);
}

let activeType = "all";
let activeStatus = "all";
let searchQuery = "";

let latestSnapshot = {};

document.querySelectorAll("#typeFilters .filter-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		document
			.querySelectorAll("#typeFilters .filter-btn")
			.forEach((b) => b.classList.remove("active"));
		btn.classList.add("active");
		activeType = btn.dataset.type;
		renderBoard(latestSnapshot);
	});
});

document.querySelectorAll("#statusFilters .filter-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		document
			.querySelectorAll("#statusFilters .filter-btn")
			.forEach((b) => b.classList.remove("active"));
		btn.classList.add("active");
		activeStatus = btn.dataset.status;
		renderBoard(latestSnapshot);
	});
});

document.getElementById("searchInput").addEventListener("input", (e) => {
	searchQuery = e.target.value.toLowerCase();
	renderBoard(latestSnapshot);
});

function updateStats(itemsObj) {
	const all = Object.values(itemsObj);
	const lost = all.filter((i) => i.type === "lost").length;
	const found = all.filter((i) => i.type === "found").length;
	const claimed = all.filter((i) => i.status === "claimed").length;

	document.getElementById("statusLost").textContent = lost;
	document.getElementById("statusFound").textContent = found;
	document.getElementById("statusClaimed").textContent = claimed;
	document.getElementById("statTotal").textContent = all.length;
}

function renderBoard(itemsObj) {
	updateStats(itemsObj);

	let items = Object.entries(itemsObj)
		.map(([id, data]) => ({ id, ...data }))
		.sort((a, b) => b.createdAt - a.createdAt);

	if (activeType !== "all") items = items.filter((i) => i.type === activeType);
	if (activeStatus !== "all")
		items = items.filter((i) => i.status === activeStatus);

	if (searchQuery) {
		items = items.filter(
			(i) =>
				i.itemname?.toLowerCase().includes(searchQuery) ||
				i.description?.toLowerCase().includes(searchQuery) ||
				i.location?.toLowerCase().includes(searchQuery) ||
				i.category?.toLowerCase().includes(searchQuery),
		);
	}

	const grid = document.getElementById("cardsGrid");

	if (items.length === 0) {
		grid.innerHTML = `
      <div class="empty-state">
        <div class="icon">...</div>
        <h3>Oops. No items found.</h3>
        <p>Try adjusting your search or filters, or <a href="add.html" style="color:var(--teal)">post a new item</a>.</p>
      </div>`;
		return;
	}

	grid.innerHTML = items.map((item) => buildCard(item)).join("");
}

// build card (somethings up here, or not idk...)
function buildCard(item) {
	const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});

	const imagePart = item.imageUrl
		? `<div class="card-image"><img src="${escHtml(item.imageUrl)}" alt="${escHtml(item.itemname)}" onerror="this.parentElement.innerHTML='📦'" /></div>`
		: `<div class="card-image" style="font-size:3rem;">📦</div>`;

	const claimBtn =
		item.status === "open"
			? `<button class="btn btn-success" onclick="claimItem('${item.id}')">Mark as Claimed</button>`
			: `<button class="btn btn-reopen"  onclick="reopenItem('${item.id}')">Reopen Item</button>`;

	return `
    <div class="item-card ${item.status === "claimed" ? "claimed" : ""}">
      ${imagePart}
      <div class="card-body">
        <div class="card-tags">
          <span class="tag ${item.type}">${item.type === "lost" ? "Lost" : "Found"}</span>
          <span class="tag ${item.status}">${item.status}</span>
          <span class="tag cat">${escHtml(item.category)}</span>
        </div>
        <div class="card-title">${escHtml(item.itemname)}</div>
        <div class="card-desc">${escHtml(item.description)}</div>
        <div class="card-meta">
          <div class="meta-row"><span>📍</span>${escHtml(item.location)}</div>
          <div class="meta-row"><span>📞</span>${escHtml(item.contact)}</div>
          <div class="meta-row"><span>📅</span>${dateStr}</div>
        </div>
      </div>
      <div class="card-footer">
        ${claimBtn}
        <button class="btn btn-outline" onclick="openModal('${item.id}')">👁 View</button>
        <button class="btn btn-danger"  onclick="confirmDelete('${item.id}')">🗑</button>
      </div>
    </div>`;
}

function claimItem(id) {
	const item = latestSnapshot[id];
	if (!item) return;
	if (item.status === "claimed") {
		showToast("This item is already claimed.", "info");
		return;
	}
	updateItem(id, { status: "claimed", claimedAt: Date.now() });
	showToast("Item marked as claimed!", "success");
}

function reopenItem(id) {
	const item = latestSnapshot[id];
	if (!item) return;
	if (item.status === "open") {
		showToast("This item is already open.", "info");
		return;
	}
	updateItem(id, { status: "open", claimedAt: null });
	showToast("Item reopened!", "info");
}

function confirmDelete(id) {
	const item = latestSnapshot[id];
	if (!item) return;
	if (
		confirm(
			` Are you sure you want to delete "${item.itemname}"? This cannot be undone.`,
		)
	) {
		deleteItem(id);
		showToast("Item has been deleted.", "info");
		closeModal();
	}
}

function openModal(id) {
	const item = latestSnapshot[id];
	if (!item) return;

	const dateStr = new Date(item.createdAt).toLocaleString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});

	const claimedStr = item.claimedAt
		? new Date(item.claimedAt).toLocaleString("en-US", {
				month: "long",
				day: "numeric",
				year: "numeric",
			})
		: null;

	document.getElementById("modalContent").innerHTML = `
    ${
			item.imageUrl
				? `<img src="${escHtml(item.imageUrl)}" style="width:100%;height:200px;object-fit:cover;border-radius:10px;margin-bottom:20px;" onerror="this.remove()" />`
				: ""
		}
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
      <span class="tag ${item.type}">${item.type === "lost" ? "Lost" : "Found"}</span>
      <span class="tag ${item.status}">${item.status}</span>
      <span class="tag cat">${escHtml(item.category)}</span>
    </div>
    <h2 style="font-family:'DM Serif Display',serif;font-size:1.5rem;margin-bottom:10px;">${escHtml(item.itemname)}</h2>
    <p><strong>Note:</strong></p>
    <p style="color:var(--text-light);margin-bottom:18px;">${escHtml(item.description)}</p>
    <div class="modal-desc" style="display:flex;flex-direction:column;gap:8px;font-size:0.9rem;">
      <div><strong>Location:</strong> ${escHtml(item.location)}</div>
      <div><strong>Contact:</strong> ${escHtml(item.contact)}</div>
      <div><strong>Posted:</strong> ${dateStr}</div>
      ${claimedStr ? `<div>✅ <strong>Claimed:</strong> ${claimedStr}</div>` : ""}
    </div>
    <div style="display:flex;gap:10px;margin-top:24px;">
      ${
				item.status === "open"
					? `<button class="btn btn-success btn-lg" onclick="claimItem('${id}');closeModal()">Mark as Claimed</button>`
					: `<button class="btn btn-reopen btn-lg"  onclick="reopenItem('${id}');closeModal()">Reopen Item</button>`
			}
      <button class="btn btn-danger btn-lg" onclick="confirmDelete('${id}')">🗑 Delete</button>
    </div>`;

	document.getElementById("modal").style.display = "block";
}

function closeModal() {
	document.getElementById("modal").style.display = "none";
}

document.getElementById("modal").addEventListener("click", (e) => {
	if (e.target === document.getElementById("modal")) closeModal();
});

function showToast(message, type = "info") {
	const existing = document.querySelector(".toast");
	if (existing) existing.remove();

	const toast = document.createElement("div");
	toast.className = `toast ${type}`;
	toast.textContent = message;
	document.body.appendChild(toast);
	setTimeout(() => toast.remove(), 3000);
}

function escHtml(str) {
	const d = document.createElement("div");
	d.textContent = str || "";
	return d.innerHTML;
}

const itemsRef = ref(db, "lostFoundItems");
onValue(itemsRef, (snapshot) => {
	latestSnapshot = snapshot.val() || {};
	renderBoard(latestSnapshot);
});

window.claimItem = claimItem;
window.reopenItem = reopenItem;
window.confirmDelete = confirmDelete;
window.openModal = openModal;
window.closeModal = closeModal;
