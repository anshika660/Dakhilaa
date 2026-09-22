import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import './Blog.css';

export default function BlogList({ onOpenPost }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, cover_image, author, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (!error) setPosts(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return <div className="blog-loading">Loading articles…</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="blog-empty">
        <div className="blog-empty-emoji">📝</div>
        <p>New JEE prep articles coming soon. Check back shortly.</p>
      </div>
    );
  }

  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <div key={post.id} className="blog-card" onClick={() => onOpenPost(post.slug)}>
          {post.cover_image && (
            <div className="blog-card-img">
              <img src={post.cover_image} alt={post.title} />
            </div>
          )}
          <div className="blog-card-body">
            <div className="blog-card-title">{post.title}</div>
            <p className="blog-card-excerpt">{post.excerpt}</p>
            <div className="blog-card-meta">
              <span>{post.author}</span>
              <span>{new Date(post.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}