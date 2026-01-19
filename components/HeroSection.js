import Image from 'next/image';

export default function HeroSection() {
    return (
        <section className="hero">
            {/* Gen Z Welcome Banner */}
            <div className="genz-welcome">
                <div className="welcome-inner">
                    <div className="welcome-badge">🎊 HỘI XUÂN 2026 🎊</div>
                    <h2 className="welcome-title">
                        <span className="typing-text">Yoo! Chào mừng các "chiến thần ẩm thực" đã ghé chơi~ 🔥</span>
                    </h2>
                    <p className="welcome-desc">
                        <span className="highlight-text">10.11 - THPT Nguyễn Thị Minh Khai</span> tự hào mang đến món xiên siêu cháy trend!
                        <br />
                        <span className="slang-text">Đã miệng đến phát "lú"</span> 🤤 • <span className="slang-text">Ngon "nức nở"</span> 😭 • <span className="slang-text">"Real" không cap</span> 💯
                    </p>
                    <div className="welcome-tags">
                        <span className="tag-item fire">🌶️ Cay xé lưỡi</span>
                        <span className="tag-item sweet">🍯 Ngọt vị beo</span>
                        <span className="tag-item viral">📸 Check-in triệu like</span>
                        <span className="tag-item price">💸 Giá sinh viên</span>
                    </div>
                </div>
            </div>

            <div className="hero-content">
                <div className="product-images">
                    <div className="image-card main-image">
                        <Image
                            src="/images/product1.png"
                            alt="Tuyết Sơn Xiên Hỏa Long"
                            width={400}
                            height={400}
                            priority
                        />
                        <div className="image-glow"></div>
                    </div>
                    <div className="image-card secondary-image">
                        <Image
                            src="/images/product2.png"
                            alt="Tuyết Sơn Xiên Hỏa Long"
                            width={400}
                            height={400}
                            priority
                        />
                        <div className="image-glow"></div>
                    </div>
                </div>
                <div className="hero-text">
                    <div className="product-label">
                        <span className="hot-tag">🔥 HOT</span>
                        <span className="new-tag">✨ VIRAL</span>
                        <span className="spring-tag">🌸 HỘI XUÂN</span>
                    </div>
                    <h1 className="product-title">
                        <span className="title-snow">TUYẾT SƠN</span>
                        <span className="title-fire">XIÊN HỎA LONG</span>
                    </h1>
                    <p className="product-description">
                        Xiên bánh gạo Hàn Quốc cay ngọt đặc biệt -
                        Món ăn viral nhất Hội Xuân 2026! 🌶️🧧
                    </p>
                    <div className="price-box">
                        <span className="price-label">CHỈ CÒN</span>
                        <span className="price-value">20K</span>
                        <span className="price-unit">/phần</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
