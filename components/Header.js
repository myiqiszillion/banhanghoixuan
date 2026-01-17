export default function Header({ onOpenHistory, onOpenMiniGame }) {
    return (
        <header className="header">
            <div className="header-glass"></div>
            <div className="header-content">
                <div className="header-left">
                    <div className="school-badge">
                        <span className="badge-icon">🏫</span>
                        <span className="mobile-hide">Minh Khai</span>
                        <span className="desktop-hide">MK</span>
                    </div>
                </div>

                <div className="header-center">
                    <h1 className="main-title">
                        <span className="class-name">10.11</span>
                        <span className="slogan">OUT OF CONTROL</span>
                    </h1>
                </div>

                <div className="header-right" style={{ gap: '0.5rem' }}>
                    <button onClick={onOpenMiniGame} className="nav-btn game-btn">
                        <span className="btn-icon">🎮</span>
                        <span className="mobile-hide">Mini Game</span>
                    </button>
                    <button onClick={onOpenHistory} className="nav-btn history-btn">
                        <span className="btn-icon">🕒</span>
                        <span className="mobile-hide">Lịch sử</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
