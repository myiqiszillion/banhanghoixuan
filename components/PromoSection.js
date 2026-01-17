export default function PromoSection() {
    return (
        <section className="promo-section">
            <div className="promo-card">
                <div className="promo-icon">🎁</div>
                <div className="promo-content">
                    <h3>💥 BÃO DEAL ĐỔ BỘ</h3>

                    <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px dashed rgba(255,255,255,0.2)' }}>
                        <p className="promo-text">
                            🎮 Mua <span className="highlight">3 phần</span> trở lên =
                            Tặng ngay <span className="highlight">1 VÉ OUT OF CONTROL</span>
                        </p>
                        <p className="promo-note">Mini game trúng quà khủng của lớp 10.11</p>
                    </div>

                    <div>
                        <p className="promo-text">
                            🔥 COMBO ĐẠI GIA: Mua <span className="highlight">10 phần</span>
                            <br />👉 Tặng ngay <span className="highlight">1 PHẦN ĂN FREE (20K)</span> 🍡
                        </p>
                        <p className="promo-note" style={{ color: '#00d26a', fontWeight: 'bold', marginTop: '0.5rem' }}>
                            * Áp dụng lũy tiến không giới hạn!
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
