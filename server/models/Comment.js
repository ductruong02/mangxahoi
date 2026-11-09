import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    user: { type: String, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
