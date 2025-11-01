// Utility: format uang Rupiah
const formatIDR = (n) => {
  const val = Number(n || 0);
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
};

// Utility: parse angka dari input yang mungkin berisi titik/koma
const parseIDR = (s) => {
  if (typeof s === 'number') return s;
  if (!s) return 0;
  return Number(String(s).replace(/[^0-9-]/g, '')) || 0;
};

// Convert number to Indonesian words (Terbilang)
function terbilang(n) {
  n = Math.floor(parseIDR(n));
  if (n === 0) return 'nol Rupiah';
  const angka = ['','satu','dua','tiga','empat','lima','enam','tujuh','delapan','sembilan'];
  const tingkat = ['','puluh','ratus','ribu','juta','milyar','triliun'];
  const chunk = (num) => {
    let str = '';
    const ratus = Math.floor(num/100);
    const puluh = Math.floor((num%100)/10);
    const satuan = num%10;
    if (ratus) str += (ratus===1? 'seratus' : angka[ratus]+' ratus');
    if (puluh) str += (str? ' ' : '') + (puluh===1? 'sepuluh' : angka[puluh]+' puluh');
    if (satuan) {
      if (puluh===1 && satuan===1) str = (str? ' ' : '') + 'sebelas';
      else if (puluh===1 && satuan>1) str = (str? ' ' : '') + angka[satuan] + ' belas';
      else str += (str? ' ' : '') + (satuan===1 && !puluh && !ratus ? 'satu' : angka[satuan]);
    }
    return str;
  };
  let words = '';
  let i = 0;
  while (n > 0) {
    const part = n % 1000;
    if (part) {
      let partStr = chunk(part);
      if (i === 1 && part === 1) partStr = 'seribu';
      words = partStr + (tingkat[i] && part? ' ' + tingkat[i] : '') + (words? ' ' + words : '');
    }
    n = Math.floor(n/1000);
    i++;
  }
  return words + ' Rupiah';
}

// State
const state = {
  company: {
    name: 'PT. PUSAT CARA CARA',
    address: 'Jl. Sekedar Contoh Saja No. 100',
    phone: '(012) 34567890',
    city: 'Kota Sampel',
    month: ''
  },
  employee: {
    nik: 'QC001', kode: 'QC001', nama: 'FAIZAR KHAIRI', jabatan: 'QUALITY CONTROL', npwp: '333444555666'
  },
  income: [
    { label: 'GAJI POKOK', amount: 4750000 },
    { label: 'TUNJANGAN JABATAN', amount: 2100000 },
    { label: 'TUNJANGAN BERAS', amount: 1000000 },
    { label: 'TUNJANGAN LAIN-LAIN', amount: 500000 },
    { label: 'LEMBUR', amount: 300000 },
    { label: 'THR', amount: 0 }
  ],
  deduction: [
    { label: 'PPh21', amount: 712500 },
    { label: 'BPJS/JAMSOSTEK', amount: 712500 },
    { label: 'KOPERASI', amount: 90000 },
    { label: '', amount: 1250000 }
  ]
};

// Elements
const el = {
  form: document.getElementById('payroll-form'),
  // company
  companyName: document.getElementById('companyName'),
  companyAddress: document.getElementById('companyAddress'),
  companyPhone: document.getElementById('companyPhone'),
  companyCity: document.getElementById('companyCity'),
  payrollMonth: document.getElementById('payrollMonth'),
  // employee
  nik: document.getElementById('nik'),
  kode: document.getElementById('kode'),
  nama: document.getElementById('nama'),
  jabatan: document.getElementById('jabatan'),
  npwp: document.getElementById('npwp'),
  // containers
  incomeItems: document.getElementById('income-items'),
  deductionItems: document.getElementById('deduction-items'),
  addIncome: document.getElementById('addIncome'),
  addDeduction: document.getElementById('addDeduction'),
  resetForm: document.getElementById('resetForm'),
  downloadPdf: document.getElementById('downloadPdf'),
  // preview
  p_companyName: document.getElementById('p_companyName'),
  p_companyAddress: document.getElementById('p_companyAddress'),
  p_companyPhone: document.getElementById('p_companyPhone'),
  p_companyCity: document.getElementById('p_companyCity'),
  p_month: document.getElementById('p_month'),
  p_nik: document.getElementById('p_nik'),
  p_nama: document.getElementById('p_nama'),
  p_jabatan: document.getElementById('p_jabatan'),
  p_npwp: document.getElementById('p_npwp'),
  incomeTable: document.getElementById('income-table'),
  deductionTable: document.getElementById('deduction-table'),
  totalIncome: document.getElementById('total-income'),
  totalDeduction: document.getElementById('total-deduction'),
  netSalary: document.getElementById('net-salary'),
  terbilang: document.getElementById('terbilang')
};

function monthLabel(val) {
  if (!val) return 'Periode';
  const [y,m] = val.split('-');
  const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  return `${months[Number(m)-1]} ${y}`;
}

