function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues || result.error.errors || [];
      const errorMessage = issues
        .map(e => `${e.path && e.path.length > 0 ? e.path.join('.') + ': ' : ''}${e.message}`)
        .join(', ');
      return res.status(400).json({ error: errorMessage || 'Validation error' });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
