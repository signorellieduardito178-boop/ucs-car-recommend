import mongoose from 'mongoose';

const CarSchema = new mongoose.Schema({
  vin: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  paint: { type: String, default: '' },
  interior: { type: String, default: '' },
  location: { type: String, default: '' },
  actualPoint: { type: String, default: '' },
  salesStatus: { type: String, default: '' },
  damageRecord: { type: String, default: '' },
  isDowngrade: { type: String, default: '' },
  pointType: { type: String, default: '' },
  pointPriority: { type: Number, default: 99 },
  isDeleted: { type: Boolean, default: false },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true });

export const Car = mongoose.models.Car || mongoose.model('Car', CarSchema);
