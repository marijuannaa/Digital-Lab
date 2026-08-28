/**
 * Dijital Laboratuvar - FTIR Spektrum Analizörü & Grafik Stüdyosu
 */

let ftirSpectraList = [];
const ftirDefaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6'];

function initFTIRModule() {
    setupFTIRDropZone();
    initFTIRPlotly();
}

function setupFTIRDropZone() {
    const dropZone = document.getElementById('ftir-drop-zone');
    const fileInput = document.getElementById('ftir-file-input');

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
        if (files.length > 0) handleFTIRFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleFTIRFiles(e.target.files);
    });
}

function handleFTIRFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.name.match(/\.(csv|txt|dat)$/i)) {
            showToast(`${file.name} desteklenmeyen dosya formatı. (.csv, .txt, .dat kullanın)`, 'error');
            return;
        }

        Papa.parse(file, {
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                processFTIRParsedCSV(results.data, file.name);
            },
            error: (err) => {
                showToast(`Dosya okunurken hata: ${err.message}`, 'error');
            }
        });
    });
}

function processFTIRParsedCSV(rows, fileName) {
    let rawX = [];
    let rawY = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const valX = parseFloat(row[0]);
        const valY = parseFloat(row[1]);

        if (!isNaN(valX) && !isNaN(valY)) {
            rawX.push(valX);
            rawY.push(valY);
        }
    }

    if (rawX.length === 0) {
        showToast(`${fileName} içinde geçerli FTIR sayısal verisi bulunamadı.`, 'error');
        return;
    }

    // Dalga sayılarına göre sırala (Küçükten büyüğe)
    const combined = rawX.map((x, idx) => ({ x: x, y: rawY[idx] }));
    combined.sort((a, b) => a.x - b.x);

    const sortedX = combined.map(item => item.x);
    const sortedY = combined.map(item => item.y);

    const color = ftirDefaultColors[ftirSpectraList.length % ftirDefaultColors.length];

    ftirSpectraList.push({
        id: 'ftir_' + Date.now() + Math.random().toString(36).substring(2, 5),
        name: fileName.replace(/\.[^/.]+$/, ""),
        rawX: sortedX,
        rawY: sortedY,
        processedX: sortedX,
        processedY: sortedY,
        color: color,
        visible: true
    });

    incrementStat('spectraAnalyzed');
    updateFTIRSpectraUIList();
    processAndPlotFTIRData();
    showToast(`${fileName} FTIR listesine eklendi!`, 'success');
}

// Ağırlıklı Spektral Yumuşatıcı (Triangular Weighted Moving Average)
function applyFTIRSmoothing(yValues, windowSize) {
    if (windowSize < 3) return yValues;
    const half = Math.floor(windowSize / 2);
    const len = yValues.length;
    const smoothed = new Array(len);

    for (let i = 0; i < len; i++) {
        let sum = 0;
        let weightSum = 0;

        for (let j = -half; j <= half; j++) {
            const idx = i + j;
            if (idx >= 0 && idx < len) {
                const weight = half + 1 - Math.abs(j);
                sum += yValues[idx] * weight;
                weightSum += weight;
            }
        }
        smoothed[i] = sum / weightSum;
    }
    return smoothed;
}

