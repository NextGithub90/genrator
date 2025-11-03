// Utility: format uang Rupiah
const formatIDR = (n) => {
  const val = Number(n || 0);
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
};

// Utility: parse angka dari input yang mungkin berisi titik/koma
const parseIDR = (s) => {
  if (typeof s === "number") return s;
  if (!s) return 0;
  return Number(String(s).replace(/[^0-9-]/g, "")) || 0;
};

// Convert number to Indonesian words (Terbilang)
function terbilang(n) {
  n = Math.floor(parseIDR(n));
  if (n === 0) return "nol Rupiah";
  const angka = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan"];
  // Skala ribuan (per 3 digit)
  const tingkat = ["", "ribu", "juta", "milyar", "triliun"];
  const chunk = (num) => {
    let str = "";
    const ratus = Math.floor(num / 100);
    const puluh = Math.floor((num % 100) / 10);
    const satuan = num % 10;
    if (ratus) str += ratus === 1 ? "seratus" : angka[ratus] + " ratus";
    if (puluh) str += (str ? " " : "") + (puluh === 1 ? "sepuluh" : angka[puluh] + " puluh");
    if (satuan) {
      // 11-19 harus menggunakan 'belas' tanpa menghapus bagian ratus sebelumnya
      if (puluh === 1 && satuan === 1) str += (str ? " " : "") + "sebelas";
      else if (puluh === 1 && satuan > 1) str += (str ? " " : "") + angka[satuan] + " belas";
      else str += (str ? " " : "") + (satuan === 1 && !puluh && !ratus ? "satu" : angka[satuan]);
    }
    return str;
  };
  let words = "";
  let i = 0;
  while (n > 0) {
    const part = n % 1000;
    if (part) {
      let partStr = chunk(part);
      if (i === 1 && part === 1) partStr = "seribu"; // 1000 -> seribu
      words = partStr + (tingkat[i] && part ? " " + tingkat[i] : "") + (words ? " " + words : "");
    }
    n = Math.floor(n / 1000);
    i++;
  }
  return words + " Rupiah";
}

// State
const state = {
  company: {
    name: "YAYASAN RIBHUL ULUM",
    address: "Jl. Sekedar Contoh Saja No. 100",
    phone: "(012) 34567890",
    city: "Kota Sampel",
    month: "",
  },
  employee: {
    nik: "QC001",
    kode: "QC001",
    nama: "FAIZAR KHAIRI",
    jabatan: "QUALITY CONTROL",
    npwp: "333444555666",
    gender: "L",
    ttl: "",
    pendidikan: "",
    wali: "Tidak",
    jtm: 0,
    unit: "",
  },
  org: {
    pengurus: "",
    pembina: "",
    pengawas: "",
  },
  income: [
    { label: "GAJI POKOK", amount: 4750000 },
    { label: "TUNJANGAN JABATAN", amount: 2100000 },
    { label: "TUNJANGAN BERAS", amount: 1000000 },
    { label: "TUNJANGAN LAIN-LAIN", amount: 500000 },
    { label: "LEMBUR", amount: 300000 },
    { label: "THR", amount: 0 },
  ],
  deduction: [
    { label: "PPh21", amount: 712500 },
    { label: "BPJS/JAMSOSTEK", amount: 712500 },
    { label: "KOPERASI", amount: 90000 },
    { label: "", amount: 1250000 },
  ],
};

// Elements
const el = {
  form: document.getElementById("payroll-form"),
  // company
  companyName: document.getElementById("companyName"),
  companyAddress: document.getElementById("companyAddress"),
  companyPhone: document.getElementById("companyPhone"),
  companyCity: document.getElementById("companyCity"),
  payrollMonth: document.getElementById("payrollMonth"),
  // employee
  nik: document.getElementById("nik"),
  kode: document.getElementById("kode"),
  nama: document.getElementById("nama"),
  jabatan: document.getElementById("jabatan"),
  npwp: document.getElementById("npwp"),
  // containers
  incomeItems: document.getElementById("income-items"),
  deductionItems: document.getElementById("deduction-items"),
  addIncome: document.getElementById("addIncome"),
  addDeduction: document.getElementById("addDeduction"),
  resetForm: document.getElementById("resetForm"),
  downloadPdf: document.getElementById("downloadPdf"),
  // preview
  p_companyName: document.getElementById("p_companyName"),
  p_companyAddress: document.getElementById("p_companyAddress"),
  p_companyPhone: document.getElementById("p_companyPhone"),
  p_companyCity: document.getElementById("p_companyCity"),
  p_month: document.getElementById("p_month"),
  p_nik: document.getElementById("p_nik"),
  p_nama: document.getElementById("p_nama"),
  p_jabatan: document.getElementById("p_jabatan"),
  p_npwp: document.getElementById("p_npwp"),
  // detail guru
  p_gender: document.getElementById("p_gender"),
  p_ttl: document.getElementById("p_ttl"),
  p_pendidikan: document.getElementById("p_pendidikan"),
  p_wali: document.getElementById("p_wali"),
  p_jtm: document.getElementById("p_jtm"),
  p_unit: document.getElementById("p_unit"),
  incomeTable: document.getElementById("income-table"),
  deductionTable: document.getElementById("deduction-table"),
  totalIncome: document.getElementById("total-income"),
  totalDeduction: document.getElementById("total-deduction"),
  netSalary: document.getElementById("net-salary"),
  terbilang: document.getElementById("terbilang"),
  // organisasi inputs
  orgPengurus: document.getElementById("orgPengurus"),
  orgPembina: document.getElementById("orgPembina"),
  orgPengawas: document.getElementById("orgPengawas"),
  // organisasi preview lists
  p_orgPengurus: document.getElementById("p_orgPengurus"),
  p_orgPembina: document.getElementById("p_orgPembina"),
  p_orgPengawas: document.getElementById("p_orgPengawas"),
};

function monthLabel(val) {
  if (!val) return "Periode";
  const [y, m] = val.split("-");
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  return `${months[Number(m) - 1]} ${y}`;
}

// Render form item rows
function renderItemRows(type) {
  const list = type === "income" ? state.income : state.deduction;
  const container = type === "income" ? el.incomeItems : el.deductionItems;
  container.innerHTML = "";
  list.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "row align-items-center g-2 mb-2";
    row.innerHTML = `
      <div class="col-6">
        <input type="text" class="form-control form-control-sm" value="${it.label}" data-type="${type}" data-index="${idx}" data-field="label" aria-label="${type} label">
      </div>
      <div class="col-5">
        <input type="text" inputmode="numeric" class="form-control form-control-sm currency-input" value="${it.amount}" data-type="${type}" data-index="${idx}" data-field="amount" aria-label="${type} amount">
      </div>
      <div class="col-1 text-end">
        <button type="button" class="btn btn-link text-danger p-0 remove-btn" data-type="${type}" data-index="${idx}" aria-label="hapus"><i class="bi bi-x-lg"></i></button>
      </div>`;
    container.appendChild(row);
  });
}

