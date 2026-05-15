import { model, Schema } from 'mongoose';
const S = new Schema({ key: { type: String, unique: true }, name: String, description: String, price: Number, emoji: String });
export default model('GameBadge', S);
