// achievements-config.js - قائمة الإنجازات
// يمكنك تعديل/إضافة/حذف الإنجازات
// المسؤول: Kamikaz007

const ACHIEVEMENTS_CONFIG = {
    // تصنيفات الإنجازات
    categories: {
        social:      { icon: "💬", name: "اجتماعي" },
        finance:     { icon: "💰", name: "مالي" },
        progress:    { icon: "📈", name: "تقدم" },
        exploration: { icon: "🗺️", name: "استكشاف" },
        dedication:  { icon: "🔥", name: "إخلاص" },
        secret:      { icon: "🔮", name: "سري" },
        commerce:    { icon: "🛍️", name: "تجارة" }
    },

    // قائمة الإنجازات
    achievements: [
        {
            id: "first_message",
            name: "المستكشف الأول",
            description: "أرسل أول رسالة في Chatoo",
            icon: "💬",
            xpReward: 10,
            piReward: 0.01,
            category: "social",
            rarity: "common",
            secret: false,
            condition: { messagesSent: 1 }
        },
        {
            id: "first_pi_tip",
            name: "كريم Web3",
            description: "أرسل أول إكرامية Pi",
            icon: "💎",
            xpReward: 25,
            piReward: 0.05,
            category: "finance",
            rarity: "uncommon",
            secret: false,
            condition: { tipsSent: 1 }
        },
        {
            id: "first_pi_received",
            name: "محفظة نشطة",
            description: "استلم أول Pi على Chatoo",
            icon: "💰",
            xpReward: 20,
            piReward: 0.02,
            category: "finance",
            rarity: "uncommon",
            secret: false,
            condition: { tipsReceived: 1 }
        },
        {
            id: "xp_100",
            name: "عضو فضي",
            description: "اجمع 100 نقطة XP",
            icon: "🥈",
            xpReward: 30,
            piReward: 0.1,
            category: "progress",
            rarity: "rare",
            secret: false,
            condition: { totalXP: 100 }
        },
        {
            id: "xp_500",
            name: "عضو ذهبي",
            description: "اجمع 500 نقطة XP",
            icon: "🥇",
            xpReward: 50,
            piReward: 0.5,
            category: "progress",
            rarity: "epic",
            secret: false,
            condition: { totalXP: 500 }
        },
        {
            id: "xp_1000",
            name: "أسطورة Chatoo",
            description: "اجمع 1000 نقطة XP",
            icon: "👑",
            xpReward: 100,
            piReward: 1.0,
            category: "progress",
            rarity: "legendary",
            secret: false,
            condition: { totalXP: 1000 }
        },
        {
            id: "visit_5_venues",
            name: "رحالة Web3",
            description: "زر 5 أماكن مختلفة",
            icon: "🗺️",
            xpReward: 35,
            piReward: 0.15,
            category: "exploration",
            rarity: "rare",
            secret: false,
            condition: { venuesVisited: 5 }
        },
        {
            id: "night_owl",
            name: "بومة الليل",
            description: "أرسل رسالة بين منتصف الليل والخامسة صباحاً",
            hint: "تواصل في ساعات متأخرة...",
            icon: "🦉",
            xpReward: 15,
            piReward: 0.03,
            category: "secret",
            rarity: "secret",
            secret: true,
            condition: { nightMessages: 1 }
        },
        {
            id: "perfect_week",
            name: "أسبوع مثالي",
            description: "سجل دخول 7 أيام متتالية",
            icon: "📅",
            xpReward: 40,
            piReward: 0.2,
            category: "dedication",
            rarity: "epic",
            secret: false,
            condition: { consecutiveDays: 7 }
        },
        {
            id: "first_shop_purchase",
            name: "متسوق Web3",
            description: "أول عملية شراء من المتجر",
            icon: "🛍️",
            xpReward: 20,
            piReward: 0.08,
            category: "commerce",
            rarity: "uncommon",
            secret: false,
            condition: { shopPurchases: 1 }
        },
        {
            id: "referral_master",
            name: "سفير Chatoo",
            description: "ادعُ 3 أصدقاء",
            icon: "🤝",
            xpReward: 45,
            piReward: 0.3,
            category: "social",
            rarity: "epic",
            secret: false,
            condition: { referrals: 3 }
        },
        {
            id: "map_explorer",
            name: "مستكشف الخرائط",
            description: "استخدم الخريطة 10 مرات",
            icon: "🌍",
            xpReward: 25,
            piReward: 0.1,
            category: "exploration",
            rarity: "uncommon",
            secret: false,
            condition: { mapOpens: 10 }
        }
    ],

    // مستويات الندرة للإنجازات
    rarity: {
        common:    { color: "#888888", label: "عادي", glow: false },
        uncommon:  { color: "#00ff88", label: "غير شائع", glow: false },
        rare:      { color: "#8257e5", label: "نادر", glow: true },
        epic:      { color: "#ff6b6b", label: "ملحمي", glow: true },
        legendary: { color: "#ffd700", label: "أسطوري", glow: true },
        secret:    { color: "#ff69b4", label: "سري", glow: true }
    }
};