function processAndPlotFTIRData() {
    const yMode = document.getElementById('ftir-y-mode')?.value || 'raw';
    const normalize = document.getElementById('ftir-normalize-y')?.checked || false;
    const enableSmoothing = document.getElementById('ftir-enable-smoothing')?.checked || false;
    const smoothingLevel = parseInt(document.getElementById('ftir-smoothing-level')?.value || '7');
    const stackOffset = parseFloat(document.getElementById('ftir-stack-offset')?.value || '0');

    let visibleIndex = 0;

    ftirSpectraList.forEach(spectrum => {
        let yValues = [...spectrum.rawY];

        // Birim Dönüşümü
        if (yMode === 'transmittance_to_absorbance') {
            // A = 2 - log10(%T)
            yValues = yValues.map(val => {
                let t = val;
                if (t <= 0) t = 0.0001;
                if (t > 100) t = 100;
                return 2 - Math.log10(t);
            });
        } else if (yMode === 'absorbance_to_transmittance') {
            // %T = 10^(2 - A)
            yValues = yValues.map(a => Math.pow(10, 2 - a));
        }

        // Gürültü Azaltma Filtresi
        if (enableSmoothing) {
            yValues = applyFTIRSmoothing(yValues, smoothingLevel);
        }

        // Min-Max Normalizasyonu (0 - 1)
        if (normalize && yValues.length > 0) {
            const min = Math.min(...yValues);
            const max = Math.max(...yValues);
            const range = max - min;
            if (range !== 0) {
                yValues = yValues.map(v => (v - min) / range);
            }
        }

        // Şelale / Üst üste Yığma Ofseti (Waterfall Offset)
        if (stackOffset > 0 && spectrum.visible) {
            const offsetVal = visibleIndex * stackOffset;
            yValues = yValues.map(v => v + offsetVal);
            visibleIndex++;
        }

        spectrum.processedX = spectrum.rawX;
        spectrum.processedY = yValues;
    });

    updateFTIRPlot();
}

function initFTIRPlotly() {
    const chartDiv = document.getElementById('ftir-plotly-chart');
    if (!chartDiv) return;

    const layout = getFTIRPlotlyLayout();
    const config = {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: 'ftir_spektrumu',
            height: 900,
            width: 1600,
            scale: 2
        }
    };

    Plotly.newPlot('ftir-plotly-chart', [], layout, config);
}

function getFTIRPlotlyLayout() {
    const invertX = document.getElementById('ftir-invert-x')?.checked ?? true;
    const yMode = document.getElementById('ftir-y-mode')?.value || 'raw';

    let yAxisTitle = 'Şiddet / Sinyal';
    if (yMode === 'transmittance_to_absorbance') yAxisTitle = 'Absorbans (A)';
    else if (yMode === 'absorbance_to_transmittance') yAxisTitle = 'Transmitans (%T)';

    return {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(15, 23, 42, 0.65)',
        margin: { l: 65, r: 35, t: 35, b: 65 },
        showlegend: true,
        legend: {
            x: 1,
            xanchor: 'right',
            y: 1,
            font: { color: '#94a3b8', size: 11 },
            bgcolor: 'rgba(30, 41, 59, 0.85)',
            bordercolor: 'rgba(255, 255, 255, 0.1)',
            borderwidth: 1
        },
        xaxis: {
            title: { text: 'Dalga Sayısı (Wavenumber) [cm⁻¹]', font: { color: '#cbd5e1', size: 13, family: 'Inter' } },
            autorange: invertX ? 'reversed' : true,
            gridcolor: 'rgba(51, 65, 85, 0.6)',
            zerolinecolor: 'rgba(71, 85, 105, 0.8)',
            tickfont: { color: '#94a3b8', family: 'Inter' }
        },
        yaxis: {
            title: { text: yAxisTitle, font: { color: '#cbd5e1', size: 13, family: 'Inter' } },
            gridcolor: 'rgba(51, 65, 85, 0.6)',
            zerolinecolor: 'rgba(71, 85, 105, 0.8)',
            tickfont: { color: '#94a3b8', family: 'Inter' }
        },
        hovermode: 'x unified'
    };
}

