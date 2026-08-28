/**
 * Dijital Laboratuvar - Çoklu CSV Karakter & Ayırıcı Dönüştürücü
 */

let convertedCSVFiles = [];

function initCSVConverterModule() {
    setupCSVConverterDropZone();
}

function setupCSVConverterDropZone() {
    const dropZone = document.getElementById('csv-conv-drop-zone');
    const fileInput = document.getElementById('csv-conv-file-input');

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
        if (files.length > 0) handleCSVConverterFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleCSVConverterFiles(e.target.files);
    });
}

function handleCSVConverterFiles(files) {
    const validFiles = Array.from(files).filter(f => f.name.match(/\.(csv|txt|dat)$/i));
    if (validFiles.length === 0) {
        showToast('Lütfen geçerli .csv, .txt veya .dat dosyaları seçin.', 'error');
        return;
    }

    const mode = document.getElementById('csv-conv-mode')?.value || 'auto_eu_to_std';
    let processedCount = 0;

    validFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const originalContent = event.target.result;
            const convertedContent = convertCSVContent(originalContent, mode);
            const newFileName = 'donusturulmus_' + file.name;
            const rowCount = (convertedContent.match(/\n/g) || []).length + 1;

            convertedCSVFiles.push({
                id: 'csv_' + Date.now() + Math.random().toString(36).substring(2, 5),
                originalName: file.name,
                newName: newFileName,
                originalContent: originalContent,
                convertedContent: convertedContent,
                size: file.size,
                rowCount: rowCount
            });

            processedCount++;
            incrementStat('filesConverted');

            if (processedCount === validFiles.length) {
                updateCSVConverterUI();
                showToast(`${processedCount} adet dosya başarıyla dönüştürüldü!`, 'success');
            }
        };

        reader.readAsText(file);
    });
}

// Akıllı Karakter Dönüştürme Motoru
function convertCSVContent(content, mode = 'auto_eu_to_std') {
    if (!content) return '';

    if (mode === 'auto_eu_to_std') {
        // Avrupa/TR Formatı: ';' -> ',' ve ',' -> '.'
        // Önce virgülleri geçici bir belirtece dönüştür
        let converted = content.replace(/,/g, '__TEMP_DECIMAL_COMMA__');
        // Noktalı virgülleri virgüle çevir
        converted = converted.replace(/;/g, ',');
        // Geçici belirteçleri noktaya çevir
        converted = converted.replace(/__TEMP_DECIMAL_COMMA__/g, '.');
        return converted;
    } else if (mode === 'tab_to_comma') {
        return content.replace(/\t/g, ',');
    } else if (mode === 'comma_to_semicolon') {
        // Standarttan TR/AB formatına: '.' -> ',' ve ',' -> ';'
        let converted = content.replace(/,/g, ';');
        converted = converted.replace(/\./g, ',');
        return converted;
    } else if (mode === 'space_to_comma') {
        return content.replace(/[ \t]+/g, ',');
    }

    return content;
}

