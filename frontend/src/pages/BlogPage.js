import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaTags, FaSearch, FaArrowRight } from 'react-icons/fa';
import '../styles/BlogPage.css';

// Import background image from src/assets
import restaurantImage from '../assets/images/about/restaurant-interior.jpg';

// Mock data - replace with API calls
const blogPosts = [
  {
    id: 1,
    title: 'Hành trình khởi nghiệp của nhà hàng chúng tôi',
    excerpt: 'Khám phá câu chuyện đằng sau sự ra đời của nhà hàng và những thách thức ban đầu...',
    content: `
      <p>Vào một ngày đẹp trời năm 2018, chúng tôi - những người yêu ẩm thực đã quyết định biến đam mê thành hiện thực. Từ một quán nhỏ ven biển, sau 5 năm nỗ lực không ngừng, chúng tôi đã xây dựng được thương hiệu nhà hàng hải sản được yêu thích nhất khu vực.</p>
      <p>Những ngày đầu tiên không hề dễ dàng, từ việc tìm nguồn hải sản tươi ngon cho đến xây dựng thực đơn độc đáo. Nhưng với sự ủng hộ của khách hàng, chúng tôi đã vượt qua tất cả.</p>
      <p>Đến nay, nhà hàng đã phục vụ hơn 50,000 thực khách và nhận được nhiều giải thưởng ẩm thực uy tín.</p>
    `,
    image: '/images/blog/restaurant-story.jpg',
    date: '2023-11-15',
    author: 'Nguyễn Văn A',
    position: 'Chủ nhà hàng',
    tags: ['Câu chuyện', 'Khởi nghiệp', 'Hải sản'],
    slug: 'hanh-trinh-khoi-nghiep',
    readTime: '5 phút đọc'
  },
  {
    id: 2,
    title: 'Bí quyết chọn hải sản tươi ngon',
    excerpt: 'Hướng dẫn chi tiết cách chọn lựa hải sản tươi ngon nhất cho bữa ăn gia đình...',
    content: `
      <h3>1. Cách chọn tôm tươi</h3>
      <p>Màu sắc tươi sáng, vỏ cứng và trong, đầu dính chặt vào thân. Tôm tươi có mùi thơm đặc trưng, không có mùi tanh hôi.</p>
      
      <h3>2. Cách chọn mực tươi</h3>
      <p>Mực tươi có màu trắng sữa, thịt đàn hồi tốt, mắt trong và đồng tử đen. Nên chọn con có lớp màng màu nâu đỏ bám ngoài còn nguyên vẹn.</p>
    `,
    image: '/images/blog/seafood-tips.jpg',
    date: '2023-11-20',
    author: 'Trần Thị B',
    position: 'Đầu bếp trưởng',
    tags: ['Mẹo vặt', 'Hải sản', 'Nấu ăn'],
    slug: 'bi-quyet-chon-hai-san',
    readTime: '7 phút đọc'
  },
  {
    id: 3,
    title: 'Top 5 món hải sản tốt cho sức khỏe',
    excerpt: 'Khám phá những loại hải sản giàu dinh dưỡng và tốt cho sức khỏe...',
    content: `
      <h3>1. Cá hồi</h3>
      <p>Giàu omega-3, tốt cho tim mạch và trí não. Nên ăn 2-3 bữa/tuần.</p>
      
      <h3>2. Hàu</h3>
      <p>Nguồn kẽm dồi dào, tăng cường miễn dịch và tốt cho sinh lý nam giới.</p>
    `,
    image: '/images/blog/healthy-seafood.jpg',
    date: '2023-11-25',
    author: 'Lê Văn C',
    position: 'Chuyên gia dinh dưỡng',
    tags: ['Sức khỏe', 'Dinh dưỡng', 'Hải sản'],
    slug: 'hai-san-tot-cho-suc-khoe',
    readTime: '6 phút đọc'
  }
];

// Get unique categories from all posts
const allCategories = ['Tất cả', ...new Set(blogPosts.flatMap(post => post.tags))];

const BlogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  const [recentPosts, setRecentPosts] = useState([]);

  // Get recent posts (latest 3)
  useEffect(() => {
    setRecentPosts([...blogPosts].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 3));
  }, []);

  // Filter posts based on search and category
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tất cả' || post.tags.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setSearchParams({ search: searchTerm });
  };

  return (
    <div className="blog-page">
      {/* Blog Header with background image */}
      <div
        className="blog-header"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)),
            url(${restaurantImage})
          `
        }}
      >
        <h1>Tin tức & Sự kiện</h1>
        <p>Cập nhật những tin tức mới nhất về nhà hàng và ẩm thực</p>
      </div>

      <div className="blog-container">
        {/* Main Content */}
        <div className="blog-posts">
          {filteredPosts.map(post => (
            <article key={post.id} className="blog-post-card">
              <div className="post-image">
                <img src={post.image} alt={post.title} />
              </div>
              <div className="post-content">
                <div className="post-meta">
                  <span><FaCalendarAlt /> {new Date(post.date).toLocaleDateString('vi-VN')}</span>
                  <span><FaUser /> {post.author}</span>
                  <div className="post-tags">
                    <FaTags />
                    {post.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <h2>
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h2>
                <p className="excerpt">{post.excerpt}</p>
                <Link to={`/blog/${post.slug}`} className="read-more">
                  Đọc thêm <FaArrowRight />
                </Link>
              </div>
            </article>
          ))}

          {filteredPosts.length === 0 && (
            <div className="no-results">
              <h3>Không tìm thấy bài viết phù hợp</h3>
              <p>Hãy thử tìm kiếm với từ khóa khác hoặc chọn danh mục khác</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="blog-sidebar">
          {/* Search Widget */}
          <div className="widget search-widget">
            <h3>Tìm kiếm</h3>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit"><FaSearch /></button>
            </form>
          </div>

          {/* Categories Widget */}
          <div className="widget categories-widget">
            <h3>Danh mục</h3>
            <ul>
              {allCategories.map((category, index) => (
                <li 
                  key={index} 
                  className={selectedCategory === category ? 'active' : ''}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </li>
              ))}
            </ul>
          </div>

          {/* Recent Posts Widget */}
          <div className="widget recent-posts-widget">
            <h3>Bài viết gần đây</h3>
            <ul>
              {recentPosts.map(post => (
                <li key={post.id}>
                  <Link to={`/blog/${post.slug}`} className="recent-post">
                    <img src={post.image} alt={post.title} />
                    <div className="recent-post-info">
                      <h4>{post.title}</h4>
                      <span>{new Date(post.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default BlogPage;