/**
 * Player - Billy Soco character with movement and animation
 */
class Player {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 56;
        this.speed = 3;

        this._rect = { x: 0, y: 0, width: 0, height: 0 };

        // Direction and movement
        this.facing = 'down';
        this.moving = false;
        this.frame = 0;
        this.animationSpeed = 0.15;
        this.animationCounter = 0;

        // Diagonal facing tracking
        this.dominantAxis = null;
        this.lastDx = 0;
        this.lastDy = 0;

        // Sprites
        this.sprites = null;
        this.loadSprites();
    }

    loadSprites() {
        const spriteSheet = new SpriteSheet(this.game);
        const result = spriteSheet.loadSprites(this.width, this.height);
        this.sprites = result.sprites;
    }

    update(dt) {
        if (this.moving) {
            this.animationCounter += this.animationSpeed;
            const walkKey = `${this.facing}_walk`;
            const frameCount = (this.sprites && this.sprites[walkKey]?.length) || 1;

            if (frameCount > 1) {
                if (this.animationCounter >= frameCount) this.animationCounter = 0;
                this.frame = Math.floor(this.animationCounter);
            } else {
                // No walk frames - just use idle
                this.frame = 0;
            }
        } else {
            this.frame = 0;
            this.animationCounter = 0;
        }
    }

    move(dx, dy, obstacles = []) {
        if (dx !== 0 || dy !== 0) {
            this.moving = true;

            // Determine dominant axis for facing direction
            const wasH = this.lastDx !== 0;
            const wasV = this.lastDy !== 0;
            const nowH = dx !== 0;
            const nowV = dy !== 0;

            if (nowH && nowV) {
                if (!wasH && nowH) this.dominantAxis = 'vertical';
                else if (!wasV && nowV) this.dominantAxis = 'horizontal';
                if (!this.dominantAxis) {
                    this.dominantAxis = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
                }
            } else if (nowH) {
                this.dominantAxis = 'horizontal';
            } else {
                this.dominantAxis = 'vertical';
            }

            if (this.dominantAxis === 'horizontal') {
                this.facing = dx > 0 ? 'right' : 'left';
            } else {
                this.facing = dy > 0 ? 'down' : 'up';
            }

            this.lastDx = dx;
            this.lastDy = dy;

            // Per-axis collision: try X first, then Y (allows sliding along walls)
            let newX = this.x + dx;
            let newY = this.y + dy;

            // Boundary clamp
            newX = Math.max(0, Math.min(newX, this.game.width - this.width));
            newY = Math.max(0, Math.min(newY, this.game.height - this.height));

            // Check X axis
            let xBlocked = false;
            for (const obs of obstacles) {
                if (this._collides(newX, this.y, obs)) {
                    xBlocked = true;
                    break;
                }
            }
            if (!xBlocked) this.x = newX;

            // Check Y axis
            let yBlocked = false;
            for (const obs of obstacles) {
                if (this._collides(this.x, newY, obs)) {
                    yBlocked = true;
                    break;
                }
            }
            if (!yBlocked) this.y = newY;
        } else {
            this.moving = false;
            this.dominantAxis = null;
            this.lastDx = 0;
            this.lastDy = 0;
        }
    }

    _collides(testX, testY, obstacle) {
        const r = obstacle.getRect();
        return testX < r.x + r.width &&
               testX + this.width > r.x &&
               testY < r.y + r.height &&
               testY + this.height > r.y;
    }

    getRect() {
        this._rect.x = this.x;
        this._rect.y = this.y;
        this._rect.width = this.width;
        this._rect.height = this.height;
        return this._rect;
    }

    render(ctx, game) {
        let spriteData;
        const walkKey = `${this.facing}_walk`;
        const idleKey = `${this.facing}_idle`;

        if (this.moving && this.sprites[walkKey] && this.sprites[walkKey].length > 0) {
            const frameIndex = Math.min(this.frame, this.sprites[walkKey].length - 1);
            spriteData = this.sprites[walkKey][frameIndex];
        } else if (this.sprites[idleKey] && this.sprites[idleKey].length > 0) {
            spriteData = this.sprites[idleKey][0];
        }

        if (spriteData && spriteData.image) {
            ctx.save();
            if (spriteData.flipped) {
                ctx.translate(this.x + this.width, this.y);
                ctx.scale(-1, 1);
                ctx.drawImage(
                    spriteData.image,
                    spriteData.sx, spriteData.sy, spriteData.sw, spriteData.sh,
                    0, 0, spriteData.width, spriteData.height
                );
            } else {
                ctx.drawImage(
                    spriteData.image,
                    spriteData.sx, spriteData.sy, spriteData.sw, spriteData.sh,
                    this.x, this.y, spriteData.width, spriteData.height
                );
            }
            ctx.restore();
        } else {
            // Fallback rectangle
            ctx.fillStyle = '#ff6b35';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#fff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('BILLY', this.x + this.width / 2, this.y + this.height / 2 + 4);
            ctx.textAlign = 'left';
        }

        // Debug collision box
        if (game.showDebug) {
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 1;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = 'lime';
            ctx.font = '10px monospace';
            ctx.fillText(`${this.facing} ${this.moving ? 'walk' : 'idle'} f:${this.frame}`, this.x, this.y - 4);
        }
    }
}

window.Player = Player;
