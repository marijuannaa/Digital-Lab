/**
 * Dijital Laboratuvar - Bilimsel Hesaplayıcılar & Referans Kütüphanesi
 */

// Kapsamlı IR Korelasyon Veritabanı
const irCorrelationData = [
    { range: '3200 - 3650', bond: 'O-H (Alkol / Fenol)', type: 'Gerilme (Serbest / H-Bağlı)', intensity: 'Güçlü, Geniş', group: 'Alkoller, Fenoller' },
    { range: '2500 - 3300', bond: 'O-H (Karboksilik Asit)', type: 'Gerilme (Çok Geniş)', intensity: 'Çok Güçlü, Yayvan', group: 'Karboksilik Asitler' },
    { range: '3300 - 3500', bond: 'N-H (Primer / Sekonder Amin)', type: 'Gerilme (İki Tepe / Tek Tepe)', intensity: 'Orta, Keskin', group: 'Aminler, Amidler' },
    { range: '3000 - 3100', bond: '=C-H (Alken / Aromatik)', type: 'Gerilme', intensity: 'Orta-Zayıf', group: 'Alkenler, Aromatikler' },
    { range: '2850 - 2960', bond: 'C-H (Alkan CH2, CH3)', type: 'Simetrik / Asimetrik Gerilme', intensity: 'Güçlü-Orta', group: 'Alkanlar, Alifatik Zincirler' },
    { range: '2720 - 2820', bond: 'C-H (Aldehit - Fermi Çifti)', type: 'Çift Bant Gerilme', intensity: 'Zayıf-Orta (Karakteristik)', group: 'Aldehitler' },
    { range: '2200 - 2260', bond: 'C≡N (Nitril)', type: 'Gerilme', intensity: 'Orta-Güçlü, Keskin', group: 'Nitriller' },
    { range: '2100 - 2260', bond: 'C≡C (Alkin)', type: 'Gerilme (Uç / İç Alkin)', intensity: 'Değişken (Uç: Keskin)', group: 'Alkinler' },
    { range: '1735 - 1750', bond: 'C=O (Ester)', type: 'Karbonil Gerilmesi', intensity: 'Çok Güçlü', group: 'Esterler' },
    { range: '1720 - 1740', bond: 'C=O (Aldehit)', type: 'Karbonil Gerilmesi', intensity: 'Çok Güçlü', group: 'Aldehitler' },
    { range: '1705 - 1725', bond: 'C=O (Keton)', type: 'Karbonil Gerilmesi', intensity: 'Çok Güçlü', group: 'Ketonlar' },
    { range: '1700 - 1725', bond: 'C=O (Karboksilik Asit)', type: 'Karbonil Gerilmesi', intensity: 'Çok Güçlü', group: 'Karboksilik Asitler' },
    { range: '1640 - 1690', bond: 'C=O (Amid - Amid I)', type: 'Karbonil / C-N Gerilmesi', intensity: 'Çok Güçlü', group: 'Amidler' },
    { range: '1620 - 1680', bond: 'C=C (Alken)', type: 'Çift Bağ Gerilmesi', intensity: 'Değişken, Keskin', group: 'Alkenler' },
    { range: '1500 - 1600', bond: 'C=C (Aromatik Halka)', type: 'Halka İçi İskelet Titreşimi', intensity: 'Orta (Genelde 2-3 Tepe)', group: 'Aromatik Bileşikler' },
    { range: '1515 - 1560', bond: 'N-O (Nitro Asimetrik)', type: 'Asimetrik Gerilme', intensity: 'Güçlü', group: 'Nitro Bileşikleri (-NO2)' },
    { range: '1340 - 1385', bond: 'N-O (Nitro Simetrik)', type: 'Simetrik Gerilme', intensity: 'Güçlü', group: 'Nitro Bileşikleri (-NO2)' },
    { range: '1375 & 1450', bond: 'C-H (Metil / Metilen)', type: 'Bükülme Titreşimleri', intensity: 'Orta', group: 'Alkanlar' },
    { range: '1050 - 1300', bond: 'C-O (Alkol, Eter, Ester)', type: 'Tekli Bağ Gerilmesi', intensity: 'Güçlü', group: 'Oksijenli Fonksiyonel Gruplar' },
    { range: '690 - 900', bond: '=C-H (Aromatik Düzlem Dışı)', type: 'İkame Deseni (Orto/Meta/Para)', intensity: 'Güçlü', group: 'Aromatik Parmak İzi' },
    { range: '500 - 800', bond: 'C-Cl, C-Br (Haloalkan)', type: 'Karbon-Halojen Gerilmesi', intensity: 'Güçlü', group: 'Halojenli Bileşikler' }
];

