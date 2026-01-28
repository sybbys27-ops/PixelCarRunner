// ===== 게임 설정 (하늘에서 내려다보는 시점) =====
const CONFIG = {
    GAME_SPEED: 1.5,
    SPEED_INCREMENT: 0.0002,
    ROAD_Y: 280,             // 도로 Y 위치
    ROAD_HEIGHT: 80,         // 3차선 도로 높이
    LANE_COUNT: 3,
    CAR_WIDTH: 20,           // 작은 자동차
    CAR_HEIGHT: 12,
    TRAFFIC_MIN_GAP: 120,
    TRAFFIC_MAX_GAP: 280,
    COIN_SPAWN_CHANCE: 0.5,
    POWER_SPAWN_CHANCE: 0.05,
    CLOUD_COUNT: 5
};

// ===== 캔버스 설정 =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = 800;
    canvas.height = 500;
}
resizeCanvas();

// ===== 게임 상태 =====
let gameState = 'start';
let score = 0;
let distance = 0;
let gameSpeed = CONFIG.GAME_SPEED;
let effectiveGameSpeed = CONFIG.GAME_SPEED;
let powerMode = false;
let powerTimer = 0;

// ===== UI 요소 =====
const startScreen = document.getElementById('start-screen');
const gameoverScreen = document.getElementById('gameover-screen');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const scoreDisplay = document.getElementById('score');
const distanceDisplay = document.getElementById('distance');
const finalScore = document.getElementById('final-score');
const finalDistance = document.getElementById('final-distance');

