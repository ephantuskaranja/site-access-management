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
exports.AccessLog = void 0;
const typeorm_1 = require("typeorm");
const types_1 = require("../types");
const User_1 = require("./User");
const Visitor_1 = require("./Visitor");
let AccessLog = class AccessLog {
};
exports.AccessLog = AccessLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], AccessLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Visitor_1.Visitor, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'visitorId' }),
    __metadata("design:type", Visitor_1.Visitor)
], AccessLog.prototype, "visitor", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AccessLog.prototype, "visitorId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'employeeId' }),
    __metadata("design:type", User_1.User)
], AccessLog.prototype, "employee", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], AccessLog.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.User),
    (0, typeorm_1.JoinColumn)({ name: 'guardId' }),
    __metadata("design:type", User_1.User)
], AccessLog.prototype, "guard", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], AccessLog.prototype, "guardId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'varchar',
        enum: types_1.AccessAction,
    }),
    __metadata("design:type", String)
], AccessLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: 'Main Gate' }),
    __metadata("design:type", String)
], AccessLog.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], AccessLog.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], AccessLog.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 45 }),
    __metadata("design:type", String)
], AccessLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 500 }),
    __metadata("design:type", String)
], AccessLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AccessLog.prototype, "createdAt", void 0);
exports.AccessLog = AccessLog = __decorate([
    (0, typeorm_1.Entity)('access_logs'),
    (0, typeorm_1.Index)(['timestamp']),
    (0, typeorm_1.Index)(['visitorId', 'timestamp']),
    (0, typeorm_1.Index)(['guardId', 'timestamp']),
    (0, typeorm_1.Index)(['action', 'timestamp']),
    (0, typeorm_1.Index)(['location', 'timestamp'])
], AccessLog);
//# sourceMappingURL=AccessLog.js.map