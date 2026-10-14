import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Atomic, gap-free sequence per cycle: ADM2026000147
 */
export const nextApplicationNo = async (admissionCycle) => {
  const year = String(admissionCycle).slice(0, 4);
  const counter = await Counter.findByIdAndUpdate(
    `application:${year}`,
    { $inc: { seq: 1 } },
    { new: true, upsert: true },
  );
  return `ADM${year}${String(counter.seq).padStart(6, '0')}`;
};

export { Counter };
export default nextApplicationNo;
