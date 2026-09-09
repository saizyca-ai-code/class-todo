/**
 * MEGA CLONE - 2D 橫向平台動作射擊遊戲 (Phaser 3)
 */

// ==========================================
// 1. 8-Bit Web Audio 合成音效引擎 (零外部依賴)
// ==========================================
class SoundFX {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, type, duration, startVol = 0.2, endVol = 0.01, freqEnd = null) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const now = this.ctx.currentTime;

            osc.type = type;
            osc.frequency.setValueAtTime(freq, now);
            if (freqEnd !== null) {
                osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), now + duration);
            }

            gain.gain.setValueAtTime(startVol, now);
            gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, endVol), now + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + duration);
        } catch (e) { }
    }

    shoot() {
        this.init();
        this.playTone(880, 'square', 0.12, 0.25, 0.01, 220);
    }

    jump() {
        this.init();
        this.playTone(220, 'square', 0.18, 0.2, 0.01, 580);
    }

    hit() {
        this.init();
        this.playTone(150, 'sawtooth', 0.2, 0.35, 0.01, 60);
    }

    explosion() {
        this.init();
        if (!this.ctx) return;
        try {
            const bufferSize = this.ctx.sampleRate * 0.3;
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.ctx.currentTime);
            filter.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3);

            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.ctx.destination);

            noise.start();
        } catch (e) { }
    }

    pickup() {
        this.init();
        const now = this.ctx ? this.ctx.currentTime : 0;
        this.playTone(523.25, 'triangle', 0.1, 0.25, 0.05);
        setTimeout(() => this.playTone(659.25, 'triangle', 0.1, 0.25, 0.05), 80);
        setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.25, 0.01), 160);
    }

    enemyShoot() {
        this.init();
        this.playTone(400, 'sawtooth', 0.15, 0.15, 0.01, 150);
    }

    victory() {
        this.init();
        const notes = [440, 554, 659, 880];
        notes.forEach((note, idx) => {
            setTimeout(() => this.playTone(note, 'square', 0.25, 0.3, 0.02), idx * 140);
        });
    }

    gameOver() {
        this.init();
        const notes = [400, 350, 300, 200];
        notes.forEach((note, idx) => {
            setTimeout(() => this.playTone(note, 'sawtooth', 0.3, 0.3, 0.02), idx * 180);
        });
    }

    letterBeep() {
        this.init();
        this.playTone(700, 'square', 0.05, 0.15, 0.01, 900);
    }

    confirm() {
        this.init();
        this.playTone(523.25, 'triangle', 0.08, 0.25, 0.05);
        setTimeout(() => this.playTone(1046.5, 'square', 0.18, 0.25, 0.01), 60);
    }
}

const sfx = new SoundFX();

// ==========================================
// 1.5 街機歷史排行榜管理器 (localStorage)
// ==========================================
class ArcadeLeaderboard {
    static STORAGE_KEY = 'MEGA_CLONE_HIGH_SCORES_V1';

    static getDefaultScores() {
        return [
            { rank: 1, name: 'MEG', score: 4500, enemies: 12 },
            { rank: 2, name: 'ACE', score: 3200, enemies: 9 },
            { rank: 3, name: 'WIN', score: 2400, enemies: 7 },
            { rank: 4, name: 'PRO', score: 1800, enemies: 5 },
            { rank: 5, name: 'ZRO', score: 1200, enemies: 3 },
            { rank: 6, name: 'X01', score: 800,  enemies: 2 },
            { rank: 7, name: 'BOT', score: 400,  enemies: 1 }
        ];
    }

    static loadScores() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            }
        } catch (e) {
            console.warn('無法從 localStorage 讀取排行榜', e);
        }
        const defaults = this.getDefaultScores();
        this.saveScores(defaults);
        return defaults;
    }

    static saveScores(scores) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(scores));
        } catch (e) {
            console.warn('無法儲存至 localStorage', e);
        }
    }

    static addScore(name, score, enemies) {
        const scores = this.loadScores();
        const cleanName = (name || 'AAA').toUpperCase().slice(0, 3).padEnd(3, ' ');
        const newEntry = {
            name: cleanName,
            score: Math.max(0, score),
            enemies: Math.max(0, enemies),
            timestamp: Date.now()
        };
        scores.push(newEntry);
        // 按分數高至低排序，平手比擊殺數
        scores.sort((a, b) => b.score - a.score || b.enemies - a.enemies);
        // 保留前 7 名
        const topScores = scores.slice(0, 7).map((entry, idx) => ({
            ...entry,
            rank: idx + 1
        }));
        this.saveScores(topScores);
        // 判斷玩家的新紀錄是第幾名
        const userRankIndex = topScores.findIndex(e => e.name === newEntry.name && e.score === newEntry.score && e.timestamp === newEntry.timestamp);
        return {
            topScores,
            userRank: userRankIndex !== -1 ? userRankIndex + 1 : null
        };
    }

    static clearScores() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (e) {}
        return this.getDefaultScores();
    }
}



