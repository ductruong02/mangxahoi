import { useAuth } from "@clerk/clerk-react";
import { ImagePlus, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const EditPostModal = ({ post, onClose, onUpdated }) => {
    const { getToken } = useAuth();
    const [content, setContent] = useState(post.content || '');
    const [keptImages, setKeptImages] = useState(post.image_urls || []);
    const [newImages, setNewImages] = useState([]);
    const [saving, setSaving] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        if (!content.trim() && !keptImages.length && !newImages.length) return toast.error(`Post can't be empty.`);
        setSaving(true);
        try {
            const form = new FormData();
            form.append('postId', post._id);
            form.append('content', content);
            form.append('keep_image_urls', JSON.stringify(keptImages));
            newImages.forEach(file => form.append('images', file));
            const { data } = await api.put('/api/post/update', form, { headers: { Authorization: `Bearer ${await getToken()}` } });
            if (!data.success) throw new Error(data.message);
            toast.success(data.message);
            onUpdated(data.post);
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
        finally { setSaving(false); }
    };

    return <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        <form onSubmit={submit} className="bg-white rounded-2xl w-full max-w-xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Edit post</h2>
                <button type="button" onClick={onClose}><X /></button>
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-400" placeholder="What are you think about?" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {keptImages.map(url => <div key={url} className="relative">
                    <img src={url} className="w-full h-24 object-cover rounded-lg" alt="" />
                    <button type="button" onClick={() => setKeptImages(items => items.filter(item => item !== url))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X size={14} />
                    </button>
                </div>
                )}
                {newImages.map((file, index) => <div key={`${file.name}-${index}`} className="relative">
                    <img src={URL.createObjectURL(file)} className="w-full h-24 object-cover rounded-lg" alt="" />
                    <button type="button" onClick={() => setNewImages(items => items.filter((_, i) => i !== index))}
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1"><X size={14} />
                    </button>
                </div>)}
            </div>
            <label className="inline-flex items-center gap-2 text-indigo-600 cursor-pointer">
                <ImagePlus size={18} /> Add photos
                <input hidden type="file" accept="image/*" multiple onChange={e => setNewImages(items => [...items, ...Array.from(e.target.files || [])].slice(0, 4 - keptImages.length))} />
            </label>
            <div className="flex justify-end gap-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-100">Cancel</button>
                <button disabled={saving} className="px-5 py-2 rounded-lg bg-indigo-600 text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save changes'}</button>
            </div>
        </form>
    </div>;
};
export default EditPostModal;
