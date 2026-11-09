import { useAuth } from "@clerk/clerk-react";
import { BadgeCheck, Heart, MessageCircle, MoreHorizontal, Pencil, Share2, Trash2 } from "lucide-react";
import moment from "moment";
import { useState } from "react";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import CommentsSection from "./CommentsSection";
import EditPostModal from "./EditPostModal";
import SharePostModal from "./SharePostModal";

const PostCard = ({ post, onPostChanged }) => {
    const currentUser = useSelector(state => state.user.value);
    const { getToken } = useAuth();
    const navigate = useNavigate();
    const [likes, setLikes] = useState(post.post_type === 'share' ? (post.shared_post?.likes_count || []) : (post.likes_count || []));
    const [showComments, setShowComments] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showShare, setShowShare] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const originalPost = post.post_type === 'share' ? post.shared_post : post;
    const isShare = post.post_type === 'share';
    const isOwner = post.user?._id === currentUser?._id;
    const canEditOriginal = !isShare && isOwner;

    if (!originalPost) return null;

    const handleLike = async () => {
        try {
            const { data } = await api.post('/api/post/like', { postId: originalPost._id }, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if (!data.success) throw new Error(data.message);
            setLikes(data.likes_count || []);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };
    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            const { data } = await api.delete('/api/post/delete', { data: { postId: post._id }, headers: { Authorization: `Bearer ${await getToken()}` } });
            if (!data.success) throw new Error(data.message);
            toast.success(data.message);
            onPostChanged?.(post._id);
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    return <article className="bg-white rounded-xl shadow p-4 space-y-4 w-full max-w-2xl">
        {isShare && <div className="flex items-center gap-2 text-sm text-gray-500"><Share2 size={15} />
            <span><b>{post.user?.full_name || 'User'}</b> shared the post</span>
            <span className="ml-auto">{moment(post.createdAt).fromNow()}</span>
        </div>}
        <div className="flex items-start justify-between gap-2">
            <div onClick={() => navigate(`/profile/${(isShare ? originalPost.user : post.user)?._id}`)} className="inline-flex items-center gap-3 cursor-pointer min-w-0">
                <img src={(isShare ? originalPost.user : post.user)?.profile_picture} alt="Profile picture" className="w-10 h-10 rounded-full shadow object-cover" />
                <div className="min-w-0">
                    <div className="flex items-center gap-1">
                        <span className="font-medium truncate">{(isShare ? originalPost.user : post.user)?.full_name}</span>
                        <BadgeCheck className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-gray-500 text-sm">@{(isShare ? originalPost.user : post.user)?.username} · {moment(isShare ? originalPost.createdAt : post.createdAt).fromNow()}</div>
                </div>
            </div>
            {(isOwner || canEditOriginal) && <div className="relative">
                <button onClick={() => setShowMenu(v => !v)} className="p-2 rounded-full hover:bg-gray-100"><MoreHorizontal size={19} /></button>
                {showMenu && <div className="absolute right-0 top-9 z-10 bg-white shadow-lg border rounded-lg py-1 w-40">{
                    canEditOriginal && <button onClick={() => {
                        setShowEdit(true); setShowMenu(false)
                    }} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"><Pencil size={15} /> Edit post</button>}
                    <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-gray-50">
                        <Trash2 size={15} /> Delete post</button>
                </div>
                }
            </div>
            }
        </div>
        {originalPost.content && <p className="text-gray-800 text-sm whitespace-pre-line break-words">{originalPost.content}</p>}
        {!!originalPost.image_urls?.length && <div className="grid grid-cols-2 gap-2">
            {originalPost.image_urls.map(
                (img, index) => <img src={img} key={index} className={`w-full h-48 object-cover rounded-lg ${originalPost.image_urls.length === 1
                    ? 'col-span-2 h-auto max-h-[520px]'
                    : ''}`} alt="Post image" />)}
        </div>
        }
        <div className="flex items-center gap-5 text-gray-600 text-sm pt-2 border-t border-gray-200">
            <button onClick={handleLike} className="flex items-center gap-1 hover:text-red-500">
                <Heart className={`w-4 h-4 ${likes.includes(currentUser?._id) ? 'text-red-500 fill-red-500' : ''}`} />
                <span>{likes.length}</span>
            </button>
            <button onClick={() => setShowComments(v => !v)} className="flex items-center gap-1 hover:text-indigo-600">
                <MessageCircle className="w-4 h-4" />
                <span>Comment</span>
            </button>
            <button onClick={() => setShowShare(true)} className="flex items-center gap-1 hover:text-indigo-600">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
            </button>
        </div>
        {showComments && <CommentsSection postId={originalPost._id} />}
        {showEdit && <EditPostModal post={post} onClose={() => setShowEdit(false)} onUpdated={() => onPostChanged?.(post._id, true)} />}
        {showShare && <SharePostModal post={originalPost} onClose={() => setShowShare(false)} onShared={() => onPostChanged?.(null, true)} />}
    </article>;
};
export default PostCard;
