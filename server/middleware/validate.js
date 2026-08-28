const { AppError } = require('./errorHandler');

/**
 * Middleware factory - validates req.body against a Joi schema.
 *
 * On success the sanitised value replaces req.body, so controllers receive
 * type-coerced input with schema defaults applied and unknown keys rejected.
 * That is what stops a client smuggling extra fields (e.g. userId) into a
 * downstream Model.create().
 *
 * On failure responds 400 with every validation message.
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: false,
    convert: true,
  });

  if (error) {
    const message = error.details.map((d) => d.message.replace(/"/g, "'")).join('; ');
    return next(new AppError(message, 400));
  }

  req.body = value;
  next();
};

module.exports = { validate };
