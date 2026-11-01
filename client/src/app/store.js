import { configureStore } from "@reduxjs/toolkit"
import connectionsReducer from "../features/connections/connectionsSlice.js"
import messagesReducer from "../features/messages/messagesSlice.js"
import userReducer from "../features/user/userSlice.js"

export const store = configureStore({
    reducer: {
        user: userReducer,
        connections: connectionsReducer,
        messages: messagesReducer
    }
})