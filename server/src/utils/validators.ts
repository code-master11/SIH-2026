import { body } from 'express-validator';

export const authValidators = {
  register: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    body('name').notEmpty().withMessage('Name is required'),
  ],
  login: [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]
};

export const caseValidators = {
  create: [
    body('title').notEmpty().withMessage('Title is required'),
    body('type').isIn(['FIR', 'INVESTIGATION', 'COURT', 'CIVIL', 'CRIMINAL']).withMessage('Invalid case type'),
    body('priority').isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority'),
  ]
};

export const documentValidators = {
  upload: [
    body('title').notEmpty().withMessage('Title is required'),
    body('caseId').notEmpty().withMessage('Case ID is required'),
    body('accessLevel').isIn(['PUBLIC', 'RESTRICTED', 'CONFIDENTIAL', 'TOP_SECRET']).withMessage('Invalid access level'),
  ]
};
