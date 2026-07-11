export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone) {
  return /^\+?\d{7,15}$/.test(phone.replace(/[\s-]/g, ''));
}

export function isRequired(value) {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return !isNaN(value);
  return value !== null && value !== undefined;
}

export function isPositiveNumber(value) {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
}

export function isValidDateRange(start, end) {
  if (!start || !end) return false;
  return new Date(start) <= new Date(end);
}

export function validateForm(fields, values) {
  const errors = {};
  for (const [key, rules] of Object.entries(fields)) {
    const value = values[key];
    if (rules.required && !isRequired(value)) {
      errors[key] = `${rules.label || key} is required`;
      continue;
    }
    if (value && rules.email && !isValidEmail(value)) {
      errors[key] = 'Invalid email format';
    }
    if (value && rules.phone && !isValidPhone(value)) {
      errors[key] = 'Invalid phone format';
    }
    if (value && rules.positive && !isPositiveNumber(value)) {
      errors[key] = 'Must be a positive number';
    }
  }
  return errors;
}
