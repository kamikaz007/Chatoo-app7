// rewards-config.js - إعدادات المكافآت
// يمكنك تعديل جميع القيم من هنا أو من لوحة التحكم
// المسؤول: Kamikaz007

const REWARDS_CONFIG = {
    // مكافآت XP
    xp: {
        message: 2,           // XP لكل رسالة
        tip: 5,              // XP لكل إكرامية
        dailyLogin: 10,      // XP لتسجيل الدخول اليومي
        venueVisit: 5,       // XP لزيارة مكان
        mapUse: 2,           // XP لاستخدام الخريطة
        voiceMessage: 8,     // XP لرسالة صوتية
        imageUpload: 10,     // XP لرفع صورة
        audioRoomJoin: 15,   // XP للانضمام لغرفة صوت
        shopPurchase: 20     // XP للشراء من المتجر
    },

    // المكافأة اليومية
    dailyReward: {
        minXP: 10,
        maxXP: 50,
        claimInterval: 24 // ساعة
    },

    // مكافآت Pi
    piRewards: {
        achievementUnlock: 0.01,  // Pi لكل إنجاز
        referralBonus: 0.25,     // Pi لكل إحالة
        topReferrerBonus: 1.0    // Pi لأفضل محيل شهرياً
    },

    // مكافآت الإحالات
    referrals: {
        basePiReward: 0.25,
        baseXPReward: 50,
        milestones: {
            5:  { pi: 1.0,  xp: 100, title: "سفير برونزي 🥉" },
            10: { pi: 2.5,  xp: 250, title: "سفير فضي 🥈" },
            25: { pi: 5.0,  xp: 500, title: "سفير ذهبي 🥇" },
            50: { pi: 10.0, xp: 1000, title: "سفير ماسي 💎" },
            100:{ pi: 25.0, xp: 2500, title: "أسطورة Chatoo 👑" }
        }
    },

    // مستويات XP والرتب
    ranks: {
        0:    "ORIGIN VOYAGER 🌱",
        100:  "ACTIVE NODE 🔥",
        250:  "TRUSTED NODE ⭐",
        500:  "GRAND MAYOR 🏛️",
        1000: "WEB3 ELITE 💎",
        2500: "BLOCKCHAIN LORD 👑",
        5000: "CHATOO LEGEND 🌟"
    }
};

// يمكنك تعديل أي قيمة أعلاه
// التغييرات تنطبق فوراً عند إعادة تحميل التطبيق
