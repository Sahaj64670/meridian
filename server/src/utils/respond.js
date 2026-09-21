/** Uniform success envelope so the client can always read `res.data`. */
export const send = (res, { status = 200, data = null, message, meta } = {}) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });
