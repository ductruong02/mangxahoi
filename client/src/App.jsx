import { useUser } from "@clerk/clerk-react"
import { Route, Routes } from "react-router-dom"
import ChatBox from "./pages/ChatBox"
import Connections from "./pages/Connections"
import CreatePost from "./pages/CreatePost"
import Discover from "./pages/Discover"
import Feed from "./pages/Feed"
import Layout from "./pages/Layout"
import Messages from "./pages/Messages"
import Profile from "./pages/Profile"
import Login from "./pages/login"

const App = () => {
  const { user } = useUser()

  return (
    <>
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Layout />} >
          <Route index element={<Feed />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<ChatBox />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:profileId" element={<Profile />} />
          <Route path="/create-post" element={<CreatePost />} />
        </Route>
      </Routes >
    </>
  )
}

export default App
