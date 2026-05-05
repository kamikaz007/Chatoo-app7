// shop-config.js - منتجات المتجر
// يمكنك إضافة/حذف/تعديل المنتجات
// المسؤول: Kamikaz007

const SHOP_CONFIG = {
    // فئات المتجر
    categories: [
        { id: "items", name: "🛍️ المنتجات", icon: "🛍️" },
        { id: "nfts", name: "🎨 NFTs", icon: "🎨" },
        { id: "tickets", name: "🎫 تذاكر", icon: "🎫" },
        { id: "boosters", name: "⚡ معززات", icon: "⚡" }
    ],

    // المنتجات
    products: [
        {
            id: "verified_badge",
            name: "شارة التحقق",
            nameAr: "🛡️ شارة التحقق",
            description: "هوية Web3 موثقة على Pi Network",
            price: 5.0,
            currency: "Pi",
            type: "badge",
            category: "items",
            rarity: "rare",
            active: true
        },
        {
            id: "golden_frame",
            name: "Golden Frame",
            nameAr: "🖼️ الإطار الذهبي",
            description: "إطار ذهبي للصورة الرمزية",
            price: 10.0,
            currency: "Pi",
            type: "frame",
            category: "items",
            rarity: "legendary",
            active: true 
        },
        {
            id: "name_color",
            name: "Custom Name Color",
            nameAr: "🎨 لون مميز للاسم",
            description: "لون مميز لاسمك في المحادثة",
            price: 3.0,
            currency: "Pi",
            type: "color",
            category: "items",
            rarity: "uncommon",
            active: true
        },
        {
            id: "vip_access",
            name: "VIP Room Access",
            nameAr: "👑 دخول غرف VIP",
            description: "دخول حصري للغرف الخاصة لمدة شهر",
            price: 20.0,
            currency: "Pi",
            type: "vip",
            category: "items",
            rarity: "exclusive",
            active: true
        },
        {
            id: "nft_voyager",
            name: "VOYAGER NFT #001",
            nameAr: "🎭 VOYAGER #001",
            description: "NFT أصلي من Chatoo - محدود",
            price: 15.0,
            currency: "Pi",
            type: "nft",
            category: "nfts",
            rarity: "legendary",
            supply: 100,
            active: true
        },
        {
            id: "nft_node_master",
            name: "NODE MASTER NFT",
            nameAr: "🔷 NODE MASTER",
            description: "حاكم العقدة - NFT حصري",
            price: 25.0,
            currency: "Pi",
            type: "nft",
            category: "nfts",
            rarity: "mythic",
            supply: 10,
            active: true
        },
        {
            id: "ticket_event",
            name: "Event Ticket",
            nameAr: "🎟️ تذكرة فعالية Web3",
            description: "دخول فعالية Web3 حصرية",
            price: 2.0,
            currency: "Pi",
            type: "ticket",
            category: "tickets",
            rarity: "common",
            active: true
        },
        {
            id: "ticket_raffle",
            name: "Raffle Ticket",
            nameAr: "🎰 تذكرة سحب",
            description: "فرصة ربح 100 Pi",
            price: 1.0,
            currency: "Pi",
            type: "ticket",
            category: "tickets",
            rarity: "common",
            active: true
        },
        {
            id: "xp_boost_2x",
            name: "XP Boost 2x",
            nameAr: "⚡ مضاعف XP ×2",
            description: "ضعف نقاط XP لمدة 24 ساعة",
            price: 8.0,
            currency: "Pi",
            type: "booster",
            category: "boosters",
            duration: 24 * 60 * 60 * 1000,
            active: true
        },
        {
            id: "tip_shield",
            name: "Tip Shield",
            nameAr: "🛡️ درع الإكرامية",
            description: "حماية من الإكراميات غير المرغوبة",
            price: 4.0,
            currency: "Pi",
            type: "booster",
            category: "boosters",
            active: true
        }
    ],

    // إعدادات الندرة
    rarity: {
        common:    { color: "#888888", label: "عادي" },
        uncommon:  { color: "#00ff88", label: "غير شائع" },
        rare:      { color: "#8257e5", label: "نادر" },
        epic:      { color: "#ff6b6b", label: "ملحمي" },
        legendary: { color: "#ffd700", label: "أسطوري" },
        mythic:    { color: "#ff69b4", label: "خرافي" },
        exclusive: { color: "#ff4500", label: "حصري" }
    }
};