// ===== 차량 타입 정의 =====
const VEHICLE_TYPES = {
    // 일반 차량
    small: {
        width: 16, height: 10,
        colors: ['#e74c3c', '#3498db', '#f39c12', '#9b59b6', '#1abc9c', '#e91e63'],
        draw: function (ctx, x, y, w, h, color) {
            // 소형차 (귀여운 미니카)
            ctx.fillStyle = color;
            ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
            ctx.fillStyle = darken(color);
            ctx.fillRect(x + 4, y + 2, w - 8, 3);
            // 창문
            ctx.fillStyle = '#74b9ff';
            ctx.fillRect(x + 5, y + 3, w - 10, 2);
            // 바퀴
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x + 2, y, 3, 2);
            ctx.fillRect(x + w - 5, y, 3, 2);
            ctx.fillRect(x + 2, y + h - 2, 3, 2);
            ctx.fillRect(x + w - 5, y + h - 2, 3, 2);
        }
    },
    medium: {
        width: 22, height: 12,
        colors: ['#27ae60', '#2980b9', '#8e44ad', '#d35400', '#16a085'],
        draw: function (ctx, x, y, w, h, color) {
            // 중형차
            ctx.fillStyle = color;
            ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
            ctx.fillStyle = darken(color);
            ctx.fillRect(x + 5, y + 2, w - 10, 4);
            // 창문
            ctx.fillStyle = '#74b9ff';
            ctx.fillRect(x + 6, y + 3, w - 12, 2);
            // 바퀴
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x + 3, y, 3, 2);
            ctx.fillRect(x + w - 6, y, 3, 2);
            ctx.fillRect(x + 3, y + h - 2, 3, 2);
            ctx.fillRect(x + w - 6, y + h - 2, 3, 2);
        }
    },
    truck: {
        width: 28, height: 14,
        colors: ['#95a5a6', '#7f8c8d', '#bdc3c7'],
        draw: function (ctx, x, y, w, h, color) {
            // 트럭
            // 화물칸
            ctx.fillStyle = color;
            ctx.fillRect(x, y + 1, w - 8, h - 2);
            // 운전석
            ctx.fillStyle = '#3498db';
            ctx.fillRect(x + w - 10, y + 2, 8, h - 4);
            ctx.fillStyle = '#74b9ff';
            ctx.fillRect(x + w - 8, y + 3, 4, h - 6);
            // 바퀴
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x + 2, y, 4, 2);
            ctx.fillRect(x + w - 10, y, 4, 2);
            ctx.fillRect(x + 2, y + h - 2, 4, 2);
            ctx.fillRect(x + w - 10, y + h - 2, 4, 2);
        }
    },
    police: {
        width: 22, height: 12,
        colors: ['#fff'],
        draw: function (ctx, x, y, w, h) {
            // 경찰차 (흰색 + 파란색 줄)
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
            // 파란 줄
            ctx.fillStyle = '#3498db';
            ctx.fillRect(x + 2, y + h / 2 - 1, w - 4, 2);
            // 지붕
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(x + 5, y + 2, w - 10, 3);
            // 경광등
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + w / 2 - 2, y + 2, 2, 2);
            ctx.fillStyle = '#3498db';
            ctx.fillRect(x + w / 2, y + 2, 2, 2);
            // 바퀴
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x + 3, y, 3, 2);
            ctx.fillRect(x + w - 6, y, 3, 2);
            ctx.fillRect(x + 3, y + h - 2, 3, 2);
            ctx.fillRect(x + w - 6, y + h - 2, 3, 2);
        }
    },
    ambulance: {
        width: 26, height: 13,
        colors: ['#fff'],
        draw: function (ctx, x, y, w, h) {
            // 구급차
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
            // 빨간 십자가
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + 6, y + 3, 2, 6);
            ctx.fillRect(x + 4, y + 5, 6, 2);
            // 운전석
            ctx.fillStyle = '#74b9ff';
            ctx.fillRect(x + w - 8, y + 3, 4, h - 6);
            // 경광등
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + w - 6, y + 1, 3, 2);
            // 바퀴
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x + 3, y, 4, 2);
            ctx.fillRect(x + w - 7, y, 4, 2);
            ctx.fillRect(x + 3, y + h - 2, 4, 2);
            ctx.fillRect(x + w - 7, y + h - 2, 4, 2);
        }
    },
    firetruck: {
        width: 30, height: 14,
        colors: ['#e74c3c'],
        draw: function (ctx, x, y, w, h) {
            // 소방차
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
            // 하얀 줄
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 4, y + h / 2 - 1, w - 8, 2);
            // 사다리
            ctx.fillStyle = '#bdc3c7';
            ctx.fillRect(x + 4, y + 2, w - 14, 2);
            // 운전석
            ctx.fillStyle = '#c0392b';
            ctx.fillRect(x + w - 10, y + 2, 6, h - 4);
            ctx.fillStyle = '#74b9ff';
            ctx.fillRect(x + w - 8, y + 3, 3, h - 6);
            // 경광등
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(x + w - 6, y + 1, 3, 2);
            // 바퀴
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x + 3, y, 4, 2);
            ctx.fillRect(x + 12, y, 4, 2);
            ctx.fillRect(x + w - 8, y, 4, 2);
            ctx.fillRect(x + 3, y + h - 2, 4, 2);
            ctx.fillRect(x + 12, y + h - 2, 4, 2);
            ctx.fillRect(x + w - 8, y + h - 2, 4, 2);
        }
    },
    bus: {
        width: 32, height: 14,
        colors: ['#f39c12', '#27ae60', '#9b59b6'],
        draw: function (ctx, x, y, w, h, color) {
            // 버스
            ctx.fillStyle = color;
            ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
            // 창문들
            ctx.fillStyle = '#74b9ff';
            for (let i = 0; i < 4; i++) {
                ctx.fillRect(x + 4 + i * 6, y + 3, 4, h - 6);
            }
            // 운전석
            ctx.fillStyle = '#74b9ff';
            ctx.fillRect(x + w - 7, y + 3, 4, h - 6);
            // 바퀴
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x + 4, y, 4, 2);
            ctx.fillRect(x + w - 8, y, 4, 2);
            ctx.fillRect(x + 4, y + h - 2, 4, 2);
            ctx.fillRect(x + w - 8, y + h - 2, 4, 2);
        }
    },
    taxi: {
        width: 20, height: 11,
        colors: ['#f1c40f'],
        draw: function (ctx, x, y, w, h) {
            // 택시 (노란색)
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
            ctx.fillStyle = '#d68910';
            ctx.fillRect(x + 4, y + 2, w - 8, 3);
            // 창문
            ctx.fillStyle = '#74b9ff';
            ctx.fillRect(x + 5, y + 3, w - 10, 2);
            // TAXI 표시
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x + w / 2 - 2, y + 1, 4, 2);
            // 바퀴
            ctx.fillStyle = '#2d3436';
            ctx.fillRect(x + 3, y, 3, 2);
            ctx.fillRect(x + w - 6, y, 3, 2);
            ctx.fillRect(x + 3, y + h - 2, 3, 2);
            ctx.fillRect(x + w - 6, y + h - 2, 3, 2);
        }
    }
};