// Render form item rows
function renderItemRows(type) {
  const list = type === 'income' ? state.income : state.deduction;
  const container = type === 'income' ? el.incomeItems : el.deductionItems;
  container.innerHTML = '';
  list.forEach((it, idx) => {
    const row = document.createElement('div');
    row.className = 'row align-items-center g-2 mb-2';
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
  el.incomeTable.innerHTML = '';
  el.deductionTable.innerHTML = '';
  state.income.forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>- ${it.label}</td><td>${formatIDR(it.amount)}</td>`;
    el.incomeTable.appendChild(tr);
  });
  state.deduction.forEach(it => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>- ${it.label || ''}</td><td>${formatIDR(it.amount)}</td>`;
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
}

function recalc() {
  const totalIn = state.income.reduce((s, it) => s + parseIDR(it.amount), 0);
  const totalOut = state.deduction.reduce((s, it) => s + parseIDR(it.amount), 0);
  const net = totalIn - totalOut;
  el.totalIncome.textContent = formatIDR(totalIn);
  el.totalDeduction.textContent = formatIDR(totalOut);
  el.netSalary.textContent = new Intl.NumberFormat('id-ID', {maximumFractionDigits: 0}).format(net);
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

  updateCompanyPreview();
  updateEmployeePreview();
  renderSlipTables();
  recalc();
}

function addItem(type) {
  const list = type === 'income' ? state.income : state.deduction;
  list.push({ label: type === 'income' ? 'Pendapatan Baru' : 'Potongan Baru', amount: 0 });
  renderItemRows(type);
  renderSlipTables();
  recalc();
}

function removeItem(type, index) {
  const list = type === 'income' ? state.income : state.deduction;
  list.splice(index, 1);
  renderItemRows(type);
  renderSlipTables();
  recalc();
}

function initMonthDefault() {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  el.payrollMonth.value = ym;
  state.company.month = ym;
}

function exportPDF() {
  const element = document.getElementById('slip-a4');
  const fileNameSafe = state.employee.nama ? state.employee.nama.replace(/\s+/g,'_') : 'Slip_Gaji';
  const opt = {
    margin:       0,
    filename:     `Slip_Gaji_${fileNameSafe}.pdf`,
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true },
    jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().from(element).set(opt).save();
}

function attachEvents() {
  // Inputs company/employee
  ['companyName','companyAddress','companyPhone','companyCity','payrollMonth','nik','kode','nama','jabatan','npwp']
    .forEach(id => document.getElementById(id).addEventListener('input', syncFromInputs));

  // Delegation for item edit/remove
  el.incomeItems.addEventListener('input', (e) => {
    const t = e.target;
    const type = t.dataset.type; if (!type) return;
    const idx = Number(t.dataset.index);
    const field = t.dataset.field;
    if (field === 'label') {
      state.income[idx].label = t.value;
    } else {
      state.income[idx].amount = parseIDR(t.value);
    }
    renderSlipTables();
    recalc();
  });
  el.deductionItems.addEventListener('input', (e) => {
    const t = e.target; const type = t.dataset.type; if (!type) return;
    const idx = Number(t.dataset.index); const field = t.dataset.field;
    if (field === 'label') state.deduction[idx].label = t.value; else state.deduction[idx].amount = parseIDR(t.value);
    renderSlipTables(); recalc();
  });

  // Remove buttons
  [el.incomeItems, el.deductionItems].forEach(container => {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-btn');
      if (!btn) return;
      removeItem(btn.dataset.type, Number(btn.dataset.index));
    });
  });

  el.addIncome.addEventListener('click', () => addItem('income'));
  el.addDeduction.addEventListener('click', () => addItem('deduction'));
  el.downloadPdf.addEventListener('click', exportPDF);
  el.resetForm.addEventListener('click', () => {
    setTimeout(() => { // wait for browser reset
      // Re-sync defaults from inputs
      state.company.name = el.companyName.value = 'PT. PUSAT CARA CARA';
      state.company.address = el.companyAddress.value = 'Jl. Sekedar Contoh Saja No. 100';
      state.company.phone = el.companyPhone.value = '(012) 34567890';
      state.company.city = el.companyCity.value = 'Kota Sampel';
      initMonthDefault();
      state.employee = { nik: 'QC001', kode: 'QC001', nama: 'FAIZAR KHAIRI', jabatan: 'QUALITY CONTROL', npwp: '333444555666' };
      el.nik.value = state.employee.nik; el.kode.value = state.employee.kode; el.nama.value = state.employee.nama; el.jabatan.value = state.employee.jabatan; el.npwp.value = state.employee.npwp;
      state.income = [
        { label: 'GAJI POKOK', amount: 4750000 },
        { label: 'TUNJANGAN JABATAN', amount: 2100000 },
        { label: 'TUNJANGAN BERAS', amount: 1000000 },
        { label: 'TUNJANGAN LAIN-LAIN', amount: 500000 },
        { label: 'LEMBUR', amount: 300000 },
        { label: 'THR', amount: 0 }
      ];
      state.deduction = [
        { label: 'PPh21', amount: 712500 },
        { label: 'BPJS/JAMSOSTEK', amount: 712500 },
        { label: 'KOPERASI', amount: 90000 },
        { label: '', amount: 1250000 }
      ];
      renderItemRows('income');
      renderItemRows('deduction');
      syncFromInputs();
    }, 50);
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

  renderItemRows('income');
  renderItemRows('deduction');
  syncFromInputs();
  attachEvents();
}

document.addEventListener('DOMContentLoaded', init);