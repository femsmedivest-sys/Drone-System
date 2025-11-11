// Gantikan dengan Web App URL anda (berakhir /exec)
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmr6KxwyT99r5toQyzxnAQbWV7thUr_-jG6Iv7ci6t1stY_fIet0V-0PNqQpP8vxov/exec";

document.addEventListener('DOMContentLoaded', () => {
  // ... (Kod untuk booking form dan tab switch kekal sama) ...

  const bookingForm = document.getElementById('booking-form');
  const messageEl = document.getElementById('booking-message');
  const submitBtn = bookingForm.querySelector('.submit-btn');

  function setMessage(msg, isError = false) {
    messageEl.textContent = msg;
    messageEl.className =
      `mt-3 text-center text-sm font-bold ${isError ? 'text-red-400' : 'text-green-400'}`;
  }

  // Submit pinjaman baru
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitBtn.textContent = 'Menghantar...';
    submitBtn.disabled = true;
    setMessage('Sila tunggu, menghantar data...');

    const formData = new FormData(bookingForm);
    // Tambah action: 'loan'
    const data = { ...Object.fromEntries(formData.entries()), action: 'loan' };

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (result.status === 'success') {
        setMessage('✅ ' + result.message);
        bookingForm.reset();
        loadStatus();
      } else {
        throw new Error(result.message || 'Response error');
      }
    } catch (err) {
      setMessage('❌ ' + err.message, true);
    } finally {
      submitBtn.textContent = 'HANTAR REKOD PINJAMAN';
      submitBtn.disabled = false;
    }
  });

  // TAB SWITCH (pastikan class active toggle)
  const tabBooking = document.getElementById('tab-booking');
  const tabStatus = document.getElementById('tab-status');
  const contentBooking = document.getElementById('tab-booking-content');
  const contentStatus = document.getElementById('tab-status-content');

  function activateTab(tab) {
    if (tab === 'booking') {
      contentBooking.classList.add('active');
      contentStatus.classList.remove('active');
      tabBooking.classList.add('active');
      tabStatus.classList.remove('active');
    } else {
      contentBooking.classList.remove('active');
      contentStatus.classList.add('active');
      tabBooking.classList.remove('active');
      tabStatus.classList.add('active');
      loadStatus();
    }
  }

  tabBooking.addEventListener('click', () => activateTab('booking'));
  tabStatus.addEventListener('click', () => activateTab('status'));


  // Load status records
  async function loadStatus() {
    const container = document.getElementById('status-container');
    container.innerHTML = `<p class="text-gray-300">Memuatkan...</p>`;

    try {
      const res = await fetch(APPS_SCRIPT_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();
      if (!result.data || result.data.length === 0) {
        container.innerHTML = `<p class="text-gray-300 text-center">Tiada rekod pinjaman.</p>`;
        return;
      }

      const list = [...result.data].reverse(); // Guna SEMUA data

      container.innerHTML = "";
      list.forEach(item => {
        // Tentukan status dan kelas badge
        const status = item.Status || "Tiada Status";
        // Semak sama ada status adalah "Telah Dipulangkan" atau "Returned" (dari Spreadsheet anda)
        const isReturned = (status || "").toLowerCase() === "telah dipulangkan" || (status || "").toLowerCase() === "returned";
        const statusClass = isReturned ? "status-pulang" : "status-pending";
        const statusDisplay = isReturned ? "Telah Dipulangkan" : "Sedang Digunakan";

        // *** PEMBETULAN UNTUK TARIKH & MASA AMBIL (Menggunakan nilai yang diformat dari GAS) ***
        // Guna TarikhMasaAmbil yang diformat oleh Apps Script.
        const tarikhMasaAmbil = item.TarikhMasaAmbil || '-';

        // *** PEMBETULAN UNTUK TARIKH PULANG ***
        // Pastikan ReturnedAt juga menggunakan kunci baru (seperti yang sedia ada)
        const returnedDateDisplay = item.ReturnedAt && item.ReturnedAt.length > 5 ? item.ReturnedAt : '-';

        const card = document.createElement('div');
        card.className = "drone-card";

        // Tentukan sama ada butang PULANGKAN perlu dipaparkan
        const returnButtonHtml = isReturned
          ? `<p class="text-green-400 text-sm font-semibold">Tarikh Pulang: ${returnedDateDisplay}</p>`
          : `<div><button class="action-btn return-btn" data-row="${item.row}">PULANGKAN</button></div>`;


        card.innerHTML = `
            <div class="flex justify-between items-start">
              <div>
                <p class="text-gray-300 text-sm">
                  <span class="label-badge">Nama Peminjam:</span> ${escapeHtml(item.NamaPeminjam || "-")}
                </p>
                <p class="text-gray-300 text-sm">
                  <span class="label-badge">Site Peminjam:</span> ${escapeHtml(item.SitePeminjam || "-")} 
                </p>
                <p class="text-gray-300 text-sm">
                  <span class="label-badge">Model Drone:</span> ${escapeHtml(item.DroneModel || "-")} 
                </p>
                <p class="text-gray-300 text-sm mt-2">
                  <span class="label-badge">Tarikh & Masa Ambil:</span> ${tarikhMasaAmbil}
                </p>
                <p class="text-gray-300 text-sm">
                  <span class="label-badge">Lokasi Penerbangan:</span> ${escapeHtml(item.LokasiPenerbangan || "-")}
                </p>
                <p class="text-gray-300 text-sm">
                  <span class="label-badge">Tujuan Penerbangan:</span> ${escapeHtml(item.TujuanPenerbangan || "-")}
                </p>
              </div>

              <div class="text-right">
                <div class="mb-2">
                  <span class="status-badge ${statusClass}">${statusDisplay}</span>
                </div>

                ${returnButtonHtml}
              </div>
            </div>
          `;

        container.appendChild(card);
      });

      if (list.length === 0) {
        container.innerHTML = `<p class="text-gray-300 text-center">Tiada Pinjaman.</p>`;
      }

    } catch (err) {
      container.innerHTML = `<p class="text-red-400 text-center">Ralat: ${err.message}</p>`;
    }
  }

  // Global click listener for dynamic return buttons
  document.addEventListener('click', async (ev) => {
    const btn = ev.target.closest('.return-btn');
    if (!btn) return;

    const row = btn.getAttribute('data-row');
    if (!row) return alert('Row ID tidak ditemui.');

    // Confirm
    const ok = confirm('Sahkan: anda ingin menanda drone ini sebagai DIPULANGKAN?');
    if (!ok) return;

    // Disable button semasa request
    btn.disabled = true;
    btn.textContent = 'Memproses...';

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'return', row: row })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const resJson = await response.json();
      if (resJson.status === 'success') {
        // reload status
        loadStatus();
      } else {
        throw new Error(resJson.message || 'Gagal mengemaskini');
      }
    } catch (err) {
      alert('Ralat: ' + err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = 'PULANGKAN';
    }
  });

  // small helper to escape HTML
  function escapeHtml(unsafe) {
    return String(unsafe)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Load initial status if status tab active
  if (contentStatus.classList.contains('active')) {
    loadStatus();
  }

});