// Render slip preview tables
function renderSlipTables() {
  el.incomeTable.innerHTML = "";
  el.deductionTable.innerHTML = "";
  state.income.forEach((it) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>- ${it.label}</td><td>${formatIDR(it.amount)}</td>`;
    el.incomeTable.appendChild(tr);
  });
  state.deduction.forEach((it) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>- ${it.label || ""}</td><td>${formatIDR(it.amount)}</td>`;
    el.deductionTable.appendChild(tr);
  });
}

function updateCompanyPreview() {
  el.p_companyName.textContent = state.company.name;
  el.p_companyAddress.textContent = state.company.address;
  el.p_companyPhone.textContent = state.company.phone;
  el.p_companyCity.textContent = state.company.city;
  el.p_month.textContent = monthLabel(state.company.month);
}

function updateEmployeePreview() {
  el.p_nik.textContent = state.employee.nik;
  el.p_nama.textContent = state.employee.nama;
  el.p_jabatan.textContent = state.employee.jabatan;
  el.p_npwp.textContent = state.employee.npwp;
  // detail guru
  el.p_gender.textContent = state.employee.gender || "-";
  el.p_ttl.textContent = state.employee.ttl || "-";
  el.p_pendidikan.textContent = state.employee.pendidikan || "-";
  el.p_wali.textContent = state.employee.wali || "-";
  el.p_jtm.textContent = state.employee.jtm ?? "-";
  el.p_unit.textContent = state.employee.unit || "-";
}

function renderOrgPreview() {
  const toList = (str) => str
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const renderUL = (ulEl, arr) => {
    if (!ulEl) return;
    ulEl.innerHTML = "";
    arr.forEach((line) => {
      const li = document.createElement("li");
      li.textContent = line;
      ulEl.appendChild(li);
    });
  };
  renderUL(el.p_orgPengurus, toList(state.org.pengurus));
  renderUL(el.p_orgPembina, toList(state.org.pembina));
  renderUL(el.p_orgPengawas, toList(state.org.pengawas));
}

function recalc() {
  const totalIn = state.income.reduce((s, it) => s + parseIDR(it.amount), 0);
  const totalOut = state.deduction.reduce((s, it) => s + parseIDR(it.amount), 0);
  const net = totalIn - totalOut;
  el.totalIncome.textContent = formatIDR(totalIn);
  el.totalDeduction.textContent = formatIDR(totalOut);
  el.netSalary.textContent = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(net);
  el.terbilang.textContent = `# ${terbilang(net)} #`;
}

function syncFromInputs() {
  state.company.name = el.companyName.value.trim();
  state.company.address = el.companyAddress.value.trim();
  state.company.phone = el.companyPhone.value.trim();
  state.company.city = el.companyCity.value.trim();
  state.company.month = el.payrollMonth.value;

  state.employee.nik = el.nik.value.trim();
  state.employee.kode = el.kode.value.trim();
  state.employee.nama = el.nama.value.trim();
  state.employee.jabatan = el.jabatan.value.trim();
  state.employee.npwp = el.npwp.value.trim();

  // organisasi
  if (el.orgPengurus) state.org.pengurus = el.orgPengurus.value;
  if (el.orgPembina) state.org.pembina = el.orgPembina.value;
  if (el.orgPengawas) state.org.pengawas = el.orgPengawas.value;

  updateCompanyPreview();
  updateEmployeePreview();
  renderOrgPreview();
  renderOrgBoxes();
  renderSlipTables();
  recalc();
}

function addItem(type) {
  const list = type === "income" ? state.income : state.deduction;
  list.push({ label: type === "income" ? "Pendapatan Baru" : "Potongan Baru", amount: 0 });
  renderItemRows(type);
  renderSlipTables();
  recalc();
}

function removeItem(type, index) {
  const list = type === "income" ? state.income : state.deduction;
  list.splice(index, 1);
  renderItemRows(type);
  renderSlipTables();
  recalc();
}

function initMonthDefault() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  el.payrollMonth.value = ym;
  state.company.month = ym;
}