// ==========================================
// 2. 程序化動態產生像素貼圖 (零外部圖檔)
// ==========================================
function generateGameTextures(scene) {
    // 輔助繪圖函式：繪製像素漸層/色塊
    const rect = (ctx, color, x, y, w, h) => {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
    };

    // 1. 玩家 Idle 姿勢 (32x38)
    createCanvasTexture(scene, 'player_idle', 32, 38, (ctx) => {
        // 外框陰影
        rect(ctx, '#031940', 8, 2, 16, 17);
        // 頭盔主體 (金屬藍漸層)
        rect(ctx, '#0052cc', 9, 3, 14, 15);
        rect(ctx, '#1a75ff', 10, 4, 12, 6);
        rect(ctx, '#66a3ff', 11, 4, 8, 2); // 頂部高光
        // 頭頂青色裝飾線條
        rect(ctx, '#00e5ff', 13, 2, 6, 6);
        rect(ctx, '#ffffff', 14, 3, 4, 2);
        // 額頭金黃色核心徽章
        rect(ctx, '#ffcc00', 14, 8, 4, 4);
        rect(ctx, '#ffffff', 15, 9, 2, 2);

        // 臉部與大眼 (動漫風格)
        rect(ctx, '#031940', 14, 11, 9, 8);
        rect(ctx, '#fed7aa', 15, 12, 8, 7);
        rect(ctx, '#fde68a', 17, 13, 5, 4);
        rect(ctx, '#0f172a', 19, 13, 3, 5); // 瞳孔
        rect(ctx, '#38bdf8', 20, 14, 2, 3); // 虹膜
        rect(ctx, '#ffffff', 19, 13, 1, 2); // 眼神光

        // 耳部耳機/裝甲
        rect(ctx, '#003d99', 7, 8, 4, 8);
        rect(ctx, '#00d2ff', 8, 10, 2, 4);

        // 胸腹部裝甲 (青藍 + 能量核)
        rect(ctx, '#031940', 10, 18, 12, 9);
        rect(ctx, '#00d2ff', 11, 19, 10, 7);
        rect(ctx, '#a5f3fc', 13, 20, 6, 4);
        rect(ctx, '#ffffff', 15, 21, 2, 2); // 發光核心
        // 護肩
        rect(ctx, '#0052cc', 8, 19, 3, 6);
        rect(ctx, '#3385ff', 9, 20, 2, 4);

        // 洛克砲手部 (Mega Buster)
        rect(ctx, '#003d99', 21, 18, 8, 8);
        rect(ctx, '#0052cc', 22, 19, 7, 6);
        rect(ctx, '#00d2ff', 24, 20, 3, 4);
        rect(ctx, '#090d16', 28, 20, 2, 4); // 砲口
        rect(ctx, '#facc15', 27, 21, 1, 2); // 待機光點

        // 腰帶與內襯
        rect(ctx, '#0f172a', 11, 26, 10, 3);
        rect(ctx, '#facc15', 15, 26, 2, 2); // 金屬腰帶扣

        // 大腿與強力裝甲靴
        rect(ctx, '#031940', 8, 28, 6, 9);
        rect(ctx, '#031940', 18, 28, 6, 9);
        // 靴子主體
        rect(ctx, '#0052cc', 7, 29, 7, 8);
        rect(ctx, '#0052cc', 18, 29, 7, 8);
        rect(ctx, '#3385ff', 8, 30, 4, 5);
        rect(ctx, '#3385ff', 19, 30, 4, 5);
        // 靴底青色防滑墊與鋼邊
        rect(ctx, '#00d2ff', 6, 35, 9, 3);
        rect(ctx, '#00d2ff', 17, 35, 9, 3);
        rect(ctx, '#e0f2fe', 7, 35, 6, 1);
        rect(ctx, '#e0f2fe', 18, 35, 6, 1);
    });

    // 2. 玩家 Run 姿勢 1
    createCanvasTexture(scene, 'player_run_1', 32, 38, (ctx) => {
        // 沿用頭部與胸甲
        rect(ctx, '#0052cc', 9, 3, 14, 15);
        rect(ctx, '#1a75ff', 10, 4, 12, 6);
        rect(ctx, '#00e5ff', 13, 2, 6, 6);
        rect(ctx, '#ffcc00', 14, 8, 4, 4);
        rect(ctx, '#fed7aa', 15, 12, 8, 7);
        rect(ctx, '#0f172a', 19, 13, 3, 5);
        rect(ctx, '#38bdf8', 20, 14, 2, 3);
        rect(ctx, '#ffffff', 19, 13, 1, 2);
        rect(ctx, '#0052cc', 8, 19, 3, 6);
        rect(ctx, '#00d2ff', 11, 19, 10, 7);
        rect(ctx, '#ffffff', 15, 21, 2, 2);
        rect(ctx, '#0052cc', 21, 18, 8, 8);
        rect(ctx, '#090d16', 28, 20, 2, 4);
        rect(ctx, '#0f172a', 11, 26, 10, 3);
        // 跨步奔跑 (前跨腳與後擺腳)
        rect(ctx, '#0052cc', 4, 28, 7, 8);
        rect(ctx, '#00d2ff', 3, 34, 9, 3);
        rect(ctx, '#0052cc', 20, 27, 7, 8);
        rect(ctx, '#00d2ff', 20, 33, 9, 3);
    });

    // 3. 玩家 Run 姿勢 2
    createCanvasTexture(scene, 'player_run_2', 32, 38, (ctx) => {
        rect(ctx, '#0052cc', 9, 3, 14, 15);
        rect(ctx, '#1a75ff', 10, 4, 12, 6);
        rect(ctx, '#00e5ff', 13, 2, 6, 6);
        rect(ctx, '#ffcc00', 14, 8, 4, 4);
        rect(ctx, '#fed7aa', 15, 12, 8, 7);
        rect(ctx, '#0f172a', 19, 13, 3, 5);
        rect(ctx, '#38bdf8', 20, 14, 2, 3);
        rect(ctx, '#ffffff', 19, 13, 1, 2);
        rect(ctx, '#0052cc', 8, 19, 3, 6);
        rect(ctx, '#00d2ff', 11, 19, 10, 7);
        rect(ctx, '#ffffff', 15, 21, 2, 2);
        rect(ctx, '#0052cc', 21, 18, 8, 8);
        rect(ctx, '#090d16', 28, 20, 2, 4);
        rect(ctx, '#0f172a', 11, 26, 10, 3);
        // 反向跨步
        rect(ctx, '#0052cc', 20, 28, 7, 8);
        rect(ctx, '#00d2ff', 19, 34, 9, 3);
        rect(ctx, '#0052cc', 4, 27, 7, 8);
        rect(ctx, '#00d2ff', 3, 33, 9, 3);
    });

    // 4. 玩家 Jump 姿勢
    createCanvasTexture(scene, 'player_jump', 32, 38, (ctx) => {
        rect(ctx, '#0052cc', 9, 2, 14, 15);
        rect(ctx, '#1a75ff', 10, 3, 12, 6);
        rect(ctx, '#00e5ff', 13, 1, 6, 6);
        rect(ctx, '#ffcc00', 14, 7, 4, 4);
        rect(ctx, '#fed7aa', 15, 10, 8, 7);
        rect(ctx, '#0f172a', 19, 11, 3, 5);
        rect(ctx, '#38bdf8', 20, 12, 2, 3);
        rect(ctx, '#ffffff', 19, 11, 1, 2);
        rect(ctx, '#00d2ff', 11, 17, 10, 7);
        rect(ctx, '#ffffff', 15, 19, 2, 2);
        rect(ctx, '#0052cc', 22, 16, 8, 8);
        rect(ctx, '#090d16', 29, 18, 2, 4);
        // 屈膝騰空
        rect(ctx, '#0052cc', 6, 25, 8, 6);
        rect(ctx, '#00d2ff', 4, 29, 9, 5);
        rect(ctx, '#0052cc', 17, 25, 8, 6);
        rect(ctx, '#00d2ff', 17, 29, 9, 5);
        // 推進器火焰火花
        rect(ctx, '#38bdf8', 7, 35, 4, 3);
        rect(ctx, '#ffffff', 8, 35, 2, 2);
        rect(ctx, '#38bdf8', 19, 35, 4, 3);
        rect(ctx, '#ffffff', 20, 35, 2, 2);
    });

    // 5. 玩家 Shoot 射擊姿勢 (砲口發光與後座力)
    createCanvasTexture(scene, 'player_shoot', 38, 38, (ctx) => {
        rect(ctx, '#0052cc', 7, 3, 14, 15);
        rect(ctx, '#1a75ff', 8, 4, 12, 6);
        rect(ctx, '#00e5ff', 11, 2, 6, 6);
        rect(ctx, '#ffcc00', 12, 8, 4, 4);
        rect(ctx, '#fed7aa', 13, 11, 8, 7);
        rect(ctx, '#0f172a', 17, 12, 3, 5);
        rect(ctx, '#38bdf8', 18, 13, 2, 3);
        rect(ctx, '#ffffff', 17, 12, 1, 2);
        rect(ctx, '#00d2ff', 9, 18, 10, 7);
        rect(ctx, '#ffffff', 13, 20, 2, 2);
        // 前伸發射砲管
        rect(ctx, '#031940', 19, 18, 13, 9);
        rect(ctx, '#0052cc', 20, 19, 11, 7);
        rect(ctx, '#00d2ff', 24, 20, 4, 5);
        rect(ctx, '#090d16', 30, 20, 2, 5);
        // 砲口能量爆發光芒
        rect(ctx, '#fef08a', 31, 18, 4, 9);
        rect(ctx, '#ffffff', 32, 20, 5, 5);
        rect(ctx, '#38bdf8', 34, 17, 2, 11);

        rect(ctx, '#0052cc', 5, 28, 7, 9);
        rect(ctx, '#00d2ff', 4, 34, 8, 4);
        rect(ctx, '#0052cc', 16, 28, 7, 9);
        rect(ctx, '#00d2ff', 15, 34, 8, 4);
    });

    // 6. 能量彈 (檸檬光彈 + 電漿尾流)
    createCanvasTexture(scene, 'bullet', 18, 12, (ctx) => {
        // 外層青藍電漿暈
        ctx.fillStyle = '#00d2ff';
        ctx.beginPath();
        ctx.ellipse(9, 6, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // 亮黃色能量主體
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.ellipse(9, 6, 6, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // 極亮白核心
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(9, 6, 3.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    });

    // 7. 巡邏機器人 (經典立體光澤 Metool 安全帽怪)
    createCanvasTexture(scene, 'enemy_patrol', 30, 26, (ctx) => {
        // 安全帽底框與暗部
        rect(ctx, '#92400e', 4, 2, 22, 16);
        // 安全帽本體 (飽滿金黃色)
        rect(ctx, '#eab308', 5, 3, 20, 14);
        rect(ctx, '#facc15', 7, 4, 16, 6);
        rect(ctx, '#fef08a', 8, 4, 12, 2); // 頂部反光弧線
        // 安全帽護帽邊緣
        rect(ctx, '#ca8a04', 3, 14, 24, 4);
        rect(ctx, '#fde047', 4, 14, 22, 2);
        // 白色醫療/警示十字標誌
        rect(ctx, '#ffffff', 13, 4, 4, 8);
        rect(ctx, '#ffffff', 10, 6, 10, 4);
        // 深色面罩眼縫
        rect(ctx, '#090d16', 6, 17, 18, 6);
        // 數位青藍發光大眼
        rect(ctx, '#06b6d4', 9, 18, 4, 4);
        rect(ctx, '#ffffff', 10, 19, 2, 2);
        rect(ctx, '#06b6d4', 17, 18, 4, 4);
        rect(ctx, '#ffffff', 18, 19, 2, 2);
        // 綠色機械行軍腳掌
        rect(ctx, '#15803d', 4, 22, 7, 4);
        rect(ctx, '#22c55e', 5, 22, 5, 3);
        rect(ctx, '#15803d', 19, 22, 7, 4);
        rect(ctx, '#22c55e', 20, 22, 5, 3);
    });

    // 8. 飛行浮游砲 (紅蓮蜂鳥無人機 Flyer Drone)
    createCanvasTexture(scene, 'enemy_flyer', 28, 28, (ctx) => {
        // 機身裝甲 (暗紅底 + 鮮紅外殼)
        rect(ctx, '#7f1d1d', 7, 6, 14, 14);
        rect(ctx, '#dc2626', 8, 7, 12, 12);
        rect(ctx, '#ef4444', 9, 8, 10, 5);
        rect(ctx, '#fca5a5', 10, 8, 6, 2); // 金屬高光
        // 兩側機械翼
        rect(ctx, '#475569', 1, 9, 6, 5);
        rect(ctx, '#94a3b8', 2, 10, 4, 2);
        rect(ctx, '#475569', 21, 9, 6, 5);
        rect(ctx, '#94a3b8', 22, 10, 4, 2);
        // 中央發光單眼鏡頭
        rect(ctx, '#090d16', 10, 11, 8, 8);
        rect(ctx, '#00ffff', 11, 12, 6, 6);
        rect(ctx, '#ffffff', 13, 14, 2, 2);
        // 推進噴嘴與電漿尾焰
        rect(ctx, '#334155', 10, 20, 8, 3);
        rect(ctx, '#00d2ff', 12, 23, 4, 4);
        rect(ctx, '#ffffff', 13, 23, 2, 2);
    });

    // 9. 敵人子彈 (高溫電漿球)
    createCanvasTexture(scene, 'enemy_bullet', 12, 12, (ctx) => {
        ctx.fillStyle = '#ea580c';
        ctx.beginPath(); ctx.arc(6, 6, 5.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath(); ctx.arc(6, 6, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(6, 6, 1.5, 0, Math.PI * 2); ctx.fill();
    });

    // 10. 地面地磚 (科幻金屬電路方塊)
    createCanvasTexture(scene, 'tile_ground', 32, 32, (ctx) => {
        // 鈦金屬底盤
        rect(ctx, '#0b1329', 0, 0, 32, 32);
        rect(ctx, '#1e293b', 1, 1, 30, 30);
        // 頂部高光霓虹藍導光條
        rect(ctx, '#0284c7', 0, 0, 32, 4);
        rect(ctx, '#38bdf8', 0, 0, 32, 2);
        rect(ctx, '#ffffff', 4, 0, 24, 1);
        // 電路板紋路與金屬鉚釘
        rect(ctx, '#06b6d4', 6, 8, 2, 16);
        rect(ctx, '#06b6d4', 8, 14, 12, 2);
        rect(ctx, '#06b6d4', 20, 14, 2, 12);
        // 微型晶片指示燈
        rect(ctx, '#ef4444', 23, 9, 2, 2);
        rect(ctx, '#22c55e', 26, 9, 2, 2);
        // 角落鉚釘
        rect(ctx, '#64748b', 3, 5, 2, 2);
        rect(ctx, '#64748b', 27, 5, 2, 2);
        rect(ctx, '#64748b', 3, 27, 2, 2);
        rect(ctx, '#64748b', 27, 27, 2, 2);
    });

    // 11. 懸浮平台磚 (反重力力場鋼梁)
    createCanvasTexture(scene, 'tile_platform', 32, 16, (ctx) => {
        rect(ctx, '#090d16', 0, 0, 32, 16);
        rect(ctx, '#1e293b', 1, 1, 30, 12);
        // 頂部導光軌道
        rect(ctx, '#00d2ff', 0, 0, 32, 3);
        rect(ctx, '#ffffff', 6, 0, 20, 1);
        // 中間排氣槽
        rect(ctx, '#334155', 4, 5, 24, 4);
        rect(ctx, '#0f172a', 6, 6, 20, 2);
        // 底部反重力發光器
        rect(ctx, '#0284c7', 4, 13, 24, 2);
        rect(ctx, '#38bdf8', 8, 14, 16, 2);
    });

    // 12. 致命尖刺 (鍍鉻亮刃 + 警示底座)
    createCanvasTexture(scene, 'spike', 32, 24, (ctx) => {
        // 底座警示條
        rect(ctx, '#1e293b', 0, 18, 32, 6);
        rect(ctx, '#ef4444', 0, 18, 32, 2);
        rect(ctx, '#facc15', 2, 21, 5, 2);
        rect(ctx, '#facc15', 10, 21, 5, 2);
        rect(ctx, '#facc15', 18, 21, 5, 2);
        rect(ctx, '#facc15', 26, 21, 5, 2);
        // 4 根鍍鉻利刃
        for (let i = 0; i < 4; i++) {
            const bx = i * 8;
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.moveTo(bx, 18);
            ctx.lineTo(bx + 4, 2);
            ctx.lineTo(bx + 8, 18);
            ctx.fill();

            // 刀刃銀白反光面
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(bx + 1, 18);
            ctx.lineTo(bx + 4, 2);
            ctx.lineTo(bx + 4, 18);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(bx + 3, 10);
            ctx.lineTo(bx + 4, 2);
            ctx.lineTo(bx + 5, 10);
            ctx.fill();
        }
    });

    // 13. 補血膠囊 (晶透奈米生命藥劑)
    createCanvasTexture(scene, 'item_health', 24, 24, (ctx) => {
        // 外圍微光環
        ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
        ctx.beginPath(); ctx.arc(12, 12, 11, 0, Math.PI * 2); ctx.fill();
        // 藥劑外球
        ctx.fillStyle = '#15803d';
        ctx.beginPath(); ctx.arc(12, 12, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath(); ctx.arc(12, 12, 8, 0, Math.PI * 2); ctx.fill();
        // 高光球頂
        ctx.fillStyle = '#86efac';
        ctx.beginPath(); ctx.ellipse(12, 7, 5, 2.5, 0, 0, Math.PI * 2); ctx.fill();
        // 白色醫療十字
        rect(ctx, '#ffffff', 10, 6, 4, 12);
        rect(ctx, '#ffffff', 6, 10, 12, 4);
    });

    // 14. 傳送膠囊 / 終點傳送門 (Goal Portal)
    createCanvasTexture(scene, 'portal_goal', 48, 72, (ctx) => {
        // 鋼構外殼
        rect(ctx, '#0f172a', 2, 2, 44, 68);
        rect(ctx, '#1e293b', 4, 4, 40, 64);
        rect(ctx, '#334155', 6, 6, 36, 60);
        // 能量力場玻璃管
        rect(ctx, '#0369a1', 10, 10, 28, 52);
        rect(ctx, '#0284c7', 12, 12, 24, 48);
        rect(ctx, '#38bdf8', 14, 14, 20, 44);
        // 漩渦核心
        rect(ctx, '#ffffff', 18, 20, 12, 32);
        rect(ctx, '#a5f3fc', 16, 24, 16, 24);
        // 兩側發光能量導管柱
        rect(ctx, '#00d2ff', 4, 12, 3, 48);
        rect(ctx, '#00d2ff', 41, 12, 3, 48);
    });

    // 15. 粒子特效貼圖
    createCanvasTexture(scene, 'particle_spark', 6, 6, (ctx) => {
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(0, 0, 6, 6);
    });
}

function createCanvasTexture(scene, key, width, height, drawFn) {
    if (scene.textures.exists(key)) return;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx);
    scene.textures.addCanvas(key, canvas);
}


// ==========================================
// 3. 遊戲主場景 (GameScene)
// ==========================================
class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        // 嘗試載入高解析度賽博朋克背景
        this.load.image('cyberpunk_bg', 'assets/cyberpunk_background.jpg');
        generateGameTextures(this);
    }

    create() {
        this.cameras.main.setBackgroundColor('#090d16');

        // 世界尺寸 (長度 3200px)
        this.worldWidth = 3200;
        this.worldHeight = 500;
        this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

        // 狀態變數
        this.playerHP = 100;
        this.maxHP = 100;
        this.score = 0;
        this.enemiesDefeated = 0;
        this.totalEnemiesSpawned = 0;
        this.maxTotalEnemies = 100;
        this.isInvulnerable = false;
        this.isGameOver = false;
        this.isVictory = false;
        this.isEnteringName = false;
        this.canRestartWithR = false;
        this.lastShootTime = 0;
        this.shootCooldown = 180; // ms

        // 背景裝飾 (視差天際線)
        this.createBackground();

        // 建立群組
        this.platforms = this.physics.add.staticGroup();
        this.spikes = this.physics.add.staticGroup();
        this.items = this.physics.add.group();
        this.bullets = this.physics.add.group({ maxSize: 15 });
        this.enemyBullets = this.physics.add.group({ maxSize: 25 });
        this.patrolEnemies = this.physics.add.group();
        this.flyerEnemies = this.physics.add.group();

        // 建立關卡地形與敵人
        this.buildLevel();

        // 啟動定時在可站立位置生成敵人的機制 (總數最高100個)
        this.startEnemySpawner();

        // 建立玩家
        this.createPlayer();

        // 終點傳送門
        this.createGoalPortal();

        // 建立粒子系統
        this.createParticleEmitters();

        // 建立相機與 HUD
        this.setupCamera();
        this.createHUD();

        // 註冊輸入按鍵
        this.setupInputs();

        // 設定物理碰撞偵測
        this.setupCollisions();
    }

    createBackground() {
        // 若有載入生成的賽博朋克背景圖，建立視差滾動圖層
        if (this.textures.exists('cyberpunk_bg')) {
            for (let x = 0; x < this.worldWidth + 1000; x += 888) {
                const bg = this.add.image(x, 250, 'cyberpunk_bg');
                bg.setDisplaySize(889, 500);
                bg.setScrollFactor(0.15);
                bg.setDepth(-10);
            }
            // 底部暗部漸層增加平台反差與能見度
            const overlay = this.add.graphics();
            overlay.setScrollFactor(0);
            overlay.fillGradientStyle(0x090d16, 0x090d16, 0x090d16, 0x090d16, 0, 0, 0.45, 0.45);
            overlay.fillRect(0, 360, 800, 140);
            overlay.setDepth(-5);
            return;
        }

        // 預備方案：遠景科技都市線條
        const bgGraphics = this.add.graphics();
        bgGraphics.setScrollFactor(0.2);
        bgGraphics.fillStyle(0x131d2e, 1);

        for (let x = 0; x < this.worldWidth; x += 120) {
            const h = 100 + Math.sin(x) * 60 + (x % 50) * 2;
            bgGraphics.fillRect(x, this.worldHeight - h - 50, 90, h + 50);

            // 建築窗戶燈光
            bgGraphics.fillStyle(0x00d2ff, 0.2);
            for (let wy = this.worldHeight - h - 30; wy < this.worldHeight - 60; wy += 20) {
                bgGraphics.fillRect(x + 15, wy, 10, 10);
                bgGraphics.fillRect(x + 40, wy, 10, 10);
                bgGraphics.fillRect(x + 65, wy, 10, 10);
            }
            bgGraphics.fillStyle(0x131d2e, 1);
        }
    }

    buildLevel() {
        const createGroundSection = (startX, endX, y = 470) => {
            for (let x = startX; x < endX; x += 32) {
                const block = this.platforms.create(x + 16, y, 'tile_ground');
                block.refreshBody();
            }
        };

        const createPlatform = (x, y, count = 3) => {
            for (let i = 0; i < count; i++) {
                const p = this.platforms.create(x + i * 32 + 16, y, 'tile_platform');
                p.refreshBody();
            }
        };

        const createSpikeHazard = (startX, count = 2, y = 480) => {
            for (let i = 0; i < count; i++) {
                const sp = this.spikes.create(startX + i * 32 + 16, y, 'spike');
                sp.refreshBody();
                sp.body.setSize(28, 16);
                sp.body.setOffset(2, 8);
            }
        };

        // ====== 關卡分段設計 ======
        // 區域 1: 起步與基礎教學 (0 ~ 700)
        createGroundSection(0, 700);
        createPlatform(300, 360, 3);
        createPlatform(480, 290, 3);
        this.spawnPatrolEnemy(450, 430, 400, 680);
        this.spawnPatrolEnemy(500, 260, 480, 560);

        // 坑洞與尖刺 1 (700 ~ 900)
        createSpikeHazard(700, 6);
        createPlatform(730, 380, 2);
        createPlatform(830, 320, 2);
        this.spawnFlyerEnemy(820, 220);

        // 區域 2: 階梯平台跳躍 (900 ~ 1600)
        createGroundSection(900, 1600);
        createPlatform(1020, 360, 4);
        createPlatform(1200, 280, 3);
        createPlatform(1360, 200, 4);
        this.spawnHealthItem(1400, 160);
        this.spawnPatrolEnemy(1050, 430, 950, 1500);
        this.spawnPatrolEnemy(1040, 330, 1020, 1140);
        this.spawnFlyerEnemy(1280, 180);

        // 坑洞與尖刺 2 (1600 ~ 1850)
        createSpikeHazard(1600, 8);
        createPlatform(1640, 370, 2);
        createPlatform(1740, 300, 2);
        this.spawnFlyerEnemy(1700, 190);

        // 區域 3: 密集敵人突圍 (1850 ~ 2550)
        createGroundSection(1850, 2550);
        createPlatform(1950, 360, 3);
        createPlatform(2120, 290, 4);
        createPlatform(2320, 220, 3);
        this.spawnPatrolEnemy(1980, 430, 1880, 2200);
        this.spawnPatrolEnemy(2280, 430, 2150, 2500);
        this.spawnFlyerEnemy(2180, 180);
        this.spawnFlyerEnemy(2400, 150);
        this.spawnHealthItem(2350, 180);

        // 坑洞 3 (2550 ~ 2750)
        createSpikeHazard(2550, 6);
        createPlatform(2580, 350, 2);
        createPlatform(2680, 280, 2);

        // 區域 4: 終點大平台 (2750 ~ 3200)
        createGroundSection(2750, 3200);
        createPlatform(2850, 360, 3);
        this.spawnPatrolEnemy(2880, 430, 2780, 3100);
    }

    createPlayer() {
        this.player = this.physics.add.sprite(100, 400, 'player_idle');
        this.player.setCollideWorldBounds(true);
        this.player.setGravityY(820);
        this.player.body.setSize(20, 32);
        this.player.body.setOffset(4, 4);
        this.player.facingRight = true;
        this.player.isShooting = false;

        // 建立跑動動畫
        if (!this.anims.exists('player_run')) {
            this.anims.create({
                key: 'player_run',
                frames: [
                    { key: 'player_run_1' },
                    { key: 'player_idle' },
                    { key: 'player_run_2' },
                    { key: 'player_idle' }
                ],
                frameRate: 10,
                repeat: -1
            });
        }
    }

    createGoalPortal() {
        this.goalPortal = this.physics.add.sprite(3100, 420, 'portal_goal');
        this.goalPortal.setImmovable(true);
        this.goalPortal.body.setAllowGravity(false);

        // 傳送門微光動畫
        this.tweens.add({
            targets: this.goalPortal,
            alpha: 0.6,
            yoyo: true,
            repeat: -1,
            duration: 800
        });
    }

    spawnPatrolEnemy(x, y, minX, maxX) {
        if (this.totalEnemiesSpawned >= this.maxTotalEnemies) return null;
        this.totalEnemiesSpawned++;
        const enemy = this.patrolEnemies.create(x, y, 'enemy_patrol');
        enemy.setCollideWorldBounds(true);
        enemy.setGravityY(800);
        enemy.body.setSize(24, 20);
        enemy.body.setOffset(2, 4);
        enemy.hp = 2;
        enemy.minX = minX;
        enemy.maxX = maxX;
        enemy.setVelocityX(60);
        return enemy;
    }

    spawnFlyerEnemy(x, y) {
        if (this.totalEnemiesSpawned >= this.maxTotalEnemies) return null;
        this.totalEnemiesSpawned++;
        const enemy = this.flyerEnemies.create(x, y, 'enemy_flyer');
        enemy.body.setAllowGravity(false);
        enemy.body.setSize(22, 22);
        enemy.hp = 1;
        enemy.baseY = y;
        enemy.shootTimer = this.time.addEvent({
            delay: 2400 + Math.random() * 600,
            callback: () => this.flyerShoot(enemy),
            loop: true
        });
        return enemy;
    }

    // ==========================================
    // 敵人隨機定時生成機制 (最高100隻)
    // ==========================================
    startEnemySpawner() {
        // 可站立/行走的有效區域定義 (包含各區地面與各浮空平台)
        this.standableLocations = [
            { minX: 120, maxX: 650, y: 430, minP: 100, maxP: 680 },
            { minX: 950, maxX: 1550, y: 430, minP: 920, maxP: 1580 },
            { minX: 1900, maxX: 2500, y: 430, minP: 1860, maxP: 2530 },
            { minX: 2780, maxX: 3050, y: 430, minP: 2760, maxP: 3100 },
            // 各懸浮平台
            { minX: 300, maxX: 380, y: 320, minP: 300, maxP: 396 },
            { minX: 480, maxX: 560, y: 250, minP: 480, maxP: 576 },
            { minX: 1020, maxX: 1130, y: 320, minP: 1020, maxP: 1148 },
            { minX: 1200, maxX: 1280, y: 240, minP: 1200, maxP: 1296 },
            { minX: 1360, maxX: 1460, y: 160, minP: 1360, maxP: 1488 },
            { minX: 1950, maxX: 2030, y: 320, minP: 1950, maxP: 2046 },
            { minX: 2120, maxX: 2230, y: 250, minP: 2120, maxP: 2248 },
            { minX: 2320, maxX: 2400, y: 180, minP: 2320, maxP: 2416 },
            { minX: 2850, maxX: 2930, y: 320, minP: 2850, maxP: 2946 }
        ];

        // 每隔 3.2 秒在可站立位置隨機生成敵人
        this.enemySpawnEvent = this.time.addEvent({
            delay: 3200,
            callback: () => this.trySpawnRandomEnemy(),
            loop: true
        });
    }

    trySpawnRandomEnemy() {
        if (this.isGameOver || this.isVictory || this.isEnteringName) return;
        if (this.totalEnemiesSpawned >= this.maxTotalEnemies) return;

        // 場上同時存在敵人數量限制 (最多10隻，維持順暢與體驗)
        const currentActive = this.patrolEnemies.countActive(true) + this.flyerEnemies.countActive(true);
        if (currentActive >= 10) return;

        // 搜尋玩家周圍 120px ~ 650px 範圍內的可站立區域
        const playerX = this.player.x;
        const validSpots = this.standableLocations.filter(loc => {
            const centerX = (loc.minX + loc.maxX) / 2;
            const dist = Math.abs(centerX - playerX);
            return dist >= 120 && dist <= 650;
        });

        if (validSpots.length === 0) return;

        const spot = Phaser.Utils.Array.GetRandom(validSpots);
        const spawnX = Phaser.Math.Between(spot.minX, spot.maxX);
        const spawnY = spot.y;

        // 敵人傳送降臨火花特效
        this.sparkEmitter.explode(16, spawnX, spawnY);

        // 70% 生成巡邏安全帽怪，30% 生成空中懸浮浮游砲
        if (Math.random() < 0.7) {
            this.spawnPatrolEnemy(spawnX, spawnY, spot.minP, spot.maxP);
        } else {
            this.spawnFlyerEnemy(spawnX, spawnY - 60);
        }
        this.updateHUD();
    }

    flyerShoot(enemy) {
        if (!enemy.active || this.isGameOver || this.isVictory) return;
        // 只有當玩家在距離內才射擊
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (dist > 500) return;

        const bullet = this.enemyBullets.get(enemy.x, enemy.y, 'enemy_bullet');
        if (bullet) {
            bullet.setActive(true);
            bullet.setVisible(true);
            bullet.body.setAllowGravity(false);
            sfx.enemyShoot();

            // 朝玩家方向發射
            const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
            this.physics.velocityFromRotation(angle, 180, bullet.body.velocity);

            // 4 秒後自動回收
            this.time.delayedCall(4000, () => {
                if (bullet.active) {
                    bullet.setActive(false);
                    bullet.setVisible(false);
                    bullet.body.stop();
                }
            });
        }
    }

    spawnHealthItem(x, y) {
        const item = this.items.create(x, y, 'item_health');
        item.body.setAllowGravity(false);

        // 浮動動畫
        this.tweens.add({
            targets: item,
            y: y - 8,
            yoyo: true,
            repeat: -1,
            duration: 900
        });
    }

    createParticleEmitters() {
        this.sparkEmitter = this.add.particles(0, 0, 'particle_spark', {
            speed: { min: 80, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 1, end: 0 },
            lifespan: 300,
            gravityY: 300,
            emitting: false
        });
    }

    setupCamera() {
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }

    createHUD() {
        // 固定在畫面上的 UI 容器
        this.hudContainer = this.add.container(0, 0);
        this.hudContainer.setScrollFactor(0);

        // 1. 經典洛克人垂直血條外框
        const barBg = this.add.rectangle(26, 75, 18, 94, 0x111827, 0.85);
        barBg.setStrokeStyle(2, 0x38bdf8);
        this.hudContainer.add(barBg);

        // 血條圖示
        const hpIcon = this.add.text(26, 18, 'LIFE', {
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#38bdf8',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.hudContainer.add(hpIcon);

        // 垂直血條格子
        this.hpBars = [];
        for (let i = 0; i < 14; i++) {
            const segment = this.add.rectangle(26, 115 - i * 6, 12, 4, 0x22c55e);
            this.hudContainer.add(segment);
            this.hpBars.push(segment);
        }

        // 2. 得分與擊殺計數
        this.scoreText = this.add.text(50, 16, `SCORE: 0`, {
            fontSize: '16px',
            fontFamily: 'monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        this.hudContainer.add(this.scoreText);

        this.enemyText = this.add.text(50, 36, `ENEMIES: 0`, {
            fontSize: '13px',
            fontFamily: 'monospace',
            color: '#94a3b8'
        });
        this.hudContainer.add(this.enemyText);

        // 3. 終點距離進度指示
        this.distText = this.add.text(780, 20, `PORTAL: 3000m`, {
            fontSize: '14px',
            fontFamily: 'monospace',
            color: '#38bdf8',
            fontStyle: 'bold'
        }).setOrigin(1, 0);
        this.hudContainer.add(this.distText);
    }

    updateHUD() {
        // 更新血條
        const activeCount = Math.ceil((this.playerHP / this.maxHP) * 14);
        this.hpBars.forEach((bar, idx) => {
            if (idx < activeCount) {
                bar.setVisible(true);
                // 殘血變紅/黃
                if (activeCount <= 4) {
                    bar.setFillStyle(0xef4444);
                } else if (activeCount <= 8) {
                    bar.setFillStyle(0xf59e0b);
                } else {
                    bar.setFillStyle(0x22c55e);
                }
            } else {
                bar.setVisible(false);
            }
        });

        this.scoreText.setText(`SCORE: ${this.score}`);
        this.enemyText.setText(`KILLS: ${this.enemiesDefeated} | ENEMIES: ${this.totalEnemiesSpawned}/${this.maxTotalEnemies}`);

        const remainingDist = Math.max(0, Math.floor(3100 - this.player.x));
        this.distText.setText(`PORTAL: ${remainingDist}m`);
    }

    setupInputs() {
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.keyJ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.J);
        this.keyX = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
        this.keyK = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.K);
        this.keyR = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

        // 支援滑鼠點擊發射
        this.input.on('pointerdown', (pointer) => {
            if (pointer.leftButtonDown()) {
                this.shootBullet();
            }
        });
    }

    setupCollisions() {
        // 地形碰撞
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.patrolEnemies, this.platforms);

        // 子彈打到地形銷毀
        this.physics.add.collider(this.bullets, this.platforms, (bullet) => {
            this.sparkEmitter.explode(4, bullet.x, bullet.y);
            bullet.destroy();
        });
        this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => {
            bullet.destroy();
        });

        // 玩家碰觸尖刺
        this.physics.add.overlap(this.player, this.spikes, () => {
            this.takeDamage(35, true);
        });

        // 玩家碰觸道具
        this.physics.add.overlap(this.player, this.items, (player, item) => {
            sfx.pickup();
            this.playerHP = Math.min(this.maxHP, this.playerHP + 35);
            this.score += 200;
            this.sparkEmitter.explode(10, item.x, item.y);
            item.destroy();
            this.updateHUD();
        });

        // 玩家子彈擊中巡邏怪
        this.physics.add.overlap(this.bullets, this.patrolEnemies, (bullet, enemy) => {
            bullet.destroy();
            this.damageEnemy(enemy, 1);
        });

        // 玩家子彈擊中飛行怪
        this.physics.add.overlap(this.bullets, this.flyerEnemies, (bullet, enemy) => {
            bullet.destroy();
            this.damageEnemy(enemy, 1);
        });

        // 玩家碰觸敵人
        this.physics.add.overlap(this.player, this.patrolEnemies, () => {
            this.takeDamage(20);
        });
        this.physics.add.overlap(this.player, this.flyerEnemies, () => {
            this.takeDamage(15);
        });

        // 敵人子彈擊中玩家
        this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
            bullet.destroy();
            this.takeDamage(15);
        });

        // 玩家抵達傳送門
        this.physics.add.overlap(this.player, this.goalPortal, () => {
            this.triggerVictory();
        });
    }

    damageEnemy(enemy, amount) {
        enemy.hp -= amount;
        sfx.hit();
        this.sparkEmitter.explode(8, enemy.x, enemy.y);

        // 受傷白閃
        enemy.setTint(0xffffff);
        this.time.delayedCall(100, () => {
            if (enemy.active) enemy.clearTint();
        });

        if (enemy.hp <= 0) {
            sfx.explosion();
            this.sparkEmitter.explode(18, enemy.x, enemy.y);
            if (enemy.shootTimer) enemy.shootTimer.remove();
            enemy.destroy();

            this.score += 150;
            this.enemiesDefeated += 1;
            this.updateHUD();
        }
    }

    takeDamage(amount, isSpike = false) {
        if (this.isInvulnerable || this.isGameOver || this.isVictory) return;

        this.playerHP = Math.max(0, this.playerHP - amount);
        this.updateHUD();
        sfx.hit();

        // 畫面微震動
        this.cameras.main.shake(150, 0.01);

        // 擊退
        if (isSpike) {
            this.player.setVelocityY(-350);
        } else {
            this.player.setVelocityX(this.player.facingRight ? -140 : 140);
            this.player.setVelocityY(-200);
        }

        if (this.playerHP <= 0) {
            this.triggerGameOver();
            return;
        }

        // 無敵時間與閃爍
        this.isInvulnerable = true;
        this.tweens.add({
            targets: this.player,
            alpha: 0.2,
            yoyo: true,
            repeat: 5,
            duration: 100,
            onComplete: () => {
                this.player.alpha = 1;
                this.isInvulnerable = false;
            }
        });
    }

    shootBullet() {
        if (this.isGameOver || this.isVictory) return;

        const now = this.time.now;
        if (now - this.lastShootTime < this.shootCooldown) return;

        // 限制畫面上最多 3 發子彈 (經典洛克人手感)
        if (this.bullets.countActive(true) >= 3) return;

        this.lastShootTime = now;
        sfx.shoot();

        // 計算槍口位置
        const offsetX = this.player.facingRight ? 20 : -20;
        const bullet = this.bullets.create(this.player.x + offsetX, this.player.y - 2, 'bullet');
        if (bullet) {
            bullet.body.setAllowGravity(false);
            const speed = this.player.facingRight ? 550 : -550;
            bullet.setVelocityX(speed);
            bullet.setFlipX(!this.player.facingRight);

            // 超過鏡頭邊界自動回收
            this.time.delayedCall(1600, () => {
                if (bullet.active) bullet.destroy();
            });
        }

        // 短暫切換射擊姿勢
        this.player.isShooting = true;
        this.player.setTexture('player_shoot');
        if (this.shootResetTimer) this.shootResetTimer.remove();
        this.shootResetTimer = this.time.delayedCall(200, () => {
            this.player.isShooting = false;
        });
    }

    triggerGameOver() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        sfx.gameOver();

        this.player.setVelocity(0, 0);
        this.player.setTint(0xef4444);
        this.sparkEmitter.explode(25, this.player.x, this.player.y);

        this.time.delayedCall(700, () => {
            this.startArcadeNameEntry(false, this.score);
        });
    }

    triggerVictory() {
        if (this.isVictory) return;
        this.isVictory = true;
        sfx.victory();

        this.player.setVelocity(0, 0);
        this.sparkEmitter.explode(30, this.player.x, this.player.y);

        this.time.delayedCall(700, () => {
            this.startArcadeNameEntry(true, this.score + 1000);
        });
    }

    // ==========================================
    // 街機代號輸入系統 (Classic Arcade Name Entry: _ _ _)
    // ==========================================
    startArcadeNameEntry(isVictory, finalScore) {
        this.isEnteringName = true;
        this.canRestartWithR = false;

        // 街機字符集：A-Z, 0-9, 經典街機符號
        const CHAR_LIST = [
            'A','B','C','D','E','F','G','H','I','J','K','L','M',
            'N','O','P','Q','R','S','T','U','V','W','X','Y','Z',
            '0','1','2','3','4','5','6','7','8','9',
            '.','!','?','-','★','♥'
        ];

        // 初始狀態：已確定代號（初始為 _ _ _）
        this.finalInitials = ['', '', ''];
        this.activeSlot = 0;
        this.currentCharIndex = 0; // 預設字母為 'A'

        // 最頂層覆蓋容器
        this.nameEntryContainer = this.add.container(400, 250);
        this.nameEntryContainer.setScrollFactor(0);
        this.nameEntryContainer.setDepth(9999);

        // 1. 機台框體背景 (最底層)
        const borderColor = isVictory ? 0x22c55e : 0xef4444;
        const bg = this.add.rectangle(0, 0, 540, 410, 0x070b14, 0.97);
        bg.setStrokeStyle(3, borderColor);
        this.nameEntryContainer.add(bg);

        // 2. 頂部標題與成績
        const titleText = isVictory ? '★ STAGE CLEAR! ★' : '★ MISSION FAILED ★';
        const titleColor = isVictory ? '#22c55e' : '#ef4444';
        const title = this.add.text(0, -165, titleText, {
            fontSize: '28px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: titleColor,
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const statsTxt = this.add.text(0, -125, `FINAL SCORE: ${finalScore}    KILLS: ${this.enemiesDefeated}`, {
            fontSize: '18px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#facc15',
            stroke: '#000000',
            strokeThickness: 4,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const hintTxt = this.add.text(0, -85, '▼ ENTER INITIALS / 輸入三字代號 ▼', {
            fontSize: '15px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#38bdf8',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.nameEntryContainer.add([title, statsTxt, hintTxt]);

        // 3. 三個字母輸入槽 UI (_ _ _)
        this.slotLetters = [];
        this.slotUnderscores = [];
        this.slotBoxes = [];
        const slotXCoords = [-95, 0, 95];

        slotXCoords.forEach((x, idx) => {
            // 背景槽格
            const box = this.add.rectangle(x, 0, 68, 80, 0x0f172a);
            box.setStrokeStyle(2, idx === 0 ? 0x00d2ff : 0x334155);

            // 槽位字母 (預設為 _)
            const letterText = this.add.text(x, -5, idx === 0 ? 'A' : '_', {
                fontSize: '46px',
                fontFamily: '"Courier New", Consolas, monospace',
                color: idx === 0 ? '#fef08a' : '#64748b',
                stroke: '#000000',
                strokeThickness: 6,
                fontStyle: 'bold'
            }).setOrigin(0.5);

            // 底部閃爍游標條
            const cursorLine = this.add.rectangle(x, 26, 46, 4, 0x00d2ff);
            cursorLine.setVisible(idx === 0);

            this.slotBoxes.push(box);
            this.slotLetters.push(letterText);
            this.slotUnderscores.push(cursorLine);
            this.nameEntryContainer.add([box, letterText, cursorLine]);
        });

        // 游標閃爍動態
        this.cursorTween = this.tweens.add({
            targets: this.slotUnderscores,
            alpha: 0,
            yoyo: true,
            repeat: -1,
            duration: 350
        });

        // 4. 輔助切換箭頭 (可點擊)
        const upBtn = this.add.rectangle(0, -48, 220, 28, 0x1e293b).setInteractive({ useHandCursor: true });
        upBtn.setStrokeStyle(1, 0x38bdf8);
        const upTxt = this.add.text(0, -48, '▲ 上下鍵選擇 (↑ / W 或 ↓ / S)', {
            fontSize: '12px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#38bdf8',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 5. 操作說明與確認按鈕
        const guideTxt = this.add.text(0, 80, '【 ↑ / ↓ 鍵換字，按空白鍵 (SPACE) 輸入下一個字 】', {
            fontSize: '13px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#a5f3fc',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 空白鍵確認按鈕 (可點擊)
        const nextBtn = this.add.rectangle(-80, 135, 230, 44, 0x0284c7).setInteractive({ useHandCursor: true });
        nextBtn.setStrokeStyle(2, 0x38bdf8);
        const nextTxt = this.add.text(-80, 135, '空白鍵：輸入下個字 ➔', {
            fontSize: '15px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 倒退鍵按鈕 (可點擊)
        const backBtn = this.add.rectangle(135, 135, 140, 44, 0x334155).setInteractive({ useHandCursor: true });
        backBtn.setStrokeStyle(1, 0x64748b);
        const backTxt = this.add.text(135, 135, '◄ 倒退 (Backspace)', {
            fontSize: '13px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#e2e8f0'
        }).setOrigin(0.5);

        this.nameEntryContainer.add([upBtn, upTxt, guideTxt, nextBtn, nextTxt, backBtn, backTxt]);

        // 刷新字母槽顯示
        const refreshDisplay = () => {
            this.slotLetters.forEach((textObj, i) => {
                if (i < this.activeSlot) {
                    textObj.setText(this.finalInitials[i]);
                    textObj.setColor('#4ade80'); // 已鎖定輸入的字母呈現綠色
                } else if (i === this.activeSlot) {
                    textObj.setText(CHAR_LIST[this.currentCharIndex]);
                    textObj.setColor('#fef08a'); // 正在挑選的字母呈現亮黃色
                } else {
                    textObj.setText('_');
                    textObj.setColor('#64748b'); // 後續尚未填寫的槽顯示 _
                }
            });

            this.slotBoxes.forEach((box, i) => {
                box.setStrokeStyle(2, i === this.activeSlot ? 0x00d2ff : 0x334155);
            });

            this.slotUnderscores.forEach((line, i) => {
                line.setVisible(i === this.activeSlot);
            });

            if (this.activeSlot >= 2) {
                nextTxt.setText('空白鍵：完成送出 ✔');
            } else {
                nextTxt.setText('空白鍵：輸入下個字 ➔');
            }
        };

        // 輪播切換字符
        const changeChar = (direction) => {
            this.currentCharIndex = (this.currentCharIndex + direction + CHAR_LIST.length) % CHAR_LIST.length;
            sfx.letterBeep();
            refreshDisplay();
        };

        // 空白鍵/確定鍵：鎖定當前字母並前進到下一格
        const confirmAndNext = () => {
            sfx.letterBeep();
            this.finalInitials[this.activeSlot] = CHAR_LIST[this.currentCharIndex];

            if (this.activeSlot < 2) {
                this.activeSlot++;
                this.currentCharIndex = 0; // 下一個字母預設從 'A' 開始
                refreshDisplay();
            } else {
                // 三個字元全部鎖定完成，送出排行榜！
                finishAndSubmit();
            }
        };

        // 倒退至上一格
        const goBack = () => {
            if (this.activeSlot > 0) {
                sfx.letterBeep();
                this.activeSlot--;
                const prev = this.finalInitials[this.activeSlot];
                const foundIdx = CHAR_LIST.indexOf(prev);
                this.currentCharIndex = foundIdx !== -1 ? foundIdx : 0;
                refreshDisplay();
            }
        };

        // 提交姓名並顯示排行榜
        const finishAndSubmit = () => {
            if (!this.isEnteringName) return;
            this.isEnteringName = false;
            sfx.confirm();
            this.input.keyboard.off('keydown', onKey);
            if (this.cursorTween) this.cursorTween.remove();
            this.nameEntryContainer.destroy();

            const initials = this.finalInitials.join('').slice(0, 3);
            const result = ArcadeLeaderboard.addScore(initials, finalScore, this.enemiesDefeated);
            this.showArcadeLeaderboard(result.userRank);
        };

        // 按鈕點擊綁定
        upBtn.on('pointerdown', () => changeChar(1));
        nextBtn.on('pointerdown', confirmAndNext);
        backBtn.on('pointerdown', goBack);

        // 鍵盤監聽事件 (經典大型電玩：上下鍵挑字，空白鍵輸入下一個字)
        const onKey = (event) => {
            if (!this.isEnteringName) return;

            const key = event.key;
            // 上下鍵或 W / S 選擇字母
            if (key === 'ArrowUp' || key === 'w' || key === 'W') {
                changeChar(-1);
                return;
            }
            if (key === 'ArrowDown' || key === 's' || key === 'S') {
                changeChar(1);
                return;
            }

            // 空白鍵、Enter 或 J (射擊鍵) 確認當前字並輸入下一個
            if (key === ' ' || key === 'Spacebar' || key === 'Enter' || key === 'j' || key === 'J') {
                confirmAndNext();
                return;
            }

            // 倒退修改
            if (key === 'Backspace' || key === 'ArrowLeft') {
                goBack();
                return;
            }
            if (key === 'ArrowRight') {
                if (this.activeSlot < 2) {
                    confirmAndNext();
                }
                return;
            }

            // 支援鍵盤直接敲擊英數字快選
            const upper = key.toUpperCase();
            const idx = CHAR_LIST.indexOf(upper);
            if (idx !== -1) {
                this.currentCharIndex = idx;
                sfx.letterBeep();
                refreshDisplay();
            }
        };

        this.input.keyboard.on('keydown', onKey);
        refreshDisplay();
    }

    // ==========================================
    // 街機歷史排行榜記分板 (Arcade Leaderboard)
    // ==========================================
    showArcadeLeaderboard(userRank) {
        this.canRestartWithR = true;

        if (this.leaderboardContainer) {
            this.leaderboardContainer.destroy();
        }

        this.leaderboardContainer = this.add.container(400, 250);
        this.leaderboardContainer.setScrollFactor(0);
        this.leaderboardContainer.setDepth(9999);

        // 機台背景 (最先加入容器最底層)
        const bg = this.add.rectangle(0, 0, 560, 420, 0x080e1a, 0.97);
        bg.setStrokeStyle(3, 0xfacc15);
        this.leaderboardContainer.add(bg);

        // 標題
        const title = this.add.text(0, -175, '🏆 ARCADE TOP SCORES 🏆', {
            fontSize: '24px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#facc15',
            stroke: '#000000',
            strokeThickness: 5,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const subTitle = this.add.text(0, -145, '== 大型街機歷史名譽榜 (LOCALSTORAGE) ==', {
            fontSize: '13px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#38bdf8',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 表頭
        const header = this.add.text(0, -115, 'RANK    NAME       SCORE      KILLS', {
            fontSize: '14px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#94a3b8',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.leaderboardContainer.add([title, subTitle, header]);

        // 讀取紀錄繪製
        const scores = ArcadeLeaderboard.loadScores();
        const startY = -85;
        const rowHeight = 32;

        scores.slice(0, 7).forEach((entry, idx) => {
            const y = startY + idx * rowHeight;
            const isUserRow = entry.rank === userRank;

            // 若為剛才玩家創下的紀錄，加上高亮閃爍行背景
            if (isUserRow) {
                const rowGlow = this.add.rectangle(0, y, 480, 26, 0x0284c7, 0.4);
                rowGlow.setStrokeStyle(1, 0x38bdf8);
                this.tweens.add({
                    targets: rowGlow,
                    alpha: 0.15,
                    yoyo: true,
                    repeat: -1,
                    duration: 500
                });
                this.leaderboardContainer.add(rowGlow);
            }

            // 名次
            let rankColor = '#38bdf8';
            let rankLabel = `${entry.rank}TH`;
            if (entry.rank === 1) { rankColor = '#fbbf24'; rankLabel = '1ST'; }
            else if (entry.rank === 2) { rankColor = '#e2e8f0'; rankLabel = '2ND'; }
            else if (entry.rank === 3) { rankColor = '#f97316'; rankLabel = '3RD'; }

            const rankTxt = this.add.text(-190, y, rankLabel, {
                fontSize: '15px',
                fontFamily: '"Courier New", Consolas, monospace',
                color: rankColor,
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            // 代號
            const nameColor = isUserRow ? '#fde047' : '#ffffff';
            const nameTxt = this.add.text(-90, y, entry.name, {
                fontSize: '16px',
                fontFamily: '"Courier New", Consolas, monospace',
                color: nameColor,
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            // 分數
            const scoreTxt = this.add.text(35, y, entry.score.toString().padStart(6, ' '), {
                fontSize: '15px',
                fontFamily: '"Courier New", Consolas, monospace',
                color: '#4ade80',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold'
            }).setOrigin(0, 0.5);

            // 擊殺數
            const killsTxt = this.add.text(175, y, `${entry.enemies || 0}`, {
                fontSize: '15px',
                fontFamily: '"Courier New", Consolas, monospace',
                color: '#cbd5e1',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0, 0.5);

            // 標示 YOU
            if (isUserRow) {
                const youBadge = this.add.text(210, y, '◀ YOU', {
                    fontSize: '12px',
                    fontFamily: '"Courier New", Consolas, monospace',
                    color: '#facc15',
                    stroke: '#000000',
                    strokeThickness: 3,
                    fontStyle: 'bold'
                }).setOrigin(0, 0.5);
                this.leaderboardContainer.add(youBadge);
            }

            this.leaderboardContainer.add([rankTxt, nameTxt, scoreTxt, killsTxt]);
        });

        // 重新開始按鈕
        const restartBtn = this.add.rectangle(-80, 165, 230, 36, 0x16a34a).setInteractive({ useHandCursor: true });
        restartBtn.setStrokeStyle(2, 0x4ade80);
        const restartTxt = this.add.text(-80, 165, '【 按 R 鍵重新開始 】', {
            fontSize: '15px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        restartBtn.on('pointerdown', () => this.scene.restart());
        restartBtn.on('pointerover', () => restartBtn.setFillStyle(0x15803d));
        restartBtn.on('pointerout', () => restartBtn.setFillStyle(0x16a34a));

        // 清除排行榜按鈕
        const clearBtn = this.add.rectangle(130, 165, 140, 36, 0x334155).setInteractive({ useHandCursor: true });
        clearBtn.setStrokeStyle(1, 0x64748b);
        const clearTxt = this.add.text(130, 165, '重設排行榜', {
            fontSize: '13px',
            fontFamily: '"Courier New", Consolas, monospace',
            color: '#cbd5e1',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);

        clearBtn.on('pointerdown', () => {
            ArcadeLeaderboard.clearScores();
            sfx.letterBeep();
            this.showArcadeLeaderboard(null);
        });
        clearBtn.on('pointerover', () => clearBtn.setFillStyle(0x475569));
        clearBtn.on('pointerout', () => clearBtn.setFillStyle(0x334155));

        this.leaderboardContainer.add([restartBtn, restartTxt, clearBtn, clearTxt]);
    }

    update(time, delta) {
        // 重開按鍵 (僅在排行榜結算階段生效，避免輸入代號時衝突)
        if (this.canRestartWithR && Phaser.Input.Keyboard.JustDown(this.keyR)) {
            this.scene.restart();
            return;
        }

        if (this.isGameOver || this.isVictory || this.isEnteringName) return;

        // 掉落深淵判定
        if (this.player.y > this.worldHeight + 20) {
            this.playerHP = 0;
            this.updateHUD();
            this.triggerGameOver();
            return;
        }

        const onGround = this.player.body.blocked.down || this.player.body.touching.down;
        const moveSpeed = 210;

        // 左右移動控制
        if (this.cursors.left.isDown || this.keyA.isDown) {
            this.player.setVelocityX(-moveSpeed);
            this.player.facingRight = false;
            this.player.setFlipX(true);
            if (onGround && !this.player.isShooting) {
                this.player.anims.play('player_run', true);
            }
        } else if (this.cursors.right.isDown || this.keyD.isDown) {
            this.player.setVelocityX(moveSpeed);
            this.player.facingRight = true;
            this.player.setFlipX(false);
            if (onGround && !this.player.isShooting) {
                this.player.anims.play('player_run', true);
            }
        } else {
            this.player.setVelocityX(0);
            if (onGround && !this.player.isShooting) {
                this.player.anims.stop();
                this.player.setTexture('player_idle');
            }
        }

        // 跳躍控制
        const isJumpPressed = Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
            Phaser.Input.Keyboard.JustDown(this.keyW) ||
            Phaser.Input.Keyboard.JustDown(this.keySpace) ||
            Phaser.Input.Keyboard.JustDown(this.keyK);

        if (isJumpPressed && onGround) {
            this.player.setVelocityY(-430);
            sfx.jump();
        }

        // 空中姿態
        if (!onGround && !this.player.isShooting) {
            this.player.anims.stop();
            this.player.setTexture('player_jump');
        }

        // 射擊控制
        const isShootPressed = Phaser.Input.Keyboard.JustDown(this.keyJ) ||
            Phaser.Input.Keyboard.JustDown(this.keyX);
        if (isShootPressed) {
            this.shootBullet();
        }

        // 更新巡邏機器人 (在 minX 與 maxX 之間來回)
        this.patrolEnemies.children.iterate((enemy) => {
            if (enemy && enemy.active) {
                if (enemy.x <= enemy.minX) {
                    enemy.setVelocityX(60);
                    enemy.setFlipX(false);
                } else if (enemy.x >= enemy.maxX) {
                    enemy.setVelocityX(-60);
                    enemy.setFlipX(true);
                }
            }
        });

        // 更新飛行機器人 (上下微幅懸浮浮動)
        this.flyerEnemies.children.iterate((enemy) => {
            if (enemy && enemy.active) {
                enemy.y = enemy.baseY + Math.sin(time * 0.004 + enemy.x) * 12;
            }
        });
    }
}

// ==========================================
// 4. Phaser 遊戲設定與啟動
// ==========================================
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 500,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [GameScene]
};

window.addEventListener('DOMContentLoaded', () => {
    new Phaser.Game(config);
});