function darken(color) {
    const darkColors = {
        '#e74c3c': '#c0392b', '#3498db': '#2980b9', '#f39c12': '#d68910',
        '#9b59b6': '#8e44ad', '#1abc9c': '#16a085', '#e91e63': '#c2185b',
        '#27ae60': '#229954', '#2980b9': '#1f618d', '#8e44ad': '#6c3483',
        '#d35400': '#a04000', '#16a085': '#117a65', '#95a5a6': '#7f8c8d',
        '#7f8c8d': '#616a6b', '#bdc3c7': '#95a5a6'
    };
    return darkColors[color] || color;
}

// ===== 플레이어 자동차 =====
class PlayerCar {
    constructor() {
        this.width = 18;
        this.height = 11;
        this.x = 100;
        this.y = 0;
        this.targetY = 0;
        this.lane = 0;
        this.eyeBlink = 0;
    }

    reset() {
        this.lane = 0;
        this.y = this.getLaneY();
        this.targetY = this.y;
    }

    getLaneY() {
        const laneHeight = CONFIG.ROAD_HEIGHT / CONFIG.LANE_COUNT;
        return CONFIG.ROAD_Y + (this.lane * laneHeight) + laneHeight / 2 - this.height / 2;
    }

    switchLane(direction) {
        if (direction === 'up' && this.lane > 0) {
            this.lane--;
        } else if (direction === 'down' && this.lane < CONFIG.LANE_COUNT - 1) {
            this.lane++;
        }
        this.targetY = this.getLaneY();
    }

    update() {
        this.y += (this.targetY - this.y) * 0.25;
        this.eyeBlink++;
        if (this.eyeBlink > 150) this.eyeBlink = 0;
    }

    draw() {
        const x = this.x;
        const y = this.y;
        const w = this.width;
        const h = this.height;

        // 그림자
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.fillRect(x + 2, y + h, w - 2, 3);

        // 파란 귀여운 자동차 (플레이어)
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x + 2, y + 1, w - 4, h - 2);

        ctx.fillStyle = '#2980b9';
        ctx.fillRect(x + 4, y + 2, w - 8, 3);

        // 창문
        ctx.fillStyle = '#74b9ff';
        ctx.fillRect(x + 5, y + 3, w - 10, 2);

        // 귀여운 눈!
        const blinkH = (this.eyeBlink > 145) ? 1 : 2;
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + w - 5, y + 3, 3, 3);
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(x + w - 4, y + 4, 2, blinkH);

        // 볼터치
        ctx.fillStyle = '#fab1a0';
        ctx.fillRect(x + w - 5, y + 6, 2, 1);

        // 바퀴
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(x + 3, y, 3, 2);
        ctx.fillRect(x + w - 6, y, 3, 2);
        ctx.fillRect(x + 3, y + h - 2, 3, 2);
        ctx.fillRect(x + w - 6, y + h - 2, 3, 2);
    }

    getBounds() {
        return { x: this.x + 2, y: this.y + 1, width: this.width - 4, height: this.height - 2 };
    }
}

// ===== 일반 차량 =====
class TrafficCar {
    constructor(x, lane) {
        // 랜덤 차량 타입 선택
        const types = ['small', 'small', 'medium', 'medium', 'truck', 'police', 'ambulance', 'firetruck', 'bus', 'taxi'];
        this.type = types[Math.floor(Math.random() * types.length)];
        const typeData = VEHICLE_TYPES[this.type];

        this.width = typeData.width;
        this.height = typeData.height;
        this.x = x;
        this.lane = lane;
        this.y = 0;
        this.speed = 0.3 + Math.random() * 0.8;
        this.color = typeData.colors[Math.floor(Math.random() * typeData.colors.length)];
    }

    getLaneY() {
        const laneHeight = CONFIG.ROAD_HEIGHT / CONFIG.LANE_COUNT;
        return CONFIG.ROAD_Y + (this.lane * laneHeight) + laneHeight / 2 - this.height / 2;
    }

    update() {
        this.x -= effectiveGameSpeed - this.speed;
        this.y = this.getLaneY();
    }

    draw() {
        // 그림자
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.fillRect(this.x + 2, this.y + this.height, this.width - 2, 2);

        VEHICLE_TYPES[this.type].draw(ctx, this.x, this.y, this.width, this.height, this.color);
    }

