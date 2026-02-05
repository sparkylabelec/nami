
import React, { useState, useEffect } from 'react';
import { Post, postService, PostInput } from '../services/postService';
import { User } from '../types';
import { exportToDocx } from '../services/exportService';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  List, 
  X, 
  Loader2, 
  CheckCircle2, 
  FileText,
  User as UserIcon,
  Calendar,
  FileDown
} from 'lucide-react';

interface Props {
  user: User;
}

const PostManager: React.FC<Props> = ({ user }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form States
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const data = await postService.getPosts();
      setPosts(data);
    } catch (error) {
      alert('데이터를 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = (post: Post) => {
    // 게시판 내용은 일반 텍스트이므로 P 태그로 구조화하여 전달
    const htmlContent = `<p>${(post.content || "").replace(/\n/g, '</p><p>')}</p>`;
    exportToDocx({
      title: post.title,
      author: post.author,
      htmlContent: htmlContent,
      fileName: `[게시글]_${post.title}`
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const safeTitle = (title || "").trim();
    const safeContent = (content || "").trim();
    
    if (!safeTitle || !safeContent) return;

    setIsLoading(true);
    try {
      if (editingPost) {
        await postService.updatePost(editingPost.id, { title: safeTitle, content: safeContent });
      } else {
        const newPost: PostInput = {
          title: safeTitle,
          content: safeContent,
          author: user.name,
          authorId: user.uid
        };
        await postService.createPost(newPost);
      }
      resetForm();
      await fetchPosts();
    } catch (error) {
      alert('저장에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (post: Post) => {
    setEditingPost(post);
    setTitle(post.title);
    setContent(post.content);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;
    setIsLoading(true);
    try {
      await postService.deletePost(id);
      await fetchPosts();
    } catch (error) {
      alert('삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setEditingPost(null);
    setIsFormOpen(false);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '-';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-indigo-600" />
            전사 게시판
          </h2>
          <p className="text-gray-500 text-sm mt-1">팀 간의 소통과 공지사항을 확인하세요.</p>
        </div>
        {!isFormOpen && (
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
          >
            <Plus size={18} />
            새 게시글 작성
          </button>
        )}
      </div>

      {isFormOpen && (
        <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 overflow-hidden ring-4 ring-indigo-50">
          <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
            <h3 className="text-white font-bold flex items-center gap-2">
              {editingPost ? <Pencil size={18} /> : <Plus size={18} />}
              {editingPost ? '게시글 수정' : '새 게시글 작성'}
            </h3>
            <button onClick={resetForm} className="text-indigo-100 hover:text-white">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">제목</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력하세요"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">내용</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="여기에 내용을 입력하세요..."
                rows={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none leading-relaxed"
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={resetForm}
                className="px-6 py-2.5 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl transition-all"
              >
                취소
              </button>
              <button 
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (editingPost ? <Save size={20} /> : <CheckCircle2 size={20} />)}
                {editingPost ? '수정 완료' : '게시하기'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {isLoading && !isFormOpen ? (
          <div className="flex flex-col items-center justify-center py-20 text-indigo-300">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="font-medium">데이터를 불러오는 중입니다...</p>
          </div>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:border-indigo-100">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                    <div className="flex items-center gap-1.5 font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                      <UserIcon size={14} />
                      {post.author}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={14} />
                      {formatDate(post.createdAt)}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleExport(post)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    title="Word 다운로드"
                  >
                    <FileDown size={18} />
                  </button>
                  {post.authorId === user.uid && (
                    <>
                      <button 
                        onClick={() => handleEdit(post)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 text-gray-600 leading-relaxed whitespace-pre-wrap">
                {post.content}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-20 flex flex-col items-center justify-center">
            <div className="bg-gray-50 p-4 rounded-full mb-4">
              <List className="text-gray-300" size={48} />
            </div>
            <p className="text-gray-500 font-medium">아직 등록된 게시글이 없습니다.</p>
            <button 
              onClick={() => setIsFormOpen(true)}
              className="mt-4 text-indigo-600 font-bold hover:underline"
            >
              첫 게시글 작성하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostManager;
