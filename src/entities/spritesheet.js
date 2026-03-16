/**
 * SpriteSheet - Loads Billy Soco sprites from the spritesheet
 * Uses frame coordinates exported from the sprite-selector tool
 */
class SpriteSheet {
    constructor(game) {
        this.game = game;
    }

    /**
     * Load Billy's sprites using frame coordinate data.
     * frameData is an object like:
     * {
     *   "down_idle": [{ x, y, w, h }],
     *   "up_idle": [{ x, y, w, h }],
     *   "right_idle": [{ x, y, w, h }],
     *   "left_idle": [{ x, y, w, h }],
     *   "down_walk": [{ x, y, w, h }, ...],
     *   "up_walk": [{ x, y, w, h }, ...],
     *   "right_walk": [{ x, y, w, h }, ...],
     *   "left_walk": [{ x, y, w, h }, ...]
     * }
     */
    loadSprites(frameData, targetWidth, targetHeight) {
        const spritesheet = this.game.getImage('billy_spritesheet');

        const sprites = {
            down_idle: [], down_walk: [],
            up_idle: [], up_walk: [],
            right_idle: [], right_walk: [],
            left_idle: [], left_walk: []
        };

        for (const [key, frames] of Object.entries(frameData)) {
            if (!sprites[key]) continue;

            sprites[key] = frames.map(frame => ({
                image: spritesheet,
                sx: frame.x,
                sy: frame.y,
                sw: frame.w,
                sh: frame.h,
                width: targetWidth,
                height: targetHeight,
                flipped: false
            }));
        }

        // If left sprites not provided, flip right sprites
        if (sprites.left_idle.length === 0 && sprites.right_idle.length > 0) {
            sprites.left_idle = sprites.right_idle.map(s => ({ ...s, flipped: true }));
        }
        if (sprites.left_walk.length === 0 && sprites.right_walk.length > 0) {
            sprites.left_walk = sprites.right_walk.map(s => ({ ...s, flipped: true }));
        }

        return { sprites };
    }
}

window.SpriteSheet = SpriteSheet;
