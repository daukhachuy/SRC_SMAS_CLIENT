import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer'; 
import '../styles/Promotion.css';

const Promotion = () => {
    const blogRef = useRef(null);
    const comboRef = useRef(null);
    const discountRef = useRef(null);

    // Hàm scroll dùng chung cho tất cả các phần
    const scrollHandler = (ref, direction) => {
        if (ref.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

   const blogData = [
        { id: 1, tag: "MẸO ĂN UỐNG", title: "5 Cách săn voucher giảm giá cực hời mỗi tuần", desc: "Làm thế nào để luôn được ăn ngon với giá tiết kiệm? Hãy xem ngay các mẹo săn deal sau...", img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500" },
        { id: 2, tag: "TIN TỨC", title: "Top 10 món ăn đường phố được yêu thích nhất tháng 10", desc: "Khám phá danh sách các món ăn đang làm môi làm gió trên các bảng xếp hạng ẩm thực...", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500" },
        { id: 3, tag: "KHÁM PHÁ", title: "Nghệ thuật trình bày món ăn đẹp mắt như nhà hàng 5 sao", desc: "Biến bữa cơm gia đình trở nên sang trọng hơn chỉ với vài bước đơn giản và tinh tế...", img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500" },
        { id: 4, tag: "SỨC KHỎE", title: "Chế độ ăn Clean Eating cho người bận rộn", desc: "Duy trì vóc dáng và sức khỏe với những thực đơn đơn giản, chuẩn bị chỉ trong 15 phút...", img: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500" },
        { id: 5, tag: "VĂN HÓA", title: "Hành trình khám phá hương vị cà phê Việt Nam", desc: "Từ cà phê trứng Hà Nội đến cà phê sữa đá Sài Gòn, mỗi giọt cà phê là một câu chuyện...", img: "https://images.unsplash.com/photo-1541167760496-162955ed8a9f?w=500" },
        { id: 6, tag: "GIA VỊ", title: "Bí quyết kết hợp gia vị cho món nướng chuẩn vị", desc: "Học cách sử dụng thảo mộc và gia vị tự nhiên để nâng tầm món nướng của bạn lên tầm cao mới...", img: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=500" },
    ];

    const vouchers = [
        { id: 1, title: "Miễn phí vận chuyển", desc: "Đơn hàng từ 150.000đ", code: "FREESHIP", icon: "🚚" },
        { id: 2, title: "Giảm 50.000đ", desc: "Cho đơn từ 300.000đ", code: "FOODIE50", icon: "🍴" },
        { id: 3, title: "Giảm 20% Tổng bill", desc: "Tối đa 100.000đ", code: "ALLDAY20", icon: "🔥" },
    ];

    return (
        <div className="Page-Container">
            <Header />

            <main className="Promotion-Page-Wrapper">
                {/* HERO BANNER */}
                <section className="Promo-Hero-Container">
                    <div className="Promo-Hero-Card">
                        <img src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1200" alt="Hero" />
                        <div className="Hero-Overlay">
                            <span className="hero-tag">Voucher & Deals</span>
                            <h1>Đại Tiệc Cuối Tuần<br/>Thưởng Thức Thả Ga</h1>
                            <button className="btn-order-now-hero">Đặt ngay ngay</button>
                        </div>
                    </div>
                </section>

                {/* VOUCHER LIST */}
                <section className="Section-Container">
                    <div className="Section-Header-Line">
                        <h2 className="Voucher-Title">🎫 Voucher Hấp Dẫn</h2>
                    </div>
                    <div className="Voucher-Grid-ImageStyle">
                        {vouchers.map(v => (
                            <div className="Voucher-Card-New" key={v.id}>
                                <div className="V-Icon">{v.icon}</div>
                                <h3>{v.title}</h3>
                                <p>{v.desc}</p>
                                <div className="Voucher-Bottom">
                                    <span className="V-Code">{v.code}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* BLOG ẨM THỰC */}
                <section className="Section-Container Blog-Section-Main">
                    <div className="Blog-Header-Center">
                        <h2>Blog Ẩm Thực</h2>
                        <p>Khám phá những mẹo ăn uống hữu ích và cập nhật tin tức khuyến mãi mới nhất từ chúng tôi.</p>
                    </div>
                    
                    <div className="Blog-Slider-Outer">
                        {/* Nút bấm Blog đã được chỉnh khoảng cách trong CSS */}
                        <button className="blog-nav-btn left" onClick={() => scrollHandler(blogRef, 'left')}><ChevronLeft size={30}/></button>
                        
                        <div className="Blog-Scroll-Container" ref={blogRef}>
                            {blogData.map(blog => (
                                <div className="Blog-Item-Card" key={blog.id}>
                                    <div className="Blog-Img-Holder">
                                        <img src={blog.img} alt="Blog" />
                                    </div>
                                    <div className="Blog-Text-Content">
                                        <span className="Blog-Tag-Red">{blog.tag}</span>
                                        <h4>{blog.title}</h4>
                                        <p>{blog.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="blog-nav-btn right" onClick={() => scrollHandler(blogRef, 'right')}><ChevronRight size={30}/></button>
                    </div>
                </section>

                {/* COMBO SIÊU LỜI - CÓ THÊM NÚT BẤM */}
                <section className="Section-Container">
                    <div className="Section-Header-Line">
                        <h2>COMBO SIÊU LỜI</h2>
                        <div className="header-line"></div>
                    </div>
                    
                    <div className="Blog-Slider-Outer">
                        <button className="blog-nav-btn left" onClick={() => scrollHandler(comboRef, 'left')}><ChevronLeft size={30}/></button>
                        
                        <div className="Infinite-Slider-Wrapper" ref={comboRef} style={{overflowX: 'auto', scrollBehavior: 'smooth'}}>
                            <div className="Infinite-Track-Product">
                                {[...Array(10)].map((_, i) => (
                                    <div className="Product-Card-Modern" key={i}>
                                        <div className="img-holder">
                                            <img src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400" alt="Food" />
                                        </div>
                                        <div className="Product-Info">
                                            <h3>Cá mú đỏ <span className="price-tag-inline">250 000 vnđ / đĩa</span></h3>
                                            <p className="product-desc-mini">Cá mú được tẩm bột tỏi hành và chiên trong ngập dầu ăn sẽ tạo cảm giác như ở trên mây</p>
                                            <button className="btn-add-cart-modern">Thêm</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="blog-nav-btn right" onClick={() => scrollHandler(comboRef, 'right')}><ChevronRight size={30}/></button>
                    </div>
                </section>

                {/* MÓN ĂN GIẢM GIÁ - CÓ THÊM NÚT BẤM */}
                <section className="Section-Container">
                    <div className="Section-Header-Line">
                        <h2>Món ăn giảm giá</h2>
                        <div className="header-line"></div>
                    </div>

                    <div className="Blog-Slider-Outer">
                        <button className="blog-nav-btn left" onClick={() => scrollHandler(discountRef, 'left')}><ChevronLeft size={30}/></button>
                        
                        <div className="Infinite-Slider-Wrapper" ref={discountRef} style={{overflowX: 'auto', scrollBehavior: 'smooth'}}>
                            <div className="Infinite-Track-Product reverse">
                                {[...Array(10)].map((_, i) => (
                                    <div className="Product-Card-Modern" key={i}>
                                        <div className="img-holder">
                                            <img src="https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400" alt="Food" />
                                        </div>
                                        <div className="Product-Info">
                                            <h3>Cá mú đỏ <span className="price-old-inline">250 000 vnđ / đĩa</span></h3>
                                            <p className="product-desc-mini">Cá mú được tẩm bột tỏi hành và chiên trong ngập dầu ăn sẽ tạo cảm giác như ở trên mây</p>
                                            <div className="price-row-discount">
                                                <button className="btn-add-cart-modern">Thêm</button>
                                                <span className="price-new-bold">150 000 vnđ / đĩa</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <button className="blog-nav-btn right" onClick={() => scrollHandler(discountRef, 'right')}><ChevronRight size={30}/></button>
                    </div>
                </section>

            </main>
            <Footer />
        </div>
    );
};

export default Promotion;