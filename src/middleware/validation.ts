import { Request, Response, NextFunction } from 'express';
import { ObjectSchema, ValidationError } from 'joi';
import { ApiResponse } from '../types';

export const validate = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail: ValidationError['details'][0]) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      const response: ApiResponse = {
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

export const validateQuery = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail: ValidationError['details'][0]) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      const response: ApiResponse = {
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

export const validateParams = (schema: ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail: ValidationError['details'][0]) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      const response: ApiResponse = {
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