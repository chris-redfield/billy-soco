/**
 * World - Seamless world with block-based loading
 *
 * Supports infinite stages (3x3 around player) and finite stages (predefined blocks with lava borders).
 * Camera follows the player. Finite stages get camera clamping.
 */

const BLOCK_W = 1280;
const BLOCK_H = 720;
const LAVA_W = 40;

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
    constructor(game, stage) {
        this.game = game;
        this.stage = stage;
        this.blocks = {};
        this.currentBlockX = 0;
        this.currentBlockY = 0;

        this.cameraX = 0;
        this.cameraY = 0;

        // Cache valid block keys for finite stages
        this._validBlocks = null;
        if (stage.type === 'finite' && stage.blocks) {
            this._validBlocks = new Set(stage.blocks.map(b => `${b[0]},${b[1]}`));
        }
    }

    _isValidBlock(bx, by) {
        if (this.stage.type === 'infinite') return true;
        return this._validBlocks.has(`${bx},${by}`);
    }

    /**
     * Load the 3x3 grid around a block coordinate (only valid blocks). Unload anything outside.
     */
    loadSurrounding(bx, by) {
        this.currentBlockX = bx;
        this.currentBlockY = by;

        const needed = new Set();
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nbx = bx + dx;
                const nby = by + dy;
                if (!this._isValidBlock(nbx, nby)) continue;
                const key = `${nbx},${nby}`;
                needed.add(key);
                if (!this.blocks[key]) {
                    this.blocks[key] = this._generateBlock(nbx, nby);
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
        this.cameraX = player.x + player.width / 2 - this.game.width / 2;
        this.cameraY = player.y + player.height / 2 - this.game.height / 2;

        // Clamp camera for finite stages
        if (this.stage.type === 'finite') {
            const b = this._getStageBounds();
            if (b.w >= this.game.width) {
                this.cameraX = Math.max(b.x, Math.min(this.cameraX, b.x + b.w - this.game.width));
            } else {
                this.cameraX = b.x + (b.w - this.game.width) / 2;
            }
            if (b.h >= this.game.height) {
                this.cameraY = Math.max(b.y, Math.min(this.cameraY, b.y + b.h - this.game.height));
            } else {
                this.cameraY = b.y + (b.h - this.game.height) / 2;
            }
        }

        const bx = Math.floor(player.x / BLOCK_W);
        const by = Math.floor(player.y / BLOCK_H);

        if (bx !== this.currentBlockX || by !== this.currentBlockY) {
            this.loadSurrounding(bx, by);
        }
    }

    _getStageBounds() {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const [bx, by] of this.stage.blocks) {
            minX = Math.min(minX, bx * BLOCK_W);
            minY = Math.min(minY, by * BLOCK_H);
            maxX = Math.max(maxX, (bx + 1) * BLOCK_W);
            maxY = Math.max(maxY, (by + 1) * BLOCK_H);
        }
        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
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
     * Get all entities that render in the entity layer (excludes ground-layer like lava).
     */
    getAllEntities() {
        const all = [];
        for (const block of Object.values(this.blocks)) {
            for (const e of block.entities) {
                if (e.renderLayer !== 'ground') all.push(e);
            }
        }
        return all;
    }

    /**
     * Check if the player overlaps a portal. Returns the portal or null.
     */
    getPortalAt(player) {
        for (const block of Object.values(this.blocks)) {
            for (const e of block.entities) {
                if (e.entityType === 'portal') {
                    if (player.x < e.x + e.width &&
                        player.x + player.width > e.x &&
                        player.y < e.y + e.height &&
                        player.y + player.height > e.y) {
                        return e;
                    }
                }
            }
        }
        return null;
    }

    /**
     * Render the ground for all loaded blocks, then ground-layer entities (lava).
     */
    renderGround(ctx) {
        const cx = this.cameraX;
        const cy = this.cameraY;

        for (const block of Object.values(this.blocks)) {
            const screenX = Math.round(block.xCoord * BLOCK_W - cx);
            const screenY = Math.round(block.yCoord * BLOCK_H - cy);

            if (screenX + BLOCK_W < 0 || screenX > this.game.width ||
                screenY + BLOCK_H < 0 || screenY > this.game.height) continue;

            // +1 overlap to prevent sub-pixel seams between blocks
            ctx.fillStyle = this.stage.groundColor;
            ctx.fillRect(screenX, screenY, BLOCK_W + 1, BLOCK_H + 1);

            // Checkerboard pattern (world-coordinate aligned for seamless tiling)
            if (this.stage.checkerboard) {
                const cb = this.stage.checkerboard;
                const ts = cb.tileSize;
                const ox = block.xCoord * BLOCK_W;
                const oy = block.yCoord * BLOCK_H;

                ctx.fillStyle = cb.color;

                if (cb.diagonal) {
                    // Diagonal: diamond tiles using rotated grid (u=wx+wy, v=wx-wy)
                    const hs = ts / 2;
                    const uMin = ox + oy;
                    const uMax = ox + BLOCK_W + oy + BLOCK_H;
                    const vMin = ox - oy - BLOCK_H;
                    const vMax = ox + BLOCK_W - oy;
                    const startIU = Math.floor(uMin / ts);
                    const endIU = Math.ceil(uMax / ts);
                    const startIV = Math.floor(vMin / ts);
                    const endIV = Math.ceil(vMax / ts);
                    const gw = this.game.width;
                    const gh = this.game.height;

                    ctx.beginPath();
                    for (let iu = startIU; iu < endIU; iu++) {
                        for (let iv = startIV; iv < endIV; iv++) {
                            if ((iu + iv) % 2 === 0) continue;

                            // Bounding box screen check
                            const bbx = (iu + iv) * hs - cx;
                            const bby = (iu - iv - 1) * hs - cy;
                            if (bbx + ts < 0 || bbx > gw || bby + ts < 0 || bby > gh) continue;

                            // Diamond vertices in world coords → screen
                            const bx = (iu + iv) * hs;
                            const by = (iu - iv) * hs;
                            ctx.moveTo(Math.round(bx - cx), Math.round(by - cy));
                            ctx.lineTo(Math.round(bx + hs - cx), Math.round(by + hs - cy));
                            ctx.lineTo(Math.round(bx + ts - cx), Math.round(by - cy));
                            ctx.lineTo(Math.round(bx + hs - cx), Math.round(by - hs - cy));
                            ctx.closePath();
                        }
                    }
                    ctx.fill();
                } else {
                    // Standard axis-aligned checkerboard
                    const startTX = Math.floor(ox / ts);
                    const startTY = Math.floor(oy / ts);
                    const endTX = Math.ceil((ox + BLOCK_W) / ts);
                    const endTY = Math.ceil((oy + BLOCK_H) / ts);

                    for (let ty = startTY; ty < endTY; ty++) {
                        for (let tx = startTX; tx < endTX; tx++) {
                            if ((tx + ty) % 2 === 0) continue;
                            const drawX = Math.max(tx * ts, ox);
                            const drawY = Math.max(ty * ts, oy);
                            const drawW = Math.min(tx * ts + ts, ox + BLOCK_W) - drawX;
                            const drawH = Math.min(ty * ts + ts, oy + BLOCK_H) - drawY;
                            if (drawW <= 0 || drawH <= 0) continue;
                            ctx.fillRect(Math.round(drawX - cx), Math.round(drawY - cy), drawW, drawH);
                        }
                    }
                }
            }

            if (this.game.showDebug) {
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                ctx.strokeRect(screenX, screenY, BLOCK_W, BLOCK_H);
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.font = '14px monospace';
                ctx.fillText(`(${block.xCoord},${block.yCoord})`, screenX + 8, screenY + 20);
            }
        }

        // Ground-layer entities (lava)
        for (const block of Object.values(this.blocks)) {
            for (const e of block.entities) {
                if (e.renderLayer === 'ground') {
                    const esx = e.x - cx;
                    const esy = e.y - cy;
                    if (esx + e.width < 0 || esx > this.game.width ||
                        esy + e.height < 0 || esy > this.game.height) continue;
                    e.render(ctx, this.game, cx, cy);
                }
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

        const ox = bx * BLOCK_W;
        const oy = by * BLOCK_H;

        // Safe zone
        const sz = this.stage.safeZone;
        const safeRadius = sz ? sz.radius : 0;

        // Rocks
        const [minRocks, maxRocks] = this.stage.rockCount;
        const rockCount = minRocks + Math.floor(rand() * (maxRocks - minRocks + 1));
        const margin = this.stage.type === 'finite' ? 60 : 30;

        for (let i = 0; i < rockCount; i++) {
            const type = Math.floor(rand() * 3) + 1;
            const scale = 0.25 + rand() * 0.35;
            const size = Math.floor(100 * scale);
            const x = ox + margin + rand() * (BLOCK_W - margin * 2 - size);
            const y = oy + margin + rand() * (BLOCK_H - margin * 2 - size);

            // Skip if in safe zone
            if (safeRadius > 0 && sz) {
                const dx = (x + size / 2) - sz.x;
                const dy = (y + size / 2) - sz.y;
                if (Math.sqrt(dx * dx + dy * dy) < safeRadius) continue;
            }

            // Skip if overlapping a portal position
            let overlapsPortal = false;
            if (this.stage.portals) {
                for (const p of this.stage.portals) {
                    const pbx = Math.floor(p.x / BLOCK_W);
                    const pby = Math.floor(p.y / BLOCK_H);
                    if (pbx === bx && pby === by) {
                        const dx = (x + size / 2) - (p.x + 24);
                        const dy = (y + size / 2) - (p.y + 32);
                        if (Math.sqrt(dx * dx + dy * dy) < 80) {
                            overlapsPortal = true;
                            break;
                        }
                    }
                }
            }
            if (overlapsPortal) continue;

            block.addEntity(new Rock(this.game, x, y, size, type));
        }

        // Add portals that belong to this block
        if (this.stage.portals) {
            for (const p of this.stage.portals) {
                const pbx = Math.floor(p.x / BLOCK_W);
                const pby = Math.floor(p.y / BLOCK_H);
                if (pbx === bx && pby === by) {
                    block.addEntity(new Portal(this.game, p.x, p.y, p.targetStage, p.label));
                }
            }
        }

        // Add lava boundaries for finite stages
        if (this.stage.type === 'finite') {
            if (!this._isValidBlock(bx, by - 1)) {
                block.addEntity(new Lava(this.game, ox, oy, BLOCK_W, LAVA_W));
            }
            if (!this._isValidBlock(bx, by + 1)) {
                block.addEntity(new Lava(this.game, ox, oy + BLOCK_H - LAVA_W, BLOCK_W, LAVA_W));
            }
            if (!this._isValidBlock(bx - 1, by)) {
                block.addEntity(new Lava(this.game, ox, oy, LAVA_W, BLOCK_H));
            }
            if (!this._isValidBlock(bx + 1, by)) {
                block.addEntity(new Lava(this.game, ox + BLOCK_W - LAVA_W, oy, LAVA_W, BLOCK_H));
            }
        }

        return block;
    }
}

window.World = World;
window.BLOCK_W = BLOCK_W;
window.BLOCK_H = BLOCK_H;
