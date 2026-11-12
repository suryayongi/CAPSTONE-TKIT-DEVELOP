================================================================================
DOKUMEN PEMBARUAN VERSI SISTEM (CHANGELOG)
Capstone Design Project — Repositori Media Pembelajaran Interaktif TKIT Al Madani
================================================================================

1. METADATA RILIS & RINGKASAN KOMIT
--------------------------------------------------------------------------------
* Komit Hash          : 2ff7f5f634d0eb38e7828bdc0208a6e06735f40c (HEAD -> LangVersion, origin/main)
* Pengembang / Author : Zhafran Ahmad Zaidan <zhafranforstudy04@gmail.com>
* Waktu Komit         : Jumat, 6 November 2026, 04:32:22 WIB (+07:00)
* Pesan Komit         : "update tgl 6 nov 26 (frontend)"
* Cakupan Perubahan   : 42 berkas dimodifikasi, +6.907 baris ditambahkan, -1.830 baris dihapus
* Status Build        : SUCCESS / Lolos Pengujian (Vite v8.3.5 built in 775ms, 0 error)

2. RINCIAN PERUBAHAN UTAMA
--------------------------------------------------------------------------------
A. REFAKTORISASI SISTEM IKON VEKTOR MODULAR (360+ IKON TERKURASI)
   Folder baru: frontend/src/utils/icons/
   Sebelumnya seluruh SVG menumpuk di satu file monolitik icons.jsx. Kini dipecah menjadi 11 modul:
   - animals.js (491 baris)    : Fauna lengkap untuk tema sentra binatang.
   - food.js (340 baris)       : Makanan sehat, buah, dan kudapan anak.
   - islamic.js (259 baris)    : Ikon islami khas TKIT (masjid, ka'bah, quran, sajadah, busana muslim).
   - nature.js (271 baris)     : Alam semesta, tanaman, dan cuaca.
   - objects.js (352 baris)    : Peralatan kelas, mainan edukatif, dan perkakas sentra.
   - produce.js (322 baris)    : Sayur-mayur dan hasil perkebunan.
   - professions.js (386 baris): Profesi lengkap (guru, dokter, polisi, pemadam, koki, arsitek, dsb).
   - school.js (348 baris)     : Alat tulis dan sarana PAUD.
   - symbols.js & vehicles.js  : Simbol antarmuka dan kendaraan darat/laut/udara.
   - catalog.js & IconPicker.jsx : Fitur pencarian dwibahasa (ID/EN), tab kategori horizontal, dan mode popover anti-overflow.

B. PENINGKATAN KINERJA VIDEO PLAYER (VideoPlayer.jsx)
   - Antarmuka Ramping: Kontrol 1 baris di bawah agar konsentrasi anak usia dini tidak terdistraksi.
   - Slide-Over Drawer Kanan saat Fullscreen: Guru dapat menandai dan menyunting kuis langsung saat video dalam mode layar penuh (Fullscreen) tanpa harus keluar dari tampilan proyektor.
   - Toleransi Jeda Detik: Deteksi cue points lebih presisi saat seek/pause.

C. INTERAKTIVITAS KUIS RAMAH ANAK (QuizOverlay.jsx)
   - Audio Responsif: Integrasi sound effects ceria (pop, tick, correct).
   - Action Prompt Timer: Hitung mundur otomatis (default 8 detik) untuk kuis gerak & lagu.
   - Feedback Positif: Kalimat penguatan bernuansa islami dan memotivasi.

D. DEKOMPOSISI HALAMAN STUDIO GURU (StudioPage.jsx)
   - CuePointForm.jsx (465 baris): Form kuis terisolasi anti-overflow (min-w-0).
   - CuePointItem.jsx (116 baris): Baris daftar kuis dengan pengaman teks panjang.
   - Pratinjau Kuis Instan: Guru dapat menguji coba langsung kuis sebelum disimpan.

E. PUSTAKA KOMPONEN UI REUSABLE BARU
   - Alert.jsx             : Notifikasi serbaguna inline & floating.
   - BackButton.jsx        : Tombol kembali kontekstual otomatis.
   - BackupHelpModal.jsx   : Modal tutorial cadangan & pemindahan berkas JSON kurikulum.
   - Breadcrumb.jsx        : Navigasi jejak halaman sentence-case.
   - EmptyState.jsx        : Tampilan standar saat data kosong.
   - LicenseModal.jsx      : Modal atribusi lisensi video & Creative Commons.
   - StatCard.jsx          : Kartu metrik dengan varian warna di dashboard.
   - SubthemeFilterTabs.jsx: Tab filter subtema di halaman detail tema.

3. CATATAN WORKING DIRECTORY LOKAL
--------------------------------------------------------------------------------
* frontend/src/services/authService.js:
  Terdapat modifikasi lokal yang belum di-commit untuk auto-login fallback akun guru (usr-guru-01) saat mengakses rute /admin guna kemudahan demonstrasi tanpa harus login manual.
