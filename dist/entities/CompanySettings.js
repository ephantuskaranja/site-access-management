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
exports.CompanySettings = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
let CompanySettings = class CompanySettings {
    getWorkingHours() {
        try {
            return JSON.parse(this.workingHours);
        }
        catch {
            return { start: '08:00', end: '18:00' };
        }
    }
    setWorkingHours(hours) {
        this.workingHours = JSON.stringify(hours);
    }
    validateWorkingHours() {
        const hours = this.getWorkingHours();
        const startTime = hours.start.split(':');
        const endTime = hours.end.split(':');
        const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
        const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
        if (startMinutes >= endMinutes) {
            throw new Error('Working hours end time must be after start time');
        }
    }
    updateSettings(updates, userId) {
        Object.assign(this, updates);
        this.updatedById = userId;
    }
    getPublicSettings() {
        return {
            companyName: this.companyName,
            address: this.address,
            phone: this.phone,
            email: this.email,
            logo: this.logo,
            workingHours: this.getWorkingHours(),
            requirePreApproval: this.requirePreApproval,
            enableQRCode: this.enableQRCode,
        };
    }
    isWithinWorkingHours(checkTime) {
        const now = checkTime || new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const hours = this.getWorkingHours();
        return currentTime >= hours.start && currentTime <= hours.end;
    }
};
exports.CompanySettings = CompanySettings;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], CompanySettings.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], CompanySettings.prototype, "companyName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], CompanySettings.prototype, "address", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], CompanySettings.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], CompanySettings.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], CompanySettings.prototype, "logo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'ntext' }),
    __metadata("design:type", String)
], CompanySettings.prototype, "workingHours", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 480 }),
    __metadata("design:type", Number)
], CompanySettings.prototype, "maxVisitorDuration", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], CompanySettings.prototype, "requirePreApproval", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], CompanySettings.prototype, "allowMultipleEntries", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], CompanySettings.prototype, "enableQRCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], CompanySettings.prototype, "enableEmailNotifications", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], CompanySettings.prototype, "emergencyContact", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'updatedById' }),
    __metadata("design:type", User_1.User)
], CompanySettings.prototype, "updatedBy", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], CompanySettings.prototype, "updatedById", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], CompanySettings.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], CompanySettings.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CompanySettings.prototype, "validateWorkingHours", null);
exports.CompanySettings = CompanySettings = __decorate([
    (0, typeorm_1.Entity)('company_settings')
], CompanySettings);
//# sourceMappingURL=CompanySettings.js.map