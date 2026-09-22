import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';
import './Blog.css';

export default function BlogPost({ slug, onBack }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .single();

      if (!error) setPost(data);
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) return <div className="blog-loading">Loading…</div>;
  if (!post) return <div className="blog-loading">Article not found.</div>;

  const getInitials = (name) =>
    name?.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '';

  const getReadTime = (content) => {
    const words = content?.trim().split(/\s+/).length || 0;
    return Math.max(1, Math.round(words / 200)); // ~200 words/min
  };

  return (
    <div className="blog-post">
      <button className="blog-back" onClick={onBack}>← Back to articles</button>

      {post.cover_image && (
        <div className="blog-post-img">
          <img src={post.cover_image} alt={post.title} />
        </div>
      )}

      <h1 className="blog-post-title">{post.title}</h1>
      <div className="blog-post-meta">
        {post.author} · {new Date(post.created_at).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'short', year: 'numeric',
        })}
      </div>
      <div className="blog-author-mini">
  <div className="blog-author-avatar">{getInitials(post.author)}</div>
  <div>
    <div className="blog-author-mini-name">{post.author}</div>
    <div className="blog-author-mini-sub">Founder, Dakhilaa · {getReadTime(post.content)} min read</div>
  </div>
</div>

            {/* content — Markdown se render */}
      <div className="blog-post-content">
        <ReactMarkdown>{post.content}</ReactMarkdown>
      </div>

      {/* About the Author — har article ke neeche automatic */}
      <div className="blog-author-box">
        <div className="blog-author-head">About the Author</div>
        <p>
          <strong>Mukesh Singh</strong> is the founder of{' '}
          <a href="https://dakhilaa.com">Dakhilaa</a>. He writes about JEE preparation,
          learning psychology, performance systems, and rank improvement strategies.
        </p>
                <div className="blog-author-links">
          <a href="https://instagram.com/dakhilaaofficial" target="_blank" rel="noopener noreferrer">
            📷 Instagram
          </a>
          <a href="https://www.facebook.com/share/1BGUYMq7PZ/" target="_blank" rel="noopener noreferrer">
            👥 Facebook
          </a>
          <a href="mailto:Support@dakhilaa.com">✉️ Support@dakhilaa.com</a>
        </div>
      </div>
    </div>
  );
}