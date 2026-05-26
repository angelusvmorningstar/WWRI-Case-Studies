export class ValidationError extends Error {
  constructor(code, message, fields = []) {
    super(message);
    this.name = 'ValidationError';
    this.code = code;
    this.fields = fields;
  }
}

export const CODES = {
  ASSUMPTION_RATIONALE_REQUIRED: 'ASSUMPTION_RATIONALE_REQUIRED',
  ASSUMPTION_SOURCE_REQUIRED:    'ASSUMPTION_SOURCE_REQUIRED',
  ASSUMPTION_KEY_REQUIRED:       'ASSUMPTION_KEY_REQUIRED',
  ASSUMPTION_VALUE_REQUIRED:     'ASSUMPTION_VALUE_REQUIRED',
  ASSUMPTION_LABEL_REQUIRED:     'ASSUMPTION_LABEL_REQUIRED',
  INVALID_LIFECYCLE_TRANSITION:  'INVALID_LIFECYCLE_TRANSITION',
  INVALID_WORKBOOK:              'INVALID_WORKBOOK',
};
