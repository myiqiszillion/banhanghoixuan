import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">
                <p>🔥 TUYẾT SƠN XIÊN HỏA LONG - Hội Xuân 2026</p>
                <p className="footer-school">Lớp 10.11 - THPT Nguyễn Thị Minh Khai</p>
                <p className="footer-note">Made with ❤️ for Spring Festival</p>
                <Link href="/admin" className="admin-trigger" title="Admin">
                    ⚙️
                </Link>
            </div>
        </footer>
    );
}
