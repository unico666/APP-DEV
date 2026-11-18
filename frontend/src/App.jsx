import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import Home from './pages/Home.jsx';
import PostDetail from './pages/PostDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import MyPosts from './pages/MyPosts.jsx';
import PostForm from './pages/PostForm.jsx';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const canWrite = user && (user.role === 'author' || user.role === 'admin');

  return (
    <nav className="navbar">
      <Link to="/" className="brand">Mini Blog</Link>
      <div className="nav-links">
        <Link to="/">Posts</Link>
        {user && <Link to="/my-posts">My Posts</Link>}
        {canWrite && <Link to="/posts/new">New Post</Link>}
        {user ? (
          <>
            <span className="badge">{user.username} · {user.role}</span>
            <button onClick={async () => { await logout(); navigate('/'); }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function RequireAuth({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <p className="error">403 – your role cannot access this page.</p>;
  return children;
}

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/my-posts" element={<RequireAuth><MyPosts /></RequireAuth>} />
          <Route path="/posts/new" element={<RequireAuth roles={['author', 'admin']}><PostForm /></RequireAuth>} />
          <Route path="/posts/:id/edit" element={<RequireAuth><PostForm /></RequireAuth>} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
