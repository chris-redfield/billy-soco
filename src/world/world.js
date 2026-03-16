/**
 * World - Simple single-block world for Billy Soco
 */
class World {
    constructor(game) {
        this.game = game;
    }

    render(ctx) {
        // Draw a simple ground pattern
        ctx.fillStyle = '#2d5a27';
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        // Subtle grass texture with darker patches
        ctx.fillStyle = '#245020';
        for (let x = 0; x < this.game.width; x += 64) {
            for (let y = 0; y < this.game.height; y += 64) {
                // Deterministic pseudo-random pattern
                const hash = ((x * 7 + y * 13) % 37);
                if (hash < 12) {
                    ctx.fillRect(x + (hash % 8) * 4, y + (hash % 6) * 4, 16, 16);
                }
            }
        }

        // A few lighter grass spots
        ctx.fillStyle = '#3a7a33';
        for (let x = 20; x < this.game.width; x += 80) {
            for (let y = 30; y < this.game.height; y += 80) {
                const hash = ((x * 3 + y * 11) % 29);
                if (hash < 8) {
                    ctx.fillRect(x, y, 8, 8);
                }
            }
        }
    }
}

window.World = World;
