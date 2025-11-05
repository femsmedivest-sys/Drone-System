// ----------------------------
// KONFIGURASI
// ----------------------------
// GANTIKAN DENGAN URL APPS SCRIPT BARU ANDA DARI LANGKAH 2
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKcCLjAzV0SB4ZsJP-jsFeDqHlpqSDNxxZUgbGDgo2hx_LrVDBtOZaajPTc4XgHyh5/exec";

// ----------------------------
// FUNGSI UTAMA
// ----------------------------
document.addEventListener('DOMContentLoaded', ( ) => {
  const bookingForm = document.getElementById('booking-form');
  const messageEl = document.getElementById('booking-message');
  const submitBtn = bookingForm.querySelector('.submit-btn');

  // Fungsi untuk memaparkan mesej
  function setMessage(msg, isError = false) {
    messageEl.textContent = msg;
    messageEl.className = `mt-3 text-center text-sm font-bold ${isError ? 'text-red-400' : 'text-green-400'}`;
  }

  // Apabila borang dihantar...
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Halang borang dari refresh halaman

    // Tukar teks butang dan paparkan mesej menunggu
    submitBtn.textContent = 'Menghantar...';
    submitBtn.disabled = true;
    setMessage('Sila tunggu, menghantar data ke Google Sheet...');

    // Dapatkan semua data dari borang
    const formData = new FormData(bookingForm);
    const data = Object.fromEntries(formData.entries());

    try {
      // Hantar data ke Apps Script
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'doPOST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      // Semak hasil yang diterima dari Apps Script
      if (result.status === 'success') {
        setMessage('✅ ' + result.message); // Papar mesej kejayaan
        bookingForm.reset(); // Kosongkan borang
      } else {
        throw new Error(result.message); // Jika gagal, baling ralat
      }
    } catch (err) {
      // Tangkap sebarang ralat (cth: 'Failed to fetch' atau ralat dari Apps Script)
      setMessage(`❌ Ralat: ${err.message}`, true);
    } finally {
      // Kembalikan butang kepada keadaan asal
      submitBtn.textContent = 'HANTAR REKOD PINJAMAN KE GOOGLE SHEET';
      submitBtn.disabled = false;
    }
  });
});