function initCalculatorsModule() {
    renderIRCorrelationTable();
    initCalibrationPlot();
}

// 1. Beer-Lambert Kanunu Hesaplayıcısı (A = ε * b * c)
function calculateBeerLambert() {
    const calcTarget = document.getElementById('bl-calc-target')?.value || 'A';
    const aVal = parseFloat(document.getElementById('bl-absorbance')?.value);
    const epsVal = parseFloat(document.getElementById('bl-epsilon')?.value);
    const bVal = parseFloat(document.getElementById('bl-pathlength')?.value);
    const cVal = parseFloat(document.getElementById('bl-concentration')?.value);

    const resultBox = document.getElementById('bl-result-box');
    const resultText = document.getElementById('bl-result-text');

    let result = '';

    if (calcTarget === 'A') {
        if (isNaN(epsVal) || isNaN(bVal) || isNaN(cVal)) {
            showToast('Lütfen ε, b ve c değerlerini eksiksiz girin.', 'warning');
            return;
        }
        const a = epsVal * bVal * cVal;
        result = `Absorbans (A) = <strong>${a.toFixed(4)}</strong>`;
    } else if (calcTarget === 'c') {
        if (isNaN(aVal) || isNaN(epsVal) || isNaN(bVal) || epsVal === 0 || bVal === 0) {
            showToast('Lütfen A, ε ve b değerlerini eksiksiz girin.', 'warning');
            return;
        }
        const c = aVal / (epsVal * bVal);
        result = `Konsantrasyon (c) = <strong>${c.toExponential(4)} M</strong> (${(c * 1000).toFixed(4)} mM)`;
    } else if (calcTarget === 'eps') {
        if (isNaN(aVal) || isNaN(bVal) || isNaN(cVal) || bVal === 0 || cVal === 0) {
            showToast('Lütfen A, b ve c değerlerini eksiksiz girin.', 'warning');
            return;
        }
        const eps = aVal / (bVal * cVal);
        result = `Molar Absorptivite (ε) = <strong>${eps.toFixed(2)} L·mol⁻¹·cm⁻¹</strong>`;
    } else if (calcTarget === 'b') {
        if (isNaN(aVal) || isNaN(epsVal) || isNaN(cVal) || epsVal === 0 || cVal === 0) {
            showToast('Lütfen A, ε ve c değerlerini eksiksiz girin.', 'warning');
            return;
        }
        const b = aVal / (epsVal * cVal);
        result = `Işık Yolu Uzunluğu (b) = <strong>${b.toFixed(3)} cm</strong> (${(b * 10).toFixed(2)} mm)`;
    }

    if (resultBox && resultText) {
        resultText.innerHTML = result;
        resultBox.classList.remove('hidden');
    }
}

// Kalibrasyon Eğrisi Hesaplayıcısı & Mini Plotly Grafiği
function initCalibrationPlot() {
    const chartDiv = document.getElementById('calibration-plot');
    if (!chartDiv) return;

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(15, 23, 42, 0.6)',
        margin: { l: 45, r: 25, t: 25, b: 45 },
        xaxis: { title: { text: 'Konsantrasyon (c)', font: { color: '#94a3b8', size: 11 } }, gridcolor: '#334155', tickfont: { color: '#94a3b8' } },
        yaxis: { title: { text: 'Absorbans (A)', font: { color: '#94a3b8', size: 11 } }, gridcolor: '#334155', tickfont: { color: '#94a3b8' } }
    };
    Plotly.newPlot('calibration-plot', [], layout, { responsive: true, displayModeBar: false });
}

