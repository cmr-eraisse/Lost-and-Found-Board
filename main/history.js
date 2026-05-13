import { db, ref, onValue } from "./firebase.js";

let activeType = "all";
let activeStatus = "all";
let searchQuery = "";
let sortKey = "createdAt";
let sortDir = -1;

let latestSnapshot = {};

function updateSummary(itemsObj) {
	const all = Object.values(itemsObj);
	const lost = all.filter((i) => i.type === "lost").length;
	const found = all.filter((i) => i.type === "found").length;
	const claimed = all.filter((i) => i.status === "claimed").length;
	const open = all.filter((i) => i.status === "open").length;

	document.getElementById("sumLost").textContent = lost;
	document.getElementById("sumFound").textContent = found;
	document.getElementById("sumClaimed").textContent = claimed;
	document.getElementById("sumOpen").textContent = open;

	const catCounts = {};
	all.forEach((i) => {
		catCounts[i.category] = (catCounts[i.category] || 0) + 1;
	});
	const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
	document.getElementById("sumTop").textContent = topCat ? topCat[0] : "—";
}

function sortBy(key) {
	if (sortKey === key) sortDir *= -1;
	else {
		sortKey = key;
		sortDir = 1;
	}
	renderTable(latestSnapshot);
}

document.querySelectorAll("[data-type]").forEach((btn) => {
	btn.addEventListener("click", () => {
		document
			.querySelectorAll("[data-type]")
			.forEach((b) => b.classList.remove("active"));
		btn.classList.add("active");
		activeType = btn.dataset.type;
		renderTable(latestSnapshot);
	});
});

document.querySelectorAll("[data-status]").forEach((btn) => {
	btn.addEventListener("click", () => {
		document
			.querySelectorAll("[data-status]")
			.forEach((b) => b.classList.remove("active"));
		btn.classList.add("active");
		activeStatus = btn.dataset.status;
		renderTable(latestSnapshot);
	});
});

document.getElementById("histSearch").addEventListener("input", (e) => {
	searchQuery = e.target.value.toLowerCase();
	renderTable(latestSnapshot);
});

function renderTable(itemsObj) {
	let items = Object.entries(itemsObj).map(([id, data]) => ({ id, ...data }));

	if (activeType !== "all") items = items.filter((i) => i.type === activeType);
	if (activeStatus !== "all")
		items = items.filter((i) => i.status === activeStatus);

	if (searchQuery) {
		items = items.filter(
			(i) =>
				i.itemname?.toLowerCase().includes(searchQuery) ||
				i.location?.toLowerCase().includes(searchQuery) ||
				i.category?.toLowerCase().includes(searchQuery) ||
				i.contact?.toLowerCase().includes(searchQuery),
		);
	}

	items.sort((a, b) => {
		const valA = a[sortKey] ?? "";
		const valB = b[sortKey] ?? "";
		if (valA < valB) return -1 * sortDir;
		if (valA > valB) return 1 * sortDir;
		return 0;
	});

	const tbody = document.getElementById("histBody");

	if (items.length === 0) {
		tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:48px;color:var(--muted);">
          No records found.
        </td>
      </tr>`;
		return;
	}

	tbody.innerHTML = items
		.map((item) => {
			const dateStr = new Date(item.createdAt).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
			});
			return `
      <tr>
        <td><span class="tag ${item.type}">${item.type === "lost" ? "Lost" : "Found"}</span></td>
        <td><strong>${escHtml(item.itemname)}</strong></td>
        <td>${escHtml(item.category)}</td>
        <td>${escHtml(item.location)}</td>
        <td>${escHtml(item.contact)}</td>
        <td><span class="tag ${item.status}">${item.status}</span></td>
        <td style="white-space:nowrap;">${dateStr}</td>
      </tr>`;
		})
		.join("");
}

function escHtml(str) {
	const d = document.createElement("div");
	d.textContent = str || "";
	return d.innerHTML;
}

const histRef = ref(db, "lostFoundItems");
onValue(histRef, (snapshot) => {
	latestSnapshot = snapshot.val() || {};
	updateSummary(latestSnapshot);
	renderTable(latestSnapshot);
});

window.sortBy = sortBy;