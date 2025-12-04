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
exports.Visitor = void 0;
const typeorm_1 = require("typeorm");
const types_1 = require("../types");
const User_1 = require("./User");
let Visitor = class Visitor {
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    get visitDuration() {
        if (!this.actualCheckIn || !this.actualCheckOut)
            return null;
        const duration = this.actualCheckOut.getTime() - this.actualCheckIn.getTime();
        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    }
    generateQRCode() {
        if (!this.qrCode && this.status === types_1.VisitorStatus.APPROVED) {
            this.qrCode = `VISITOR:${this.id}:${this.idNumber}:${Date.now()}`;
        }
    }
    approve(approvedById) {
        this.status = types_1.VisitorStatus.APPROVED;
        this.approvedById = approvedById;
        delete this.rejectionReason;
        this.generateQRCode();
    }
    reject(reason) {
        this.status = types_1.VisitorStatus.REJECTED;
        this.rejectionReason = reason;
        delete this.approvedById;
    }
    checkIn() {
        this.status = types_1.VisitorStatus.CHECKED_IN;
        this.actualCheckIn = new Date();
    }
    checkOut() {
        this.status = types_1.VisitorStatus.CHECKED_OUT;
        this.actualCheckOut = new Date();
    }
    isExpired() {
        if (this.status === types_1.VisitorStatus.CHECKED_OUT)
            return false;
        const now = new Date();
        const visitDate = new Date(this.expectedDate);
        visitDate.setHours(23, 59, 59, 999);
        return now > visitDate;
    }
};
exports.Visitor = Visitor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Visitor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Visitor.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Visitor.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], Visitor.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Visitor.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Visitor.prototype, "idNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], Visitor.prototype, "visitorCardNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 100 }),
    __metadata("design:type", String)
], Visitor.prototype, "company", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], Visitor.prototype, "vehicleNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Visitor.prototype, "photo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Visitor.prototype, "qrCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Visitor.prototype, "hostEmployee", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Visitor.prototype, "hostDepartment", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        enum: types_1.VisitPurpose,
    }),
    __metadata("design:type", String)
], Visitor.prototype, "visitPurpose", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Visitor.prototype, "expectedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5 }),
    __metadata("design:type", String)
], Visitor.prototype, "expectedTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Visitor.prototype, "actualCheckIn", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Date)
], Visitor.prototype, "actualCheckOut", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        enum: types_1.VisitorStatus,
        default: types_1.VisitorStatus.PENDING,
    }),
    __metadata("design:type", String)
], Visitor.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'approvedById' }),
    __metadata("design:type", User_1.User)
], Visitor.prototype, "approvedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Visitor.prototype, "approvedById", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], Visitor.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], Visitor.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Visitor.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Visitor.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Visitor.prototype, "generateQRCode", null);
exports.Visitor = Visitor = __decorate([
    (0, typeorm_1.Entity)('visitors'),
    (0, typeorm_1.Index)(['idNumber']),
    (0, typeorm_1.Index)(['phone']),
    (0, typeorm_1.Index)(['status']),
    (0, typeorm_1.Index)(['expectedDate']),
    (0, typeorm_1.Index)(['hostEmployee']),
    (0, typeorm_1.Index)(['hostDepartment'])
], Visitor);
//# sourceMappingURL=Visitor.js.map