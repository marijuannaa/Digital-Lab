/**
 * Dijital Laboratuvar - CSV to XLSX (Excel) Dönüştürücü Modülü
 */

let xlsxFileQueue = [];

function initXLSXConverterModule() {
    setupXLSXDropZone();
}

function setupXLSXDropZone() {
    const dropZone = document.getElementById('xlsx-conv-drop-zone');
    const fileInput = document.getElementById('xlsx-conv-file-input');

    if (!dropZone || !fileInput) return;

    dropZone.addEventListener('click', () => fileInput.click());

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) handleXLSXFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleXLSXFiles(e.target.files);
    });
}

function handleXLSXFiles(files) {
    const validFiles = Array.from(files).filter(f => f.name.match(/\.(csv|txt|dat)$/i));
    if (validFiles.length === 0) {
        showToast('Lütfen geçerli .csv, .txt veya .dat dosyaları seçin.', 'error');
        return;
    }

    validFiles.forEach(file => {
        Papa.parse(file, {
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                addParsedDataToXLSXQueue(results.data, file.name, file.size);
            },
            error: (err) => {
                showToast(`Dosya okunurken hata: ${err.message}`, 'error');
            }
        });
    });
}

function addRawCSVToXLSXQueue(csvText, fileName) {
    Papa.parse(csvText, {
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
            addParsedDataToXLSXQueue(results.data, fileName, csvText.length);
        }
    });
}

function addParsedDataToXLSXQueue(rows, fileName, size) {
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    xlsxFileQueue.push({
        id: 'xlsx_' + Date.now() + Math.random().toString(36).substring(2, 5),
        originalName: fileName,
        sheetName: baseName.substring(0, 30), // Excel sayfa adı max 31 karakter
        rows: rows,
        rowCount: rows.length,
        colCount: rows[0] ? rows[0].length : 0,
        size: size
    });

    incrementStat('filesConverted');
    updateXLSXConverterUI();
    showToast(`"${fileName}" Excel kuyruğuna eklendi!`, 'success');
}

function updateXLSXConverterUI() {
    const listContainer = document.getElementById('xlsx-conv-files-list');
    const actionsContainer = document.getElementById('xlsx-conv-actions');
    const countBadge = document.getElementById('xlsx-conv-count-badge');

    if (!listContainer) return;

    if (countBadge) countBadge.innerText = `${xlsxFileQueue.length} Dosya`;

    if (xlsxFileQueue.length === 0) {
        listContainer.innerHTML = `
            <div class="col-span-full py-10 text-center text-slate-500 italic flex flex-col items-center justify-center">
                <i data-lucide="sheet" class="w-8 h-8 mb-2 opacity-40"></i>
                <span>Henüz Excel'e dönüştürülecek dosya yüklenmedi.</span>
            </div>
        `;
        if (actionsContainer) actionsContainer.classList.add('hidden');
        lucide.createIcons();
        return;
    }

    if (actionsContainer) actionsContainer.classList.remove('hidden');

    listContainer.innerHTML = xlsxFileQueue.map(f => `
        <div class="glass-card rounded-xl p-4 border border-slate-700/70 flex flex-col justify-between gap-3">
            <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5 overflow-hidden">
                    <div class="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
                    </div>
                    <div class="overflow-hidden">
                        <h4 class="text-xs font-semibold text-white truncate" title="${f.originalName}">${f.originalName}</h4>
                        <p class="text-[10px] text-slate-400 font-mono mt-0.5">${f.rowCount} satır • ${f.colCount} sütun</p>
                    </div>
                </div>
                <button onclick="removeXLSXQueueItem('${f.id}')" title="Kaldır" class="text-slate-500 hover:text-red-400 transition p-1">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>

            <div class="pt-2 border-t border-slate-700/50 flex gap-2">
                <button onclick="downloadSingleXLSX('${f.id}')" class="w-full py-1.5 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-600/20">
                    <i data-lucide="download" class="w-3.5 h-3.5"></i>
                    <span>.XLSX İndir</span>
                </button>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function downloadSingleXLSX(id) {
    if (typeof XLSX === 'undefined') {
        showToast('SheetJS Excel motoru yüklenemedi.', 'error');
        return;
    }

    const item = xlsxFileQueue.find(f => f.id === id);
    if (!item) return;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(item.rows);
    XLSX.utils.book_append_sheet(wb, ws, item.sheetName);

    XLSX.writeFile(wb, `${item.sheetName}.xlsx`);
    showToast(`"${item.sheetName}.xlsx" indirildi!`, 'success');
}

// Tüm CSV dosyalarını tek bir Excel çalışma kitabında sekmeler (sheets) olarak birleştir
function downloadCombinedMasterWorkbook() {
    if (typeof XLSX === 'undefined' || xlsxFileQueue.length === 0) return;

    const wb = XLSX.utils.book_new();
    const usedNames = new Set();

    xlsxFileQueue.forEach((item, index) => {
        let name = item.sheetName.replace(/[:\\/?*\[\]]/g, '');
        if (name.length > 28) name = name.substring(0, 28);
        
        let uniqueName = name;
        let counter = 1;
        while (usedNames.has(uniqueName)) {
            uniqueName = `${name}_${counter}`;
            counter++;
        }
        usedNames.add(uniqueName);

        const ws = XLSX.utils.aoa_to_sheet(item.rows);
        XLSX.utils.book_append_sheet(wb, ws, uniqueName);
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Birlestirilmis_Laboratuvar_Verileri_${dateStr}.xlsx`);
    showToast('Tüm dosyalar tek bir Excel kitabında birleştirilerek indirildi!', 'success');
}

// Bütün dosyaları ayrı ayrı XLSX olarak ZIP'leme
async function downloadAllXLSXAsZip() {
    if (xlsxFileQueue.length === 0 || typeof JSZip === 'undefined' || typeof XLSX === 'undefined') return;

    const zip = new JSZip();
    const folder = zip.folder("excel_dosyalari");

    xlsxFileQueue.forEach(item => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(item.rows);
        XLSX.utils.book_append_sheet(wb, ws, item.sheetName);

        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        folder.file(`${item.sheetName}.xlsx`, wbout);
    });

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Excel_Dosyalari_${new Date().toISOString().slice(0,10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Tüm Excel dosyaları ZIP olarak indirildi!', 'success');
    } catch (err) {
        showToast(`Hata: ${err.message}`, 'error');
    }
}

function removeXLSXQueueItem(id) {
    xlsxFileQueue = xlsxFileQueue.filter(f => f.id !== id);
    updateXLSXConverterUI();
    showToast('Dosya kuyruktan çıkarıldı.');
}

function clearAllXLSXQueue() {
    xlsxFileQueue = [];
    updateXLSXConverterUI();
    showToast('Excel kuyruğu temizlendi.');
}
