"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportType = exports.AlertSeverity = exports.AlertType = exports.AccessAction = exports.VisitPurpose = exports.VisitorStatus = exports.UserStatus = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["SECURITY_GUARD"] = "security_guard";
    UserRole["RECEPTIONIST"] = "receptionist";
    UserRole["VISITOR"] = "visitor";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var VisitorStatus;
(function (VisitorStatus) {
    VisitorStatus["PENDING"] = "pending";
    VisitorStatus["APPROVED"] = "approved";
    VisitorStatus["REJECTED"] = "rejected";
    VisitorStatus["CHECKED_IN"] = "checked_in";
    VisitorStatus["CHECKED_OUT"] = "checked_out";
    VisitorStatus["EXPIRED"] = "expired";
})(VisitorStatus || (exports.VisitorStatus = VisitorStatus = {}));
var VisitPurpose;
(function (VisitPurpose) {
    VisitPurpose["MEETING"] = "meeting";
    VisitPurpose["DELIVERY"] = "delivery";
    VisitPurpose["PIG_DELIVERY"] = "pig_delivery";
    VisitPurpose["MAINTENANCE"] = "maintenance";
    VisitPurpose["CONTRACT_WORKS"] = "contract_works";
    VisitPurpose["INTERVIEW"] = "interview";
    VisitPurpose["PIG_ORDER"] = "pig_order";
    VisitPurpose["OTHER"] = "other";
})(VisitPurpose || (exports.VisitPurpose = VisitPurpose = {}));
var AccessAction;
(function (AccessAction) {
    AccessAction["CHECK_IN"] = "check_in";
    AccessAction["CHECK_OUT"] = "check_out";
    AccessAction["ACCESS_GRANTED"] = "access_granted";
    AccessAction["ACCESS_DENIED"] = "access_denied";
    AccessAction["LOGIN"] = "login";
    AccessAction["LOGOUT"] = "logout";
    AccessAction["LOGIN_FAILED"] = "login_failed";
    AccessAction["VISITOR_CHECKIN"] = "visitor_checkin";
    AccessAction["VISITOR_CHECKOUT"] = "visitor_checkout";
    AccessAction["VEHICLE_ENTRY"] = "vehicle_entry";
    AccessAction["VEHICLE_EXIT"] = "vehicle_exit";
    AccessAction["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
})(AccessAction || (exports.AccessAction = AccessAction = {}));
var AlertType;
(function (AlertType) {
    AlertType["SECURITY"] = "security";
    AlertType["SYSTEM"] = "system";
    AlertType["VISITOR"] = "visitor";
    AlertType["ACCESS"] = "access";
})(AlertType || (exports.AlertType = AlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["LOW"] = "low";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var ReportType;
(function (ReportType) {
    ReportType["DAILY"] = "daily";
    ReportType["WEEKLY"] = "weekly";
    ReportType["MONTHLY"] = "monthly";
    ReportType["CUSTOM"] = "custom";
})(ReportType || (exports.ReportType = ReportType = {}));
//# sourceMappingURL=index.js.map