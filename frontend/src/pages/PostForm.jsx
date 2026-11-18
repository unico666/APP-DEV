import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { blogApi } from '../api.js';

// Used for both "New Post" (/posts/new) and "Edit Post" (/posts/:id/edit)
export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      blogApi.get(id).then((p) => setForm({ title: p.title, content: p.content })).catch((e) => setError(e.message));
    }
  }, [id]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const saved = id ? await blogApi.update(id, form) : await blogApi.create(form);
      navigate(`/posts/${saved.id}`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h1>{id ? 'Edit Post' : 'New Post'}</h1>
      {error && <p className="error">{error}</p>}
      <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea rows="8" placeholder="Content" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      <button type="submit">{id ? 'Save changes' : 'Publish'}</button>
    </form>
  );
}