function exportPDF() {
  const element = document.getElementById("slip-a4");
  const fileNameSafe = state.employee.nama ? state.employee.nama.replace(/\s+/g, "_") : "Slip_Gaji";
  const opt = {
    margin: 0,
    filename: `Slip_Gaji_${fileNameSafe}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };
  html2pdf().from(element).set(opt).save();
}

function attachEvents() {
  // Inputs company/employee
  ["companyName", "companyAddress", "companyPhone", "companyCity", "payrollMonth", "nik", "kode", "nama", "jabatan", "npwp", "orgPengurus", "orgPembina", "orgPengawas"].forEach((id) => document.getElementById(id)?.addEventListener("input", syncFromInputs));

  // Delegation for item edit/remove
  el.incomeItems.addEventListener("input", (e) => {
    const t = e.target;
    const type = t.dataset.type;
    if (!type) return;
    const idx = Number(t.dataset.index);
    const field = t.dataset.field;
    if (field === "label") {
      state.income[idx].label = t.value;
    } else {
      state.income[idx].amount = parseIDR(t.value);
    }
    renderSlipTables();
    recalc();
  });
  el.deductionItems.addEventListener("input", (e) => {
    const t = e.target;
    const type = t.dataset.type;
    if (!type) return;
    const idx = Number(t.dataset.index);
    const field = t.dataset.field;
    if (field === "label") state.deduction[idx].label = t.value;
    else state.deduction[idx].amount = parseIDR(t.value);
    renderSlipTables();
    recalc();
  });

  // Remove buttons
  [el.incomeItems, el.deductionItems].forEach((container) => {
    container.addEventListener("click", (e) => {
      const btn = e.target.closest(".remove-btn");
      if (!btn) return;
      removeItem(btn.dataset.type, Number(btn.dataset.index));
    });
  });

  el.addIncome.addEventListener("click", () => addItem("income"));
  el.addDeduction.addEventListener("click", () => addItem("deduction"));
  el.downloadPdf.addEventListener("click", exportPDF);
  el.resetForm.addEventListener("click", () => {
    setTimeout(() => {
      // wait for browser reset
      // Re-sync defaults from inputs
      state.company.name = el.companyName.value = "YAYASAN RIBHUL ULUM";
      state.company.address = el.companyAddress.value = "Jl. Sekedar Contoh Saja No. 100";
      state.company.phone = el.companyPhone.value = "(012) 34567890";
      state.company.city = el.companyCity.value = "Kota Sampel";
      initMonthDefault();
      state.employee = { nik: "QC001", kode: "QC001", nama: "FAIZAR KHAIRI", jabatan: "QUALITY CONTROL", npwp: "333444555666", gender: "L", ttl: "", pendidikan: "", wali: "Tidak", jtm: 0, unit: "" };
      el.nik.value = state.employee.nik;
      el.kode.value = state.employee.kode;
      el.nama.value = state.employee.nama;
      el.jabatan.value = state.employee.jabatan;
      el.npwp.value = state.employee.npwp;
      state.income = [
        { label: "GAJI POKOK", amount: 4750000 },
        { label: "TUNJANGAN JABATAN", amount: 2100000 },
        { label: "TUNJANGAN BERAS", amount: 1000000 },
        { label: "TUNJANGAN LAIN-LAIN", amount: 500000 },
        { label: "LEMBUR", amount: 300000 },
        { label: "THR", amount: 0 },
      ];
      state.deduction = [
        { label: "PPh21", amount: 712500 },
        { label: "BPJS/JAMSOSTEK", amount: 712500 },
        { label: "KOPERASI", amount: 90000 },
        { label: "", amount: 1250000 },
      ];
      // reset organisasi
      state.org = { pengurus: "", pembina: "", pengawas: "" };
      if (el.orgPengurus) el.orgPengurus.value = "";
      if (el.orgPembina) el.orgPembina.value = "";
      if (el.orgPengawas) el.orgPengawas.value = "";
      renderItemRows("income");
      renderItemRows("deduction");
      syncFromInputs();
    }, 50);
  });

  // Quick add for Struktur Organisasi
  document.getElementById("addOrgPengurus")?.addEventListener("click", () => {
    const nama = (document.getElementById("orgPengurusNama")?.value || "").trim();
    const jabatan = (document.getElementById("orgPengurusJabatan")?.value || "").trim();
    const single = (document.getElementById("orgPengurusNew")?.value || "").trim();
    const val = single || (nama && jabatan ? `${nama} — ${jabatan}` : "");
    if (!val) return;
    el.orgPengurus.value = (el.orgPengurus.value ? el.orgPengurus.value + "\n" : "") + val;
    if (document.getElementById("orgPengurusNama")) document.getElementById("orgPengurusNama").value = "";
    if (document.getElementById("orgPengurusJabatan")) document.getElementById("orgPengurusJabatan").value = "";
    if (document.getElementById("orgPengurusNew")) document.getElementById("orgPengurusNew").value = "";
    syncFromInputs();
  });
  document.getElementById("addOrgPembina")?.addEventListener("click", () => {
    const nama = (document.getElementById("orgPembinaNama")?.value || "").trim();
    const jabatan = (document.getElementById("orgPembinaJabatan")?.value || "").trim();
    const single = (document.getElementById("orgPembinaNew")?.value || "").trim();
    const val = single || (nama && jabatan ? `${nama} — ${jabatan}` : "");
    if (!val) return;
    el.orgPembina.value = (el.orgPembina.value ? el.orgPembina.value + "\n" : "") + val;
    if (document.getElementById("orgPembinaNama")) document.getElementById("orgPembinaNama").value = "";
    if (document.getElementById("orgPembinaJabatan")) document.getElementById("orgPembinaJabatan").value = "";
    if (document.getElementById("orgPembinaNew")) document.getElementById("orgPembinaNew").value = "";
    syncFromInputs();
  });
  document.getElementById("addOrgPengawas")?.addEventListener("click", () => {
    const nama = (document.getElementById("orgPengawasNama")?.value || "").trim();
    const jabatan = (document.getElementById("orgPengawasJabatan")?.value || "").trim();
    const single = (document.getElementById("orgPengawasNew")?.value || "").trim();
    const val = single || (nama && jabatan ? `${nama} — ${jabatan}` : "");
    if (!val) return;
    el.orgPengawas.value = (el.orgPengawas.value ? el.orgPengawas.value + "\n" : "") + val;
    if (document.getElementById("orgPengawasNama")) document.getElementById("orgPengawasNama").value = "";
    if (document.getElementById("orgPengawasJabatan")) document.getElementById("orgPengawasJabatan").value = "";
    if (document.getElementById("orgPengawasNew")) document.getElementById("orgPengawasNew").value = "";
    syncFromInputs();
  });

  // Modal Tambah Struktur Organisasi (serupa flow Data Guru)
  const orgAddBtn = document.getElementById("orgAdd");
  const orgModalEl = document.getElementById("orgModal");
  const orgCategory = document.getElementById("orgCategory");
  const orgNama = document.getElementById("orgNama");
  const orgJabatan = document.getElementById("orgJabatan");
  const orgSave = document.getElementById("orgSave");
  let orgModalInstance = null;

  if (orgModalEl && window.bootstrap) {
    try {
      orgModalInstance = new bootstrap.Modal(orgModalEl);
    } catch (err) {
      orgModalInstance = null;
    }
  }

  orgAddBtn?.addEventListener("click", () => {
    if (orgCategory) orgCategory.value = "pengurus";
    if (orgNama) orgNama.value = "";
    if (orgJabatan) orgJabatan.value = "";
    if (orgModalInstance) orgModalInstance.show();
  });

  orgSave?.addEventListener("click", () => {
    const kategori = (orgCategory?.value || "pengurus");
    const nama = (orgNama?.value || "").trim();
    const jabatan = (orgJabatan?.value || "").trim();
    if (!nama || !jabatan) return;
    const line = `${nama} — ${jabatan}`;
    let ta = el.orgPengurus;
    if (kategori === "pembina") ta = el.orgPembina;
    else if (kategori === "pengawas") ta = el.orgPengawas;
    ta.value = (ta.value ? ta.value + "\n" : "") + line;
    if (orgModalInstance) orgModalInstance.hide();
    syncFromInputs();
  });
}

function init() {
  initMonthDefault();
  // Prefill inputs
  el.companyName.value = state.company.name;
  el.companyAddress.value = state.company.address;
  el.companyPhone.value = state.company.phone;
  el.companyCity.value = state.company.city;

  el.nik.value = state.employee.nik;
  el.kode.value = state.employee.kode;
  el.nama.value = state.employee.nama;
  el.jabatan.value = state.employee.jabatan;
  el.npwp.value = state.employee.npwp;

  // Prefill organisasi
  if (el.orgPengurus) el.orgPengurus.value = state.org.pengurus;
  if (el.orgPembina) el.orgPembina.value = state.org.pembina;
  if (el.orgPengawas) el.orgPengawas.value = state.org.pengawas;

  renderItemRows("income");
  renderItemRows("deduction");
  syncFromInputs();
  attachEvents();
}

// Tampilkan daftar org sebagai kartu dengan tombol hapus
function renderOrgBoxes() {
  const build = (containerId, str, role) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";
    const lines = str.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    lines.forEach((line, idx) => {
      const div = document.createElement("div");
      div.className = "border rounded p-2 mb-2 d-flex justify-content-between align-items-center";
      div.innerHTML = `<span>${line}</span><button class="btn btn-sm btn-outline-danger org-del" data-role="${role}" data-index="${idx}"><i class="bi bi-x-lg"></i></button>`;
      container.appendChild(div);
    });
  };
  build("orgPengurusList", state.org.pengurus || "", "pengurus");
  build("orgPembinaList", state.org.pembina || "", "pembina");
  build("orgPengawasList", state.org.pengawas || "", "pengawas");
}

// Delegasi hapus item organisasi
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".org-del");
  if (!btn) return;
  const role = btn.dataset.role;
  const idx = Number(btn.dataset.index);
  const getStr = () => role === "pembina" ? state.org.pembina : role === "pengawas" ? state.org.pengawas : state.org.pengurus;
  const setStr = (val) => {
    if (role === "pembina") state.org.pembina = val; else if (role === "pengawas") state.org.pengawas = val; else state.org.pengurus = val;
  };
  const arr = (getStr() || "").split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  arr.splice(idx, 1);
  const joined = arr.join("\n");
  setStr(joined);
  // sinkron ke textarea hidden
  if (role === "pembina") document.getElementById("orgPembina").value = joined;
  else if (role === "pengawas") document.getElementById("orgPengawas").value = joined;
  else document.getElementById("orgPengurus").value = joined;
  renderOrgBoxes();
  renderOrgPreview();
});

// -----------------------
// Navigasi & Halaman Data Guru
// -----------------------
function initNavigation() {
  const navSlip = document.getElementById("nav-slip");
  const navGuru = document.getElementById("nav-guru");
  const tabSlip = document.getElementById("tab-slip");
  const tabGuru = document.getElementById("tab-guru");
  const mNavSlip = document.getElementById("m-nav-slip");
  const mNavGuru = document.getElementById("m-nav-guru");
  const mobileSidebarEl = document.getElementById("mobileSidebar");
  const mobileSidebar = mobileSidebarEl ? new bootstrap.Offcanvas(mobileSidebarEl) : null;

  // Tabs tambahan untuk sidebar desktop
  const tabDashboard = document.getElementById("tab-dashboard");
  const tabProfil = document.getElementById("tab-profil");
  const tabAset = document.getElementById("tab-aset");
  const tabPendapatan = document.getElementById("tab-pendapatan");
  const tabPengeluaran = document.getElementById("tab-pengeluaran");
  const sidebar = document.querySelector(".sidebar-desktop");
  const guruUnitList = document.getElementById("guru-unit-list");

  function showTab(which) {
    // Pastikan hanya satu section tampil dengan memanfaatkan showSection
    showSection(which);

    // Update state tombol nav (legacy pill & mobile)
    if (which === "guru") {
      navGuru?.classList.add("active");
      navSlip?.classList.remove("active");
      mNavGuru?.classList.add("active");
      mNavSlip?.classList.remove("active");
    } else {
      navSlip?.classList.add("active");
      navGuru?.classList.remove("active");
      mNavSlip?.classList.add("active");
      mNavGuru?.classList.remove("active");
    }
    // Tutup sidebar setelah berpindah tab di mobile
    mobileSidebar?.hide();
  }

  // Navigasi generik untuk menu sidebar (Dashboard, Profil, Aset, Keuangan)
  function showSection(which) {
    const allTabs = [
      { id: "slip", el: tabSlip },
      { id: "guru", el: tabGuru },
      { id: "dashboard", el: tabDashboard },
      { id: "profil", el: tabProfil },
      { id: "aset", el: tabAset },
      { id: "pendapatan", el: tabPendapatan },
      { id: "pengeluaran", el: tabPengeluaran },
    ];
    allTabs.forEach((t) => t.el?.classList.add("d-none"));
    const target = allTabs.find((t) => t.id === which);
    if (target?.el) target.el.classList.remove("d-none");

    // Highlight nav mobile bila relevan
    mNavSlip?.classList.toggle("active", which === "slip");
    mNavGuru?.classList.toggle("active", which === "guru");

    // Render ulang Dashboard saat ditampilkan agar metriknya selalu terbaru
    if (which === "dashboard") {
      try { renderDashboard(); } catch {}
    }

    // Tutup sidebar mobile jika terbuka
    mobileSidebar?.hide();
  }

  navSlip?.addEventListener("click", () => showTab("slip"));
  navGuru?.addEventListener("click", () => showTab("guru"));
  mNavSlip?.addEventListener("click", () => showTab("slip"));
  mNavGuru?.addEventListener("click", () => showTab("guru"));

  // Event untuk sidebar desktop
  sidebar?.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (!link) return;

    const tab = link.dataset.tab;
    const unit = link.dataset.unit;
    const unitSlip = link.dataset.unitSlip;
    const isCollapseToggle = link.getAttribute("data-bs-toggle") === "collapse";
    if (isCollapseToggle) return; // biarkan Bootstrap menangani toggle
    e.preventDefault();

    // Sub-menu Data Guru: filter unit dan tampilkan tab guru
    if (unit && link.closest("#guru-submenu")) {
      const btn = guruUnitList?.querySelector(`[data-unit="${unit}"]`);
      btn?.click();
      showSection("guru");
      return;
    }
    // Sub-menu Slip Gaji: set unit di preview dan tampilkan slip
    if (unitSlip && link.closest("#slip-submenu")) {
      state.employee.unit = unitSlip;
      updateEmployeePreview();
      showSection("slip");
      return;
    }
    // Link biasa: tampilkan section terkait
    if (tab) {
      showSection(tab);
    }
  });

  // Event untuk sidebar mobile (offcanvas)
  const mobileSidebarNav = document.querySelector(".mobile-sidebar");
  mobileSidebarNav?.addEventListener("click", (e) => {
    const link = e.target.closest(".nav-link");
    if (!link) return;
    const tab = link.dataset.tab;
    const unit = link.dataset.unit;
    const unitSlip = link.dataset.unitSlip;
    const isCollapseToggle = link.getAttribute("data-bs-toggle") === "collapse";
    if (isCollapseToggle) return;
    e.preventDefault();

    // Sub-menu Data Guru: filter unit dan tampilkan tab guru
    if (unit && link.closest("#m-guru-submenu")) {
      const btn = guruUnitList?.querySelector(`[data-unit="${unit}"]`);
      btn?.click();
      showSection("guru");
      return;
    }
    // Sub-menu Slip Gaji: set unit di preview dan tampilkan slip
    if (unitSlip && link.closest("#m-slip-submenu")) {
      state.employee.unit = unitSlip;
      updateEmployeePreview();
      showSection("slip");
      return;
    }
    // Link biasa: tampilkan section terkait
    if (tab) {
      showSection(tab);
    }
  });

  // Navigasi dari Profil Yayasan ke Slip Gaji
  const goToSlipBtn = document.getElementById("goToSlip");
  goToSlipBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    showSection("slip");
  });

  // Default awal: tampilkan Dashboard
  showSection("dashboard");
}

function initGuruPage() {
  const gEl = {
    unitList: document.getElementById("guru-unit-list"),
    tbody: document.getElementById("guruTbody"),
    info: document.getElementById("guruInfo"),
    search: document.getElementById("guruSearch"),
    pageSize: document.getElementById("guruPageSize"),
    add: document.getElementById("guruAdd"),
    copy: document.getElementById("guruCopy"),
    print: document.getElementById("guruPrint"),
    excel: document.getElementById("guruExcel"),
    modal: document.getElementById("guruModal"),
    modalTitle: document.getElementById("guruModalTitle"),
    save: document.getElementById("guruSave"),
    table: document.getElementById("guruTable"),
    form: {
      unit: document.getElementById("f_unit"),
      nik: document.getElementById("f_nik"),
      nuptk: document.getElementById("f_nuptk"),
      nama: document.getElementById("f_nama"),
      gender: document.getElementById("f_gender"),
      ttl: document.getElementById("f_ttl"),
      pendidikan: document.getElementById("f_pendidikan"),
      wali: document.getElementById("f_wali"),
      jtm: document.getElementById("f_jtm"),
    },
  };

  // Kunci penyimpanan localStorage
  const STORAGE_KEY = "guruData";

  const guru = {
    data: [
      { id: 1, unit: "MI", nik: "1982370001", nuptk: "PEG001", nama: "Ahmad Nailal", gender: "L", ttl: "Kota, 1990", pendidikan: "Sarjana (S1)", wali: "Ya", jtm: 18 },
      { id: 2, unit: "RA", nik: "1982370002", nuptk: "PEG002", nama: "Siti Rahma", gender: "P", ttl: "Kota, 1992", pendidikan: "Sarjana (S1)", wali: "Tidak", jtm: 20 },
      { id: 3, unit: "MTs", nik: "1982370003", nuptk: "PEG003", nama: "Budi Santoso", gender: "L", ttl: "Kota, 1989", pendidikan: "Magister (S2)", wali: "Ya", jtm: 24 },
      { id: 4, unit: "MA", nik: "1982370004", nuptk: "PEG004", nama: "Dewi Lestari", gender: "P", ttl: "Kota, 1991", pendidikan: "Sarjana (S1)", wali: "Tidak", jtm: 16 },
      { id: 5, unit: "MI", nik: "1982370005", nuptk: "PEG005", nama: "Fajar Pratama", gender: "L", ttl: "Kota, 1993", pendidikan: "Sarjana (S1)", wali: "Ya", jtm: 18 },
      { id: 6, unit: "RA", nik: "1982370006", nuptk: "PEG006", nama: "Nur Aini", gender: "P", ttl: "Kota, 1994", pendidikan: "Diploma (D3)", wali: "Tidak", jtm: 14 },
      { id: 7, unit: "MTs", nik: "1982370007", nuptk: "PEG007", nama: "Rizky Ramadhan", gender: "L", ttl: "Kota, 1988", pendidikan: "Sarjana (S1)", wali: "Ya", jtm: 22 },
      { id: 8, unit: "MA", nik: "1982370008", nuptk: "PEG008", nama: "Laila Oktaviani", gender: "P", ttl: "Kota, 1995", pendidikan: "Sarjana (S1)", wali: "Tidak", jtm: 12 },
    ],
    filterUnit: "ALL",
    search: "",
    pageSize: 10,
    editId: null,
  };

  // Muat data dari localStorage jika ada
  function loadGuruData() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          guru.data = arr;
        }
      }
    } catch (err) {
      console.warn("Gagal memuat data guru dari localStorage", err);
    }
  }

  // Simpan data saat ada perubahan
  function persistGuruData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(guru.data));
    } catch (err) {
      console.warn("Gagal menyimpan data guru ke localStorage", err);
    }
  }

  function filteredData() {
    let arr = guru.data.filter((it) => guru.filterUnit === "ALL" || it.unit === guru.filterUnit);
    const s = guru.search.toLowerCase();
    if (s) {
      arr = arr.filter((it) => it.nik.toLowerCase().includes(s) || (it.nuptk || "").toLowerCase().includes(s) || it.nama.toLowerCase().includes(s) || it.pendidikan.toLowerCase().includes(s) || it.ttl.toLowerCase().includes(s));
    }
    return arr;
  }

  function renderTable() {
    const arr = filteredData();
    gEl.tbody.innerHTML = "";
    const showCount = Math.min(arr.length, Number(guru.pageSize));
    arr.slice(0, showCount).forEach((it, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${it.nik}</td>
        <td>${it.nuptk || "-"}</td>
        <td>${it.nama}</td>
        <td>${it.gender}</td>
        <td>${it.ttl}</td>
        <td>${it.pendidikan}</td>
        <td>${it.wali}</td>
        <td>${it.jtm}</td>
        <td>
          <button class="btn btn-sm btn-success me-1 use-btn" data-id="${it.id}"><i class="bi bi-filetype-pdf"></i> Gunakan</button>
          <button class="btn btn-sm btn-outline-primary me-1 edit-btn" data-id="${it.id}"><i class="bi bi-pencil-square"></i> Edit</button>
          <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${it.id}"><i class="bi bi-trash"></i> Delete</button>
        </td>
      `;
      gEl.tbody.appendChild(tr);
    });
    gEl.info.textContent = `Showing ${Math.min(showCount, arr.length)} of ${arr.length} entries`;
  }

  // Unit filter
  gEl.unitList?.addEventListener("click", (e) => {
    const btn = e.target.closest(".list-group-item");
    if (!btn) return;
    [...gEl.unitList.children].forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    guru.filterUnit = btn.dataset.unit || "ALL";
    renderTable();
  });

  // Search and page size
  gEl.search?.addEventListener("input", (e) => {
    guru.search = e.target.value.trim();
    renderTable();
  });
  gEl.pageSize?.addEventListener("change", (e) => {
    guru.pageSize = Number(e.target.value || 10);
    renderTable();
  });

  // Add & Edit
  let guruModal;
  function openModal(mode, id) {
    guru.editId = null;
    gEl.modalTitle.textContent = mode === "edit" ? "Edit Guru" : "Tambah Guru";
    // default values
    gEl.form.unit.value = "MI";
    gEl.form.nik.value = "";
    gEl.form.nuptk.value = "";
    gEl.form.nama.value = "";
    gEl.form.gender.value = "L";
    gEl.form.ttl.value = "";
    gEl.form.pendidikan.value = "Sarjana (S1)";
    gEl.form.wali.value = "";
    gEl.form.jtm.value = 18;

    if (mode === "edit" && id != null) {
      const it = guru.data.find((d) => d.id === id);
      if (it) {
        guru.editId = id;
        gEl.form.unit.value = it.unit;
        gEl.form.nik.value = it.nik;
        gEl.form.nuptk.value = it.nuptk || "";
        gEl.form.nama.value = it.nama;
        gEl.form.gender.value = it.gender;
        gEl.form.ttl.value = it.ttl;
        gEl.form.pendidikan.value = it.pendidikan;
        gEl.form.wali.value = it.wali;
        gEl.form.jtm.value = it.jtm;
      }
    }
    guruModal = guruModal || new bootstrap.Modal(gEl.modal);
    guruModal.show();
  }

  gEl.add?.addEventListener("click", () => openModal("add"));
  gEl.table?.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".edit-btn");
    if (editBtn) openModal("edit", Number(editBtn.dataset.id));
    const useBtn = e.target.closest(".use-btn");
    if (useBtn) {
      const id = Number(useBtn.dataset.id);
      const it = guru.data.find((d) => d.id === id);
      if (it) applyGuruToSlip(it);
    }
    const delBtn = e.target.closest(".delete-btn");
    if (delBtn) {
      const id = Number(delBtn.dataset.id);
      const it = guru.data.find((d) => d.id === id);
      if (!it) return;
      const ok = confirm(`Yakin hapus data guru: ${it.nama}?`);
      if (!ok) return;
      const idx = guru.data.findIndex((d) => d.id === id);
      if (idx >= 0) {
        guru.data.splice(idx, 1);
        renderTable();
        persistGuruData();
      }
    }
  });

  gEl.save?.addEventListener("click", () => {
    const item = {
      id: guru.editId || Math.max(0, ...guru.data.map((d) => d.id)) + 1,
      unit: gEl.form.unit.value,
      nik: gEl.form.nik.value.trim(),
      nuptk: gEl.form.nuptk.value.trim(),
      nama: gEl.form.nama.value.trim(),
      gender: gEl.form.gender.value,
      ttl: gEl.form.ttl.value.trim(),
      pendidikan: gEl.form.pendidikan.value.trim(),
      wali: gEl.form.wali.value,
      jtm: Number(gEl.form.jtm.value || 0),
    };
    if (guru.editId) {
      const idx = guru.data.findIndex((d) => d.id === guru.editId);
      if (idx >= 0) guru.data[idx] = item;
    } else {
      guru.data.push(item);
    }
    renderTable();
    persistGuruData();
    bootstrap.Modal.getInstance(gEl.modal)?.hide();
  });

  // Copy / Print / Excel (CSV)
  gEl.copy?.addEventListener("click", () => {
    const arr = filteredData();
    const header = ["No", "NIK", "NUPTK/PegID", "Nama", "L/P", "TTL", "Pendidikan", "Wali Kelas", "JTM", "Unit"];
    const rows = arr.map((it, i) => [i + 1, it.nik, it.nuptk || "", it.nama, it.gender, it.ttl, it.pendidikan, it.wali, it.jtm, it.unit].join("\t"));
    const text = header.join("\t") + "\n" + rows.join("\n");
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Data dicopy ke clipboard"))
      .catch(() => alert("Gagal copy ke clipboard"));
  });

  gEl.print?.addEventListener("click", () => {
    const w = window.open("", "_blank");
    w.document.write(`<!doctype html><html><head><title>Data Guru</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"></head><body class="p-3">`);
    w.document.write(`<h5>Data Guru</h5>`);
    w.document.write(document.getElementById("guruTable").outerHTML);
    w.document.write("</body></html>");
    w.document.close();
    w.focus();
    w.print();
    w.close();
  });

  gEl.excel?.addEventListener("click", () => {
    const arr = filteredData();
    const header = ["No", "NIK", "NUPTK/PegID", "Nama", "L/P", "TTL", "Pendidikan", "Wali Kelas", "JTM", "Unit"];
    const csv = [
      header.join(","),
      ...arr.map((it, i) => [i + 1, it.nik, it.nuptk || "", it.nama, it.gender, `"${it.ttl.replace(/"/g, '""')}"`, `"${it.pendidikan.replace(/"/g, '""')}"`, it.wali, it.jtm, it.unit].join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data_guru.csv";
    a.click();
    URL.revokeObjectURL(url);
  });

  // Initial render
  // Pastikan data yang dirender berasal dari localStorage bila tersedia
  loadGuruData();
  renderTable();
}

// Terapkan data guru ke Slip Gaji dan pindah tab
function applyGuruToSlip(it) {
  // Map sederhana agar cocok dengan layout slip
  state.employee.nik = it.nik;
  state.employee.kode = it.nik; // gunakan NIK sebagai kode
  state.employee.nama = it.nama;
  state.employee.jabatan = "Guru";
  state.employee.npwp = state.employee.npwp || "-";
  // detail guru tambahan
  state.employee.gender = it.gender || "-";
  state.employee.ttl = it.ttl || "-";
  state.employee.pendidikan = it.pendidikan || "-";
  state.employee.wali = it.wali || "-";
  state.employee.jtm = it.jtm ?? 0;
  state.employee.unit = it.unit || "-";

  // sinkronkan ke input form supaya preview ikut berubah
  el.nik.value = state.employee.nik;
  el.kode.value = state.employee.kode;
  el.nama.value = state.employee.nama;
  el.jabatan.value = state.employee.jabatan;
  el.npwp.value = state.employee.npwp;
  syncFromInputs();

  // pindah ke tab slip dan fokus ke preview
  document.getElementById("nav-slip")?.click();
  document.getElementById("preview")?.scrollIntoView({ behavior: "smooth" });
  alert("Data guru diterapkan ke Slip Gaji. Siap unduh PDF.");
}

// ===================== Keuangan (Pendapatan/Pengeluaran) per unit =====================
const KEU_STORAGE_KEY = "KEUANGAN_DATA";
let keuData = [];
let keuEditId = null;
const keuCtx = { unitIn: "ALL", unitOut: "ALL", searchIn: "", searchOut: "" };

function loadKeuData() {
  try {
    const raw = localStorage.getItem(KEU_STORAGE_KEY);
    keuData = raw ? JSON.parse(raw) : [];
  } catch (e) {
    keuData = [];
  }
}
function persistKeuData() {
  localStorage.setItem(KEU_STORAGE_KEY, JSON.stringify(keuData));
}

function renderKeu(kind) {
  const isIn = kind === "pendapatan";
  const tableId = isIn ? "keuIn_table" : "keuOut_table";
  const infoId = isIn ? "keuIn_info" : "keuOut_info";
  const unitFilter = isIn ? keuCtx.unitIn : keuCtx.unitOut;
  const search = isIn ? keuCtx.searchIn : keuCtx.searchOut;

  const tbody = document.querySelector(`#${tableId} tbody`);
  const info = document.getElementById(infoId);
  if (!tbody) return;

  const rows = keuData
    .filter((d) => d.jenis === kind)
    .filter((d) => (unitFilter === "ALL" ? true : d.unit === unitFilter))
    .filter((d) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        String(d.tahun).includes(s) ||
        (d.sumber || "").toLowerCase().includes(s) ||
        (d.ket || "").toLowerCase().includes(s) ||
        (d.unit || "").toLowerCase().includes(s)
      );
    });

  tbody.innerHTML = rows
    .map((d) => {
      return `<tr data-id="${d.id}">
          <td class="small">${d.tahun || ""}</td>
          <td class="small">${d.sumber || ""}</td>
          <td class="small">${formatIDR(d.jumlah || 0)}</td>
          <td class="small">${d.ket || ""}</td>
          <td class="small">
            <button class="btn btn-light btn-sm me-1" data-action="edit"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-light btn-sm" data-action="del"><i class="bi bi-trash"></i></button>
          </td>
        </tr>`;
    })
    .join("");

  if (info) info.textContent = `Showing ${rows.length} entries`;

  tbody.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const tr = e.currentTarget.closest("tr");
      const id = tr ? tr.getAttribute("data-id") : null;
      const action = e.currentTarget.getAttribute("data-action");
      if (!id) return;
      if (action === "edit") {
        openKeuModal(kind, id);
      } else if (action === "del") {
        deleteKeu(id);
        renderKeu(kind);
      }
    });
  });
}

