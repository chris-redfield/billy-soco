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

    // Load assets
    await game.loadAssets();

    // Create world (single block)
    gameState.world = new World(game);

    // Create player at center of screen
    const centerX = game.width / 2 - 24;
    const centerY = game.height / 2 - 28;
    gameState.player = new Player(game, centerX, centerY);

    game.onUpdate = (dt) => updateGame(dt);
    game.onRender = (ctx) => renderGame(ctx);

    game.start();
    console.log('Game started! WASD to move. Hold C for debug info.');
}

function updateGame(dt) {
    const player = gameState.player;
    const movement = game.input.getMovementVector();

    player.move(movement.x * player.speed, movement.y * player.speed);
    player.update(dt);
}

function renderGame(ctx) {
    // Draw world ground
    gameState.world.render(ctx);

    // Draw player
    gameState.player.render(ctx, game);
}

window.addEventListener('load', init);
