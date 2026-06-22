let plantsDb = {};

async function initApp() {
    const btn = document.getElementById('analyzeBtn');
    btn.innerText = "Initializing Engine...";
    btn.disabled = true;

    // Hardcoded data profiles supporting quick plain text lookups
    const localFallback = {
        "hazelnut": { "min_temp": 12, "max_temp": 28, "min_hum": 40, "max_hum": 70 },
        "blueberry": { "min_temp": 15, "max_temp": 26, "min_hum": 50, "max_hum": 75 },
        "tangerine": { "min_temp": 16, "max_temp": 30, "min_hum": 55, "max_hum": 80 },
        "saperavi": { "min_temp": 16, "max_temp": 30, "min_hum": 35, "max_hum": 65 },
        "rhododendron": { "min_temp": 5, "max_temp": 22, "min_hum": 60, "max_hum": 85 },
        "snowdrop": { "min_temp": 2, "max_temp": 18, "min_hum": 50, "max_hum": 80 },
        "rose": { "min_temp": 15, "max_temp": 28, "min_hum": 50, "max_hum": 70 }
    };

    try {
        const response = await fetch('plants.json');
        if (!response.ok) throw new Error("File missing");
        plantsDb = await response.json();
    } catch (e) {
        console.warn("Local sandbox mode active. Loading local fallback records.");
        plantsDb = localFallback;
    }

    btn.innerText = "Analyze Environment";
    btn.disabled = false;
}

initApp();

document.getElementById('analyzeBtn').addEventListener('click', function() {
    const rawInput = document.getElementById('plantName').value.trim().toLowerCase();
    const temp = parseFloat(document.getElementById('temperature').value);
    const hum = parseFloat(document.getElementById('humidity').value);
    const advice = document.getElementById('aiAdvice');
    const resultCard = document.getElementById('resultCard');

    if (!rawInput || isNaN(temp) || isNaN(hum)) {
        alert("Please complete all configurations before assessing!");
        return;
    }

    let profile = plantsDb[rawInput];

    if (!profile) {
        resultCard.classList.remove('hidden');
        document.querySelector('.gauge-wrapper').style.display = 'none';
        advice.innerHTML = `<span class="error-state">❌ Crop or fruit profile not found.</span><br><br>We couldn't locate baseline properties for "${rawInput}". Try inputs like hazelnut, blueberry, tangerine, saperavi, rhododendron, snowdrop, or rose.`;
        return;
    }

    document.querySelector('.gauge-wrapper').style.display = 'flex';

    let score = 100;
    let alerts = [];

    if (temp < profile.min_temp) {
        score -= Math.min(45, (profile.min_temp - temp) * 5);
        alerts.push(`critical chill thresholds met`);
    } else if (temp > profile.max_temp) {
        score -= Math.min(40, (temp - profile.max_temp) * 4);
        alerts.push(`extreme heat limits breached`);
    }

    if (hum < profile.min_hum) {
        score -= Math.min(45, (profile.min_hum - hum) * 2.5);
        alerts.push(`dehydrated roots`);
    } else if (hum > profile.max_hum) {
        score -= Math.min(40, (hum - profile.max_hum) * 2);
        alerts.push(`waterlogged soils`);
    }

    score = Math.max(0, Math.round(score));

    let narrative = "";
    if (score >= 85) {
        narrative = `📊 **Optimal Health:** The greenhouse atmosphere is perfectly customized for **${rawInput.toUpperCase()}**. Growth conditions are thriving.`;
    } else {
        narrative = `⚠️ **Stress Warning:** Unfavorable parameters detected for **${rawInput.toUpperCase()}** cultivation due to **${alerts.join(" and ")}**. Check physical hardware infrastructure.`;
    }

    advice.innerHTML = narrative;
    resultCard.classList.remove('hidden');
    
    animateGauge(score);
});

function animateGauge(targetScore) {
    const fill = document.getElementById('gaugeFill');
    const txtValue = document.getElementById('scoreValue');
    
    const turnRotation = (targetScore / 100) * 0.5;
    fill.style.transform = `rotate(${turnRotation}turn)`;

    if (targetScore < 50) fill.style.backgroundColor = "#ef4444"; 
    else if (targetScore < 80) fill.style.backgroundColor = "#f59e0b"; 
    else fill.style.backgroundColor = "#10b981"; 

    let currentCount = 0;
    txtValue.innerText = currentCount;
    
    if(window.gaugeInterval) clearInterval(window.gaugeInterval);
    if(targetScore === 0) return;

    window.gaugeInterval = setInterval(() => {
        currentCount++;
        txtValue.innerText = currentCount;
        if (currentCount >= targetScore) {
            clearInterval(window.gaugeInterval);
        }
    }, 1200 / targetScore); 
}
