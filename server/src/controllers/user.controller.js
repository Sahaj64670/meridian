import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { signToken } from '../utils/token.js';
import { send } from '../utils/respond.js';

const authPayload = (user) => ({
  token: signToken({ sub: user._id, role: user.role }),
  user: user.toJSON(),
});

/** POST /api/auth/register */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('An account with this email already exists');

  const user = await User.create({ name, email, password });
  await send(res, {
    status: 201,
    data: authPayload(user),
    message: 'Welcome to Meridian! Your account is ready.',
  });
});

/** POST /api/auth/login */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password');
  }

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  await send(res, { data: authPayload(user), message: `Welcome back, ${user.name.split(' ')[0]}` });
});

/** GET /api/auth/me */
export const me = asyncHandler(async (req, res) => {
  await send(res, { data: { user: req.user.toJSON() } });
});

/** PATCH /api/users/me */
export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true });
  await send(res, { data: { user: user.toJSON() }, message: 'Profile updated' });
});

/** POST /api/users/me/addresses */
export const addAddress = asyncHandler(async (req, res) => {
  const address = req.body;
  const user = await User.findById(req.user._id);

  if (address.isDefault) user.addresses.forEach((a) => (a.isDefault = false));
  if (user.addresses.length === 0) address.isDefault = true;

  user.addresses.push(address);
  await user.save();
  await send(res, { status: 201, data: { addresses: user.addresses }, message: 'Address saved' });
});

/** DELETE /api/users/me/addresses/:id */
export const removeAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.addresses = user.addresses.filter(
    (a) => a._id.toString() !== req.params.id
  );
  await user.save();
  await send(res, { data: { addresses: user.addresses }, message: 'Address removed' });
});
