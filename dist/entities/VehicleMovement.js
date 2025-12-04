"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleMovement = exports.MovementStatus = exports.MovementType = void 0;
const typeorm_1 = require("typeorm");
const Vehicle_1 = require("./Vehicle");
const User_1 = require("./User");
var MovementType;
(function (MovementType) {
    MovementType["ENTRY"] = "entry";
    MovementType["EXIT"] = "exit";
})(MovementType || (exports.MovementType = MovementType = {}));
var MovementStatus;
(function (MovementStatus) {
    MovementStatus["PENDING"] = "pending";
    MovementStatus["COMPLETED"] = "completed";
    MovementStatus["CANCELLED"] = "cancelled";
})(MovementStatus || (exports.MovementStatus = MovementStatus = {}));
let VehicleMovement = class VehicleMovement {
};
exports.VehicleMovement = VehicleMovement;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VehicleMovement.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "vehicleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "area", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 20
    }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "movementType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 20,
        default: MovementStatus.COMPLETED
    }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], VehicleMovement.prototype, "mileage", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "driverName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "driverPhone", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "driverLicense", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "purpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'nvarchar', nullable: true, length: 100 }),
    __metadata("design:type", Object)
], VehicleMovement.prototype, "destination", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], VehicleMovement.prototype, "recordedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime' }),
    __metadata("design:type", Date)
], VehicleMovement.prototype, "recordedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Vehicle_1.Vehicle, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'vehicleId' }),
    __metadata("design:type", Vehicle_1.Vehicle)
], VehicleMovement.prototype, "vehicle", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'recordedById' }),
    __metadata("design:type", User_1.User)
], VehicleMovement.prototype, "recordedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VehicleMovement.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VehicleMovement.prototype, "updatedAt", void 0);
exports.VehicleMovement = VehicleMovement = __decorate([
    (0, typeorm_1.Entity)('vehicle_movements'),
    (0, typeorm_1.Index)(['vehicleId']),
    (0, typeorm_1.Index)(['movementType']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['recordedAt']),
    (0, typeorm_1.Index)(['recordedById']),
    (0, typeorm_1.Index)(['area'])
], VehicleMovement);
//# sourceMappingURL=VehicleMovement.js.map