"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.validateQuery = exports.validate = void 0;
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
            }));
            const response = {
                success: false,
                message: 'Validation failed',
                errors,
            };
            res.status(400).json(response);
            return;
        }
        next();
    };
};
exports.validate = validate;
const validateQuery = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.query, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
            }));
            const response = {
                success: false,
                message: 'Query validation failed',
                errors,
            };
            res.status(400).json(response);
            return;
        }
        next();
    };
};
exports.validateQuery = validateQuery;
const validateParams = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.params, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value,
            }));
            const response = {
                success: false,
                message: 'Parameter validation failed',
                errors,
            };
            res.status(400).json(response);
            return;
        }
        next();
    };
};
exports.validateParams = validateParams;
//# sourceMappingURL=validation.js.map