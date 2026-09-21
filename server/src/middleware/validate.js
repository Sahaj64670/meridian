import { asyncHandler } from '../utils/asyncHandler.js';

/**
 * Zod validation middleware factory.
 *   router.post('/', validate(createProductSchema), controller.create)
 * Invalid payloads are rejected with a 400 before the controller ever runs.
 */
export const validate = (schema, source = 'body') =>
  asyncHandler(async (req, _res, next) => {
    req[source] = await schema.parseAsync(req[source]);
    next();
  });
