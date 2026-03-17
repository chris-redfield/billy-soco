/**
 * World - Simple single-block world for Billy Soco
 */
class World {
    constructor(game) {
        this.game = game;
        this.entities = [];
        this._generateRocks();
    }

    _generateRocks() {
        const count = 15;
        const margin = 40;
        let seed = 12345;

        function rand() {
            seed = (seed * 16807 + 0) % 2147483647;
            return (seed - 1) / 2147483646;
        }

        // Keep a safe zone in the center for the player spawn
        const cx = this.game.width / 2;
        const cy = this.game.height / 2;
        const safeRadius = 80;

        for (let i = 0; i < count; i++) {
            const type = Math.floor(rand() * 3) + 1;
            const scale = 0.25 + rand() * 0.35;
            const size = Math.floor(100 * scale);
            const x = margin + rand() * (this.game.width - margin * 2 - size);
            const y = margin + rand() * (this.game.height - margin * 2 - size);

            // Skip if too close to player spawn
            const dx = (x + size / 2) - cx;
            const dy = (y + size / 2) - cy;
            if (Math.sqrt(dx * dx + dy * dy) < safeRadius) continue;

            this.entities.push(new Rock(this.game, x, y, size, type));
        }
    }

    getObstacles() {
        return this.entities.filter(e => e.isObstacle);
    }

    render(ctx) {
        // Flat desert sand
        ctx.fillStyle = '#c2956b';
        ctx.fillRect(0, 0, this.game.width, this.game.height);
    }
}

window.World = World;
