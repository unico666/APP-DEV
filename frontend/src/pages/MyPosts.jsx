import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../api.js';

export default function MyPosts() {
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    blogApi.mine().then(setPosts).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <>
      <h1>My Posts</h1>
      {posts.length === 0 && <p>You have not written any posts.</p>}
      {posts.map((p) => (
        <article key={p.id} className="card">
          <h2><Link to={`/posts/${p.id}`}>{p.title}</Link></h2>
          <small>{new Date(p.createdAt).toLocaleString()}</small>
          <div className="actions">
            <Link className="btn" to={`/posts/${p.id}/edit`}>Edit</Link>
          </div>
        </article>
      ))}
    </>
  );
}
