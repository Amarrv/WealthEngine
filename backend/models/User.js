const mongoose = require("mongoose");

const passkeySchema = new mongoose.Schema({
  // SQL: Encode to base64url then store as `TEXT`. Index this column
  credentialID: { type: String, required: true },
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  // In MongoDB, we can store as Buffer, but typically base64url is used.
  credentialPublicKey: { type: Buffer, required: true },
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  counter: { type: Number, required: true },
  // SQL: `VARCHAR(255)` and store comma-separated values e.g. 'usb,ble,nfc,internal'
  transports: { type: [String], default: [] }
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    default: "CFO"
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  passkeys: {
    type: [passkeySchema],
    default: []
  },
  currentChallenge: {
    type: String, // Temporarily stores the WebAuthn challenge for verification
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("User", userSchema);
