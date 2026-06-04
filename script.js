const button = document.getElementById("searchBtn");
const canvas = document.getElementById('rainCanvas');
const ctx = canvas.getContext('2d');
let animationFrameId;
let elements = [];
let currentEffect = "";

button.onclick = async function () {
    let city = document.getElementById("cityInput").value.trim();
    const apiKey = "73bddda4cb5b1cfe221b29a95965481b";

    if (!city) {
        alert("Vui lòng nhập tên thành phố!");
        return;
    }
    const tinhChinhCity = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (tinhChinhCity === "ho chi minh" || tinhChinhCity === "hcm" || tinhChinhCity === "sai gon") {
        city = "Saigon";
    }

    const urlToday = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=vi`;
    const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=vi`;

    try {
        // --- BƯỚC 1: XỬ LÝ THỜI TIẾT HÔM NAY ---
        const ketQuaHomNay = await fetch(urlToday);
        if (!ketQuaHomNay.ok) throw new Error("Không tìm thấy thành phố này rồi!");
        const dataToday = await ketQuaHomNay.json();

        const weatherMain = dataToday.weather[0].main;
        const iconCode = dataToday.weather[0].icon;
        const isDaytime = iconCode.endsWith('d');

        if (weatherMain === "Rain" || weatherMain === "Drizzle" || weatherMain === "Thunderstorm") {
            document.body.classList.remove('clear-night-bg');
            document.body.style.background = "linear-gradient(135deg, #2c3e50, #0f171e)";
            startEffect("Rain");
        }
        else if (weatherMain === "Clear") {
            if (isDaytime) {
                document.body.classList.remove('clear-night-bg');
                document.body.style.background = "linear-gradient(135deg, #2980b9, #6dd5fa, #ffffff)";
                startEffect("ClearDay");
            } else {
                document.body.classList.add('clear-night-bg');
                document.body.style.background = "linear-gradient(135deg, #0B1021, #121826, #1B263B)";
                startEffect("ClearNight");
            }
        }
        else if (weatherMain === "Clouds") {
            document.body.classList.remove('clear-night-bg');
            document.body.style.background = isDaytime ? "linear-gradient(135deg, #4b7bec, #a5b1c2)" : "linear-gradient(135deg, #57606f, #2f3542)";
            startEffect("Clouds");
        } else {
            document.body.classList.remove('clear-night-bg');
            document.body.style.background = "linear-gradient(135deg, #1f4068, #162447)";
            startEffect("None");
        }

        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        document.querySelector(".result").innerHTML = `
            <div class="weather-info">
                <h2 class="city-name">${dataToday.name}, ${dataToday.sys.country}</h2>
                <img src="${iconUrl}" alt="Thời tiết">
                <span class="temp-display">${Math.round(dataToday.main.temp)}°C</span>
                <div class="weather-desc">${dataToday.weather[0].description}</div>
                <div class="details-grid">
                    <div class="detail-item"><span>ĐỘ ẨM</span><p>${dataToday.main.humidity}%</p></div>
                    <div class="detail-item"><span>TỐC ĐỘ GIÓ</span><p>${dataToday.wind.speed} m/s</p></div>
                </div>
            </div>
        `;

        // --- BƯỚC 2: XỬ LÝ DỰ BÁO THEO GIỜ (ĐÃ SỬA MÚI GIỜ) ---
        const ketQuaDuBao = await fetch(urlForecast);
        if (!ketQuaDuBao.ok) throw new Error("Không lấy được dữ liệu dự báo!");
        const dataForecast = await ketQuaDuBao.json();

        const hourlyListHTML = document.getElementById("hourlyList");
        hourlyListHTML.innerHTML = "";
        const hourlyData = dataForecast.list.slice(0, 8);

        // Lấy thông tin lệch múi giờ của thành phố đó so với giờ chuẩn UTC (tính bằng giây)
        const timezoneOffset = dataForecast.city.timezone;

        hourlyData.forEach((item, index) => {
            // Tính toán mốc thời gian chuẩn tại địa phương bằng cách cộng số giây chênh lệch
            const localTimestamp = item.dt + timezoneOffset;
            const timeObj = new Date(localTimestamp * 1000);

            // Sử dụng các hàm UTC (getUTCDate, getUTCHours) để loại bỏ hoàn toàn múi giờ Việt Nam trên thiết bị
            let displayTime = `${timeObj.getUTCHours()}h`;
            if (index === 0) displayTime = "Bây giờ";

            const iconHourUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;

            hourlyListHTML.innerHTML += `
                <div class="hourly-item">
                    <span class="hourly-time">${displayTime}</span>
                    <img src="${iconHourUrl}" alt="icon">
                    <span class="hourly-temp">${Math.round(item.main.temp)}°C</span>
                </div>
            `;
        });
        document.getElementById("hourlyBox").style.display = "block";

        // --- BƯỚC 3: XỬ LÝ DỰ BÁO 5 NGÀY TỚI ---
        const forecastListHTML = document.getElementById("forecastList");
        forecastListHTML.innerHTML = "";
        const dailyData = dataForecast.list.filter(item => item.dt_txt.includes("12:00:00"));

        dailyData.forEach(day => {
            const dateObj = new Date(day.dt * 1000);
            const options = { weekday: 'long', day: 'numeric', month: 'numeric' };
            const formattedDate = dateObj.toLocaleDateString('vi-VN', options);
            const iconDayUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}.png`;

            forecastListHTML.innerHTML += `
                <div class="forecast-item">
                    <div class="forecast-date">${formattedDate}</div>
                    <img src="${iconDayUrl}" alt="icon">
                    <div class="forecast-desc">${day.weather[0].description}</div>
                    <div class="forecast-temp">${Math.round(day.main.temp)}°C</div>
                </div>
            `;
        });
        document.getElementById("forecastBox").style.display = "block";

    } catch (error) {
        document.querySelector(".result").innerHTML = `<p style="color: red;">${error.message}</p>`;
        document.getElementById("hourlyBox").style.display = "none";
        document.getElementById("forecastBox").style.display = "none";
    }
};

document.getElementById("cityInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") button.click();
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initElements();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function initElements() {
    elements = [];
    if (currentEffect === "Rain") {
        for (let i = 0; i < 120; i++) {
            elements.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vy: Math.random() * 4 + 7, len: Math.random() * 20 + 10 });
        }
    }
    else if (currentEffect === "ClearDay") {
        for (let i = 0; i < 40; i++) {
            elements.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: Math.random() * 0.4 - 0.2, vy: Math.random() * -0.5 - 0.2, radius: Math.random() * 3 + 2, alpha: Math.random() * 0.5 + 0.1, speedAlpha: Math.random() * 0.01 + 0.005 });
        }
    }
    else if (currentEffect === "ClearNight") {
        for (let i = 0; i < 80; i++) {
            elements.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.8,
                radius: Math.random() * 1.5 + 0.5,
                alpha: Math.random() * 0.8 + 0.2,
                speedAlpha: Math.random() * 0.02 + 0.01
            });
        }
    }
    else if (currentEffect === "Clouds") {
        for (let i = 0; i < 8; i++) {
            elements.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height * 0.7, vx: Math.random() * 0.3 + 0.1, radius: Math.random() * 100 + 150 });
        }
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentEffect === "Rain") {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.4)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
        elements.forEach(p => {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x, p.y + p.len); ctx.stroke(); p.y += p.vy;
            if (p.y > canvas.height) { p.y = -p.len; p.x = Math.random() * canvas.width; }
        });
    }
    else if (currentEffect === "ClearDay") {
        elements.forEach(p => {
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = `rgba(255, 255, 200, ${p.alpha})`; ctx.shadowBlur = 15; ctx.shadowColor = "rgba(255, 255, 255, 0.5)"; ctx.fill(); ctx.shadowBlur = 0;
            p.x += p.vx; p.y += p.vy; p.alpha += p.speedAlpha;
            if (p.alpha > 0.7 || p.alpha < 0.1) p.speedAlpha = -p.speedAlpha;
            if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
        });
    }
    else if (currentEffect === "ClearNight") {
        elements.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
            ctx.fill();
            ctx.shadowBlur = 0;

            p.alpha += p.speedAlpha;
            if (p.alpha > 0.9 || p.alpha < 0.1) {
                p.speedAlpha = -p.speedAlpha;
            }
        });
    }
    else if (currentEffect === "Clouds") {
        elements.forEach(p => {
            let grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius); grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)'); grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)'); grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2); ctx.fillStyle = grad; ctx.fill(); p.x += p.vx;
            if (p.x - p.radius > canvas.width) p.x = -p.radius;
        });
    }
    animationFrameId = requestAnimationFrame(draw);
}

function startEffect(effectName) {
    if (currentEffect === effectName) return;
    currentEffect = effectName;
    cancelAnimationFrame(animationFrameId);
    if (effectName !== "None") {
        document.body.classList.add('rainy-bg'); initElements(); draw();
    } else {
        document.body.classList.remove('rainy-bg'); ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}