    getBounds() {
        return { x: this.x + 2, y: this.y + 1, width: this.width - 4, height: this.height - 2 };
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

// ===== 도로 =====
class Road {
    constructor() {
        this.lineOffset = 0;
    }

    update() {
        this.lineOffset = (this.lineOffset + effectiveGameSpeed) % 30;
    }

    draw() {
        const roadY = CONFIG.ROAD_Y;
        const roadH = CONFIG.ROAD_HEIGHT;

        // 도로 배경
        ctx.fillStyle = '#555';
        ctx.fillRect(0, roadY, canvas.width, roadH);

        // 도로 테두리
        ctx.fillStyle = '#333';
        ctx.fillRect(0, roadY, canvas.width, 3);
        ctx.fillRect(0, roadY + roadH - 3, canvas.width, 3);

        // 인도 (위쪽)
        ctx.fillStyle = '#999';
        ctx.fillRect(0, roadY - 8, canvas.width, 8);

        // 인도 (아래쪽)
        ctx.fillStyle = '#999';
        ctx.fillRect(0, roadY + roadH, canvas.width, 8);

        // 중앙선 (점선)
        ctx.fillStyle = '#f1c40f';
        const centerY = roadY + roadH / 2 - 1;
        for (let x = -this.lineOffset; x < canvas.width; x += 30) {
            ctx.fillRect(x, centerY, 15, 2);
        }

        // 가장자리 실선
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, roadY + 5, canvas.width, 2);
        ctx.fillRect(0, roadY + roadH - 7, canvas.width, 2);
    }
}

// ===== 코인 =====
class Coin {
    constructor(x, lane) {
        this.x = x;
        this.lane = lane;
        this.size = 10;
        this.collected = false;
        this.sparkle = Math.random() * Math.PI * 2;
        this.y = 0;
    }

    getLaneY() {
        const laneHeight = CONFIG.ROAD_HEIGHT / CONFIG.LANE_COUNT;
        return CONFIG.ROAD_Y + (this.lane * laneHeight) + laneHeight / 2 - this.size / 2;
    }

    update() {
        this.x -= effectiveGameSpeed;
        this.y = this.getLaneY();
        this.sparkle += 0.1;
    }

    draw() {
        if (this.collected) return;

        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(this.x + 1, this.y + 1, this.size - 2, this.size - 2);

        ctx.fillStyle = '#f39c12';
        ctx.fillRect(this.x, this.y, this.size, 1);
        ctx.fillRect(this.x, this.y + this.size - 1, this.size, 1);
        ctx.fillRect(this.x, this.y, 1, this.size);
        ctx.fillRect(this.x + this.size - 1, this.y, 1, this.size);

        // 반짝임
        if (Math.sin(this.sparkle) > 0.5) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x + 2, this.y + 2, 2, 2);
        }
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.size, height: this.size };
    }

    isOffScreen() {
        return this.x + this.size < 0;
    }
}

// ===== 별 아이템 =====
class StarItem {
    constructor(x, lane) {
        this.x = x;
        this.lane = lane;
        this.size = 12;
        this.collected = false;
        this.rotation = 0;
        this.y = 0;
    }

    getLaneY() {
        const laneHeight = CONFIG.ROAD_HEIGHT / CONFIG.LANE_COUNT;
        return CONFIG.ROAD_Y + (this.lane * laneHeight) + laneHeight / 2 - this.size / 2;
    }

    update() {
        this.x -= effectiveGameSpeed;
        this.y = this.getLaneY();
        this.rotation += 0.08;
    }

    draw() {
        if (this.collected) return;

        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);

        ctx.fillStyle = '#ff69b4';
        ctx.fillRect(-2, -this.size / 2, 4, this.size);
        ctx.fillRect(-this.size / 2, -2, this.size, 4);

        ctx.fillStyle = '#ffb6c1';
        ctx.fillRect(-1, -1, 2, 2);

        ctx.restore();
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.size, height: this.size };
    }

    isOffScreen() {
        return this.x + this.size < 0;
    }
}

// ===== 파워 아이템 (번개) =====
class PowerItem {
    constructor(x, lane) {
        this.x = x;
        this.lane = lane;
        this.size = 12;
        this.collected = false;
        this.flash = 0;
        this.y = 0;
    }

