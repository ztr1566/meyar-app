import { AppError } from './errors.js';

function parseRequestPart(schema, value) {
  const result = schema.safeParse(value);
  if (!result.success) throw new AppError(400, 'VALIDATION_ERROR', 'Request validation failed');
  return result.data;
}

export function validate({ body, params, query } = {}) {
  return async (request) => {
    const validated = request.validated ?? {};
    if (body) validated.body = parseRequestPart(body, request.body);
    if (params) validated.params = parseRequestPart(params, request.params);
    if (query) validated.query = parseRequestPart(query, request.query);
    request.validated = validated;
  };
}
