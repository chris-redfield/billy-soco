/**
 * Billy Soco - Main entry point
 */

let game;

const gameState = {
    player: null,
    world: null
};

async function init() {
    console.log('Initializing Billy Soco...');

    game = new Game('game-canvas');
    await game.loadAssets();

    // Create world
    gameState.world = new World(game);

    // Player starts at center of block (0,0)
    const startX = BLOCK_W / 2 - 24;
    const startY = BLOCK_H / 2 - 28;
    gameState.player = new Player(game, startX, startY);

    // Load initial 9 blocks around origin
    gameState.world.loadSurrounding(0, 0);

    game.onUpdate = (dt) => updateGame(dt);
    game.onRender = (ctx) => renderGame(ctx);

    game.start();
    console.log('Game started! WASD to move. Hold C for debug info.');
}

function updateGame(dt) {
    const player = gameState.player;
    const world = gameState.world;
    const obstacles = world.getObstacles();
    const movement = game.input.getMovementVector();

    player.move(movement.x * player.speed, movement.y * player.speed, obstacles);
    player.update(dt);
    world.update(player);
}

function renderGame(ctx) {
    const world = gameState.world;
    const player = gameState.player;
    const camX = world.cameraX;
    const camY = world.cameraY;

    // Draw ground tiles
    world.renderGround(ctx);

    // Collect all renderables, depth-sort by bottom edge
    const entities = world.getAllEntities();
    entities.push(player);
    entities.sort((a, b) => (a.y + a.height) - (b.y + b.height));

    // Render with camera offset
    for (const entity of entities) {
        // Skip entities off screen
        const sx = entity.x - camX;
        const sy = entity.y - camY;
        if (sx + entity.width < 0 || sx > game.width ||
            sy + entity.height < 0 || sy > game.height) continue;

        entity.render(ctx, game, camX, camY);
    }

    // Debug: show block coords and player world position
    if (game.showDebug) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(4, game.height - 52, 280, 48);
        ctx.fillStyle = '#0f0';
        ctx.font = '12px monospace';
        const bx = Math.floor(player.x / BLOCK_W);
        const by = Math.floor(player.y / BLOCK_H);
        ctx.fillText(`World: ${Math.floor(player.x)}, ${Math.floor(player.y)}  Block: (${bx}, ${by})`, 10, game.height - 34);
        ctx.fillText(`Loaded blocks: ${Object.keys(world.blocks).length}`, 10, game.height - 16);
    }
}

window.addEventListener('load', init);