    getLaneY() {
        const laneHeight = CONFIG.ROAD_HEIGHT / CONFIG.LANE_COUNT;
        return CONFIG.ROAD_Y + (this.lane * laneHeight) + laneHeight / 2 - this.size / 2;
    }

    update() {
        this.x -= effectiveGameSpeed;
        this.y = this.getLaneY();
        this.flash++;
    }

    draw() {
        if (this.collected) return;

        const x = this.x;
        const y = this.y;
        const s = this.size;

        // 번개 모양 (노란색)
        ctx.fillStyle = '#f1c40f';
        // 지그재그
        ctx.fillRect(x + 2, y + 2, 2, 8);
        ctx.fillRect(x + 4, y + 4, 2, 6);
        ctx.fillRect(x + 6, y + 2, 2, 4);
        ctx.fillRect(x + 8, y + 6, 2, 4);

        // 반짝임 효과
        if (this.flash % 20 < 10) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x + 1, y + 1, 2, 2);
            ctx.fillRect(x + s - 3, y + s - 3, 2, 2);
        }
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.size, height: this.size };
    }

    isOffScreen() {
        return this.x + this.size < 0;
    }
}

// ===== 배경 건물/나무 (작게) =====
class BackgroundObject {
    constructor(x, layer) {
        this.x = x;
        this.layer = layer; // 0: 멀리, 1: 가까이
        this.type = Math.random() > 0.4 ? 'tree' : 'house';

        if (this.layer === 0) {
            this.width = 15 + Math.random() * 10;
            this.height = 20 + Math.random() * 15;
            this.speed = 0.3;
        } else {
            this.width = 20 + Math.random() * 15;
            this.height = 25 + Math.random() * 20;
            this.speed = 0.6;
        }

        this.color = this.getColor();
        this.roofColor = this.getRoofColor();
    }

