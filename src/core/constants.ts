export const APP_LIST = [
  {
    id: "notes",
    name: "Ghi chú",
    href: "/apps/notes",
    description: "Ghi chú, thư mục, thẻ",
    imgSrc: "/images/notes.png"
  },
  {
    id: "money-counter",
    name: "Đếm tiền",
    href: "/apps/money-counter",
    description: "Đếm tiền mặt nhanh",
    imgSrc: "/images/money-counter.png"
  },
  {
    id: "finance",
    name: "Tài chính",
    href: "/apps/finance",
    description: "Quản lý tài sản và chi tiêu",
    imgSrc: "/images/finance.png"
  },
] as const;

export const MONEY_DENOMINATIONS = [
  1000,
  2000,
  5000,
  10000,
  20000,
  50000,
  100000,
  200000,
  500000
];

export const DEFAULT_GOLD_UNIT = "chi";
