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
exports.Employee = void 0;
const typeorm_1 = require("typeorm");
let Employee = class Employee {
    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }
    getApprovalToken() {
        const crypto = require('crypto');
        return crypto.createHash('sha256')
            .update(`${this.id}-${this.email}-approval-token`)
            .digest('hex');
    }
};
exports.Employee = Employee;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Employee.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, unique: true }),
    __metadata("design:type", String)
], Employee.prototype, "employeeId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Employee.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], Employee.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, unique: true }),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, nullable: true }),
    __metadata("design:type", String)
], Employee.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Employee.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], Employee.prototype, "position", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Employee.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Employee.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Employee.prototype, "updatedAt", void 0);
exports.Employee = Employee = __decorate([
    (0, typeorm_1.Entity)('employees'),
    (0, typeorm_1.Index)(['email'], { unique: true }),
    (0, typeorm_1.Index)(['employeeId'], { unique: true }),
    (0, typeorm_1.Index)(['department'])
], Employee);
//# sourceMappingURL=Employee.js.map