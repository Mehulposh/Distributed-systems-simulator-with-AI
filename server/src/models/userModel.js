import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { 
        type: String, 
        required: true, 
        trim: true 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true 
    },
    passwordHash: { 
        type: String, 
        required: true 
    },
    savedArchitectures: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Architecture' 
    }],
    role: { 
        type: String, 
        enum: ['user', 'admin'], 
        default: 'user' 
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

/**
 * Compare a plaintext password with the stored hash.
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

/**
 * Remove sensitive fields from the user object before serialization.
 * @returns {object}
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

export default mongoose.model('User', userSchema);