function updateFTIRPlot() {
    const showPeaks = document.getElementById('ftir-show-peaks')?.checked || false;
    const sensitivity = parseInt(document.getElementById('ftir-peak-sensitivity')?.value || '5');
    const yMode = document.getElementById('ftir-y-mode')?.value || 'raw';
    
    const plotlyTraces = [];
    const annotations = [];
    const detectedPeaksList = [];

    ftirSpectraList.forEach(spectrum => {
        if (!spectrum.visible) return;

        plotlyTraces.push({
            x: spectrum.processedX,
            y: spectrum.processedY,
            mode: 'lines',
            name: spectrum.name,
            line: { color: spectrum.color, width: 2 }
        });

        if (showPeaks && spectrum.processedX.length > 0) {
            // FTIR Transmitansta çukur (minima), Absorbansta tepe (maxima) arar
            const isTMode = (yMode === 'raw' || yMode === 'absorbance_to_transmittance');
            const peaks = findFTIRPeaks(spectrum.processedX, spectrum.processedY, sensitivity, isTMode);
            
            peaks.forEach(peak => {
                annotations.push({
                    x: peak.x,
                    y: peak.y,
                    xref: 'x',
                    yref: 'y',
                    text: `${peak.x.toFixed(0)}`,
                    showarrow: true,
                    arrowhead: 2,
                    ax: 0,
                    ay: isTMode ? 25 : -25,
                    arrowcolor: '#f59e0b',
                    font: { size: 10, color: '#fcd34d', family: 'JetBrains Mono' },
                    bgcolor: 'rgba(15, 23, 42, 0.85)',
                    bordercolor: '#f59e0b',
                    borderwidth: 1,
                    borderpad: 2
                });

                detectedPeaksList.push({
                    spectrumName: spectrum.name,
                    wavenumber: peak.x,
                    intensity: peak.y,
                    group: getFTIRFunctionalGroupHint(peak.x)
                });
            });
        }
    });

    const layout = getFTIRPlotlyLayout();
    layout.annotations = annotations;

    Plotly.react('ftir-plotly-chart', plotlyTraces, layout);
    updateFTIRPeaksTable(detectedPeaksList);

    if (detectedPeaksList.length > 0) {
        incrementStat('peaksFound');
    }
}

function findFTIRPeaks(xVals, yVals, sensitivity, isTMode = true) {
    const peaks = [];
    const step = Math.max(1, Math.floor((11 - sensitivity) * 2));

    for (let i = step; i < yVals.length - step; i += 1) {
        let isExtreme = true;

        for (let j = i - step; j <= i + step; j++) {
            if (j === i) continue;
            if (isTMode) {
                // Çukur (Minimum)
                if (yVals[j] <= yVals[i]) isExtreme = false;
            } else {
                // Tepe (Maksimum)
                if (yVals[j] >= yVals[i]) isExtreme = false;
            }
        }

        if (isExtreme) {
            const lastPeak = peaks[peaks.length - 1];
            if (!lastPeak || Math.abs(xVals[i] - lastPeak.x) > 25) {
                peaks.push({ x: xVals[i], y: yVals[i] });
            }
        }
    }
    return peaks;
}

function getFTIRFunctionalGroupHint(wavenumber) {
    if (wavenumber >= 3200 && wavenumber <= 3650) return 'O-H / N-H Gerilmesi (Alkol, Fenol, Amin, Su)';
    if (wavenumber >= 3000 && wavenumber <= 3100) return '=C-H Gerilmesi (Alken / Aromatik)';
    if (wavenumber >= 2850 && wavenumber < 3000) return 'C-H Gerilmesi (Alkanlar - CH2, CH3)';
    if (wavenumber >= 2500 && wavenumber <= 3300) return 'O-H Çok Geniş (Karboksilik Asit)';
    if (wavenumber >= 2100 && wavenumber <= 2260) return 'C≡C / C≡N Üçlü Bağ Gerilmesi';
    if (wavenumber >= 1680 && wavenumber <= 1780) return 'C=O Güçlü Karbonil (Ester, Keton, Aldehit, Asit)';
    if (wavenumber >= 1600 && wavenumber < 1680) return 'C=C / Amid I Bandı (Alken, Konjuge Keton)';
    if (wavenumber >= 1450 && wavenumber <= 1600) return 'C=C Aromatik Halka Titreşimleri';
    if (wavenumber >= 1350 && wavenumber < 1450) return 'C-H Düzlem İçi Bükülme (Metil / Metilen)';
    if (wavenumber >= 1000 && wavenumber <= 1300) return 'C-O Tekli Bağ Gerilmesi (Eter, Ester, Alkol)';
    if (wavenumber < 1000) return 'Parmak İzi (Fingerprint) & Düzlem Dışı C-H Bükülmesi';
    return 'Diğer Moleküler Titreşim Modları';
}

