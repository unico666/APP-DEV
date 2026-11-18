import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../api.js';

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    blogApi.list().then(setPosts).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <h1>Latest Posts</h1>
      {posts.length === 0 && <p>No posts yet.</p>}
      {posts.map((p) => (
        <article key={p.id} className="card">
          <h2><Link to={`/posts/${p.id}`}>{p.title}</Link></h2>
          <small>by {p.author} · {new Date(p.createdAt).toLocaleString()}</small>
          <p>{p.content.length > 160 ? p.content.slice(0, 160) + '…' : p.content}</p>
        </article>
      ))}
    </>
  );
}
