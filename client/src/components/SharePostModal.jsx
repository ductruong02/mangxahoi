import { useAuth } from "@clerk/clerk-react";
import { MessageCircle, UserRound, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import api from "../api/axios";

const SharePostModal = ({ post, onClose, onShared }) => {
    const { getToken } = useAuth();
    const { connections } = useSelector(state => state.connections);
    const [recipient, setRecipient] = useState('');
    const [note, setNote] = useState('');
    const [sending, setSending] = useState(false);
    const shareToProfile = async () => {
        setSending(true);
        try {
            const { data } = await api.post('/api/post/share/profile', { postId: post._id }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if (!data.success) throw new Error(data.message);
            toast.success(data.message); onShared?.(); onClose();
        } catch (error) { toast.error(error.response?.data?.message || error.message); }
        finally { setSending(false); }
    };
    const shareToMessage = async (e) => {
        e.preventDefault();
        if (!recipient) return toast.error('Please select a recipient.');
        setSending(true);
        try {
            const { data } = await api.post('/api/message/send', { to_user_id: recipient, text: note, post_id: post._id }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if (!data.success) throw new Error(data.message);
            toast.success('Post shared via message.'); onClose();
        } catch (error) { toast.error(error.response?.data?.message || error.message); }
        finally { setSending(false); }
    };
    return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Share Post</h2>
                <button onClick={onClose}><X /></button>
            </div>
            <button disabled={sending} onClick={shareToProfile} className="w-full flex items-center gap-3 border rounded-xl p-3 hover:bg-gray-50 text-left">
                <UserRound className="text-indigo-600" />
                <span>
                    <b className="block text-sm">Share to Profile</b>
                    <small className="text-gray-500">Display post on your profile</small>
                </span>
            </button>
            <form onSubmit={shareToMessage} className="space-y-3 border rounded-xl p-3">
                <div className="flex items-center gap-2 font-medium">
                    <MessageCircle size={18} className="text-indigo-600" /> Share via Message
                </div>
                <select value={recipient} onChange={e => setRecipient(e.target.value)} className="w-full border rounded-lg p-2 text-sm">
                    <option value="">Select Recipient</option>
                    {connections.map(user => <option key={user._id} value={user._id}>{user.full_name} (@{user.username})</option>)}
                </select>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Write a note (optional)" className="w-full border rounded-lg p-2 text-sm" />
                <button disabled={sending || !recipient} className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm disabled:opacity-50">Share Post</button>
            </form>
        </div>
    </div>;
};
export default SharePostModal;