function updateFTIRPeaksTable(peaks) {
    const tableBody = document.getElementById('ftir-peaks-table-body');
    const peakCountEl = document.getElementById('ftir-detected-peak-count');
    if (!tableBody || !peakCountEl) return;
    
    peakCountEl.innerText = `${peaks.length} pik algılandı`;

    if (peaks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="p-4 text-center text-slate-500 italic">Pik tespiti yapmak için grafik ayarlarından "Otomatik Pik Etiketleri" seçeneğini aktif edin.</td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = peaks.map(p => `
        <tr class="hover:bg-slate-700/30 transition border-b border-slate-700/30">
            <td class="p-2 font-medium text-slate-200">${p.spectrumName}</td>
            <td class="p-2 font-mono text-amber-300">${p.wavenumber.toFixed(1)} cm⁻¹</td>
            <td class="p-2 font-mono text-slate-300">${p.intensity.toFixed(3)}</td>
            <td class="p-2 text-slate-400">${p.group}</td>
        </tr>
    `).join('');
}

function exportFTIRPeaksCSV() {
    const showPeaks = document.getElementById('ftir-show-peaks')?.checked;
    if (!showPeaks || ftirSpectraList.length === 0) {
        showToast('Dışa aktarmak için önce spektrum yükleyin ve pik etiketlerini açın.', 'warning');
        return;
    }

    const sensitivity = parseInt(document.getElementById('ftir-peak-sensitivity')?.value || '5');
    const yMode = document.getElementById('ftir-y-mode')?.value || 'raw';
    const isTMode = (yMode === 'raw' || yMode === 'absorbance_to_transmittance');

    let csvContent = "Spektrum Adı,Dalga Sayısı (cm-1),Şiddet Değeri,Olası İşlevsel Grup\n";

    ftirSpectraList.forEach(spec => {
        if (!spec.visible) return;
        const peaks = findFTIRPeaks(spec.processedX, spec.processedY, sensitivity, isTMode);
        peaks.forEach(p => {
            const hint = getFTIRFunctionalGroupHint(p.x).replace(/,/g, ' - ');
            csvContent += `"${spec.name}",${p.x.toFixed(2)},${p.intensity.toFixed(4)},"${hint}"\n`;
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FTIR_Pik_Tablosu_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('FTIR pik tablosu CSV olarak indirildi!', 'success');
}

function downloadFTIRChart(format = 'png') {
    const chartDiv = document.getElementById('ftir-plotly-chart');
    if (!chartDiv) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `ftir_spektrumu_${dateStr}`;

    Plotly.downloadImage(chartDiv, {
        format: format,
        width: 1920,
        height: 1080,
        filename: fileName
    }).then(() => {
        showToast(`FTIR Grafiği ${format.toUpperCase()} olarak indirildi!`, 'success');
    }).catch(() => {
        showToast('Görsel indirilirken hata oluştu.', 'error');
    });
}

function updateFTIRSpectraUIList() {
    const container = document.getElementById('ftir-spectra-list');
    const countEl = document.getElementById('ftir-spectrum-count');
    if (!container || !countEl) return;
    
    countEl.innerText = ftirSpectraList.length;

    if (ftirSpectraList.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Henüz spektrum yüklenmedi.</p>`;
        return;
    }

    container.innerHTML = ftirSpectraList.map(spec => `
        <div class="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/80 text-xs shadow-sm">
            <div class="flex items-center gap-2 overflow-hidden mr-2">
                <input type="color" value="${spec.color}" onchange="changeFTIRSpectrumColor('${spec.id}', this.value)" class="w-4 h-4 rounded cursor-pointer shrink-0">
                <span class="truncate text-slate-200 font-medium text-[11px]" title="${spec.name}">${spec.name}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button onclick="toggleFTIRSpectrumVisibility('${spec.id}')" title="Gizle / Göster" class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition">
                    <i data-lucide="${spec.visible ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="removeFTIRSpectrum('${spec.id}')" title="Kaldır" class="p-1 hover:bg-slate-800 rounded text-red-400 hover:text-red-300 transition">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function changeFTIRSpectrumColor(id, color) {
    const spec = ftirSpectraList.find(s => s.id === id);
    if (spec) {
        spec.color = color;
        updateFTIRPlot();
    }
}

function toggleFTIRSpectrumVisibility(id) {
    const spec = ftirSpectraList.find(s => s.id === id);
    if (spec) {
        spec.visible = !spec.visible;
        updateFTIRSpectraUIList();
        updateFTIRPlot();
    }
}

function removeFTIRSpectrum(id) {
    ftirSpectraList = ftirSpectraList.filter(s => s.id !== id);
    updateFTIRSpectraUIList();
    processAndPlotFTIRData();
    showToast('Spektrum listeden kaldırıldı.');
}

function clearAllFTIRSpectra() {
    ftirSpectraList = [];
    updateFTIRSpectraUIList();
    processAndPlotFTIRData();
    showToast('Tüm FTIR spektrumları temizlendi.');
}

// Örnek FTIR Verisi Yükle (Sentetik Aspirin / Asetilsalisilik Asit Spektrumu)
function loadFTIRSampleData() {
    const sampleX = [];
    const sampleY = [];

    for (let w = 400; w <= 4000; w += 2) {
        sampleX.push(w);
        
        let t = 96 + (Math.random() - 0.5) * 2.5;

        // Karakteristik Aspirin FTIR Çukurları
        t -= 55 * Math.exp(-Math.pow((w - 3320) / 70, 2)); // Fenolik/Karboksilik O-H
        t -= 40 * Math.exp(-Math.pow((w - 2930) / 30, 2)); // C-H alifatik
        t -= 30 * Math.exp(-Math.pow((w - 2850) / 25, 2)); // C-H simetrik
        t -= 80 * Math.exp(-Math.pow((w - 1750) / 18, 2)); // Ester C=O
        t -= 75 * Math.exp(-Math.pow((w - 1690) / 20, 2)); // Asit C=O
        t -= 45 * Math.exp(-Math.pow((w - 1605) / 20, 2)); // Aromatik C=C
        t -= 50 * Math.exp(-Math.pow((w - 1480) / 25, 2)); // Aromatik halka
        t -= 65 * Math.exp(-Math.pow((w - 1200) / 30, 2)); // C-O ester
        t -= 55 * Math.exp(-Math.pow((w - 1015) / 25, 2)); // C-O asit
        t -= 45 * Math.exp(-Math.pow((w - 755) / 20, 2));  // Orto-ikameli aromatik

        sampleY.push(Math.max(1.5, Math.min(100, t)));
    }

    const color = ftirDefaultColors[ftirSpectraList.length % ftirDefaultColors.length];
    ftirSpectraList.push({
        id: 'ftir_' + Date.now(),
        name: 'Ornek_Aspirin_FTIR.csv',
        rawX: sampleX,
        rawY: sampleY,
        processedX: sampleX,
        processedY: sampleY,
        color: color,
        visible: true
    });

    incrementStat('spectraAnalyzed');
    updateFTIRSpectraUIList();
    processAndPlotFTIRData();
    showToast('Örnek Aspirin FTIR spektrumu yüklendi!', 'success');
}
