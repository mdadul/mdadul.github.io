// Chrome Dinosaur Game - Complete Clone
class ChromeDinoGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        
        // Game states
        this.gameRunning = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('dinoHighScore')) || 0;
        this.gameSpeed = 8;
        this.maxGameSpeed = 16;
        this.speedIncreaseInterval = 500;
        this.animationId = null;  // Track animation frame
        
        // Dark mode
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.setupDarkMode();
        
        // Dino properties
        this.dino = {
            x: 50,
            y: 0,
            width: 44,
            height: 52,
            velocityY: 0,
            isJumping: false,
            isDucking: false,
            frameIndex: 0,
            frameCounter: 0
        };
        
        // Ground
        this.groundY = this.canvas.height - 15;
        
        // Obstacles
        this.obstacles = [];
        this.obstacleSpawnRate = 150;
        this.obstacleSpawnCounter = 0;
        
        // Clouds
        this.clouds = [];
        this.spawnCloud();
        
        // Game constants
        this.gravity = 0.6;
        this.jumpPower = -14;
        
        // Update score display
        this.updateScoreDisplay();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Auto start game
        this.startGame();
    }

    setupDarkMode() {
        const toggleBtn = document.getElementById('toggle-dark');
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
        }
        
        toggleBtn.addEventListener('click', () => {
            this.darkMode = !this.darkMode;
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', this.darkMode);
        });
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                if (!this.gameRunning && this.gameOver) {
                    this.restartGame();
                } else if (this.gameRunning && !this.dino.isJumping) {
                    this.jump();
                }
            }
            
            if (e.code === 'ArrowDown') {
                e.preventDefault();
                if (this.gameRunning && !this.dino.isJumping) {
                    this.duck();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            if (e.code === 'ArrowDown') {
                this.stopDuck();
            }
        });

        this.canvas.addEventListener('click', () => {
            if (!this.gameRunning && this.gameOver) {
                this.restartGame();
            } else if (this.gameRunning && !this.dino.isJumping) {
                this.jump();
            }
        });

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!this.gameRunning && this.gameOver) {
                this.restartGame();
            } else if (this.gameRunning) {
                const touchY = e.touches[0].clientY;
                const canvasRect = this.canvas.getBoundingClientRect();
                const relativeY = touchY - canvasRect.top;
                
                if (relativeY > this.canvas.height * 0.6 && !this.dino.isJumping) {
                    this.duck();
                } else if (!this.dino.isJumping) {
                    this.jump();
                }
            }
        });

        this.canvas.addEventListener('touchend', (e) => {
            this.stopDuck();
        });
    }

    startGame() {
        // Cancel previous animation frame if it exists
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.gameRunning = true;
        this.gameOver = false;
        this.score = 0;
        this.gameSpeed = 8;  // Reset to initial speed
        this.obstacleSpawnRate = 150;  // Reset spawn rate
        this.obstacleSpawnCounter = 0;  // Reset counter
        this.dino.y = 0;
        this.dino.velocityY = 0;
        this.dino.isDucking = false;
        this.dino.isJumping = false;
        this.dino.frameIndex = 0;
        this.dino.frameCounter = 0;
        this.obstacles = [];
        this.clouds = [];
        this.spawnCloud();  // Respawn clouds
        this.updateScoreDisplay();
        this.gameLoop();
    }

    jump() {
        if (this.dino.isJumping) return;
        this.dino.isJumping = true;
        this.dino.velocityY = this.jumpPower;
    }

    duck() {
        this.dino.isDucking = true;
    }

    stopDuck() {
        this.dino.isDucking = false;
    }

    restartGame() {
        this.startGame();
    }

    update() {
        if (!this.gameRunning) return;

        // Update dino physics
        this.dino.velocityY += this.gravity;
        this.dino.y += this.dino.velocityY;

        // Ground collision
        if (this.dino.y + this.dino.height >= this.groundY) {
            this.dino.y = this.groundY - this.dino.height;
            this.dino.velocityY = 0;
            this.dino.isJumping = false;
        }

        // Update dino animation
        this.dino.frameCounter++;
        if (this.dino.isJumping || this.dino.isDucking) {
            this.dino.frameIndex = 0;
        } else if (this.dino.frameCounter % 6 === 0) {
            this.dino.frameIndex = (this.dino.frameIndex + 1) % 2;
        }

        // Spawn obstacles
        this.obstacleSpawnCounter++;
        if (this.obstacleSpawnCounter > this.obstacleSpawnRate) {
            this.spawnObstacle();
            this.obstacleSpawnCounter = 0;
        }

        // Update obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].x -= this.gameSpeed;

            // Check collision
            if (this.checkCollision(this.dino, this.obstacles[i])) {
                this.endGame();
                return;
            }

            // Remove obstacles that are off screen
            if (this.obstacles[i].x + this.obstacles[i].width < 0) {
                this.obstacles.splice(i, 1);
                this.score += 100;
                this.updateScoreDisplay();
                
                // Increase game speed at intervals
                if (this.score % this.speedIncreaseInterval === 0 && this.gameSpeed < this.maxGameSpeed) {
                    this.gameSpeed += 0.3;
                    this.obstacleSpawnRate = Math.max(80, this.obstacleSpawnRate - 3);
                }
            }
        }

        // Update clouds
        for (let cloud of this.clouds) {
            cloud.x -= this.gameSpeed * 0.4;
            if (cloud.x < -100) {
                cloud.x = this.canvas.width;
            }
        }
    }

    spawnObstacle() {
        const obstacleType = Math.random() < 0.75 ? 'cactus' : 'bird';
        
        if (obstacleType === 'cactus') {
            const cactiCount = Math.floor(Math.random() * 3) + 1;
            const width = 20 * cactiCount + 8 * (cactiCount - 1);
            const obstacle = {
                x: this.canvas.width,
                y: this.groundY - 50,
                width: width,
                height: 50,
                type: 'cactus',
                cactiCount: cactiCount
            };
            this.obstacles.push(obstacle);
        } else {
            const birdHeight = Math.random() > 0.5 ? 40 : 65;
            const obstacle = {
                x: this.canvas.width,
                y: this.groundY - birdHeight,
                width: 50,
                height: 30,
                type: 'bird',
                birdHeight: birdHeight
            };
            this.obstacles.push(obstacle);
        }
    }

    spawnCloud() {
        for (let i = 0; i < 3; i++) {
            const cloud = {
                x: Math.random() * this.canvas.width,
                y: Math.random() * 70 + 30,
                width: 50,
                height: 25
            };
            this.clouds.push(cloud);
        }
    }

    checkCollision(dino, obstacle) {
        let dinoLeft, dinoRight, dinoTop, dinoBottom;
        
        if (dino.isDucking) {
            dinoLeft = dino.x + 8;
            dinoRight = dino.x + dino.width - 8;
            dinoTop = dino.y + 30;
            dinoBottom = dino.y + dino.height;
        } else {
            dinoLeft = dino.x + 10;
            dinoRight = dino.x + dino.width - 12;
            dinoTop = dino.y + 8;
            dinoBottom = dino.y + dino.height;
        }

        const obstacleLeft = obstacle.x + 5;
        const obstacleRight = obstacle.x + obstacle.width - 5;
        const obstacleTop = obstacle.y;
        const obstacleBottom = obstacle.y + obstacle.height;

        return dinoRight > obstacleLeft &&
               dinoLeft < obstacleRight &&
               dinoBottom > obstacleTop &&
               dinoTop < obstacleBottom;
    }

    endGame() {
        this.gameRunning = false;
        this.gameOver = true;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('dinoHighScore', this.highScore);
            this.updateScoreDisplay();
        }
    }

    updateScoreDisplay() {
        this.scoreElement.textContent = String(this.score).padStart(6, '0');
        this.highScoreElement.textContent = String(this.highScore).padStart(6, '0');
    }

    getCanvasColor() {
        return this.darkMode ? '#1a1a1a' : '#f7f7f7';
    }

    getTextColor() {
        return this.darkMode ? '#ffffff' : '#666';
    }

    draw() {
        const bgColor = this.getCanvasColor();
        const textColor = this.getTextColor();

        // Clear canvas
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw clouds
        for (let cloud of this.clouds) {
            this.drawCloud(cloud);
        }

        // Draw ground
        this.drawGround();

        // Draw obstacles
        for (let obstacle of this.obstacles) {
            if (obstacle.type === 'cactus') {
                this.drawCactus(obstacle);
            } else {
                this.drawBird(obstacle);
            }
        }

        // Draw dino
        this.drawDino();

        // Draw game over
        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    drawDino() {
        const ctx = this.ctx;
        const x = this.dino.x;
        const y = this.dino.y;
        const textColor = this.getTextColor();

        ctx.fillStyle = textColor;
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;

        if (this.dino.isDucking) {
            const ducking_y = y + 20;
            
            // Body
            ctx.fillRect(x + 5, ducking_y + 10, 35, 20);
            
            // Head
            ctx.fillRect(x + 33, ducking_y + 8, 10, 10);
            ctx.fillRect(x + 42, ducking_y + 9, 3, 4);
            
            // Eye
            ctx.fillStyle = this.darkMode ? '#1a1a1a' : '#ffffff';
            ctx.fillRect(x + 36, ducking_y + 9, 2, 2);
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 36.5, ducking_y + 9.5, 1, 1);
            
            // Legs
            ctx.fillStyle = textColor;
            ctx.fillRect(x + 10, ducking_y + 30, 3, 5);
            ctx.fillRect(x + 22, ducking_y + 30, 3, 5);
            
            // Tail
            ctx.fillRect(x + 32, ducking_y + 18, 12, 3);
        } else {
            // Body
            ctx.fillRect(x + 8, y + 18, 18, 22);
            
            // Head
            ctx.fillRect(x + 26, y + 8, 12, 12);
            
            // Snout
            ctx.fillRect(x + 38, y + 10, 4, 5);
            
            // Eye
            ctx.fillStyle = this.darkMode ? '#1a1a1a' : '#ffffff';
            ctx.fillRect(x + 30, y + 9, 3, 3);
            ctx.fillStyle = '#000';
            ctx.fillRect(x + 31, y + 10, 1, 1);
            
            // Legs
            ctx.fillStyle = textColor;
            if (this.dino.frameIndex === 0) {
                ctx.fillRect(x + 10, y + 40, 4, 10);
                ctx.fillRect(x + 18, y + 42, 4, 8);
            } else {
                ctx.fillRect(x + 10, y + 42, 4, 8);
                ctx.fillRect(x + 18, y + 40, 4, 10);
            }
            
            // Tail
            ctx.fillRect(x + 26, y + 28, 16, 4);
            
            // Stripe
            ctx.strokeStyle = textColor;
            ctx.beginPath();
            ctx.moveTo(x + 14, y + 20);
            ctx.lineTo(x + 14, y + 38);
            ctx.stroke();
        }
    }

    drawCactus(obstacle) {
        const ctx = this.ctx;
        const x = obstacle.x;
        const y = obstacle.y;
        const textColor = this.getTextColor();

        ctx.fillStyle = textColor;
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;

        for (let i = 0; i < obstacle.cactiCount; i++) {
            const offsetX = i * 28;
            
            // Main trunk
            ctx.fillRect(x + offsetX + 5, y + 10, 10, 38);
            ctx.strokeRect(x + offsetX + 5, y + 10, 10, 38);
            
            // Spikes
            ctx.fillRect(x + offsetX + 2, y + 18, 4, 8);
            ctx.strokeRect(x + offsetX + 2, y + 18, 4, 8);
            
            ctx.fillRect(x + offsetX + 14, y + 18, 4, 8);
            ctx.strokeRect(x + offsetX + 14, y + 18, 4, 8);
            
            // Upper details
            ctx.fillRect(x + offsetX + 3, y + 12, 2, 3);
            ctx.fillRect(x + offsetX + 15, y + 12, 2, 3);
        }
    }

    drawBird(obstacle) {
        const ctx = this.ctx;
        const x = obstacle.x;
        const y = obstacle.y;
        const textColor = this.getTextColor();

        ctx.fillStyle = textColor;
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 1;

        const flapFrame = Math.floor((this.score / 8) % 2);

        // Body
        ctx.beginPath();
        ctx.ellipse(x + 20, y + 15, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Head
        ctx.beginPath();
        ctx.ellipse(x + 32, y + 10, 7, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Eye
        ctx.fillStyle = this.darkMode ? '#1a1a1a' : '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 35, y + 8, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 36, y + 8, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Beak
        ctx.fillStyle = textColor;
        ctx.beginPath();
        ctx.moveTo(x + 39, y + 10);
        ctx.lineTo(x + 44, y + 10);
        ctx.lineTo(x + 39, y + 11);
        ctx.fill();
        
        // Wings
        ctx.fillStyle = textColor;
        if (flapFrame === 0) {
            ctx.beginPath();
            ctx.moveTo(x + 15, y + 12);
            ctx.lineTo(x + 10, y + 5);
            ctx.lineTo(x + 18, y + 8);
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + 25, y + 12);
            ctx.lineTo(x + 30, y + 5);
            ctx.lineTo(x + 22, y + 8);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.beginPath();
            ctx.moveTo(x + 15, y + 12);
            ctx.lineTo(x + 10, y + 20);
            ctx.lineTo(x + 18, y + 16);
            ctx.fill();
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x + 25, y + 12);
            ctx.lineTo(x + 30, y + 20);
            ctx.lineTo(x + 22, y + 16);
            ctx.fill();
            ctx.stroke();
        }
        
        // Legs
        ctx.fillRect(x + 17, y + 22, 2, 5);
        ctx.fillRect(x + 23, y + 22, 2, 5);
    }

    drawCloud(cloud) {
        const ctx = this.ctx;
        const x = cloud.x;
        const y = cloud.y;
        const opacity = this.darkMode ? 0.2 : 0.4;

        ctx.fillStyle = `rgba(180, 180, 180, ${opacity})`;
        
        ctx.beginPath();
        ctx.arc(x + 10, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + 25, y - 2, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x + 40, y, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    drawGround() {
        const ctx = this.ctx;
        const textColor = this.getTextColor();
        
        ctx.strokeStyle = textColor;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, this.groundY);
        ctx.lineTo(this.canvas.width, this.groundY);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Ground pattern
        ctx.strokeStyle = textColor;
        ctx.globalAlpha = 0.3;
        ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 30) {
            ctx.beginPath();
            ctx.moveTo(i, this.groundY + 1);
            ctx.lineTo(i + 15, this.groundY + 6);
            ctx.lineTo(i + 30, this.groundY + 1);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    }

    drawGameOver() {
        const ctx = this.ctx;
        const bgColor = this.darkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.7)';
        const textColor = this.darkMode ? '#ffffff' : '#333';

        // Overlay
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game Over text
        ctx.fillStyle = textColor;
        ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
        
        // Restart instruction
        ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI"';
        ctx.fillStyle = this.darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
        ctx.fillText('Press SPACE or tap to restart', this.canvas.width / 2, this.canvas.height / 2 + 20);
    }

    gameLoop() {
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ChromeDinoGame();
});
