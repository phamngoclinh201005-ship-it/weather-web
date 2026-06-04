const button = document.getElementById("searchBtn");
const canvas = document.getElementById('rainCanvas');
const ctx = canvas.getContext('2d');
let animationFrameId;
let elements = []; // Mảng đa năng chứa giọt mưa, hạt nắng hoặc mây bồng bềnh
let currentEffect = ""; // Trạng thái hiệu ứng hiện tại: "Rain", "Clear", "Clouds"

// 1. Xử lý sự kiện khi nhấn nút Tìm kiếm
button.onclick = async function () {
    const city = document.getElementById("cityInput").value.trim();
    const apiKey = "73bddda4cb5b1cfe221b29a95965481b";
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=vi`;

    if (!city) {
        alert("Vui lòng nhập tên thành phố!");
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Không tìm thấy thành phố này rồi!");

        const data = await response.json();
        const weatherMain = data.weather[0].main;

        // TỰ ĐỘNG ĐỔI NỀN VÀ KÍCH HOẠT HIỆU ỨNG CANVAS THEO THỜI TIẾT
        if (weatherMain === "Rain" || weatherMain === "Drizzle" || weatherMain === "Thunderstorm") {
            document.body.style.background = "linear-gradient(135deg, #2c3e50, #0f171e)";
            startEffect("Rain");
        } else if (weatherMain === "Clear") {
            document.body.style.background = "linear-gradient(135deg, #e65c00, #F9D423)";
            startEffect("Clear");
        } else if (weatherMain === "Clouds") {
            document.body.style.background = "linear-gradient(135deg, #57606f, #2f3542)";
            startEffect("Clouds");
        } else {
            document.body.style.background = "linear-gradient(135deg, #1f4068, #162447, #0f1a1c)";
            startEffect("None");
        }

        // Đổ dữ liệu ra HTML
        const iconCode = data.weather[0].icon;
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

        document.querySelector(".result").innerHTML = `
            <div class="weather-info">
                <h2 class="city-name">${data.name}, ${data.sys.country}</h2>
                <img src="${iconUrl}" alt="Thời tiết">
                <span class="temp-display">${Math.round(data.main.temp)}°C</span>
                <div class="weather-desc">${data.weather[0].description}</div>
                <div class="details-grid">
                    <div class="detail-item"><span>ĐỘ ẨM</span><p>${data.main.humidity}%</p></div>
                    <div class="detail-item"><span>TỐC ĐỘ GIÓ</span><p>${data.wind.speed} m/s</p></div>
                </div>
            </div>
        `;
    } catch (error) {
        document.querySelector(".result").innerHTML = `<p style="color: red;">${error.message}</p>`;
    }
};

// 2. Nhấn phím Enter để tìm kiếm
document.getElementById("cityInput").addEventListener("keypress", function (event) {
    if (event.key === "Enter") button.click();
});

// 3. HỆ THỐNG HIỆU ỨNG ĐA NĂNG (CANVAS ENGINE)
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initElements(); // Khởi tạo lại hạt khi đổi kích thước màn hình
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Khởi tạo các phần tử tùy theo loại thời tiết
function initElements() {
    elements = [];
    if (currentEffect === "Rain") {
        for (let i = 0; i < 120; i++) {
            elements.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vy: Math.random() * 4 + 7, // Tốc độ rơi thẳng đứng
                len: Math.random() * 20 + 10
            });
        }
    } else if (currentEffect === "Clear") {
        // Tạo các hạt nắng lung linh bay lơ lửng
        for (let i = 0; i < 40; i++) {
            elements.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: Math.random() * 0.4 - 0.2, // Bay ngang nhẹ
                vy: Math.random() * -0.5 - 0.2, // Bay lên trên nhẹ
                radius: Math.random() * 4 + 2,
                alpha: Math.random() * 0.5 + 0.1,
                speedAlpha: Math.random() * 0.01 + 0.005
            });
        }
    } else if (currentEffect === "Clouds") {
        // Tạo các khối mây mờ trôi chậm rãi
        for (let i = 0; i < 8; i++) {
            elements.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height * 0.7, // Tập trung ở nửa trên màn hình
                vx: Math.random() * 0.3 + 0.1, // Trôi từ trái sang phải
                radius: Math.random() * 100 + 150 // Khối mây siêu to
            });
        }
    }
}

// Hàm vẽ vòng lặp liên tục (Vẽ dựa trên trạng thái thời tiết)
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (currentEffect === "Rain") {
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        elements.forEach(p => {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x, p.y + p.len);
            ctx.stroke();
            p.y += p.vy;
            if (p.y > canvas.height) { p.y = -p.len; p.x = Math.random() * canvas.width; }
        });
    }
    else if (currentEffect === "Clear") {
        elements.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 200, ${p.alpha})`; // Hạt nắng vàng ấm mờ
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
            ctx.fill();
            ctx.shadowBlur = 0; // Reset shadow để không lag

            // Di chuyển
            p.x += p.vx;
            p.y += p.vy;
            p.alpha += p.speedAlpha;

            // Hiệu ứng nhấp nháy hòa tan
            if (p.alpha > 0.7 || p.alpha < 0.1) p.speedAlpha = -p.speedAlpha;
            if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
        });
    }
    else if (currentEffect === "Clouds") {
        elements.forEach(p => {
            // Tạo các khối mây dạng Gradient tròn nhạt dạt ngang
            let grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
            grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = grad;
            ctx.fill();

            // Mây trôi ngang qua phải
            p.x += p.vx;
            if (p.x - p.radius > canvas.width) p.x = -p.radius;
        });
    }

    animationFrameId = requestAnimationFrame(draw);
}

// Hàm kích hoạt hiệu ứng mới
function startEffect(effectName) {
    if (currentEffect === effectName) return; // Nếu đang chạy hiệu ứng đó rồi thì bỏ qua

    currentEffect = effectName;
    cancelAnimationFrame(animationFrameId);

    if (effectName !== "None") {
        document.body.classList.add('rainy-bg'); // Kích hoạt hiện canvas từ CSS
        initElements();
        draw();
    } else {
        document.body.classList.remove('rainy-bg');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}