function calculateCalibrationCurve() {
    const rawData = document.getElementById('cal-data-input')?.value.trim() || '';
    if (!rawData) {
        showToast('Lütfen kalibrasyon standartlarını girin.', 'warning');
        return;
    }

    const lines = rawData.split('\n');
    const xVals = [];
    const yVals = [];

    lines.forEach(line => {
        const parts = line.split(/[,\t;\s]+/).map(p => parseFloat(p.trim().replace(',', '.')));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            xVals.push(parts[0]);
            yVals.push(parts[1]);
        }
    });

    if (xVals.length < 2) {
        showToast('En az 2 geçerli (Konsantrasyon, Absorbans) noktası girilmelidir.', 'error');
        return;
    }

    // Doğrusal Regresyon (En Küçük Kareler Yöntemi - Linear Regression)
    const n = xVals.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += xVals[i];
        sumY += yVals[i];
        sumXY += xVals[i] * yVals[i];
        sumX2 += xVals[i] * xVals[i];
        sumY2 += yVals[i] * yVals[i];
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R^2 Determinasyon Katsayısı
    const rNumerator = (n * sumXY - sumX * sumY);
    const rDenominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = rDenominator !== 0 ? rNumerator / rDenominator : 0;
    const r2 = r * r;

    // Bilinmeyen Numune Konsantrasyonu (Opsiyonel)
    const unknownAbs = parseFloat(document.getElementById('cal-unknown-abs')?.value);
    let unknownConcText = '';
    if (!isNaN(unknownAbs) && slope !== 0) {
        const unkC = (unknownAbs - intercept) / slope;
        unknownConcText = `<br><span class="text-amber-400 font-semibold">Bilinmeyen Numune Konsantrasyonu (A=${unknownAbs}):</span> <strong>${unkC.toFixed(4)}</strong>`;
    }

    const summaryEl = document.getElementById('cal-regression-summary');
    if (summaryEl) {
        summaryEl.innerHTML = `
            <div class="text-xs space-y-1 text-slate-300">
                <p>Doğru Denklemi: <strong class="text-emerald-400 font-mono">y = ${slope.toFixed(4)}x ${intercept >= 0 ? '+ ' + intercept.toFixed(4) : '- ' + Math.abs(intercept).toFixed(4)}</strong></p>
                <p>Eğim (Epsilon • b): <strong class="font-mono text-white">${slope.toFixed(4)}</strong></p>
                <p>R² Korelasyonu: <strong class="font-mono ${r2 >= 0.99 ? 'text-emerald-400' : 'text-amber-400'}">${r2.toFixed(5)}</strong></p>
                ${unknownConcText}
            </div>
        `;
    }

    // Regresyon Doğrusu Noktaları
    const minX = Math.min(...xVals);
    const maxX = Math.max(...xVals);
    const lineX = [minX * 0.9, maxX * 1.1];
    const lineY = lineX.map(x => slope * x + intercept);

    const traces = [
        {
            x: xVals,
            y: yVals,
            mode: 'markers',
            name: 'Standartlar',
            marker: { color: '#6366f1', size: 9, symbol: 'circle' }
        },
        {
            x: lineX,
            y: lineY,
            mode: 'lines',
            name: 'Regresyon Doğrusu',
            line: { color: '#10b981', width: 2, dash: 'solid' }
        }
    ];

    if (!isNaN(unknownAbs) && slope !== 0) {
        const unkC = (unknownAbs - intercept) / slope;
        traces.push({
            x: [unkC],
            y: [unknownAbs],
            mode: 'markers',
            name: 'Bilinmeyen Numune',
            marker: { color: '#f59e0b', size: 11, symbol: 'diamond' }
        });
    }

    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(15, 23, 42, 0.65)',
        margin: { l: 50, r: 20, t: 20, b: 45 },
        showlegend: true,
        legend: { font: { color: '#94a3b8', size: 10 }, bgcolor: 'rgba(30, 41, 59, 0.7)' },
        xaxis: { title: { text: 'Konsantrasyon', font: { color: '#94a3b8', size: 11 } }, gridcolor: '#334155', tickfont: { color: '#94a3b8' } },
        yaxis: { title: { text: 'Absorbans (A)', font: { color: '#94a3b8', size: 11 } }, gridcolor: '#334155', tickfont: { color: '#94a3b8' } }
    };

    Plotly.react('calibration-plot', traces, layout);
    showToast('Kalibrasyon eğrisi hesaplandı!', 'success');
}

