/**
 * World - Seamless infinite world with block-based loading
 *
 * Blocks are 1280x720 chunks. Only 9 blocks (3x3 around player) are loaded.
 * Camera follows the player. No transitions - player walks freely between blocks.
 */

const BLOCK_W = 1280;
const BLOCK_H = 720;

class WorldBlock {
    constructor(xCoord, yCoord) {
        this.xCoord = xCoord;
        this.yCoord = yCoord;
        this.entities = [];
    }

    addEntity(entity) {
        this.entities.push(entity);
    }
}

class World {
    constructor(game) {
        this.game = game;
        this.blocks = {};              // "x,y" -> WorldBlock
        this.currentBlockX = 0;
        this.currentBlockY = 0;

        // Camera position (top-left corner of viewport in world coords)
        this.cameraX = 0;
        this.cameraY = 0;
    }

    /**
     * Load the 3x3 grid around a block coordinate. Unload anything outside.
     */
    loadSurrounding(bx, by) {
        this.currentBlockX = bx;
        this.currentBlockY = by;

        const needed = new Set();
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const key = `${bx + dx},${by + dy}`;
                needed.add(key);
                if (!this.blocks[key]) {
                    this.blocks[key] = this._generateBlock(bx + dx, by + dy);
                }
            }
        }

        // Unload blocks outside the 3x3
        for (const key of Object.keys(this.blocks)) {
            if (!needed.has(key)) {
                delete this.blocks[key];
            }
        }
    }

    /**
     * Update camera to follow player and check if we need to load new blocks.
     */
    update(player) {
        // Camera centers on player
        this.cameraX = player.x + player.width / 2 - this.game.width / 2;
        this.cameraY = player.y + player.height / 2 - this.game.height / 2;

        // Which block is the player in?
        const bx = Math.floor(player.x / BLOCK_W);
        const by = Math.floor(player.y / BLOCK_H);

        if (bx !== this.currentBlockX || by !== this.currentBlockY) {
            this.loadSurrounding(bx, by);
        }
    }

    /**
     * Get all obstacles from all loaded blocks.
     */
    getObstacles() {
        const obstacles = [];
        for (const block of Object.values(this.blocks)) {
            for (const e of block.entities) {
                if (e.isObstacle) obstacles.push(e);
            }
        }
        return obstacles;
    }

    /**
     * Get all entities from all loaded blocks.
     */
    getAllEntities() {
        const all = [];
        for (const block of Object.values(this.blocks)) {
            for (const e of block.entities) {
                all.push(e);
            }
        }
        return all;
    }

    /**
     * Render the ground for all loaded blocks.
     */
    renderGround(ctx) {
        const cx = this.cameraX;
        const cy = this.cameraY;

        for (const block of Object.values(this.blocks)) {
            const screenX = block.xCoord * BLOCK_W - cx;
            const screenY = block.yCoord * BLOCK_H - cy;

            // Skip if off-screen
            if (screenX + BLOCK_W < 0 || screenX > this.game.width ||
                screenY + BLOCK_H < 0 || screenY > this.game.height) continue;

            ctx.fillStyle = '#c2956b';
            ctx.fillRect(screenX, screenY, BLOCK_W, BLOCK_H);

            // Subtle block border for debug
            if (this.game.showDebug) {
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, BLOCK_W, BLOCK_H);
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '14px monospace';
                ctx.fillText(`(${block.xCoord},${block.yCoord})`, screenX + 8, screenY + 20);
            }
        }
    }

    // --- Block generation ---

    _generateBlock(bx, by) {
        const block = new WorldBlock(bx, by);

        // Seeded random based on block coords (deterministic)
        let seed = ((bx * 73856093) ^ (by * 19349663)) >>> 0;
        if (seed === 0) seed = 1;
        function rand() {
            seed = (seed * 16807 + 0) % 2147483647;
            return (seed - 1) / 2147483646;
        }

        // World-space origin of this block
        const ox = bx * BLOCK_W;
        const oy = by * BLOCK_H;

        // Safe zone around center of origin block
        const isOrigin = bx === 0 && by === 0;
        const safeCX = ox + BLOCK_W / 2;
        const safeCY = oy + BLOCK_H / 2;
        const safeRadius = isOrigin ? 120 : 0;

        // Rocks: 5-12 per block
        const rockCount = 5 + Math.floor(rand() * 8);
        const margin = 30;

        for (let i = 0; i < rockCount; i++) {
            const type = Math.floor(rand() * 3) + 1;
            const scale = 0.25 + rand() * 0.35;
            const size = Math.floor(100 * scale);
            const x = ox + margin + rand() * (BLOCK_W - margin * 2 - size);
            const y = oy + margin + rand() * (BLOCK_H - margin * 2 - size);

            // Skip if in safe zone
            if (safeRadius > 0) {
                const dx = (x + size / 2) - safeCX;
                const dy = (y + size / 2) - safeCY;
                if (Math.sqrt(dx * dx + dy * dy) < safeRadius) continue;
            }

            block.addEntity(new Rock(this.game, x, y, size, type));
        }

        return block;
    }
}

window.World = World;
window.BLOCK_W = BLOCK_W;
window.BLOCK_H = BLOCK_H;
