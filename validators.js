// validators.js
const { body, validationResult } = require('express-validator');

// Validation rules for adding an order
const orderValidationRules = () => {
    return [
        body('deliveryDate').isISO8601().withMessage('Invalid date format'),
        body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal must be a positive number'),
        body('total').isFloat({ min: 0 }).withMessage('Total must be a positive number'),
        body('products').isArray().withMessage('Products must be an array')
    ];
};

// Middleware to check for validation errors
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = { orderValidationRules, validate };