function openKeuModal(kind, id = null) {
  keuEditId = id;
  const title = document.getElementById("keuModalTitle");
  const unit = document.getElementById("keu_unit");
  const tahun = document.getElementById("keu_tahun");
  const sumber = document.getElementById("keu_sumber");
  const jumlah = document.getElementById("keu_jumlah");
  const ket = document.getElementById("keu_ket");

  if (id) {
    const d = keuData.find((x) => x.id === id);
    if (!d) return;
    title.textContent = "Edit Data";
    unit.value = d.unit || "RA";
    tahun.value = d.tahun || new Date().getFullYear();
    sumber.value = d.sumber || "";
    jumlah.value = formatIDR(d.jumlah || 0);
    ket.value = d.ket || "";
  } else {
    title.textContent = "Tambah Data";
    unit.value = "RA";
    tahun.value = new Date().getFullYear();
    sumber.value = "";
    jumlah.value = "";
    ket.value = "";
  }

  const modalEl = document.getElementById("keuModal");
  if (modalEl) {
    modalEl.setAttribute("data-kind", kind);
    const m = bootstrap.Modal.getOrCreateInstance(modalEl);
    m.show();
  }
}

function saveKeuFromModal() {
  const modalEl = document.getElementById("keuModal");
  const kind = modalEl ? modalEl.getAttribute("data-kind") : "pendapatan";
  const unit = document.getElementById("keu_unit").value;
  const tahun = Number(document.getElementById("keu_tahun").value);
  const sumber = document.getElementById("keu_sumber").value.trim();
  const jumlah = parseIDR(document.getElementById("keu_jumlah").value);
  const ket = document.getElementById("keu_ket").value.trim();

  if (keuEditId) {
    const idx = keuData.findIndex((x) => x.id === keuEditId);
    if (idx >= 0) {
      keuData[idx] = { ...keuData[idx], unit, tahun, sumber, jumlah, ket };
    }
  } else {
    const id = `keu_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    keuData.push({ id, jenis: kind, unit, tahun, sumber, jumlah, ket });
  }
  persistKeuData();
  keuEditId = null;
  const m = bootstrap.Modal.getInstance(modalEl);
  if (m) m.hide();
  renderKeu(kind);
  renderDashboard();
}

function deleteKeu(id) {
  keuData = keuData.filter((x) => x.id !== id);
  persistKeuData();
  renderDashboard();
}

function initKeu() {
  loadKeuData();
  // Pendapatan controls
  const inAdd = document.getElementById("keuIn_add");
  const inUnitList = document.getElementById("keuIn_unitList");
  const inSearch = document.getElementById("keuIn_search");
  inAdd?.addEventListener("click", () => openKeuModal("pendapatan"));
  inUnitList?.querySelectorAll(".list-group-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      inUnitList.querySelectorAll(".list-group-item").forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      keuCtx.unitIn = e.currentTarget.getAttribute("data-unit") || "ALL";
      renderKeu("pendapatan");
    });
  });
  inSearch?.addEventListener("input", (e) => { keuCtx.searchIn = e.target.value; renderKeu("pendapatan"); });

  // Pengeluaran controls
  const outAdd = document.getElementById("keuOut_add");
  const outUnitList = document.getElementById("keuOut_unitList");
  const outSearch = document.getElementById("keuOut_search");
  outAdd?.addEventListener("click", () => openKeuModal("pengeluaran"));
  outUnitList?.querySelectorAll(".list-group-item").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      outUnitList.querySelectorAll(".list-group-item").forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      keuCtx.unitOut = e.currentTarget.getAttribute("data-unit") || "ALL";
      renderKeu("pengeluaran");
    });
  });
  outSearch?.addEventListener("input", (e) => { keuCtx.searchOut = e.target.value; renderKeu("pengeluaran"); });

  // Modal save
  document.getElementById("keuSave")?.addEventListener("click", saveKeuFromModal);

  // Initial render
  renderKeu("pendapatan");
  renderKeu("pengeluaran");
}

document.addEventListener("DOMContentLoaded", () => {
  init();
  // Muat statistik dashboard lebih awal supaya tampil saat default showSection('dashboard')
  try { loadDashboardStats(); } catch {}
  initNavigation();
  initGuruPage();
  initKeu();
  initAset();
});

// ===================== Aset (Inventaris) =====================
const ASET_STORAGE_KEY = "ASET_DATA";
let aset = { data: [], search: "", editId: null };

function loadAsetData() {
  try {
    const raw = localStorage.getItem(ASET_STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    aset.data = Array.isArray(arr) ? arr : [];
  } catch (e) {
    aset.data = [];
  }
}
function persistAsetData() {
  localStorage.setItem(ASET_STORAGE_KEY, JSON.stringify(aset.data));
}

function filteredAset() {
  const s = (aset.search || "").toLowerCase();
  if (!s) return aset.data;
  return aset.data.filter((it) =>
    (it.nama || "").toLowerCase().includes(s) ||
    (it.lokasi || "").toLowerCase().includes(s)
  );
}

function renderAsetTable() {
  const tbody = document.getElementById("asetTbody");
  const info = document.getElementById("asetInfo");
  if (!tbody) return;
  const arr = filteredAset();
  tbody.innerHTML = "";
  arr.forEach((it, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="small">${idx + 1}</td>
      <td class="small">${it.nama || "-"}</td>
      <td class="small">${it.luas || "-"}</td>
      <td class="small">${it.lokasi || "-"}</td>
      <td class="small">${it.bukti || "-"}</td>
      <td class="small">
        <button class="btn btn-sm btn-outline-primary me-1 aset-edit" data-id="${it.id}"><i class="bi bi-pencil-square"></i> Edit</button>
        <button class="btn btn-sm btn-outline-danger aset-del" data-id="${it.id}"><i class="bi bi-trash"></i> Hapus</button>
      </td>`;
    tbody.appendChild(tr);
  });
  if (info) info.textContent = `Showing ${arr.length} entries`;
}

