import { useAuth } from "@clerk/clerk-react";
import { Send, Trash2 } from "lucide-react";
import moment from "moment";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import api from "../api/axios";

const CommentsSection = ({ postId }) => {
    const { getToken } = useAuth();
    const currentUser = useSelector(state => state.user.value);
    const [comments, setComments] = useState([]);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const headers = async () => ({ Authorization: `Bearer ${await getToken()}` });

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const { data } = await api.get(`/api/post/${postId}/comments`, { headers: await headers() });
                if (active && data.success) setComments(data.comments);
            } catch (error) {
                toast.error(error.response?.data?.message || error.message);
            }
            finally {
                if (active) setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [postId]);

    const add = async (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        try {
            const { data } = await api.post('/api/post/comment', { postId, content }, { headers: await headers() });
            if (!data.success) throw new Error(data.message);
            setComments(items => [...items, data.comment]); setContent('');
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };
    const remove = async (commentId) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        try {
            const { data } = await api.delete('/api/post/comment', { data: { commentId }, headers: await headers() });
            if (!data.success) throw new Error(data.message);
            setComments(items => items.filter(item => item._id !== commentId));
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    return <div className="border-t pt-3 space-y-3">
        <div className="max-h-64 overflow-y-auto space-y-3">
            {loading ? <p className="text-sm text-gray-400">Loading comments...</p>
                : comments.length === 0
                    ? <p className="text-sm text-gray-400">No comments yet</p>
                    : comments.map(comment => <div key={comment._id} className="flex gap-2 items-start">
                        <img src={comment.user?.profile_picture} alt="" className="w-8 h-8 rounded-full object-cover" />
                        <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2">
                            <div className="flex justify-between gap-2">
                                <span className="text-sm font-medium">
                                    {comment.user?.full_name || 'User'}</span>
                                <span className="text-xs text-gray-400">
                                    {moment(comment.createdAt).fromNow()}
                                </span>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                        </div>
                        {comment.user?._id === currentUser?._id && <button onClick={() => remove(comment._id)} title="Delete comment" className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>}
                    </div>
                    )}
        </div>
        <form onSubmit={add} className="flex gap-2">
            <input value={content} onChange={e => setContent(e.target.value)} maxLength={2000} placeholder="Write a comment..." className="flex-1 min-w-0 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none" />
            <button disabled={!content.trim()} className="p-2 rounded-full bg-indigo-600 text-white disabled:opacity-40"><Send size={16} /></button>
        </form>
    </div>;
};
export default CommentsSection;
