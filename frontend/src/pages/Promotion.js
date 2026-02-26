import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Ticket, Copy, BookOpen, Utensils, Loader2 } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer'; 
import '../styles/Promotion.css';

const Promotion = () => {
    const blogRef = useRef(null);
    const comboRef = useRef(null);
    const discountRef = useRef(null);

    const [blogs, setBlogs] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [combos, setCombos] = useState([]);
    const [foodDiscounts, setFoodDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const API_BASE = "https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net/api";

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            try {
                const [blogRes, discountRes, comboRes, foodDiscountRes] = await Promise.all([
                    axios.get(`${API_BASE}/blogs/lists`),
                    axios.get(`${API_BASE}/discount/lists`),
                    axios.get(`${API_BASE}/combo`),
                    axios.get(`${API_BASE}/food/discount`)
                ]);

                setBlogs(blogRes.data || []);
                setVouchers(discountRes.data || []);
                setCombos(comboRes.data || []);
                setFoodDiscounts(foodDiscountRes.data || []);
            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAllData();
    }, []);

    const scrollHandler = (ref, direction) => {
        if (ref.current) {
            const scrollAmount = direction === 'left' ? -400 : 400;
            ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        alert(`Đã sao chép mã: ${code}`);
    };

    // Tạo mảng nhân bản từ dữ liệu thật để chạy vô hạn
    // Nếu API chưa về (mảng rỗng), mảng này sẽ rỗng và không render gì cả cho đến khi có data
    const infiniteCombos = [...combos, ...combos, ...combos];
    const infiniteFoodDiscounts = [...foodDiscounts, ...foodDiscounts, ...foodDiscounts];

    if (loading) {
        return (
            <div className="Loading-State">
                <Loader2 className="spinner-icon" />
                <p>Đang tải ưu đãi mới nhất từ API...</p>
            </div>
        );
    }

    return (
        <div className="Page-Container">
            <Header />

            <main className="Promotion-Page-Wrapper">
                {/* HERO BANNER */}
                <section className="Promo-Hero-Container">
                    <div className="Promo-Hero-Card">
                        <img src="https://images.unsplash.com/photo-1544025162-d76694265947?w=1200" alt="Hero" />
                        <div className="Hero-Overlay">
                            <span className="hero-tag">Ưu đãi độc quyền</span>
                            <h1>Đại Tiệc Hương Vị<br/>Săn Deal Cực Khủng</h1>
                            <button className="btn-order-now-hero">Khám Phá Ngay</button>
                        </div>
                    </div>
                </section>

                {/* VOUCHER LIST */}
                <section className="Section-Container">
                    <div className="Section-Header-Line header-flex">
                        <h2 className="Voucher-Title">🎫 Voucher Hấp Dẫn</h2>
                        <button className="btn-view-all-minimal" onClick={() => setIsModalOpen(true)}>
                            Xem tất cả
                        </button>
                    </div>
                    <div className="Voucher-Grid-ImageStyle">
                        {vouchers.slice(0, 4).map(v => (
                            <div className="Voucher-Card-New" key={v.discountId}>
                                <div className="V-Icon">🎁</div>
                                <h3>{v.description}</h3>
                                <p>{v.discountType === "Percentage" ? `Giảm ${v.value}%` : `Giảm ${v.value?.toLocaleString()}đ`}</p>
                                <div className="Voucher-Bottom">
                                    <span className="V-Code">{v.code}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* MODAL VOUCHER */}
                {isModalOpen && (
                    <div className="Voucher-Modal-Overlay" onClick={() => setIsModalOpen(false)}>
                        <div className="Voucher-Modal-Content" onClick={e => e.stopPropagation()}>
                            <div className="Modal-Header">
                                <h2>Danh Sách Voucher</h2>
                                <button className="close-btn-minimal" onClick={() => setIsModalOpen(false)}><X size={24} /></button>
                            </div>
                            <div className="Modal-Body-Scroll">
                                {vouchers.map(v => (
                                    <div className="Voucher-Item-Full" key={v.discountId}>
                                        <div className="V-Info">
                                            <span className="V-Tag">{v.discountType === "Percentage" ? `-${v.value}%` : `-${v.value/1000}k`}</span>
                                            <div className="V-Text">
                                                <h4>{v.code}</h4>
                                                <p>{v.description}</p>
                                                <small>Hết hạn: {new Date(v.endDate).toLocaleDateString('vi-VN')}</small>
                                            </div>
                                        </div>
                                        <button className="copy-btn-modal" onClick={() => copyToClipboard(v.code)}>
                                            <Copy size={16} /> Sao chép
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* BLOG ẨM THỰC */}
                <section className="Section-Container Blog-Section-Main">
                    <div className="Blog-Header-Center">
                        <h2><BookOpen size={24} /> Blog Ẩm Thực</h2>
                    </div>
                    <div className="Blog-Slider-Outer">
                        <button className="blog-nav-btn left" onClick={() => scrollHandler(blogRef, 'left')}><ChevronLeft size={30}/></button>
                        <div className="Blog-Scroll-Container" ref={blogRef}>
                            {blogs.map(blog => (
                                <div className="Blog-Item-Card" key={blog.blogId}>
                                    <div className="Blog-Img-Holder">
                                        <img src={blog.image || "https://via.placeholder.com/500"} alt="Blog" />
                                    </div>
                                    <div className="Blog-Text-Content">
                                        <span className="Blog-Tag-Red">{blog.fullname}</span>
                                        <h4>{blog.title}</h4>
                                        <p>{blog.content?.substring(0, 100)}...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="blog-nav-btn right" onClick={() => scrollHandler(blogRef, 'right')}><ChevronRight size={30}/></button>
                    </div>
                </section>

                {/* COMBO SIÊU LỜI */}
                <section className="Section-Container">
                    <div className="Section-Header-Line">
                        <h2><Utensils size={24} /> COMBO SIÊU LỜI</h2>
                        <div className="header-line"></div>
                    </div>
                    <div className="Blog-Slider-Outer">
                        <button className="blog-nav-btn left" onClick={() => scrollHandler(comboRef, 'left')}><ChevronLeft size={30}/></button>
                        <div className="Infinite-Slider-Wrapper" ref={comboRef}>
                            <div className="Infinite-Track-Product fast-scroll">
                                {infiniteCombos.map((item, index) => (
                                    <div className="Product-Card-Modern" key={`${item.comboId}-${index}`}>
                                        <div className="img-holder">
                                            <img src={item.image || "https://via.placeholder.com/400"} alt="Food" />
                                        </div>
                                        <div className="Product-Info">
                                            <h3>{item.name} <span className="price-tag-inline">{item.price?.toLocaleString()}đ</span></h3>
                                            <p className="product-desc-mini">{item.description}</p>
                                            <button className="btn-add-cart-modern">Thêm</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <button className="blog-nav-btn right" onClick={() => scrollHandler(comboRef, 'right')}><ChevronRight size={30}/></button>
                    </div>
                </section>

                {/* MÓN ĂN GIẢM GIÁ */}
                <section className="Section-Container">
                    <div className="Section-Header-Line">
                        <h2>🔥 Món ăn giảm giá</h2>
                        <div className="header-line"></div>
                    </div>
                    <div className="Blog-Slider-Outer">
                        <button className="blog-nav-btn left" onClick={() => scrollHandler(discountRef, 'left')}><ChevronLeft size={30}/></button>
                        <div className="Infinite-Slider-Wrapper" ref={discountRef}>
                            <div className="Infinite-Track-Product reverse fast-scroll">
                                {infiniteFoodDiscounts.map((food, index) => (
                                    <div className="Product-Card-Modern" key={`${food.foodId}-${index}`}>
                                        <div className="img-holder">
                                            <img 
                                                src={food.image?.startsWith('http') ? food.image : `https://smas-api-hrapc0b0f3gsb2e7.eastasia-01.azurewebsites.net${food.image}`} 
                                                alt={food.name} 
                                            />
                                        </div>
                                        <div className="Product-Info">
                                            <h3>{food.name} <span className="price-old-inline">{food.price?.toLocaleString()}đ</span></h3>
                                            <p className="product-desc-mini">{food.description}</p>
                                            <div className="price-row-discount">
                                                <button className="btn-add-cart-modern">Thêm</button>
                                                <span className="price-new-bold">{food.promotionalPrice?.toLocaleString()}đ</span>
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