function openAsetModal(mode = "add", id = null) {
  aset.editId = mode === "edit" ? id : null;
  const title = document.getElementById("asetModalTitle");
  const nama = document.getElementById("aset_nama");
  const luas = document.getElementById("aset_luas");
  const lokasi = document.getElementById("aset_lokasi");
  const bukti = document.getElementById("aset_bukti");
  if (mode === "edit" && id) {
    const it = aset.data.find((d) => d.id === id);
    if (!it) return;
    title.textContent = "Edit Aset";
    nama.value = it.nama || "";
    luas.value = it.luas || "";
    lokasi.value = it.lokasi || "";
    bukti.value = it.bukti || "";
  } else {
    title.textContent = "Tambah Aset";
    nama.value = "";
    luas.value = "";
    lokasi.value = "";
    bukti.value = "";
  }
  const modalEl = document.getElementById("asetModal");
  if (modalEl) {
    const m = bootstrap.Modal.getOrCreateInstance(modalEl);
    m.show();
  }
}

function saveAsetFromModal() {
  const nama = document.getElementById("aset_nama").value.trim();
  const luas = document.getElementById("aset_luas").value.trim();
  const lokasi = document.getElementById("aset_lokasi").value.trim();
  const bukti = document.getElementById("aset_bukti").value.trim();
  if (!nama) return;
  if (aset.editId) {
    const idx = aset.data.findIndex((d) => d.id === aset.editId);
    if (idx >= 0) aset.data[idx] = { ...aset.data[idx], nama, luas, lokasi, bukti };
  } else {
    const id = `aset_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    aset.data.push({ id, nama, luas, lokasi, bukti });
  }
  persistAsetData();
  const modalEl = document.getElementById("asetModal");
  const m = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
  m?.hide();
  renderAsetTable();
  renderDashboard();
}

function deleteAset(id) {
  const it = aset.data.find((d) => d.id === id);
  if (!it) return;
  const ok = confirm(`Yakin hapus aset: ${it.nama}?`);
  if (!ok) return;
  aset.data = aset.data.filter((d) => d.id !== id);
  persistAsetData();
  renderAsetTable();
  renderDashboard();
}

function initAset() {
  loadAsetData();
  renderAsetTable();
  document.getElementById("asetAdd")?.addEventListener("click", () => openAsetModal("add"));
  document.getElementById("asetSearch")?.addEventListener("input", (e) => { aset.search = e.target.value; renderAsetTable(); });
  document.getElementById("asetSave")?.addEventListener("click", saveAsetFromModal);
  document.getElementById("asetTable")?.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".aset-edit");
    const delBtn = e.target.closest(".aset-del");
    if (editBtn) openAsetModal("edit", editBtn.dataset.id);
    if (delBtn) deleteAset(delBtn.dataset.id);
  });
  renderDashboard();
}

// ===================== Dashboard Render =====================
function sumKeu(kind) {
  try {
    return keuData.filter((d) => d.jenis === kind).reduce((acc, d) => acc + (Number(d.jumlah) || 0), 0);
  } catch { return 0; }
}

function renderDashboardMetrics() {
  const gCountEl = document.getElementById("cardGuruCount");
  const sCountEl = document.getElementById("cardSiswaCount");
  const kCountEl = document.getElementById("cardKelasCount");
  const inEl = document.getElementById("cardPendapatanTotal");
  const outEl = document.getElementById("cardPengeluaranTotal");
  const saldoEl = document.getElementById("cardSaldo");
  const guruCount = (window.gEl && Array.isArray(window.guru?.data)) ? window.guru.data.length : (typeof guru !== 'undefined' ? guru.data.length : 0);
  const totalIn = sumKeu("pendapatan");
  const totalOut = sumKeu("pengeluaran");
  const saldo = totalIn - totalOut;
  if (gCountEl) gCountEl.textContent = String(guruCount);
  if (sCountEl) sCountEl.textContent = String(Number(dashboardStats?.siswaCount || 0));
  if (kCountEl) kCountEl.textContent = String(Number(dashboardStats?.kelasCount || 0));
  if (inEl) inEl.textContent = formatIDR(totalIn);
  if (outEl) outEl.textContent = formatIDR(totalOut);
  if (saldoEl) saldoEl.textContent = formatIDR(saldo);
}

function renderDashboardAsetTable() {
  const tbody = document.getElementById("dashAsetTbody");
  const info = document.getElementById("dashAsetInfo");
  if (!tbody) return;
  const arr = (aset?.data || []).slice(0, 5);
  tbody.innerHTML = "";
  arr.forEach((it, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="small">${idx + 1}</td>
      <td class="small">${it.nama || "-"}</td>
      <td class="small">${it.luas || "-"}</td>
      <td class="small">${it.lokasi || "-"}</td>
      <td class="small">${it.bukti || "-"}</td>
      <td class="small">
        <button class="btn btn-sm btn-outline-primary me-1 dash-aset-edit" data-id="${it.id}"><i class="bi bi-pencil-square"></i> Edit</button>
        <button class="btn btn-sm btn-outline-danger dash-aset-del" data-id="${it.id}"><i class="bi bi-trash"></i> Hapus</button>
      </td>`;
    tbody.appendChild(tr);
  });
  if (info) info.textContent = `Menampilkan ${arr.length} entri`;
}

