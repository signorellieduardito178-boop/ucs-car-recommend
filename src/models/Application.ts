import mongoose from 'mongoose';

const ApplicationSchema = new mongoose.Schema({
  vin: { type: String, required: true },
  model: { type: String, required: true },
  paint: { type: String, default: '' },
  interior: { type: String, default: '' },
  salesName: { type: String, required: true },
  salesStore: { type: String, required: true },
  targetStore: { type: String, required: true },
  paintPref: { type: String, default: '' },
  interiorPref: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  adminNote: { type: String, default: '' },
}, { timestamps: true });

export const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);
