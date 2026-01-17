import Image from 'next/image';

export default function HeroSection() {
    return (
        <section className="hero">
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
                        <span className="new-tag">✨ MỚI</span>
                    </div>
                    <h1 className="product-title">
                        <span className="title-snow">TUYẾT SƠN</span>
                        <span className="title-fire">XIÊN HỎA LONG</span>
                    </h1>
                    <p className="product-description">
                        Xiên bánh gạo Hàn Quốc cay ngọt đặc biệt -
                        Món ăn hot nhất Hội Xuân 2026! 🌶️
                    </p>
                    <div className="price-box">
                        <span className="price-label">GIÁ CHỈ</span>
                        <span className="price-value">20.000đ</span>
                        <span className="price-unit">/phần</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
