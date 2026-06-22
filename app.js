let plantsDb = {};

async function initApp() {
    const btn = document.getElementById('analyzeBtn');
    const selector = document.getElementById('plantName');
    btn.innerText = "Initializing Engine...";
    btn.disabled = true;

    try {
        const response = await fetch('plants.json');
        plantsDb = await response.json();
        
        // 1. Clear the "Loading..." placeholder
        selector.innerHTML = '<option value="" disabled selected>Choose a crop or flower...</option>';
        
        // 2. Automatically map all keys from the database into the dropdown
        Object.keys(plantsDb).forEach(plantKey => {
            const option = document.createElement('option');
            option.value = plantKey;
            // Capitalize the first letter for a clean presentation look
            option.innerText = plantKey.charAt(0).toUpperCase() + plantKey.slice(1);
            selector.appendChild(option);
        });

    } catch (e) {
        console.error("Database fetch missing.", e);
        selector.innerHTML = '<option value="" disabled selected>Error loading options</option>';
    }

    btn.innerText = "Analyze Environment";
    btn.disabled = false;
}

initApp();

document.getElementById('analyzeBtn').addEventListener('click', function() {
    const rawInput = document.getElementById('plantName').value;
    const temp = parseFloat(document.getElementById('temperature').value);
    const hum = parseFloat(document.getElementById('humidity').value);
    const advice = document.getElementById('aiAdvice');
    const resultCard = document.getElementById('resultCard');

    if (!rawInput || isNaN(temp) || isNaN(hum)) {
        alert("Please select a plant variety and fill environmental bounds!");
        return;
    }

    let profile = plantsDb[rawInput];

    if (!profile) {
        resultCard.classList.remove('hidden');
        document.querySelector('.gauge-wrapper').style.display = 'none';
        advice.innerHTML = `<span class="error-state">❌ Crop or fruit profile not found.</span>`;
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
