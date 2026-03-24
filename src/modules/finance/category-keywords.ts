export type CategoryKeywordMap = {
  category: string;
  keywords: string[];
};

export const EXPENSE_CATEGORY_KEYWORDS: CategoryKeywordMap[] = [
  {
    category: "Ăn uống",
    keywords: [
      "an",
      "an uong",
      "com",
      "com tam",
      "bun",
      "pho",
      "mi",
      "hu tieu",
      "banh mi",
      "banh",
      "pizza",
      "hamburger",
      "ga ran",
      "lau",
      "nuong",
      "sushi",
      "tra sua",
      "cafe",
      "ca phe",
      "do uong",
      "nuoc",
      "an sang",
      "an trua",
      "an toi",
      "an dem",
      "com van phong"
    ]
  },
  {
    category: "Di chuyển",
    keywords: [
      "di lai",
      "di chuyen",
      "xang",
      "dau",
      "grab",
      "taxi",
      "xe om",
      "bus",
      "xe buyt",
      "ve xe",
      "gui xe",
      "parking",
      "tram phi",
      "phi duong",
      "phi cau duong",
      "sua xe",
      "bao duong",
      "xe may",
      "oto",
      "car",
      "bike"
    ]
  },
  {
    category: "Nhu yếu phẩm",
    keywords: [
      "sieu thi",
      "cho",
      "tap hoa",
      "do dung",
      "do gia dung",
      "gia vi",
      "nuoc rua",
      "ban chai",
      "giay ve sinh",
      "mi goi",
      "gao",
      "thit",
      "rau",
      "trung",
      "sua",
      "do kho",
      "nuoc mam",
      "dau an"
    ]
  },
  {
    category: "Hóa đơn cố định",
    keywords: [
      "dien",
      "nuoc",
      "internet",
      "wifi",
      "cuoc",
      "hoa don",
      "cap",
      "dien thoai",
      "tra sau",
      "tra truoc",
      "tien nha",
      "tien tro",
      "thue nha"
    ]
  },
  {
    category: "Sức khỏe",
    keywords: [
      "thuoc",
      "kham",
      "bac si",
      "benh vien",
      "y te",
      "nha thuoc",
      "suc khoe",
      "bao hiem",
      "kham rang",
      "nha khoa",
      "xet nghiem"
    ]
  },
  {
    category: "Vui chơi",
    keywords: [
      "xem phim",
      "rap phim",
      "game",
      "giai tri",
      "du lich",
      "an choi",
      "karaoke",
      "bar",
      "pub",
      "cafe",
      "di choi"
    ]
  },
  {
    category: "Quần áo",
    keywords: [
      "quan ao",
      "ao",
      "quan",
      "giay dep",
      "giay",
      "dep",
      "tui",
      "mu",
      "khoac",
      "thoi trang",
      "shop",
      "do"
    ]
  },
  {
    category: "Giáo dục",
    keywords: ["hoc", "khoa hoc", "sach", "tai lieu", "lop", "trung tam", "hoc phi", "khoa"]
  },
  {
    category: "Gia đình",
    keywords: ["me", "bo", "con", "gia dinh", "nha", "noi tro", "tre em", "em be"]
  },
  {
    category: "Công việc",
    keywords: ["cong viec", "van phong", "dung cu", "thiet bi", "phu cap", "di cong tac"]
  },
  {
    category: "Sửa chữa",
    keywords: ["sua", "sua chua", "bao tri", "thay the", "linh kien"]
  },
  {
    category: "Quà tặng",
    keywords: ["qua", "tang", "sinh nhat", "le", "tet", "mung"]
  },
  {
    category: "Cưới xin",
    keywords: ["cuoi", "tiec cuoi", "moi", "phong bi"]
  },
  {
    category: "Khác",
    keywords: ["khac"]
  }
];

export const INCOME_CATEGORY_KEYWORDS: CategoryKeywordMap[] = [
  {
    category: "Tiền lương",
    keywords: ["luong", "salary"]
  },
  {
    category: "Tiền thưởng",
    keywords: ["thuong", "bonus"]
  },
  {
    category: "Thu nhập phụ",
    keywords: ["freelance", "ban hang", "phu", "side", "lam them"]
  },
  {
    category: "Đầu tư / lãi",
    keywords: ["lai", "co tuc", "dau tu", "lai suat", "chung khoan", "co phieu", "tiet kiem"]
  },
  {
    category: "Quà tặng",
    keywords: ["qua", "tang", "mang den", "ho tro"]
  },
  {
    category: "Hoàn tiền",
    keywords: ["hoan", "refund"]
  },
  {
    category: "Khác",
    keywords: ["khac"]
  }
];
