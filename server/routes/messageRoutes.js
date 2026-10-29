import express from 'express'
import { upload } from '../configs/multer.js'
import { getChatMessages, sendMessage, sseController } from '../controllers/messageController.js'
import { protect } from '../middlewares/auth.js'

const messageRouter = express.Router()

messageRouter.get("/:userId", sseController)
messageRouter.post("/send", upload.single('image'), protect, sendMessage)
messageRouter.get("/get", protect, getChatMessages)

export default messageRouter