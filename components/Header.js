export default function Header() {
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

                <div className="header-right">
                    <div className="event-badge">
                        <span className="fire-emoji">🔥</span>
                        <span>2026</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
