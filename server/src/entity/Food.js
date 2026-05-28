const Cell = require('./Cell');

const BOOST_PICKUP_DEFAULT_CHANCE = 0.015;
const BOOST_PICKUP_DEFAULT_DURATION_TICKS = 125;
const BOOST_PICKUP_DEFAULT_MULTIPLIER = 1.35;

class Food extends Cell {
    constructor(server, owner, position, size) {
        super(server, owner, position, size);
        this.type = 1;
        this.overrideReuse = false;
        this.isNoxgarBoostPickup = false;

        const chance = Number(server && server.config && server.config.noxgarBoostPickupChance);
        const boostChance = Number.isFinite(chance) ? Math.max(0, chance) : BOOST_PICKUP_DEFAULT_CHANCE;
        if (boostChance > 0 && Math.random() < boostChance) {
            this.isNoxgarBoostPickup = true;
            this.color = { r: 0, g: 232, b: 255 };
            this.setSize(Math.max(this.radius, size * 1.35));
        }
    }
    onEaten(hunter) {
        if (!this.isNoxgarBoostPickup || !hunter || !hunter.owner || !this.server) return;

        const durationConfig = Number(this.server.config && this.server.config.noxgarBoostDurationTicks);
        const multiplierConfig = Number(this.server.config && this.server.config.noxgarBoostSpeedMultiplier);
        const duration = Number.isFinite(durationConfig) ? Math.max(0, durationConfig) : BOOST_PICKUP_DEFAULT_DURATION_TICKS;
        const multiplier = Number.isFinite(multiplierConfig) ? Math.max(1, multiplierConfig) : BOOST_PICKUP_DEFAULT_MULTIPLIER;

        hunter.owner.noxgarSpeedBoostUntil = Math.max(hunter.owner.noxgarSpeedBoostUntil || 0, this.server.ticks + duration);
        hunter.owner.noxgarSpeedBoostMultiplier = multiplier;
    }
    onAdd(server) {
        server.nodesFood.push(this);
    }
    onRemove(server) {
        server.nodesFood.removeUnsorted(this);
        if (!this.overrideReuse) server.spawnFood();
    }
}

module.exports = Food;
