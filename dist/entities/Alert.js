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
exports.Alert = void 0;
const typeorm_1 = require("typeorm");
const types_1 = require("../types");
const User_1 = require("./User");
let Alert = class Alert {
    markAsRead() {
        this.isRead = true;
    }
    markAsUnread() {
        this.isRead = false;
    }
    get parsedMetadata() {
        if (!this.metadata)
            return null;
        try {
            return JSON.parse(this.metadata);
        }
        catch {
            return null;
        }
    }
    setMetadata(data) {
        if (data) {
            this.metadata = JSON.stringify(data);
        }
        else {
            delete this.metadata;
        }
    }
};
exports.Alert = Alert;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Alert.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        enum: types_1.AlertType,
    }),
    __metadata("design:type", String)
], Alert.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        enum: types_1.AlertSeverity,
    }),
    __metadata("design:type", String)
], Alert.prototype, "severity", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Alert.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 1000 }),
    __metadata("design:type", String)
], Alert.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'userId' }),
    __metadata("design:type", User_1.User)
], Alert.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Alert.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Alert.prototype, "isRead", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Alert.prototype, "actionRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Alert.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Alert.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Alert.prototype, "updatedAt", void 0);
exports.Alert = Alert = __decorate([
    (0, typeorm_1.Entity)('alerts'),
    (0, typeorm_1.Index)(['userId', 'createdAt']),
    (0, typeorm_1.Index)(['type', 'createdAt']),
    (0, typeorm_1.Index)(['severity', 'createdAt']),
    (0, typeorm_1.Index)(['isRead', 'createdAt']),
    (0, typeorm_1.Index)(['actionRequired', 'createdAt'])
], Alert);
//# sourceMappingURL=Alert.js.map