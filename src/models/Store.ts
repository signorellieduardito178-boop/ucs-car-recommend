import mongoose from 'mongoose';

const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, default: '' },
  district: { type: String, default: '' },
}, { timestamps: true });

export const Store = mongoose.models.Store || mongoose.model('Store', StoreSchema);
