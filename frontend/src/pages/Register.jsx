import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api.js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'reader' });
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const body = { ...form };
      if (!body.email) delete body.email;
      await authApi.register(body);
      navigate('/login');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <h1>Register</h1>
      {error && <p className="error">{error}</p>}
      <input placeholder="Username" value={form.username} onChange={set('username')} />
      <input type="email" placeholder="Email (optional)" value={form.email} onChange={set('email')} />
      <input type="password" placeholder="Password" value={form.password} onChange={set('password')} />
      <select value={form.role} onChange={set('role')}>
        <option value="reader">Reader</option>
        <option value="author">Author</option>
        <option value="admin">Admin</option>
      </select>
      <button type="submit">Create account</button>
    </form>
  );
}
