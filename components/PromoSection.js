import { CONFIG } from '@/lib/config';

export default function PromoSection() {
    return (
        <section className="promo-section">
            {/* Grand Prize Banner */}
            <div className="prize-banner">
                <div className="prize-glow"></div>
                <div className="prize-content">
                    <div className="prize-label">🏆 GIẢI THƯỞNG KHỦNG</div>
                    <div className="prize-amount">{CONFIG.miniGame.prizeFormatted}</div>
                    <div className="prize-desc">Sưu tập đủ 11 thẻ để nhận giải!</div>
                </div>
            </div>

            {/* Promo Card */}
            <div className="promo-card">
                <div className="promo-icon">🎁</div>
                <div className="promo-content">
                    <h3>💥 BÃO DEAL ĐỔ BỘ</h3>

                    <div className="promo-item">
                        <p className="promo-text">
                            🎴 Mua <span className="highlight">3 phần</span> = Tặng <span className="highlight">1 VÉ LẬT THẺ</span>
                        </p>
                        <p className="promo-note">Sưu tập 11 thẻ để ẵm giải {CONFIG.miniGame.prizeFormatted}!</p>
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
