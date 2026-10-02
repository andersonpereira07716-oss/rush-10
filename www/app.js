document.addEventListener("DOMContentLoaded", () => {
    const startScreen = document.getElementById("start-screen");
    const shopScreen = document.getElementById("shop-screen");
    const missionsScreen = document.getElementById("missions-screen");
    const gameScreen = document.getElementById("game-screen");
    const gameOverScreen = document.getElementById("gameover-screen");
    
    const btnPlay = document.getElementById("btn-play");
    const btnShop = document.getElementById("btn-shop");
    const btnMissions = document.getElementById("btn-missions");
    const btnSound = document.getElementById("btn-sound");
    const btnBackShop = document.getElementById("btn-back-shop");
    const btnBackMissions = document.getElementById("btn-back-missions");
    const btnRestart = document.getElementById("btn-restart");
    const btnMenu = document.getElementById("btn-menu");

    const gameArea = document.getElementById("game-area");
    const player = document.getElementById("player");
    const scoreDisplay = document.getElementById("score-display");
    const coinsDisplay = document.getElementById("coins-display");
    const shieldDisplay = document.getElementById("shield-display");
    const shopCoinsEl = document.getElementById("shop-coins");

    const finalScoreEl = document.getElementById("final-score");
    const bestScoreEl = document.getElementById("best-score");
    const finalCoinsEl = document.getElementById("final-coins");

    const m1Status = document.getElementById("m1-status");
    const m2Status = document.getElementById("m2-status");

    let isPlaying = false;
    let soundEnabled = localStorage.getItem("rush10_sound") !== "false";
    let score = 0;
    let coins = parseInt(localStorage.getItem("rush10_coins")) || 0;
    let bestScore = parseInt(localStorage.getItem("rush10_best")) || 0;
    let currentSkin = localStorage.getItem("rush10_skin") || "default";
    let ownedSkins = JSON.parse(localStorage.getItem("rush10_owned")) || ["default"];
    
    // Conquistas
    let mission1Done = localStorage.getItem("rush10_m1") === "true";
    let mission2Done = localStorage.getItem("rush10_m2") === "true";

    let hasShield = false;
    let shieldTimer = null;
    let playerX = 0;
    let gameItems = [];
    let frameCount = 0;
    let gameSpeed = 4;

    updateSoundButton();
    updateUI();
    applyPlayerSkin();
    updateMissionsUI();

    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    function playSound(type) {
        if (!soundEnabled) return;
        if (audioCtx.state === 'suspended') audioCtx.resume();

        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        const now = audioCtx.currentTime;

        if (type === 'coin') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            osc.start(now);
            osc.stop(now + 0.15);
        } else if (type === 'shield') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.2);
            gainNode.gain.setValueAtTime(0.25, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
            osc.start(now);
            osc.stop(now + 0.25);
        } else if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, now);
            osc.frequency.linearRampToValueAtTime(50, now + 0.3);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
        } else if (type === 'click') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(400, now);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    }

    btnSound.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        localStorage.setItem("rush10_sound", soundEnabled);
        updateSoundButton();
        playSound('click');
    });

    function updateSoundButton() {
        btnSound.textContent = soundEnabled ? "SOM: LIGADO" : "SOM: DESLIGADO";
    }

    btnPlay.addEventListener("click", () => {
        playSound('click');
        startScreen.classList.remove("active");
        gameScreen.classList.add("active");
        startGame();
    });

    btnShop.addEventListener("click", () => {
        playSound('click');
        startScreen.classList.remove("active");
        shopScreen.classList.add("active");
        updateShopUI();
    });

    btnMissions.addEventListener("click", () => {
        playSound('click');
        startScreen.classList.remove("active");
        missionsScreen.classList.add("active");
        updateMissionsUI();
    });

    btnBackShop.addEventListener("click", () => {
        playSound('click');
        shopScreen.classList.remove("active");
        startScreen.classList.add("active");
        updateUI();
    });

    btnBackMissions.addEventListener("click", () => {
        playSound('click');
        missionsScreen.classList.remove("active");
        startScreen.classList.add("active");
        updateUI();
    });

    btnRestart.addEventListener("click", () => {
        playSound('click');
        gameOverScreen.classList.remove("active");
        gameScreen.classList.add("active");
        startGame();
    });

    btnMenu.addEventListener("click", () => {
        playSound('click');
        gameOverScreen.classList.remove("active");
        startScreen.classList.add("active");
        updateUI();
    });

    function updateMissionsUI() {
        if (score >= 300 && !mission1Done) {
            mission1Done = true;
            localStorage.setItem("rush10_m1", "true");
            coins += 5;
        }
        if (coins >= 10 && !mission2Done) {
            mission2Done = true;
            localStorage.setItem("rush10_m2", "true");
            coins += 10;
        }

        m1Status.textContent = mission1Done ? "CONCLUÍDO (+5 🪙)" : "PENDENTE";
        m1Status.className = mission1Done ? "mission-badge completed" : "mission-badge";

        m2Status.textContent = mission2Done ? "CONCLUÍDO (+10 🪙)" : "PENDENTE";
        m2Status.className = mission2Done ? "mission-badge completed" : "mission-badge";
        updateUI();
    }

    const skinItemsElements = document.querySelectorAll(".skin-item");
    skinItemsElements.forEach(item => {
        const skinName = item.getAttribute("data-skin");
        const price = parseInt(item.getAttribute("data-price"));
        const btnBuy = item.querySelector(".btn-buy");

        btnBuy.addEventListener("click", () => {
            playSound('click');
            if (ownedSkins.includes(skinName)) {
                currentSkin = skinName;
                localStorage.setItem("rush10_skin", currentSkin);
                applyPlayerSkin();
                updateShopUI();
            } else {
                if (coins >= price) {
                    coins -= price;
                    ownedSkins.push(skinName);
                    currentSkin = skinName;
                    localStorage.setItem("rush10_coins", coins);
                    localStorage.setItem("rush10_owned", JSON.stringify(ownedSkins));
                    localStorage.setItem("rush10_skin", currentSkin);
                    applyPlayerSkin();
                    updateShopUI();
                    updateUI();
                } else {
                    alert("Moedas insuficientes!");
                }
            }
        });
    });

    function updateShopUI() {
        shopCoinsEl.textContent = `🪙 ${coins}`;
        skinItemsElements.forEach(item => {
            const skinName = item.getAttribute("data-skin");
            const btnBuy = item.querySelector(".btn-buy");
            if (currentSkin === skinName) {
                btnBuy.textContent = "EM USO";
                btnBuy.className = "btn-buy select";
            } else if (ownedSkins.includes(skinName)) {
                btnBuy.textContent = "USAR";
                btnBuy.className = "btn-buy owned";
            } else {
                btnBuy.textContent = "COMPRAR";
                btnBuy.className = "btn-buy";
            }
        });
    }

    function applyPlayerSkin() {
        player.className = `skin-${currentSkin}`;
    }

    function updateUI() {
        coinsDisplay.textContent = `🪙 ${coins}`;
        localStorage.setItem("rush10_coins", coins);
    }

    function startGame() {
        gameItems.forEach(item => item.element.remove());
        gameItems = [];

        isPlaying = true;
        score = 0;
        frameCount = 0;
        gameSpeed = 4;
        hasShield = false;
        player.classList.remove("shielded");
        shieldDisplay.style.display = "none";
        scoreDisplay.textContent = `Pontos: 0`;

        const gameWidth = gameArea.clientWidth;
        playerX = (gameWidth / 2) - (player.clientWidth / 2);
        player.style.left = `${playerX}px`;

        requestAnimationFrame(gameLoop);
    }

    function spawnItem(type) {
        const gameWidth = gameArea.clientWidth;
        let size = 35;
        if (type === 'obstacle') size = 45;
        if (type === 'shield') size = 38;

        const randomX = Math.random() * (gameWidth - size);

        const element = document.createElement("div");
        if (type === 'obstacle') element.classList.add('obstacle');
        else if (type === 'coin') element.classList.add('coin');
        else if (type === 'shield') {
            element.classList.add('shield-power');
            element.textContent = '🛡️';
        }

        element.style.left = `${randomX}px`;
        element.style.top = `-50px`;
        gameArea.appendChild(element);

        gameItems.push({
            type: type,
            element: element,
            x: randomX,
            y: -50,
            width: size,
            height: size
        });
    }

    function gameOver() {
        isPlaying = false;
        playSound('hit');
        const finalScoreVal = Math.floor(score / 10);

        if (finalScoreVal > bestScore) {
            bestScore = finalScoreVal;
            localStorage.setItem("rush10_best", bestScore);
        }

        finalScoreEl.textContent = finalScoreVal;
        bestScoreEl.textContent = bestScore;
        finalCoinsEl.textContent = coins;

        updateMissionsUI();

        gameScreen.classList.remove("active");
        gameOverScreen.classList.add("active");
    }

    function gameLoop() {
        if (!isPlaying) return;

        frameCount++;
        score += 1;
        scoreDisplay.textContent = `Pontos: ${Math.floor(score / 10)}`;

        if (frameCount % 300 === 0) gameSpeed += 0.5;

        if (frameCount % 60 === 0) spawnItem('obstacle');
        if (frameCount % 90 === 0) spawnItem('coin');
        if (frameCount % 250 === 0) spawnItem('shield');

        const playerRect = {
            x: playerX,
            y: gameArea.clientHeight - 90,
            width: player.clientWidth,
            height: player.clientHeight
        };

        for (let i = gameItems.length - 1; i >= 0; i--) {
            let item = gameItems[i];
            item.y += gameSpeed;
            item.element.style.top = `${item.y}px`;

            if (
                item.x < playerRect.x + playerRect.width &&
                item.x + item.width > playerRect.x &&
                item.y < playerRect.y + playerRect.height &&
                item.y + item.height > playerRect.y
            ) {
                if (item.type === 'obstacle') {
                    if (hasShield) {
                        hasShield = false;
                        player.classList.remove("shielded");
                        shieldDisplay.style.display = "none";
                        playSound('hit');
                        item.element.remove();
                        gameItems.splice(i, 1);
                        continue;
                    } else {
                        gameOver();
                        return;
                    }
                } else if (item.type === 'coin') {
                    coins += 1;
                    playSound('coin');
                    updateUI();
                    item.element.remove();
                    gameItems.splice(i, 1);
                    continue;
                } else if (item.type === 'shield') {
                    hasShield = true;
                    player.classList.add("shielded");
                    shieldDisplay.style.display = "inline";
                    playSound('shield');
                    item.element.remove();
                    gameItems.splice(i, 1);
                    continue;
                }
            }

            if (item.y > gameArea.clientHeight) {
                item.element.remove();
                gameItems.splice(i, 1);
            }
        }

        requestAnimationFrame(gameLoop);
    }

    function movePlayer(clientX) {
        if (!isPlaying) return;
        const rect = gameArea.getBoundingClientRect();
        let x = clientX - rect.left - (player.clientWidth / 2);

        const minX = 0;
        const maxX = gameArea.clientWidth - player.clientWidth;

        if (x < minX) x = minX;
        if (x > maxX) x = maxX;

        playerX = x;
        player.style.left = `${playerX}px`;
    }

    gameArea.addEventListener("touchmove", (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        movePlayer(touch.clientX);
    }, { passive: false });

    gameArea.addEventListener("touchstart", (e) => {
        const touch = e.touches[0];
        movePlayer(touch.clientX);
    });

    gameArea.addEventListener("mousemove", (e) => {
        if (e.buttons === 1) movePlayer(e.clientX);
    });
});
