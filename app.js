let plantsDb = {};

async function initApp() {
    const btn = document.getElementById('analyzeBtn');
    btn.innerText = "Initializing Engine...";
    btn.disabled = true;

    try {
        const response = await fetch('plants.json');
        plantsDb = await response.json();
    } catch (e) {
        console.error("Database fetch missing. Loading hardcoded profile fallbacks.", e);
        plantsDb = { 
            "hazelnut": { "min_temp": 12, "max_temp": 28, "min_hum": 40, "max_hum": 70 },
            "blueberry": { "min_temp": 15, "max_temp": 26, "min_hum": 50, "max_hum": 75 }
        };
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

    // Direct Lookup Validation
    let profile = plantsDb[rawInput];

    // CROP NOT FOUND INTERCEPT STATE
    if (!profile) {
        resultCard.classList.remove('hidden');
        // Hide gauge display for missing entries
        document.querySelector('.gauge-wrapper').style.display = 'none';
        advice.innerHTML = `<span class="error-state">❌ Crop or fruit profile not found.</span><br><br>We couldn't locate data parameters for "${rawInput}". Please check the spelling or try regional staples like Hazelnut, Mocvi, Mandarini, or Saperavi.`;
        return;
    }

    // Show gauge back if it was hidden by an error state earlier
    document.querySelector('.gauge-wrapper').style.display = 'flex';

    let score = 100;
    let alerts = [];

    // Diagnostic algorithm tracking
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

    // Compile presentation descriptions
    let narrative = "";
    if (score >= 85) {
        narrative = `📊 **Optimal Health:** The greenhouse atmosphere is perfectly customized for **${rawInput.toUpperCase()}**. Growth conditions are thriving.`;
    } else {
        narrative = `⚠️ **Stress Warning:** Unfavorable parameters detected for **${rawInput.toUpperCase()}** cultivation due to **${alerts.join(" and ")}**. Check physical hardware infrastructure.`;
    }

    advice.innerHTML = narrative;
    resultCard.classList.remove('hidden');
    
    // Trigger smooth transition animations
    animateGauge(score);
});

// Smooth Animated Gauge Function
function animateGauge(targetScore) {
    const fill = document.getElementById('gaugeFill');
    const txtValue = document.getElementById('scoreValue');
    
    // 1. Compute CSS Turn values (0% = 0turn, 100% = 0.5turn for semi-circle)
    const turnRotation = (targetScore / 100) * 0.5;
    fill.style.transform = `rotate(${turnRotation}turn)`;

    // 2. Set structural warning color profiles along transition boundaries
    if (targetScore < 50) fill.style.backgroundColor = "#ef4444"; // Vivid Red
    else if (targetScore < 80) fill.style.backgroundColor = "#f59e0b"; // Clean Amber
    else fill.style.backgroundColor = "#10b981"; // Emerald Green

    // 3. Increment text values dynamically instead of snapping instantly
    let currentCount = 0;
    txtValue.innerText = currentCount;
    
    // Clear any dangling interval loops if user hits button continuously
    if(window.gaugeInterval) clearInterval(window.gaugeInterval);

    if(targetScore === 0) return;

    window.gaugeInterval = setInterval(() => {
        currentCount++;
        txtValue.innerText = currentCount;
        if (currentCount >= targetScore) {
            clearInterval(window.gaugeInterval);
        }
    }, 1200 / targetScore); // Dynamically synchronizes speed to match CSS transitions safely
}
