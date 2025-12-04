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
exports.Vehicle = exports.VehicleStatus = exports.VehicleType = void 0;
const typeorm_1 = require("typeorm");
var VehicleType;
(function (VehicleType) {
    VehicleType["CAR"] = "car";
    VehicleType["TRUCK"] = "truck";
    VehicleType["VAN"] = "van";
    VehicleType["MOTORCYCLE"] = "motorcycle";
    VehicleType["BUS"] = "bus";
    VehicleType["OTHER"] = "other";
})(VehicleType || (exports.VehicleType = VehicleType = {}));
var VehicleStatus;
(function (VehicleStatus) {
    VehicleStatus["ACTIVE"] = "active";
    VehicleStatus["INACTIVE"] = "inactive";
    VehicleStatus["MAINTENANCE"] = "maintenance";
    VehicleStatus["RETIRED"] = "retired";
})(VehicleStatus || (exports.VehicleStatus = VehicleStatus = {}));
let Vehicle = class Vehicle {
};
exports.Vehicle = Vehicle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Vehicle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, unique: true }),
    __metadata("design:type", String)
], Vehicle.prototype, "licensePlate", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Vehicle.prototype, "make", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Vehicle.prototype, "model", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'int' }),
    __metadata("design:type", Number)
], Vehicle.prototype, "year", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 30 }),
    __metadata("design:type", String)
], Vehicle.prototype, "color", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 20,
        default: VehicleType.CAR
    }),
    __metadata("design:type", String)
], Vehicle.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        length: 20,
        default: VehicleStatus.ACTIVE
    }),
    __metadata("design:type", String)
], Vehicle.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], Vehicle.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], Vehicle.prototype, "assignedDriver", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Vehicle.prototype, "currentMileage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, type: 'text' }),
    __metadata("design:type", String)
], Vehicle.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Vehicle.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Vehicle.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Vehicle.prototype, "updatedAt", void 0);
exports.Vehicle = Vehicle = __decorate([
    (0, typeorm_1.Entity)('vehicles'),
    (0, typeorm_1.Index)(['licensePlate'], { unique: true }),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['type']),
    (0, typeorm_1.Index)(['isActive'])
], Vehicle);
//# sourceMappingURL=Vehicle.js.map