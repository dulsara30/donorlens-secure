import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    passwordHash: {
      type: String,
      required: function () {
        // NGO admins set their password later via the approval flow, and
        // Google-linked accounts authenticate with Google, not a local password.
        return this.role !== "NGO_ADMIN" && !this.googleId;
      },
      select: false, // IMPORTANT: never return password by default
    },

    role: {
      type: String,
      enum: ["USER", "NGO_ADMIN", "ADMIN"],
      default: "USER",
      required: true,
    },

    // Google OIDC sign-in (Authorization Code + PKCE) — see routes/auth/googleAuth.route.js
    googleId: {
      type: String,
      unique: true,
      sparse: true, // allows many documents with no googleId (local accounts)
      index: true,
    },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    ngoDetails: {
      ngoName: {
        type: String,
        trim: true,
      },
      registrationNumber: {
        type: String,
        trim: true,
      },
      primaryPhone: {
        type: String,
        trim: true,
      },
      secondaryPhone: {
        type: String,
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
      address: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      documents: {
        registrationCertificate: {
          url: String,
          previewUrl: String,
          publicId: String,
          format: String,
          size: Number,
          uploadedAt: { type: Date, default: Date.now },
        },
        additionalDocuments: [
          {
            url: String,
            previewUrl: String,
            publicId: String,
            format: String,
            size: Number,
            uploadedAt: { type: Date, default: Date.now },
          },
        ],
      },
      status: {
        type: String,
        enum: [
          "PENDING",
          "APPROVED",
          "REJECTED",
          "RESUBMIT_REQUIRED",
          "DEACTIVATED",
        ],
        default: "PENDING",
      },
      rejectionReason: {
        type: String,
        trim: true,
      },
      reviewNotes: [
        {
          note: String,
          createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
      submissionHistory: [
        {
          submittedAt: Date,
          status: String,
          documents: Object, // Store snapshot of submitted docs
        },
      ],
      passwordSetupToken: {
        type: String,
        default: null,
      },
      passwordSetupTokenExpiry: {
        type: Date,
        default: null,
      },
      passwordSetupTokenUsed: {
        type: Boolean,
        default: false,
      },
      resubmissionToken: {
        type: String,
        default: null,
      },
      resubmissionTokenExpiry: {
        type: Date,
        default: null,
      },
      resubmissionTokenUsed: {
        type: Boolean,
        default: false,
      },
      reviewedAt: Date,
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },

    profile: {
      phone: {
        type: String,
        trim: true,
      },
      country: {
        type: String,
        trim: true,
      },
      profileImageUrl: {
        type: String,
      },
    },

    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Pre-save middleware to hash password before saving to database
 * Only runs if password field is modified or document is new
 * Note: Using async/await, so no 'next' parameter needed - Mongoose handles promise resolution
 */
/**
 * Pre-save middleware to hash password before saving to database
 * Only runs if password field is modified or document is new
 * Note: Using async/await - don't call next(), just return or throw
 */
userSchema.pre("save", async function () {
  // Skip if passwordHash wasn't modified
  if (!this.isModified("passwordHash")) {
    return;
  }

  // Skip if no password (NGO hasn't set one yet)
  if (!this.passwordHash) {
    return;
  }

  // Skip if already a bcrypt hash (starts with $2a$, $2b$, or $2y$)
  if (
    typeof this.passwordHash === "string" &&
    this.passwordHash.match(/^\$2[aby]\$/)
  ) {
    console.log("⏭Password already hashed, skipping for:", this.email);
    return;
  }

  // Only hash plain text passwords
  if (typeof this.passwordHash === "string" && this.passwordHash.length > 0) {
    console.log("Hashing password for user:", this.email);
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  }

  // Mongoose automatically continues when the promise resolves
});

/**
 * Instance method to compare password with hashed password
 * @param {string} candidatePassword - Plain text password to compare
 * @returns {Promise<boolean>} True if password matches, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.passwordHash);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

/**
 * Transform user object to safe format (remove sensitive data)
 * @returns {Object} User object without sensitive fields
 */
userSchema.methods.toSafeObject = function () {
  const userObject = this.toObject();

  // Remove sensitive fields
  delete userObject.passwordHash;
  delete userObject.__v;

  return {
    id: userObject._id,
    fullName: userObject.fullName,
    email: userObject.email,
    role: userObject.role,
    isActive: userObject.isActive,
    profile: userObject.profile,
    ngoDetails: userObject.ngoDetails,
    createdAt: userObject.createdAt,
    lastLoginAt: userObject.lastLoginAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
