import React from 'react';
import StudioBackButton from './StudioBackButton';

export interface StudioBackNavProps {
    /** Trang tổng hợp của công cụ, ví dụ /studio/ai-skills */
    to: string;
    /** Nhãn nút quay lại trang tổng hợp */
    label: string;
    className?: string;
}

/**
 * Cụm nút quay lại dùng chung cho MỌI trang con của công cụ trong /studio:
 * "Về Studio" + "Về trang tổng hợp" nằm liền kề nhau trong một khối nổi
 * (fixed) ở góc trên trái — cùng một kiểu trên tất cả các trang.
 * Nút "Về Studio" cuộn thẳng tới khối "Chọn công cụ để bắt đầu" của hub.
 */
const StudioBackNav: React.FC<StudioBackNavProps> = ({ to, label, className = '' }) => (
    <div className={`fixed top-20 left-4 z-40 flex flex-wrap items-center gap-2 ${className}`.trim()}>
        <StudioBackButton variant="cluster" to="/studio" />
        <StudioBackButton variant="cluster" to={to} label={label} />
    </div>
);

export default StudioBackNav;
