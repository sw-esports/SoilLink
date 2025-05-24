// Input sanitization and validation utilities
const validator = require('express-validator');

/**
 * HTML sanitization function to prevent XSS attacks
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeHtml = (input) => {
    if (typeof input !== 'string') return input;
    
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
};

/**
 * Remove potentially dangerous characters for database queries
 * @param {string} input - The input string to sanitize
 * @returns {string} - Sanitized string
 */
const sanitizeForDb = (input) => {
    if (typeof input !== 'string') return input;
    
    // Remove or escape characters that could be used in injection attacks
    return input
        .replace(/[\$\{\}]/g, '') // Remove MongoDB operators
        .replace(/[<>'"]/g, '') // Remove HTML/script injection chars
        .trim();
};

/**
 * Validation rules for user registration
 */
const userRegistrationValidation = [
    validator.body('name')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Name can only contain letters and spaces')
        .trim()
        .escape(),
    
    validator.body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail()
        .isLength({ max: 100 })
        .withMessage('Email must be less than 100 characters'),
      validator.body('password')
        .isLength({ min: 8, max: 128 })
        .withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one letter and one number'),
    
    validator.body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password confirmation does not match password');
            }
            return true;
        })
];

/**
 * Validation rules for user login
 */
const userLoginValidation = [
    validator.body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    validator.body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ max: 128 })
        .withMessage('Password is too long')
];

/**
 * Validation rules for contact form
 */
const contactFormValidation = [
    validator.body('name')
        .isLength({ min: 2, max: 100 })
        .withMessage('Name must be between 2 and 100 characters')
        .trim()
        .escape(),
    
    validator.body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
    
    validator.body('subject')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Subject must be less than 200 characters')
        .trim()
        .escape(),
    
    validator.body('message')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters')
        .trim()
        .escape()
];

/**
 * Validation rules for soil sample submission
 */
const soilSampleValidation = [
    validator.body('sampleName')
        .isLength({ min: 2, max: 100 })
        .withMessage('Sample name must be between 2 and 100 characters')
        .trim()
        .escape(),
    
    validator.body('location')
        .optional()
        .isLength({ max: 200 })
        .withMessage('Location must be less than 200 characters')
        .trim()
        .escape(),
    
    validator.body('dateCollected')
        .isISO8601()
        .withMessage('Please provide a valid date')
        .custom((value) => {
            const date = new Date(value);
            const today = new Date();
            if (date > today) {
                throw new Error('Collection date cannot be in the future');
            }
            return true;
        }),
    
    validator.body('notes')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Notes must be less than 500 characters')
        .trim()
        .escape()
];

/**
 * Middleware to handle validation errors
 * Provides detailed error feedback for both AJAX and regular form submissions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleValidationErrors = (req, res, next) => {
    const errors = validator.validationResult(req);
    if (!errors.isEmpty()) {
        // Sanitize error messages
        const sanitizedErrors = errors.array().map(error => ({
            field: error.path || error.param,
            message: sanitizeHtml(error.msg),
            value: error.value
        }));
        
        // Create error messages map by field for debugging
        const errorFields = {};
        sanitizedErrors.forEach(error => {
            errorFields[error.field] = error.message;
        });
        
        // Check if the request is AJAX
        const isAjax = req.xhr || req.headers.accept?.includes('application/json');
        if (isAjax) {
            return res.status(400).json({ 
                success: false,
                errors: sanitizedErrors,
                errorFields,
                error: sanitizedErrors[0].message 
            });
        }
        
        // For regular form submissions
        if (req.body.password) {
            // Don't send back passwords in the response
            delete req.body.password;
            delete req.body.confirmPassword;
        }
        
        // Flash the first error message
        req.flash('error_msg', sanitizedErrors[0].message);
        
        // For regular form submissions, pass errors to the template
        req.session.formErrors = {
            errorFields,
            errors: sanitizedErrors
        };
        
        return res.redirect('back');
    }
    next();
};

/**
 * Sanitize request body recursively
 */
const sanitizeRequestBody = (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
        const sanitizeValue = (value) => {
            if (typeof value === 'string') {
                return sanitizeForDb(value);
            } else if (typeof value === 'object' && value !== null) {
                const sanitized = {};
                for (const key in value) {
                    if (value.hasOwnProperty(key)) {
                        sanitized[key] = sanitizeValue(value[key]);
                    }
                }
                return sanitized;
            }
            return value;
        };
        
        req.body = sanitizeValue(req.body);
    }
    next();
};

module.exports = {
    sanitizeHtml,
    sanitizeForDb,
    userRegistrationValidation,
    userLoginValidation,
    contactFormValidation,
    soilSampleValidation,
    handleValidationErrors,
    sanitizeRequestBody
};