function updateCSVConverterUI() {
    const listContainer = document.getElementById('csv-conv-files-list');
    const actionsContainer = document.getElementById('csv-conv-batch-actions');
    const countBadge = document.getElementById('csv-conv-count-badge');

    if (!listContainer) return;

    if (countBadge) countBadge.innerText = `${convertedCSVFiles.length} Dosya`;

    if (convertedCSVFiles.length === 0) {
        listContainer.innerHTML = `
            <div class="col-span-full py-10 text-center text-slate-500 italic flex flex-col items-center justify-center">
                <i data-lucide="folder-x" class="w-8 h-8 mb-2 opacity-40"></i>
                <span>Dönüştürülen dosya bulunmuyor. Dosya yükleyin veya örnek veri deneyin.</span>
            </div>
        `;
        if (actionsContainer) actionsContainer.classList.add('hidden');
        lucide.createIcons();
        return;
    }

    if (actionsContainer) actionsContainer.classList.remove('hidden');

    listContainer.innerHTML = convertedCSVFiles.map(f => `
        <div class="file-card-preview glass-card rounded-xl p-4 border border-slate-700/70 flex flex-col justify-between gap-3 relative group">
            <div class="flex items-start justify-between gap-2">
                <div class="flex items-center gap-2.5 overflow-hidden">
                    <div class="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
                        <i data-lucide="file-check-2" class="w-5 h-5"></i>
                    </div>
                    <div class="overflow-hidden">
                        <h4 class="text-xs font-semibold text-white truncate" title="${f.originalName}">${f.originalName}</h4>
                        <p class="text-[10px] text-slate-400 font-mono mt-0.5">${formatBytes(f.size)} • ${f.rowCount} satır</p>
                    </div>
                </div>
                <button onclick="removeCSVConverterFile('${f.id}')" title="Kaldır" class="text-slate-500 hover:text-red-400 transition p-1">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>

            <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-700/50">
                <button onclick="previewCSVFile('${f.id}')" class="flex-1 py-1.5 px-2 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium transition flex items-center justify-center gap-1">
                    <i data-lucide="eye" class="w-3 h-3 text-cyan-400"></i>
                    <span>Önizle</span>
                </button>
                <button onclick="downloadSingleCSVFile('${f.id}')" class="flex-1 py-1.5 px-2 text-[11px] bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition flex items-center justify-center gap-1 shadow-sm">
                    <i data-lucide="download" class="w-3 h-3"></i>
                    <span>İndir</span>
                </button>
            </div>

            <!-- Doğrudan Laboratuvara Aktar Düğmeleri -->
            <div class="grid grid-cols-2 gap-1.5 pt-1">
                <button onclick="transferCSVDirectly('${f.id}', 'ftir')" class="py-1 px-1.5 text-[10px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded border border-blue-500/30 transition flex items-center justify-center gap-1" title="Doğrudan FTIR Analizörüne Gönder">
                    <i data-lucide="activity" class="w-3 h-3 text-blue-400"></i>
                    <span>FTIR'a Aktar</span>
                </button>
                <button onclick="transferCSVDirectly('${f.id}', 'uvvis')" class="py-1 px-1.5 text-[10px] bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded border border-purple-500/30 transition flex items-center justify-center gap-1" title="Doğrudan UV-Vis Analizörüne Gönder">
                    <i data-lucide="sun" class="w-3 h-3 text-purple-400"></i>
                    <span>UV-Vis'e Aktar</span>
                </button>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function transferCSVDirectly(fileId, targetTool) {
    const file = convertedCSVFiles.find(f => f.id === fileId);
    if (!file) return;

    if (targetTool === 'ftir') {
        sendCSVToFTIR(file.convertedContent, file.newName);
    } else if (targetTool === 'uvvis') {
        sendCSVToUVVis(file.convertedContent, file.newName);
    }
}

function previewCSVFile(fileId) {
    const file = convertedCSVFiles.find(f => f.id === fileId);
    if (!file) return;

    const modal = document.getElementById('csv-preview-modal');
    const titleEl = document.getElementById('csv-preview-modal-title');
    const origBox = document.getElementById('csv-preview-original');
    const convBox = document.getElementById('csv-preview-converted');

    if (!modal || !origBox || !convBox) return;

    titleEl.innerText = `${file.originalName} ➔ ${file.newName}`;
    
    // İlk 20 satırı göster
    const origLines = file.originalContent.split('\n').slice(0, 20).join('\n');
    const convLines = file.convertedContent.split('\n').slice(0, 20).join('\n');

    origBox.textContent = origLines;
    convBox.textContent = convLines;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCSVPreviewModal() {
    const modal = document.getElementById('csv-preview-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function downloadSingleCSVFile(fileId) {
    const file = convertedCSVFiles.find(f => f.id === fileId);
    if (!file) return;

    const blob = new Blob([file.convertedContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.newName;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`"${file.newName}" indirildi!`, 'success');
}

function downloadAllCSVFiles() {
    if (convertedCSVFiles.length === 0) return;

    convertedCSVFiles.forEach((file, index) => {
        setTimeout(() => {
            const blob = new Blob([file.convertedContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.newName;
            a.click();
            URL.revokeObjectURL(url);
        }, index * 250);
    });

    showToast(`${convertedCSVFiles.length} dosya tek tek indiriliyor...`, 'info');
}

// JSZip kullanarak tek arşiv halinde indirme
async function downloadAllCSVAsZip() {
    if (convertedCSVFiles.length === 0) return;

    if (typeof JSZip === 'undefined') {
        showToast('ZIP kütüphanesi yükleniyor...', 'info');
        downloadAllCSVFiles();
        return;
    }

    const zip = new JSZip();
    const folder = zip.folder("donusturulmus_laboratuvar_csvleri");

    convertedCSVFiles.forEach(file => {
        folder.file(file.newName, file.convertedContent);
    });

    try {
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Donusturulmus_CSV_Arsivi_${new Date().toISOString().slice(0,10)}.zip`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Tüm CSV dosyaları ZIP olarak indirildi!', 'success');
    } catch (err) {
        showToast(`ZIP oluşturulamadı: ${err.message}`, 'error');
    }
}

function removeCSVConverterFile(fileId) {
    convertedCSVFiles = convertedCSVFiles.filter(f => f.id !== fileId);
    updateCSVConverterUI();
    showToast('Dosya listeden kaldırıldı.');
}

function clearAllCSVConverterFiles() {
    convertedCSVFiles = [];
    updateCSVConverterUI();
    showToast('Dönüştürülen dosya listesi temizlendi.');
}

function formatBytes(bytes, decimals = 1) {
    if (!+bytes) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Örnek Noktalı Virgüllü Türk / Avrupa Cihaz Çıktısı Verisi
function loadCSVConverterSampleData() {
    let mockEUContent1 = "Dalga_Sayisi;Transmitans;Referans\n";
    for (let w = 4000; w >= 400; w -= 50) {
        const tVal = (95.42 - Math.random() * 20).toFixed(2).replace('.', ',');
        const rVal = (99.12 - Math.random() * 5).toFixed(2).replace('.', ',');
        mockEUContent1 += `${w};${tVal};${rVal}\n`;
    }

    let mockEUContent2 = "Dalga_Boyu;Numune_A;Numune_B\n";
    for (let nm = 200; nm <= 800; nm += 25) {
        const aVal = (Math.random() * 1.8).toFixed(3).replace('.', ',');
        const bVal = (Math.random() * 1.2).toFixed(3).replace('.', ',');
        mockEUContent2 += `${nm};${aVal};${bVal}\n`;
    }

    const files = [
        { name: 'Cihaz_Ciktisi_FTIR_NoktaliVirgul.csv', content: mockEUContent1 },
        { name: 'Cihaz_Ciktisi_UVVis_NoktaliVirgul.csv', content: mockEUContent2 }
    ];

    files.forEach(f => {
        const converted = convertCSVContent(f.content, 'auto_eu_to_std');
        convertedCSVFiles.push({
            id: 'csv_' + Date.now() + Math.random().toString(36).substring(2, 5),
            originalName: f.name,
            newName: 'donusturulmus_' + f.name,
            originalContent: f.content,
            convertedContent: converted,
            size: f.content.length,
            rowCount: (converted.match(/\n/g) || []).length + 1
        });
        incrementStat('filesConverted');
    });

    updateCSVConverterUI();
    showToast('2 adet örnek noktalı virgüllü CSV yüklendi!', 'success');
}