// 2. İnteraktif IR Korelasyon Tablosu
function renderIRCorrelationTable(query = '') {
    const tableBody = document.getElementById('ir-table-body');
    if (!tableBody) return;

    const filtered = irCorrelationData.filter(item => {
        const text = `${item.range} ${item.bond} ${item.type} ${item.intensity} ${item.group}`.toLowerCase();
        return text.includes(query.toLowerCase());
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-500 italic">Eşleşen bağ veya fonksiyonel grup bulunamadı.</td></tr>`;
        return;
    }

    tableBody.innerHTML = filtered.map(item => `
        <tr class="hover:bg-slate-800/40 transition border-b border-slate-800/80 text-xs">
            <td class="p-2.5 font-mono text-amber-300 font-semibold whitespace-nowrap">${item.range} cm⁻¹</td>
            <td class="p-2.5 font-medium text-white">${item.bond}</td>
            <td class="p-2.5 text-slate-300">${item.type}</td>
            <td class="p-2.5 text-slate-400">${item.intensity}</td>
            <td class="p-2.5 text-indigo-300">${item.group}</td>
        </tr>
    `).join('');
}

function filterIRTable() {
    const query = document.getElementById('ir-table-search')?.value || '';
    renderIRCorrelationTable(query);
}

// 3. Spektroskopi Birim Dönüştürücü (nm <-> cm-1 <-> eV <-> THz <-> kJ/mol)
function convertSpectroscopyUnits(sourceUnit) {
    const c = 2.99792458e8; // Işık hızı m/s
    const h = 6.62607015e-34; // Planck sabiti J*s
    const eV_to_J = 1.602176634e-19;
    const NA = 6.02214076e23; // Avogadro

    const val = parseFloat(document.getElementById(`unit-${sourceUnit}`)?.value);
    if (isNaN(val) || val <= 0) return;

    let wavelength_m = 0; // Metre cinsinden dalga boyu

    if (sourceUnit === 'nm') {
        wavelength_m = val * 1e-9;
    } else if (sourceUnit === 'cm1') {
        // Dalga sayısı (cm-1) -> lambda = 1 / (cm-1 * 100)
        wavelength_m = 1 / (val * 100);
    } else if (sourceUnit === 'ev') {
        // E = hc / lambda -> lambda = hc / (E_eV * 1.602e-19)
        wavelength_m = (h * c) / (val * eV_to_J);
    } else if (sourceUnit === 'thz') {
        // f = c / lambda -> lambda = c / (f * 1e12)
        wavelength_m = c / (val * 1e12);
    }

    if (wavelength_m > 0) {
        const nm = wavelength_m * 1e9;
        const cm1 = 1 / (wavelength_m * 100);
        const thz = (c / wavelength_m) / 1e12;
        const ev = (h * c) / (wavelength_m * eV_to_J);
        const kjmol = (h * c * NA) / (wavelength_m * 1000);

        if (sourceUnit !== 'nm') document.getElementById('unit-nm').value = nm.toFixed(2);
        if (sourceUnit !== 'cm1') document.getElementById('unit-cm1').value = cm1.toFixed(2);
        if (sourceUnit !== 'thz') document.getElementById('unit-thz').value = thz.toFixed(2);
        if (sourceUnit !== 'ev') document.getElementById('unit-ev').value = ev.toFixed(4);
        if (sourceUnit !== 'kjmol') document.getElementById('unit-kjmol').value = kjmol.toFixed(2);
    }
}
