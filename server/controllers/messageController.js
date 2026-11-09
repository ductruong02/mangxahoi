import fs from "fs"
import imagekit from "../configs/imageKit.js"
import Message from "../models/Message.js"

// Create an empty object to store SS Event connections
const connections = {}

// Controller function for the SSE Endpoint
export const sseController = (req, res) => {
    const { userId } = req.params
    console.log("New client connected : ", userId)

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Add the client's response object to the connections object
    connections[userId] = res

    // Send an initial event to the client
    res.write('log: Connected to SSE stream\n\n')

    // Handle client disconnection
    req.on('close', () => {
        // Remove the client's response object from the connections array
        delete connections[userId]
        console.log('Client disconnected')
    })
}

// Send Message
export const sendMessage = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { to_user_id, text = '', post_id } = req.body
        const image = req.file

        let media_url = ''
        let message_type = post_id ? 'post' : image ? 'image' : 'text'
        if (!to_user_id || (!text.trim() && !image && !post_id)) {
            return res.status(400).json({ success: false, message: 'Recipient and message content are required.' })
        }
        if (post_id) {
            const Post = (await import('../models/Post.js')).default
            const postExists = await Post.exists({ _id: post_id, post_type: { $ne: 'share' } })
            if (!postExists) return res.status(404).json({ success: false, message: 'Post not found.' })
        }

        if (message_type === 'image') {
            const fileBuffer = fs.readFileSync(image.path)
            const response = await imagekit.upload({
                file: fileBuffer,
                fileName: image.originalname
            })
            media_url = imagekit.url({
                path: response.filePath,
                transformation: [
                    { quality: 'auto' },
                    { format: 'webp' },
                    { width: '1280' },
                ]
            })
        }
        const message = await Message.create({
            from_user_id: userId,
            to_user_id,
            text,
            message_type,
            media_url,
            shared_post: post_id || null
        })

        // Populate the post attachment before returning it and broadcasting via SSE.
        const messageWithUserData = await Message.findById(message._id).populate('from_user_id').populate({ path: 'shared_post', populate: { path: 'user' } })
        res.json({ success: true, message: messageWithUserData })

        if (connections[to_user_id]) {
            connections[to_user_id].write(`data: ${JSON.stringify(messageWithUserData)}\n\n`)
        }

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// Get Chat Messages
export const getChatMessages = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { to_user_id } = req.body

        const messages = await Message.find({
            $or: [
                { from_user_id: userId, to_user_id },
                { from_user_id: to_user_id, to_user_id: userId },
            ]
        }).populate({ path: 'shared_post', populate: { path: 'user' } }).sort({ createdAt: 1 })

        // Mark messages as seen
        await Message.updateMany({ from_user_id: to_user_id, to_user_id: userId }, { seen: true })

        res.json({ success: true, messages })

    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getUserRecentMessages = async (req, res) => {
    try {
        const { userId } = req.auth()
        const messages = await Message.find({ to_user_id: userId }).populate('from_user_id to_user_id').populate('shared_post').sort({ createdAt: -1 })

        res.json({ success: true, messages })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}