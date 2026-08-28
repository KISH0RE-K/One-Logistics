const mongoose = require("mongoose");

const AUDIT_ACTIONS = [
  "LOGIN",
  "REGISTER",
  "CREATE_SHIPMENT",
  "UPDATE_SHIPMENT",
  "CANCEL_SHIPMENT",
  "DELETE_SHIPMENT",
  "SAVE_DRAFT",
  "RESUME_DRAFT",
  "DELETE_DRAFT",
  "CREATE_VEHICLE",
  "UPDATE_VEHICLE",
  "CHATBOT_REQUEST",
  "GET_RECOMMENDATION",
  "VIEW_SHIPMENT",
];

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: AUDIT_ACTIONS,
    required: true,
    index: true,
  },
  resource: {
    type: String,
    required: true,
  },
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

module.exports = mongoose.model("AuditLog", auditLogSchema);
module.exports.AUDIT_ACTIONS = AUDIT_ACTIONS;
