// CHR e-planning 2026 - plain JS port of the Automa workflow.
// Run on the page where the workflow should start (logged in).
// It does NOT click "Simpan" unless SAVE = true.
(async () => {
  const SAVE = false;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const $ = (s) => document.querySelector(s);

  async function el(sel, t = 8000) {
    const end = Date.now() + t;
    while (Date.now() < end) {
      const e = $(sel);
      if (e) return e;
      await sleep(150);
    }
    throw new Error('Element not found: ' + sel);
  }
  async function click(sel) {
    const e = await el(sel);
    ['mousedown', 'mouseup', 'click'].forEach((t) =>
      e.dispatchEvent(new MouseEvent(t, { bubbles: true, cancelable: true, view: window }))
    );
    await sleep(400);
  }
  async function setVal(sel, v) {
    const e = await el(sel);
    const proto = e.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
    Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(e, v);
    ['input', 'keyup', 'change'].forEach((t) => e.dispatchEvent(new Event(t, { bubbles: true })));
    await sleep(150);
  }
  async function getVal(sel) {
    return (await el(sel)).value || '';
  }
  async function pick(name) {
    // type into the open select2 search box, then press Enter
    await setVal('input.select2-search__field', name);
    await sleep(1500);
    const s = await el('input.select2-search__field');
    ['keydown', 'keyup'].forEach((t) =>
      s.dispatchEvent(new KeyboardEvent(t, { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }))
    );
    await sleep(600);
  }
  async function addPerson(name, role) {
    await click('.strip-blue:nth-child(1) .btn');
    await click('#add-itjen .form-group:nth-child(3) .select2-selection:nth-child(1)');
    await pick(name);
    await click('.form-group:nth-child(4) .select2-selection');
    await pick(role);
    await click('.form-actions:nth-child(5) .btn');
    await sleep(800);
  }
  async function addUnit(stripN, boxId, name) {
    await click(`.strip-blue:nth-child(${stripN}) .btn`);
    await click(`#${boxId} .select2-selection:nth-child(1)`);
    await pick(name);
    await click(`#${boxId} .btn:nth-child(1)`);
    await sleep(800);
  }

  if (!confirm('Run CHR e-planning fill? ' + (SAVE ? 'It WILL click Simpan.' : 'Dry run: it will not click Simpan.'))) return;

  // ---- TTE settings tab ----
  await click('.nav-tabs > li:nth-child(3) > a');
  await addPerson('Maulana Irwansyah', 'Persetujuan'); // Daltu
  await addPerson('Ratna Dian', 'Peneliti'); // Dalnis
  await addPerson('Arthur Michael', 'Penyusun'); // Ketua
  await addPerson('Ahmad Fajrusysyarif', 'Penyusun'); // Anggota
  await addUnit(6, 'add-unit', 'Yan Prastomo'); // TTD Bagren
  await addUnit(8, 'add-biro', 'Dwi Suprayitno'); // TTD Biroren

  // ---- Detail CHR tab ----
  await click('.nav-tabs > li:nth-child(1) > a');
  await click('.panel:nth-child(1) .accordion-toggle');
  await setVal('.form-group:nth-child(1) > .col-md-4 > .form-control', 'ST-ITJEN I/3-120 Tahun 2026');
  await setVal('.form-group:nth-child(1) > .col-md-2 > .form-control', '2026-10-19');
  await setVal('.form-group:nth-child(2) > .col-md-4 > .form-control', 'S-691/MK.03/2026');
  await setVal('.form-group:nth-child(2) > .col-md-2 > .form-control', '2026-09-30');

  // [n, default uraian, conclusion when uraian was empty]
  const krit = [
    [1, 'Berdasarkan hasil reviu, usulan kegiatan memenuhi aspek kelayakan anggaran', 'Sesuai'],
    [2, 'Tidak terdapat catatan kepatuhan dalam penerapan kaidah penganggaran', 'Sesuai'],
    [3, 'Kepatuhan mencantumkan pendanaan anggaran (budget tagging) sesuai dengan kategori pada semua keluaran yang dihasilkan sudah sesuai', 'Sesuai'],
    [4, 'Tidak terdapat catatan terkait kelengkapan dokumen pendukung', 'Sesuai'],
    [5, 'Kelayakan dan kesesuaian rincian anggaran yang digunakan untuk mendanai inisiatif baru dan/atau rincian anggaran Angka Dasar yang mengalami perubahan telah sesuai', 'Sesuai'],
    [6, 'Berdasarkan hasil reviu, pelaksanaan/pengalokasian tematik tertentu telah sesuai penugasan', 'Sesuai'],
  ];
  for (const [n, text, ok] of krit) {
    await click(`a.accordion-toggle[href="#chr${n}"]`);
    await sleep(500);
    const cur = await getVal(`textarea[name="uraian_${n}"]`);
    if (/a/i.test(cur)) {
      // Automa "contains a" check: already has reviewer notes
      await setVal(`textarea[name="kesimpulan_${n}"]`, 'Belum sesuai');
    } else {
      await setVal(`textarea[name="uraian_${n}"]`, text);
      await setVal(`textarea[name="kesimpulan_${n}"]`, ok);
    }
  }
  // Criterion 7
  await click('a.accordion-toggle[href="#chr7"]');
  await sleep(500);
  if (/a/i.test(await getVal('textarea[name="uraian_7"]'))) {
    await setVal('textarea[name="kesimpulan_7"]', 'Berdasarkan hasil reviu, terdapat kegiatan yang diusulkan untuk diblokir');
  } else {
    await setVal('textarea[name="uraian_7"]', 'Tidak terdapat kegiatan yang diusulkan untuk diblokir');
    await setVal('textarea[name="kesimpulan_7"]', 'Berdasarkan hasil reviu, tidak terdapat kegiatan yang diusulkan untuk diblokir');
  }

  await click('.panel:nth-child(11) .accordion-toggle');
  await setVal('#koreksi .form-control', '1.\tSesuai dengan catatan hasil reviu tersebut di atas\n2.\tPelaksanaan reviu yang dilaksanakan oleh APIP atas dokumen usulan RKA-K/L dilaksanakan sebelum diselesaikannya tahapan penelitian dan evaluasi secara berjenjang oleh Unit Eselon I teknis serta Biro Perencanaan pada aplikasi E-Planning');
  await click('.panel:nth-child(12) .accordion-toggle');
  await setVal('#rekomendasi .form-control',
    '1.\tMelakukan perbaikan dan melengkapi kekurangan dokumen pada E Planning sesuai hasil evaluasi Itjen. \n2.\tDapat diproses lanjut sesuai ketentuan yang berlaku setelah dilakukan perbaikan sesuai catatan reviu.');

  if (SAVE) await click('button.green');
  alert('Done. ' + (SAVE ? 'Saved.' : 'Review the form, then tap Simpan yourself.'));
})().catch((e) => alert('Stopped: ' + e.message));
