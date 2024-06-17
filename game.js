const config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
const socket = io();

let frogs = [];
let bubbles = [];
let swampImage;
let frogImages = [];
let bubbleImage;
let fightImage;
let hitSound;
let shootSound;
let musicEndSound;
let winSound;
let loseSound;
let finishhimSound;
let winImage;
let scoreText;
let levelText;
let nicknameText;
let timerText;

let showFightImage = false;
let showFightImageDuration = 100;
let fightImageTimer = 0;
let allowShooting = false;
let showWinImage = false;
let winDuration = 3000;
let winStartTime = null;
let gameEnded = false;
let playedFinishhimSound = false;

function preload() {
    this.load.image('swamp', 'image/болото.png');
    for (let i = 0; i < 6; i++) {
        this.load.image(`frog${i}`, `image/жаба${i}.png`);
    }
    this.load.image('bubble', 'image/пузырь.png');
    this.load.image('fight', 'image/fight.png');
    this.load.audio('hitSound', 'sound/ква.mp3');
    this.load.audio('shootSound', 'sound/пузырь.mp3');
    this.load.audio('musicEndSound', 'sound/kalambur.mp3');
    this.load.audio('winSound', 'sound/win.mp3');
    this.load.audio('loseSound', 'sound/смех.mp3');
    this.load.audio('finishhimSound', 'sound/finish him.mp3');
    this.load.image('winImage', 'image/win.png');
}

function create() {
    swampImage = this.add.image(0, 0, 'swamp').setOrigin(0);
    frogImages = [
        this.add.image(0, 0, 'жаба0'),
        this.add.image(0, 0, 'жаба1'),
        this.add.image(0, 0, 'жаба2'),
        this.add.image(0, 0, 'жаба3'),
        this.add.image(0, 0, 'жаба4'),
        this.add.image(0, 0, 'жаба5')
    ];
    bubbleImage = this.add.image(0, 0, 'bubble');
    fightImage = this.add.image(0, 0, 'fight');
    hitSound = this.sound.add('hitSound');
    shootSound = this.sound.add('shootSound');
    musicEndSound = this.sound.add('musicEndSound');
    winSound = this.sound.add('winSound');
    loseSound = this.sound.add('loseSound');
    finishhimSound = this.sound.add('finishhimSound');
    winImage = this.add.image(0, 0, 'winImage');
    scoreText = this.add.text(10, 10, '', { font: '16px Arial', fill: '#ffffff' });
    levelText = this.add.text(10, 30, '', { font: '16px Arial', fill: '#ffffff' });
    nicknameText = this.add.text(10, 50, '', { font: '16px Arial', fill: '#ffffff' });
    timerText = this.add.text(512, 30, '', { font: '48px Arial', fill: '#ffffff' }).setOrigin(0.5);

    socket.on('game_state', handleGameState);
    socket.on('game_over', handleGameOver);
    socket.on('play_sound', playSound);
    socket.on('show_fight_image', handleShowFightImage);
    socket.on('show_win_image', handleShowWinImage);
    socket.on('update_timer', handleUpdateTimer);
}

function update() {
    frogs.forEach((frog) => {
        const frogObj = this.add.image(frog.x, frog.y, `frog${frog.level}`);
        frogObj.setRotation(Phaser.Math.DegToRad(frog.angle));

        const avatar = this.add.image(frog.x, frog.y - 30, 'avatar');
        avatar.setDisplaySize(40, 40);
        avatar.setCircle(20);

        const lifeCircle = this.add.graphics();
        lifeCircle.lineStyle(2, getLifeColor(frog.lives), 1);
        lifeCircle.strokeCircle(frog.x, frog.y - 30, 22);

        if (frog.isInvincible()) {
            // Отображение эффекта неуязвимости для жабы 4-5 уровня в начале игры
            const invincibleCircle = this.add.graphics();
            invincibleCircle.lineStyle(2, 0xffffff, 0.8);
            invincibleCircle.strokeCircle(frog.x, frog.y, 30);
        }

        scoreText.setText(`Score: ${frog.score}`);
        levelText.setText(`Level: ${frog.level}`);
        nicknameText.setText(`Nickname: ${frog.nickname}`);
    });

    bubbles.forEach((bubble) => {
        this.add.image(bubble.x, bubble.y, 'bubble');
    });

    if (showFightImage) {
        fightImage.setPosition(512, 384);
        if (this.time.now - fightImageTimer > showFightImageDuration) {
            showFightImage = false;
            allowShooting = true;
            musicEndSound.play();
        }
    }

    if (showWinImage) {
        winImage.setPosition(512, 384);
        if (this.time.now - winStartTime > winDuration) {
            showWinImage = false;
        }
    }
}

function handleGameState(gameState) {
    frogs = gameState.frogs;
    bubbles = gameState.bubbles;

    if (gameState.started && !showFightImage) {
        showFightImage = true;
        fightImageTimer = this.time.now;
    }

    if (gameState.gameEnded && !gameEnded) {
        gameEnded = true;
        if (gameState.frogs.length === 1) {
            setTimeout(() => {
                winSound.play();
                showWinImage = true;
                winStartTime = this.time.now;
            }, 1000);
        } else if (gameState.frogs.length === 0) {
            loseSound.play();
        }
    }

    if (gameState.frogs.length === 2 && !playedFinishhimSound && allowShooting) {
        finishhimSound.play();
        playedFinishhimSound = true;
    } else if (gameState.frogs.length !== 2) {
        playedFinishhimSound = false;
    }
}

function handleGameOver(result) {
    // Обработка окончания игры
    alert(`Игра окончена. Результат: ${result}`);
}

function playSound(soundName) {
    if (soundName === 'hitSound') {
        hitSound.play();
    } else if (soundName === 'shootSound') {
        shootSound.play();
    }
}

function handleShowFightImage() {
    showFightImage = true;
    fightImageTimer = this.time.now;
}

function handleShowWinImage() {
    winSound.play();
    showWinImage = true;
    winStartTime = this.time.now;
}

function handleUpdateTimer(time) {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    timerText.setText(`${minutes}:${seconds.toString().padStart(2, '0')}`);
}

function getLifeColor(lives) {
    if (lives === 3) {
        return 0x00ff00;
    } else if (lives === 2) {
        return 0xffff00;
    } else if (lives === 1) {
        return 0xff0000;
    }
}