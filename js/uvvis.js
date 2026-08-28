/**
 * Dijital Laboratuvar - UV-Vis Spektrofotometre Spektrum Analizörü
 */

let uvvisSpectraList = [];
const uvvisDefaultColors = ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#3b82f6', '#f97316', '#e11d48'];

function initUVVisModule() {
    setupUVVisDropZone();
    initUVVisPlotly();
}

function setupUVVisDropZone() {
    const dropZone = document.getElementById('uvvis-drop-zone');
    const fileInput = document.getElementById('uvvis-file-input');

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
        if (files.length > 0) handleUVVisFiles(files);
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handleUVVisFiles(e.target.files);
    });
}

function handleUVVisFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.name.match(/\.(csv|txt|dat)$/i)) {
            showToast(`${file.name} desteklenmeyen dosya formatı. (.csv, .txt, .dat kullanın)`, 'error');
            return;
        }

        Papa.parse(file, {
            skipEmptyLines: true,
            dynamicTyping: true,
            complete: (results) => {
                processUVVisParsedCSV(results.data, file.name);
            },
            error: (err) => {
                showToast(`Dosya okunurken hata: ${err.message}`, 'error');
            }
        });
    });
}

function processUVVisParsedCSV(rows, fileName) {
    if (!rows || rows.length === 0) {
        showToast(`${fileName} boş veya geçersiz dosya.`, 'error');
        return;
    }

    const cleanFileName = fileName.replace(/\.[^/.]+$/, "");
    let columnHeaders = [];
    let dataRows = [];

    // Başlık ve veri ayrıştırma
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const firstVal = parseFloat(row[0]);
        if (isNaN(firstVal)) {
            const headerCandidates = row.map(cell => cell !== null && cell !== undefined ? String(cell).trim() : '');
            if (headerCandidates.filter(h => h.length > 0).length >= 2) {
                columnHeaders = headerCandidates;
            }
        } else {
            const numRow = row.map(cell => {
                if (cell === null || cell === undefined || cell === '') return NaN;
                return parseFloat(cell);
            });
            if (!isNaN(numRow[0])) {
                dataRows.push(numRow);
            }
        }
    }

    if (dataRows.length === 0) {
        showToast(`${fileName} içinde geçerli UV-Vis sayısal verisi bulunamadı.`, 'error');
        return;
    }

    let maxCols = 0;
    dataRows.forEach(r => {
        if (r.length > maxCols) maxCols = r.length;
    });

    if (maxCols < 2) {
        showToast(`${fileName} içinde en az 2 sütun bulunmalıdır.`, 'error');
        return;
    }

    // İkili Çiftler mi (X1,Y1,X2,Y2...) yoksa Tekil X mi (X,Y1,Y2...)?
    let isPairwise = false;
    if (maxCols >= 4) {
        const col2Header = columnHeaders[2] ? columnHeaders[2].toLowerCase() : '';
        const isCol2HeaderWavelength = col2Header.includes('dalga') || col2Header.includes('wave') || col2Header.includes('nm') || col2Header.includes('x');

        let validCount = 0;
        let isMonotonic = true;
        let prevVal = null;

        for (let r = 0; r < Math.min(25, dataRows.length); r++) {
            const val = dataRows[r][2];
            if (!isNaN(val)) {
                validCount++;
                if (prevVal !== null && val === prevVal) isMonotonic = false;
                prevVal = val;
            }
        }

        if (isCol2HeaderWavelength || (validCount > 5 && isMonotonic)) {
            isPairwise = true;
        }
    }

    let addedCount = 0;

    if (isPairwise) {
        for (let xCol = 0; xCol < maxCols - 1; xCol += 2) {
            const yCol = xCol + 1;
            let rawX = [];
            let rawY = [];

            for (let r = 0; r < dataRows.length; r++) {
                const row = dataRows[r];
                const valX = row[xCol];
                const valY = row[yCol];

                if (!isNaN(valX) && valY !== undefined && !isNaN(valY) && valY !== null) {
                    rawX.push(valX);
                    rawY.push(valY);
                }
            }

            if (rawX.length === 0) continue;

            const combined = rawX.map((x, idx) => ({ x: x, y: rawY[idx] }));
            combined.sort((a, b) => a.x - b.x);

            const sortedX = combined.map(item => item.x);
            const sortedY = combined.map(item => item.y);

            let specName = '';
            const hYName = columnHeaders[yCol];
            const hXName = columnHeaders[xCol];

            if (hYName && hYName.length > 0) {
                specName = `${cleanFileName} - ${hYName}`;
            } else if (hXName && hXName.length > 0) {
                specName = `${cleanFileName} - ${hXName}`;
            } else {
                specName = `${cleanFileName} - Numune ${Math.floor(xCol / 2) + 1}`;
            }

            const color = uvvisDefaultColors[uvvisSpectraList.length % uvvisDefaultColors.length];

            uvvisSpectraList.push({
                id: 'uvvis_' + Date.now() + Math.random().toString(36).substring(2, 5) + '_' + xCol,
                name: specName,
                rawX: sortedX,
                rawY: sortedY,
                processedX: sortedX,
                processedY: sortedY,
                color: color,
                visible: true
            });

            addedCount++;
        }
    } else {
        for (let yCol = 1; yCol < maxCols; yCol++) {
            let rawX = [];
            let rawY = [];

            for (let r = 0; r < dataRows.length; r++) {
                const row = dataRows[r];
                const valX = row[0];
                const valY = row[yCol];

                if (!isNaN(valX) && valY !== undefined && !isNaN(valY) && valY !== null) {
                    rawX.push(valX);
                    rawY.push(valY);
                }
            }

            if (rawX.length === 0) continue;

            const combined = rawX.map((x, idx) => ({ x: x, y: rawY[idx] }));
            combined.sort((a, b) => a.x - b.x);

            const sortedX = combined.map(item => item.x);
            const sortedY = combined.map(item => item.y);

            let specName = '';
            const hName = columnHeaders[yCol];
            
            if (hName && hName.length > 0) {
                specName = (maxCols === 2) ? cleanFileName : `${cleanFileName} - ${hName}`;
            } else {
                specName = (maxCols === 2) ? cleanFileName : `${cleanFileName} - Spektrum ${yCol}`;
            }

            const color = uvvisDefaultColors[uvvisSpectraList.length % uvvisDefaultColors.length];

            uvvisSpectraList.push({
                id: 'uvvis_' + Date.now() + Math.random().toString(36).substring(2, 5) + '_' + yCol,
                name: specName,
                rawX: sortedX,
                rawY: sortedY,
                processedX: sortedX,
                processedY: sortedY,
                color: color,
                visible: true
            });

            addedCount++;
        }
    }

    if (addedCount > 0) {
        incrementStat('spectraAnalyzed');
        updateUVVisSpectraUIList();
        processAndPlotUVVisData();
        showToast(`${fileName} dosyasından ${addedCount} UV-Vis spektrumu eklendi!`, 'success');
    } else {
        showToast(`${fileName} dosyasından spektrum çıkarılamadı.`, 'error');
    }
}