    getColor() {
        const colors = ['#f9e4b7', '#fff8dc', '#ffe4c4', '#ffefd5'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    getRoofColor() {
        const colors = ['#c0392b', '#e74c3c', '#a0522d', '#cd853f'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.x -= effectiveGameSpeed * this.speed;
    }

    draw(baseY) {
        const y = baseY - this.height;

        if (this.type === 'house') {
            // 집 본체
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, y + this.height * 0.35, this.width, this.height * 0.65);

            // 지붕
            ctx.fillStyle = this.roofColor;
            ctx.fillRect(this.x - 2, y + this.height * 0.3, this.width + 4, 4);
            ctx.fillRect(this.x + 2, y + this.height * 0.15, this.width - 4, 5);
            ctx.fillRect(this.x + 5, y, this.width - 10, 5);

            // 창문
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(this.x + 3, y + this.height * 0.5, 4, 4);
            if (this.width > 15) {
                ctx.fillRect(this.x + this.width - 7, y + this.height * 0.5, 4, 4);
            }

            // 문
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(this.x + this.width / 2 - 2, y + this.height * 0.7, 4, this.height * 0.3);
        } else {
            // 나무 줄기
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(this.x + this.width / 2 - 2, baseY - this.height * 0.4, 4, this.height * 0.4);

            // 나뭇잎
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(this.x + 2, y + this.height * 0.4, this.width - 4, 6);
            ctx.fillRect(this.x + 4, y + this.height * 0.2, this.width - 8, 6);
            ctx.fillRect(this.x + 6, y, this.width - 12, 5);
        }
    }

    isOffScreen() {
        return this.x + this.width < 0;
    }
}

// ===== 배경 시스템 =====
class Background {
    constructor() {
        this.clouds = [];
        this.topObjects = [];  // 도로 위쪽
        this.bottomObjects = []; // 도로 아래쪽
        this.init();
    }

    init() {
        // 구름
        for (let i = 0; i < CONFIG.CLOUD_COUNT; i++) {
            this.clouds.push({
                x: i * 180 + Math.random() * 80,
                y: 20 + Math.random() * 60,
                size: 20 + Math.random() * 25,
                speed: 0.2 + Math.random() * 0.2
            });
        }

        // 위쪽 건물/나무
        for (let i = 0; i < 12; i++) {
            this.topObjects.push(new BackgroundObject(i * 80 + Math.random() * 30, Math.random() > 0.5 ? 0 : 1));
        }

        // 아래쪽 건물/나무
        for (let i = 0; i < 12; i++) {
            this.bottomObjects.push(new BackgroundObject(i * 80 + Math.random() * 30, Math.random() > 0.5 ? 0 : 1));
        }
    }

    update() {
        // 구름
        for (let c of this.clouds) {
            c.x -= c.speed;
            if (c.x + c.size * 2 < 0) {
                c.x = canvas.width + c.size;
                c.y = 20 + Math.random() * 60;
            }
        }

        // 위쪽 오브젝트
        for (let i = this.topObjects.length - 1; i >= 0; i--) {
            this.topObjects[i].update();
            if (this.topObjects[i].isOffScreen()) {
                this.topObjects.splice(i, 1);
            }
        }
        while (this.topObjects.length < 12) {
            const lastX = this.topObjects.length > 0 ? Math.max(...this.topObjects.map(o => o.x)) : canvas.width;
            this.topObjects.push(new BackgroundObject(lastX + 50 + Math.random() * 40, Math.random() > 0.5 ? 0 : 1));
        }

        // 아래쪽 오브젝트
        for (let i = this.bottomObjects.length - 1; i >= 0; i--) {
            this.bottomObjects[i].update();
            if (this.bottomObjects[i].isOffScreen()) {
                this.bottomObjects.splice(i, 1);
            }
        }
        while (this.bottomObjects.length < 12) {
            const lastX = this.bottomObjects.length > 0 ? Math.max(...this.bottomObjects.map(o => o.x)) : canvas.width;
            this.bottomObjects.push(new BackgroundObject(lastX + 50 + Math.random() * 40, Math.random() > 0.5 ? 0 : 1));
        }
    }

    draw() {
        // 하늘
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#87CEEB');
        grad.addColorStop(0.5, '#98D8C8');
        grad.addColorStop(1, '#90EE90');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 태양
        ctx.fillStyle = '#f9ca24';
        ctx.beginPath();
        ctx.arc(700, 50, 25, 0, Math.PI * 2);
        ctx.fill();

        // 구름
        for (let c of this.clouds) {
            ctx.fillStyle = 'rgba(255,255,255,0.9)';
            ctx.fillRect(c.x, c.y, c.size, c.size * 0.4);
            ctx.fillRect(c.x - c.size * 0.15, c.y + c.size * 0.1, c.size * 0.3, c.size * 0.2);
            ctx.fillRect(c.x + c.size * 0.7, c.y + c.size * 0.1, c.size * 0.3, c.size * 0.2);
        }

        // 잔디 (위쪽)
        ctx.fillStyle = '#55a630';
        ctx.fillRect(0, 100, canvas.width, CONFIG.ROAD_Y - 100 - 8);

        // 잔디 디테일
        ctx.fillStyle = '#2d6a4f';
        for (let x = 0; x < canvas.width; x += 20) {
            ctx.fillRect(x + (distance % 20), CONFIG.ROAD_Y - 12, 2, 4);
        }

        // 위쪽 건물/나무
        for (let obj of this.topObjects) {
            obj.draw(CONFIG.ROAD_Y - 10);
        }

        // 잔디 (아래쪽)
        ctx.fillStyle = '#55a630';
        ctx.fillRect(0, CONFIG.ROAD_Y + CONFIG.ROAD_HEIGHT + 8, canvas.width, 120);

        // 아래쪽 건물/나무
        for (let obj of this.bottomObjects) {
            obj.draw(canvas.height - 20);
        }

        // 땅
        ctx.fillStyle = '#8b6914';
        ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    }
}

// ===== 파티클 =====
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, type) {
        const colors = type === 'coin' ? ['#FFD700', '#FFFF00'] : type === 'power' ? ['#F1C40F', '#F39C12'] : ['#FF69B4', '#FFB6C1'];
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 3,
                vy: -Math.random() * 2 - 1,
                size: 2 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                life: 1
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1;
            p.life -= 0.03;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw() {
        for (let p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }
}

// ===== 게임 객체 =====
let player, road, background, particles;
let trafficCars = [];
let coins = [];
let items = [];
let lastSpawnX = 0;

function initGame() {
    road = new Road();
    player = new PlayerCar();
    player.reset();
    background = new Background();
    particles = new ParticleSystem();
    trafficCars = [];
    coins = [];
    items = [];
    score = 0;
    distance = 0;
    gameSpeed = CONFIG.GAME_SPEED;
    effectiveGameSpeed = CONFIG.GAME_SPEED;
    powerMode = false;
    powerTimer = 0;
    lastSpawnX = canvas.width + 80;
}

function checkCollision(r1, r2) {
    return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
        r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
}

function spawnObjects() {
    const gap = CONFIG.TRAFFIC_MIN_GAP + Math.random() * (CONFIG.TRAFFIC_MAX_GAP - CONFIG.TRAFFIC_MIN_GAP);

    if (lastSpawnX < canvas.width - gap) {
        const lane = Math.floor(Math.random() * CONFIG.LANE_COUNT);
        trafficCars.push(new TrafficCar(canvas.width + 40, lane));

        // 코인
        if (Math.random() < CONFIG.COIN_SPAWN_CHANCE) {
            let coinLane;
            do {
                coinLane = Math.floor(Math.random() * CONFIG.LANE_COUNT);
            } while (coinLane === lane);
            for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
                coins.push(new Coin(canvas.width + 40 + i * 18, coinLane));
            }
        }

        // 별
        if (Math.random() < 0.12) {
            items.push(new StarItem(canvas.width + 120, Math.floor(Math.random() * CONFIG.LANE_COUNT)));
        }

        // 파워 아이템
        if (Math.random() < CONFIG.POWER_SPAWN_CHANCE) {
            items.push(new PowerItem(canvas.width + 120, Math.floor(Math.random() * CONFIG.LANE_COUNT)));
        }

        lastSpawnX = canvas.width + 40;
    }
}

function update() {
    if (gameState !== 'playing') return;

    gameSpeed += CONFIG.SPEED_INCREMENT;
    effectiveGameSpeed = powerMode ? gameSpeed * 0.8 : gameSpeed;
    distance += effectiveGameSpeed * 0.1;
    distanceDisplay.textContent = Math.floor(distance);

    background.update();
    road.update();
    player.update();

    spawnObjects();
    lastSpawnX -= effectiveGameSpeed;

    for (let i = trafficCars.length - 1; i >= 0; i--) {
        trafficCars[i].update();
        if (checkCollision(player.getBounds(), trafficCars[i].getBounds())) {
            gameOver();
            return;
        }
        if (trafficCars[i].isOffScreen()) {
            trafficCars.splice(i, 1);
            score += 5;
        }
    }

    for (let i = coins.length - 1; i >= 0; i--) {
        coins[i].update();
        if (!coins[i].collected && checkCollision(player.getBounds(), coins[i].getBounds())) {
            coins[i].collected = true;
            score += 10;
            particles.emit(coins[i].x + 5, coins[i].y + 5, 'coin');
        }
        if (coins[i].isOffScreen() || coins[i].collected) coins.splice(i, 1);
    }

    for (let i = items.length - 1; i >= 0; i--) {
        items[i].update();
        if (!items[i].collected && checkCollision(player.getBounds(), items[i].getBounds())) {
            items[i].collected = true;
            if (items[i] instanceof PowerItem) {
                powerMode = true;
                powerTimer = 600; // 10초
                score += 50;
                particles.emit(items[i].x + 6, items[i].y + 6, 'power');
            } else {
                score += 100;
                particles.emit(items[i].x + 6, items[i].y + 6, 'star');
            }
        }
        if (items[i].isOffScreen() || items[i].collected) items.splice(i, 1);
    }

    if (powerTimer > 0) {
        powerTimer--;
        if (powerTimer === 0) {
            powerMode = false;
        }
    }

    particles.update();
    scoreDisplay.textContent = score;
}

function render() {
    background.draw();
    road.draw();

    for (let c of coins) c.draw();
    for (let i of items) i.draw();
    for (let t of trafficCars) t.draw();
    player.draw();
    particles.draw();
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    initGame();
    gameState = 'playing';
    startScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
}

function gameOver() {
    gameState = 'gameover';
    finalScore.textContent = score;
    finalDistance.textContent = Math.floor(distance);
    gameoverScreen.classList.remove('hidden');
}

// ===== 입력 =====
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (gameState !== 'playing') startGame();
    } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (gameState === 'playing') player.switchLane('up');
    } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (gameState === 'playing') player.switchLane('down');
    }
});

let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => { touchStartY = e.touches[0].clientY; });
canvas.addEventListener('touchend', (e) => {
    if (gameState !== 'playing') return;
    const diff = touchStartY - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 20) player.switchLane(diff > 0 ? 'up' : 'down');
});

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

initGame();
gameLoop();
