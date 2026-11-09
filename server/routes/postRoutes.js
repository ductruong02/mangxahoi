import express from "express";
import { upload } from "../configs/multer.js";
import { addComment, addPost, deleteComment, deletePost, getComments, getFeedPosts, likePost, sharePostToProfile, updatePost } from "../controllers/postController.js";
import { protect } from "../middlewares/auth.js";

const postRouter = express.Router();
postRouter.post("/add", protect, upload.array('images', 4), addPost);
postRouter.get("/feed", protect, getFeedPosts);
postRouter.post("/like", protect, likePost);
postRouter.put("/update", protect, upload.array('images', 4), updatePost);
postRouter.delete("/delete", protect, deletePost);
postRouter.get("/:postId/comments", protect, getComments);
postRouter.post("/comment", protect, addComment);
postRouter.delete("/comment", protect, deleteComment);
postRouter.post("/share/profile", protect, sharePostToProfile);
export default postRouter;
