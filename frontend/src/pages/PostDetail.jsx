import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { blogApi } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    blogApi.get(id).then(setPost).catch((e) => setError(e.message));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await blogApi.remove(id);
      navigate('/');
    } catch (e) {
      setError(e.message);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!post) return <p>Loading…</p>;

  const canEdit = user && (user.role === 'admin' || user.id === post.authorId);
  const canDelete = user && user.role === 'admin';

  return (
    <article className="card">
      <h1>{post.title}</h1>
      <small>by {post.author} · {new Date(post.createdAt).toLocaleString()}</small>
      <p className="content">{post.content}</p>
      <div className="actions">
        {canEdit && <Link className="btn" to={`/posts/${post.id}/edit`}>Edit</Link>}
        {canDelete && <button className="danger" onClick={handleDelete}>Delete</button>}
        <Link to="/">← Back</Link>
      </div>
    </article>
  );
}