// Ağırlıklı Spektral Yumuşatıcı
function applyUVVisSmoothing(yValues, windowSize) {
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

function processAndPlotUVVisData() {
    const yMode = document.getElementById('uvvis-y-mode')?.value || 'raw';
    const normalize = document.getElementById('uvvis-normalize-y')?.checked || false;
    const enableSmoothing = document.getElementById('uvvis-enable-smoothing')?.checked || false;
    const smoothingLevel = parseInt(document.getElementById('uvvis-smoothing-level')?.value || '7');
    const stackOffset = parseFloat(document.getElementById('uvvis-stack-offset')?.value || '0');

    let visibleIndex = 0;

    uvvisSpectraList.forEach(spectrum => {
        let yValues = [...spectrum.rawY];

        if (yMode === 'transmittance_to_absorbance') {
            yValues = yValues.map(val => {
                let t = val;
                if (t <= 0) t = 0.0001;
                if (t > 100) t = 100;
                return 2 - Math.log10(t);
            });
        } else if (yMode === 'absorbance_to_transmittance') {
            yValues = yValues.map(a => Math.pow(10, 2 - a));
        }

        if (enableSmoothing) {
            yValues = applyUVVisSmoothing(yValues, smoothingLevel);
        }

        if (normalize && yValues.length > 0) {
            const min = Math.min(...yValues);
            const max = Math.max(...yValues);
            const range = max - min;
            if (range !== 0) {
                yValues = yValues.map(v => (v - min) / range);
            }
        }

        if (stackOffset > 0 && spectrum.visible) {
            const offsetVal = visibleIndex * stackOffset;
            yValues = yValues.map(v => v + offsetVal);
            visibleIndex++;
        }

        spectrum.processedX = spectrum.rawX;
        spectrum.processedY = yValues;
    });

    updateUVVisPlot();
}

function initUVVisPlotly() {
    const chartDiv = document.getElementById('uvvis-plotly-chart');
    if (!chartDiv) return;

    const layout = getUVVisPlotlyLayout();
    const config = {
        responsive: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        toImageButtonOptions: {
            format: 'png',
            filename: 'uv_vis_spektrumu',
            height: 900,
            width: 1600,
            scale: 2
        }
    };

    Plotly.newPlot('uvvis-plotly-chart', [], layout, config);
}

function getUVVisPlotlyLayout() {
    const invertX = document.getElementById('uvvis-invert-x')?.checked || false;
    const yMode = document.getElementById('uvvis-y-mode')?.value || 'raw';

    let yAxisTitle = 'Absorbans (A)';
    if (yMode === 'absorbance_to_transmittance') yAxisTitle = 'Transmitans (%T)';
    else if (yMode === 'raw') yAxisTitle = 'Sinyal / Absorbans';

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
            title: { text: 'Dalga Boyu (Wavelength) [nm]', font: { color: '#cbd5e1', size: 13, family: 'Inter' } },
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

function updateUVVisPlot() {
    const showPeaks = document.getElementById('uvvis-show-peaks')?.checked || false;
    const sensitivity = parseInt(document.getElementById('uvvis-peak-sensitivity')?.value || '5');
    
    const plotlyTraces = [];
    const annotations = [];
    const detectedPeaksList = [];

    uvvisSpectraList.forEach(spectrum => {
        if (!spectrum.visible) return;

        plotlyTraces.push({
            x: spectrum.processedX,
            y: spectrum.processedY,
            mode: 'lines',
            name: spectrum.name,
            line: { color: spectrum.color, width: 2 }
        });

        if (showPeaks && spectrum.processedX.length > 0) {
            const peaks = findUVVisPeaks(spectrum.processedX, spectrum.processedY, sensitivity);
            
            peaks.forEach(peak => {
                annotations.push({
                    x: peak.x,
                    y: peak.y,
                    xref: 'x',
                    yref: 'y',
                    text: `λmax ${peak.x.toFixed(0)} nm`,
                    showarrow: true,
                    arrowhead: 2,
                    ax: 0,
                    ay: -25,
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
                    group: getUVVisSpectralRegionHint(peak.x),
                    colorSwatch: getWavelengthColor(peak.x)
                });
            });
        }
    });

    const layout = getUVVisPlotlyLayout();
    layout.annotations = annotations;

    Plotly.react('uvvis-plotly-chart', plotlyTraces, layout);
    updateUVVisPeaksTable(detectedPeaksList);

    if (detectedPeaksList.length > 0) {
        incrementStat('peaksFound');
    }
}

function findUVVisPeaks(xVals, yVals, sensitivity) {
    const peaks = [];
    const step = Math.max(1, Math.floor((11 - sensitivity) * 3));

    for (let i = step; i < yVals.length - step; i += 1) {
        let isMax = true;

        for (let j = i - step; j <= i + step; j++) {
            if (j === i) continue;
            if (yVals[j] >= yVals[i]) isMax = false;
        }

        if (isMax) {
            const lastPeak = peaks[peaks.length - 1];
            if (!lastPeak || Math.abs(xVals[i] - lastPeak.x) > 15) {
                peaks.push({ x: xVals[i], y: yVals[i] });
            }
        }
    }
    return peaks;
}

function getUVVisSpectralRegionHint(nm) {
    if (nm < 200) return 'Vakum UV (Tekli bağlar, solvent kesilme bölgesi)';
    if (nm >= 200 && nm <= 280) return 'UV-C Bölgesi (Aromatik halkalar, Peptit bağları, Nükleik asitler)';
    if (nm > 280 && nm <= 315) return 'UV-B Bölgesi (Konjuge dienler, Protein Trp/Tyr)';
    if (nm > 315 && nm <= 400) return 'UV-A Bölgesi (Geniş konjugasyon, Flavonoidler, Karbonil n→π*)';
    if (nm > 400 && nm <= 450) return 'Görünür Mor/Mavi (Karotenoidler, Sarı/Turuncu boyarmaddeler)';
    if (nm > 450 && nm <= 500) return 'Görünür Mavi/Yeşil (Kırmızı/Turuncu metal kompleksleri)';
    if (nm > 500 && nm <= 580) return 'Görünür Yeşil/Sarı (Mor/Pembe kompleksler, Rhodamine)';
    if (nm > 580 && nm <= 700) return 'Görünür Kırmızı (Klorofil A/B, Ftalosiyanin, Mavi pigmentler)';
    if (nm > 700) return 'Yakın Kızılötesi (NIR Spektral Sınırı)';
    return 'UV-Vis Absorpsiyon Bandı';
}

function getWavelengthColor(nm) {
    if (nm < 380) return '#7c3aed'; // UV
    if (nm < 440) return '#6366f1'; // Mor
    if (nm < 490) return '#0284c7'; // Mavi
    if (nm < 510) return '#06b6d4'; // Camgöbeği
    if (nm < 560) return '#10b981'; // Yeşil
    if (nm < 590) return '#eab308'; // Sarı
    if (nm < 630) return '#f97316'; // Turuncu
    if (nm <= 750) return '#ef4444'; // Kırmızı
    return '#881337'; // NIR
}

function updateUVVisPeaksTable(peaks) {
    const tableBody = document.getElementById('uvvis-peaks-table-body');
    const peakCountEl = document.getElementById('uvvis-detected-peak-count');
    if (!tableBody || !peakCountEl) return;
    
    peakCountEl.innerText = `${peaks.length} pik algılandı`;

    if (peaks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" class="p-4 text-center text-slate-500 italic">Pik tespiti yapmak için grafik ayarlarından "λmax Etiketleri" seçeneğini aktif edin.</td>
            </tr>`;
        return;
    }

    tableBody.innerHTML = peaks.map(p => `
        <tr class="hover:bg-slate-700/30 transition border-b border-slate-700/30">
            <td class="p-2 font-medium text-slate-200">${p.spectrumName}</td>
            <td class="p-2 font-mono text-amber-300 flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full inline-block" style="background-color: ${p.colorSwatch || '#f59e0b'};"></span>
                <span>λmax = ${p.wavenumber.toFixed(1)} nm</span>
            </td>
            <td class="p-2 font-mono text-slate-300">${p.intensity.toFixed(3)}</td>
            <td class="p-2 text-slate-400">${p.group}</td>
        </tr>
    `).join('');
}

function exportUVVisPeaksCSV() {
    const showPeaks = document.getElementById('uvvis-show-peaks')?.checked;
    if (!showPeaks || uvvisSpectraList.length === 0) {
        showToast('Dışa aktarmak için önce spektrum yükleyin ve λmax etiketlerini açın.', 'warning');
        return;
    }

    const sensitivity = parseInt(document.getElementById('uvvis-peak-sensitivity')?.value || '5');
    let csvContent = "Spektrum Adı,Dalga Boyu (nm),Absorbans Şiddeti,Spektral Bölge\n";

    uvvisSpectraList.forEach(spec => {
        if (!spec.visible) return;
        const peaks = findUVVisPeaks(spec.processedX, spec.processedY, sensitivity);
        peaks.forEach(p => {
            const hint = getUVVisSpectralRegionHint(p.x).replace(/,/g, ' - ');
            csvContent += `"${spec.name}",${p.x.toFixed(2)},${p.intensity.toFixed(4)},"${hint}"\n`;
        });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UV_Vis_Pik_Tablosu_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('UV-Vis pik tablosu CSV olarak indirildi!', 'success');
}

function downloadUVVisChart(format = 'png') {
    const chartDiv = document.getElementById('uvvis-plotly-chart');
    if (!chartDiv) return;

    const dateStr = new Date().toISOString().slice(0, 10);
    const fileName = `uv_vis_spektrumu_${dateStr}`;

    Plotly.downloadImage(chartDiv, {
        format: format,
        width: 1920,
        height: 1080,
        filename: fileName
    }).then(() => {
        showToast(`UV-Vis Grafiği ${format.toUpperCase()} olarak indirildi!`, 'success');
    }).catch(() => {
        showToast('Görsel indirilirken hata oluştu.', 'error');
    });
}

function updateUVVisSpectraUIList() {
    const container = document.getElementById('uvvis-spectra-list');
    const countEl = document.getElementById('uvvis-spectrum-count');
    if (!container || !countEl) return;
    
    countEl.innerText = uvvisSpectraList.length;

    if (uvvisSpectraList.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-500 italic text-center py-4">Henüz spektrum yüklenmedi.</p>`;
        return;
    }

    container.innerHTML = uvvisSpectraList.map(spec => `
        <div class="flex items-center justify-between bg-slate-900/80 p-2.5 rounded-xl border border-slate-700/80 text-xs shadow-sm">
            <div class="flex items-center gap-2 overflow-hidden mr-2">
                <input type="color" value="${spec.color}" onchange="changeUVVisSpectrumColor('${spec.id}', this.value)" class="w-4 h-4 rounded cursor-pointer shrink-0">
                <span class="truncate text-slate-200 font-medium text-[11px]" title="${spec.name}">${spec.name}</span>
            </div>
            <div class="flex items-center gap-1 shrink-0">
                <button onclick="toggleUVVisSpectrumVisibility('${spec.id}')" title="Gizle / Göster" class="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition">
                    <i data-lucide="${spec.visible ? 'eye' : 'eye-off'}" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="removeUVVisSpectrum('${spec.id}')" title="Kaldır" class="p-1 hover:bg-slate-800 rounded text-red-400 hover:text-red-300 transition">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
            </div>
        </div>
    `).join('');

    lucide.createIcons();
}

function changeUVVisSpectrumColor(id, color) {
    const spec = uvvisSpectraList.find(s => s.id === id);
    if (spec) {
        spec.color = color;
        updateUVVisPlot();
    }
}

function toggleUVVisSpectrumVisibility(id) {
    const spec = uvvisSpectraList.find(s => s.id === id);
    if (spec) {
        spec.visible = !spec.visible;
        updateUVVisSpectraUIList();
        updateUVVisPlot();
    }
}

function removeUVVisSpectrum(id) {
    uvvisSpectraList = uvvisSpectraList.filter(s => s.id !== id);
    updateUVVisSpectraUIList();
    processAndPlotUVVisData();
    showToast('Spektrum listeden kaldırıldı.');
}

function clearAllUVVisSpectra() {
    uvvisSpectraList = [];
    updateUVVisSpectraUIList();
    processAndPlotUVVisData();
    showToast('Tüm UV-Vis spektrumları temizlendi.');
}

// Çift Sütunlu Klorofil A & B Örnek Verisi
function loadUVVisSampleData() {
    const sampleX1 = [];
    const sampleY1 = [];
    const sampleX2 = [];
    const sampleY2 = [];

    // Klorofil A
    for (let nm = 220; nm <= 750; nm += 1) {
        sampleX1.push(nm);
        let a = 0.04 + (Math.random() - 0.5) * 0.02;
        a += 0.85 * Math.exp(-Math.pow((nm - 260) / 20, 2)); // Soret UV
        a += 1.25 * Math.exp(-Math.pow((nm - 430) / 25, 2)); // Soret bandı (Mavi)
        a += 0.35 * Math.exp(-Math.pow((nm - 580) / 30, 2)); // Qx bandı
        a += 1.45 * Math.exp(-Math.pow((nm - 662) / 18, 2)); // Qy bandı (Kırmızı)
        sampleY1.push(Math.max(0, a));
    }

    // Klorofil B
    for (let nm = 220; nm <= 750; nm += 1) {
        sampleX2.push(nm);
        let b = 0.03 + (Math.random() - 0.5) * 0.02;
        b += 0.70 * Math.exp(-Math.pow((nm - 275) / 22, 2)); // UV
        b += 1.55 * Math.exp(-Math.pow((nm - 455) / 22, 2)); // Soret bandı (Mavi shift)
        b += 0.40 * Math.exp(-Math.pow((nm - 595) / 30, 2)); // Qx bandı
        b += 1.10 * Math.exp(-Math.pow((nm - 642) / 18, 2)); // Qy bandı (Kırmızı)
        sampleY2.push(Math.max(0, b));
    }

    const mockCSVRows = [
        ['Dalga Boyu (nm)', 'Klorofil_A_Absorbans', 'Dalga Boyu (nm)', 'Klorofil_B_Absorbans']
    ];

    const maxLen = Math.max(sampleX1.length, sampleX2.length);
    for (let i = 0; i < maxLen; i++) {
        mockCSVRows.push([
            sampleX1[i] !== undefined ? sampleX1[i] : '',
            sampleY1[i] !== undefined ? sampleY1[i] : '',
            sampleX2[i] !== undefined ? sampleX2[i] : '',
            sampleY2[i] !== undefined ? sampleY2[i] : ''
        ]);
    }

    processUVVisParsedCSV(mockCSVRows, 'Klorofil_A_ve_B_Spektrumu.csv');
}
