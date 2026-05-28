const Cell = require('./Cell');
const Packet = require('../packet');

class PlayerCell extends Cell {
    constructor(server, owner, position, size) {
        super(server, owner, position, size);
        this.type = 0;
        this._canRemerge = false;
        this.mergeStartTick = this.createdAt;
        this.mergeBaseMass = this._mass;
    }
    canEat(cell) {
        return true;
    }
    getSpeed(dist) {
        let speed = 2.2 * Math.pow(this.radius, -0.45) * 40;
        speed *= this.server.config.playerSpeed;
        if (this.owner && this.server.ticks < (this.owner.noxgarSpeedBoostUntil || 0)) {
            speed *= this.owner.noxgarSpeedBoostMultiplier || 1;
        }
        speed = Math.min(dist, speed);
        if (dist != 0) speed /= dist;
        return speed;
    }
    resetMergeTimer() {
        this.mergeStartTick = this.server.ticks;
        this.mergeBaseMass = this._mass;
        this._canRemerge = false;
    }
    getMergeAge() {
        return this.server.ticks - this.mergeStartTick;
    }
    onAdd(server) {
        this.color = this.owner.color;
        this.owner.cells.push(this);
        this.owner.socket.client.sendPacket(new Packet.AddNode(this.owner, this));
        this.server.nodesPlayer.unshift(this);
        server.mode.onCellAdd(this);
    }
    onRemove(server) {
        this.owner.cells.removeUnsorted(this);
        this.server.nodesPlayer.removeUnsorted(this);

        server.mode.onCellRemove(this);
    }
}

module.exports = PlayerCell;
