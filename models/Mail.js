import mongoose from "mongoose";

const MailSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  recipients: {
    type: [String],
    required: true
  },
  fromEmail: {
    type: String,
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  }
}, { timestamps: true });

export default mongoose.model("Mail", MailSchema);
