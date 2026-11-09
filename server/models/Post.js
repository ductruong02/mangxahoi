import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    user: { type: String, ref: 'User', required: true },
    content: { type: String, default: '' },
    image_urls: [{ type: String }],
    post_type: { type: String, enum: ['text', 'image', 'text_with_image', 'share'], required: true },
    likes_count: [{ type: String, ref: 'User' }],
    // A share is a lightweight reference to the original post, not a copy.
    shared_post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null },
}, { timestamps: true, minimize: false });

const Post = mongoose.model('Post', postSchema);
export default Post;
