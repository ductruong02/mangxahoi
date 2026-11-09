import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

const uploadPostImages = async (images = []) => Promise.all(images.map(async (image) => {
    const fileBuffer = fs.readFileSync(image.path);
    const response = await imagekit.upload({ file: fileBuffer, fileName: image.originalname, folder: "posts" });
    return imagekit.url({ path: response.filePath, transformation: [{ quality: 'auto' }, { format: 'webp' }, { width: '1280' }] });
}));

const populatePost = (query) => query.populate('user').populate({ path: 'shared_post', populate: { path: 'user' } });

export const addPost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { content = '', post_type } = req.body;
        const image_urls = await uploadPostImages(req.files || []);
        if (!content.trim() && !image_urls.length) return res.status(400).json({ success: false, message: 'Please add text or an image.' });
        const type = image_urls.length ? (content.trim() ? 'text_with_image' : 'image') : 'text';
        const post = await Post.create({ user: userId, content, image_urls, post_type: type || post_type });
        res.json({ success: true, message: 'Post created successfully', post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFeedPosts = async (req, res) => {
    try {
        const { userId } = req.auth();
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        const userIds = [...new Set([userId, ...(user.connections || []), ...(user.following || [])])];
        const posts = await populatePost(Post.find({ user: { $in: userIds } })).sort({ createdAt: -1 });
        // Do not display orphaned shares when their original post has been deleted.
        res.json({ success: true, posts: posts.filter(post => post.post_type !== 'share' || post.shared_post) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const likePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.body;
        const post = await Post.findById(postId);
        if (!post || post.post_type === 'share') return res.status(404).json({ success: false, message: 'Post not found' });
        if (post.likes_count.includes(userId)) post.likes_count = post.likes_count.filter(id => id !== userId);
        else post.likes_count.push(userId);
        await post.save();
        res.json({ success: true, message: 'Like updated', likes_count: post.likes_count });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updatePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId, content = '', keep_image_urls } = req.body;
        const post = await Post.findById(postId);
        if (!post || post.post_type === 'share') return res.status(404).json({ success: false, message: 'Post not found' });
        if (post.user !== userId) return res.status(403).json({ success: false, message: 'You can only edit your own post.' });
        let keepImages = [];
        if (keep_image_urls) {
            try { keepImages = JSON.parse(keep_image_urls); } catch { return res.status(400).json({ success: false, message: 'Invalid image list.' }); }
        }
        if (!Array.isArray(keepImages) || keepImages.some(url => !post.image_urls.includes(url))) return res.status(400).json({ success: false, message: 'Invalid image selection.' });
        const newImages = await uploadPostImages(req.files || []);
        const image_urls = [...keepImages, ...newImages];
        if (!String(content).trim() && !image_urls.length) return res.status(400).json({ success: false, message: 'A post cannot be empty.' });
        post.content = String(content);
        post.image_urls = image_urls;
        post.post_type = image_urls.length ? (post.content.trim() ? 'text_with_image' : 'image') : 'text';
        await post.save();
        res.json({ success: true, message: 'Post updated successfully', post: await populatePost(Post.findById(post._id)) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deletePost = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.body;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found.' });
        if (post.user !== userId) return res.status(403).json({ success: false, message: 'You can only delete your own post.' });
        await Promise.all([
            Post.deleteMany({ shared_post: post._id }),
            Comment.deleteMany({ post: post._id }),
            Post.findByIdAndDelete(post._id),
        ]);
        res.json({ success: true, message: 'Post deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const addComment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId, content } = req.body;
        if (!content?.trim()) return res.status(400).json({ success: false, message: 'Comment cannot be empty.' });
        const post = await Post.findById(postId);
        if (!post || post.post_type === 'share') return res.status(404).json({ success: false, message: 'Post not found.' });
        const comment = await Comment.create({ post: postId, user: userId, content: content.trim() });
        await comment.populate('user');
        res.json({ success: true, comment, message: 'Comment added.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getComments = async (req, res) => {
    try {
        const { postId } = req.params;
        if (!await Post.exists({ _id: postId })) return res.status(404).json({ success: false, message: 'Post not found.' });
        const comments = await Comment.find({ post: postId }).populate('user').sort({ createdAt: 1 });
        res.json({ success: true, comments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { commentId } = req.body;
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ success: false, message: 'Comment not found.' });
        if (comment.user !== userId) return res.status(403).json({ success: false, message: 'You can only delete your own comment.' });
        await comment.deleteOne();
        res.json({ success: true, message: 'Comment deleted.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const sharePostToProfile = async (req, res) => {
    try {
        const { userId } = req.auth();
        const { postId } = req.body;
        const original = await Post.findById(postId);
        if (!original || original.post_type === 'share') return res.status(404).json({ success: false, message: 'Original post not found.' });
        if (original.user === userId) return res.status(400).json({ success: false, message: 'You cannot share your own post to your profile.' });
        const alreadyShared = await Post.exists({ user: userId, shared_post: original._id });
        if (alreadyShared) return res.status(409).json({ success: false, message: 'You have already shared this post.' });
        const share = await Post.create({ user: userId, post_type: 'share', shared_post: original._id, content: '' });
        res.json({ success: true, message: 'Post shared to your profile.', share });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
