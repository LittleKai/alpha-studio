# Frontend Shared Kit

## Co gi trong day

| File | Vai tro | Khi dung |
|---|---|---|
| `formatters.ts` | Formatter thuan, khong phu thuoc React | Import truc tiep; them test khi doi hanh vi |
| `localized.ts` | Fallback va dien noi dung vi/en | Dung cho moi noi dung song ngu |

## Copy hay load chung

**Load chung.** Frontend la san pham dang deploy lien tuc; sua mot bug formatter/fallback thi moi caller phai nhan cung ban sua.

## LUAT PROMOTE

Ham thuan, khong gan voi mot component va da bi copy o it nhat hai noi phai duoc chuyen vao `src/utils/` trong cung task. Doc tat ca ban copy, hop nhat hanh vi, them test, roi chay tung caller lien quan. Logic chi dung cho mot man hinh giu tai cho.
