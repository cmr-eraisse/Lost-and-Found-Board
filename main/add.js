import { db, ref, push, onValue } from "./firebase.js";

let selectedType = "";

let latestSnapshot = {};

const itemsRef = ref(db, "lostFoundItems");
onValue(itemsRef, (snapshot) => {
	latestSnapshot = snapshot.val() || {};
});

document.querySelectorAll(".type-btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		document
			.querySelectorAll(".type-btn")
			.forEach((b) => b.classList.remove("selected"));
		btn.classList.add("selected");
		selectedType = btn.dataset.type;
		document.getElementById("itemType").value = selectedType;
	});
});

function checkDuplicate(itemName) {
	const oneDayAgo = Date.now() - 86400000;
	const nameLower = itemName.trim().toLowerCase();

	return Object.values(latestSnapshot).some((item) => {
		const similar =
			item.itemname?.toLowerCase().includes(nameLower) ||
			nameLower.includes(item.itemname?.toLowerCase());
		const recent = item.createdAt > oneDayAgo;
		return similar && recent;
	});
}

document.getElementById("itemName").addEventListener("blur", () => {
	const name = document.getElementById("itemName").value;
	const warning = document.getElementById("duplicateWarning");
	warning.style.display =
		name.length > 2 && checkDuplicate(name) ? "block" : "none";
});

function validateForm() {
	const errors = [];

	if (!selectedType) errors.push("Please select Lost or Found.");

	const fields = [
		{ id: "itemName", label: "Item Name" },
		{ id: "category", label: "Category" },
		{ id: "location", label: "Location" },
		{ id: "contact", label: "Contact Info" },
		{ id: "description", label: "Description" },
	];

	fields.forEach(({ id, label }) => {
		const val = document.getElementById(id).value.trim();
		if (!val) errors.push(`${label} is required.`);
	});

	return errors;
}

document.getElementById("addItemForm").addEventListener("submit", async (e) => {
	e.preventDefault();

	const errors = validateForm();
	if (errors.length) {
		showToast("⚠️ " + errors[0], "error");
		return;
	}

	const btn = document.getElementById("submitBtn");
	btn.disabled = true;
	btn.textContent = "Saving...";

	const newItem = {
		type: selectedType,
		itemname: document.getElementById("itemName").value.trim(),
		description: document.getElementById("description").value.trim(),
		location: document.getElementById("location").value.trim(),
		category: document.getElementById("category").value,
		contact: document.getElementById("contact").value.trim(),
		imageUrl: document.getElementById("imageUrl").value.trim() || null,
		status: "open",
		createdAt: Date.now(),
		claimedAt: null,
	};

	try {
		await push(itemsRef, newItem);
		showToast("Item posted successfully!", "success");
		resetForm();

		setTimeout(() => {
			window.location.href = "dashboard.html";
		}, 1500);
	} catch (err) {
		console.error(err);
		showToast("Failed to save. Try again.", "error");
		btn.disabled = false;
		btn.textContent = "Post Item";
	}
});

function resetForm() {
	document.getElementById("addItemForm").reset();
	document
		.querySelectorAll(".type-btn")
		.forEach((b) => b.classList.remove("selected"));
	document.getElementById("duplicateWarning").style.display = "none";
	selectedType = "";
}

function showToast(message, type = "info") {
	const existing = document.querySelector(".toast");
	if (existing) existing.remove();

	const toast = document.createElement("div");
	toast.className = `toast ${type}`;
	toast.textContent = message;
	document.body.appendChild(toast);
	setTimeout(() => toast.remove(), 3500);
}

window.resetForm = resetForm;