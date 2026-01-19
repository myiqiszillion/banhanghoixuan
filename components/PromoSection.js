export default function PromoSection() {
    return (
        <section className="promo-section">
            {/* Lucky Wheel Banner */}
            <div className="prize-banner">
                <div className="prize-glow"></div>
                <div className="prize-content">
                    <div className="prize-label">🎡 VÒNG QUAY MAY MẮN</div>
                    <div className="prize-amount" style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>QUAY LÀ TRÚNG!</div>
                    <div className="prize-desc">10K • +1 Xiên • 1 Ly Nước</div>
                </div>
            </div>

            {/* Promo Card */}
            <div className="promo-card">
                <div className="promo-icon">🎁</div>
                <div className="promo-content">
                    <h3>💥 BÃO DEAL ĐỔ BỘ</h3>

                    <div className="promo-item">
                        <p className="promo-text">
                            🎡 Mua <span className="highlight">3 phần</span> = Tặng <span className="highlight">1 LƯỢT QUAY</span>
                        </p>
                        <p className="promo-note">Quay là trúng - 100% có quà!</p>
                    </div>

                    <div className="promo-divider"></div>

                    <div className="promo-item">
                        <p className="promo-text">
                            🔥 COMBO ĐẠI GIA: Mua <span className="highlight">10 phần</span>
                            <br />👉 Tặng ngay <span className="highlight">1 PHẦN ĂN FREE</span> 🍡
                        </p>
                        <p className="promo-note success">* Áp dụng lũy tiến không giới hạn!</p>
                    </div>
                </div>
            </div>
        </section>
    );
}