function renderDashboard() {
  renderDashboardMetrics();
  renderDashboardAsetTable();
}

// Hook Dashboard actions
document.getElementById("dashStatsEdit")?.addEventListener("click", () => openDashStatsModal());
document.getElementById("dashStatsSave")?.addEventListener("click", () => saveDashStatsFromModal());
document.getElementById("dashAsetAdd")?.addEventListener("click", () => openAsetModal("add"));
document.getElementById("dashAsetTable")?.addEventListener("click", (e) => {
  const editBtn = e.target.closest(".dash-aset-edit");
  const delBtn = e.target.closest(".dash-aset-del");
  if (editBtn) openAsetModal("edit", editBtn.dataset.id);
  if (delBtn) deleteAset(delBtn.dataset.id);
});

// ===================== Dashboard Stats (Siswa & Kelas) =====================
const DASHBOARD_STORAGE_KEY = "DASHBOARD_STATS";
let dashboardStats = { siswaCount: 0, kelasCount: 0 };
function loadDashboardStats() {
  try {
    const raw = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    const obj = raw ? JSON.parse(raw) : null;
    if (obj && typeof obj === 'object') {
      dashboardStats = {
        siswaCount: Number(obj.siswaCount) || 0,
        kelasCount: Number(obj.kelasCount) || 0,
      };
    }
  } catch {}
}
function persistDashboardStats() {
  try { localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(dashboardStats)); } catch {}
}
function openDashStatsModal() {
  const mEl = document.getElementById("dashStatsModal");
  if (!mEl) return;
  const siswaInput = document.getElementById("dash_siswa");
  const kelasInput = document.getElementById("dash_kelas");
  if (siswaInput) siswaInput.value = String(dashboardStats.siswaCount || 0);
  if (kelasInput) kelasInput.value = String(dashboardStats.kelasCount || 0);
  const m = new bootstrap.Modal(mEl);
  m.show();
}
function saveDashStatsFromModal() {
  const siswa = Number(document.getElementById("dash_siswa")?.value || 0);
  const kelas = Number(document.getElementById("dash_kelas")?.value || 0);
  dashboardStats.siswaCount = isNaN(siswa) ? 0 : siswa;
  dashboardStats.kelasCount = isNaN(kelas) ? 0 : kelas;
  persistDashboardStats();
  const mEl = document.getElementById("dashStatsModal");
  try { bootstrap.Modal.getInstance(mEl)?.hide(); } catch {}
  renderDashboard();
}
