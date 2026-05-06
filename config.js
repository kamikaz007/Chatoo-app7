// config.js - إعدادات Chatoo الرئيسية
// المسؤول: Kamikaz007

const CHATOO_CONFIG = {
    app: {
        name: "Chatoo Ultra Pro",
        version: "2.0.0",
        admin: "kamikaz007",
        network: "testnet" // testnet | mainnet
    },

    piNetwork: {
        sandbox: true,
        version: "2.0",

        // ✅ إصلاح - Horizon API الصحيح مع /v2
        rpcEndpoint:      "https://api.testnet.minepi.com/v2",
        horizonEndpoint:  "https://api.testnet.minepi.com/v2",

        // Mainnet (للمستقبل)
        mainnetRpc:       "https://api.mainnet.minepi.com/v2",
        mainnetHorizon:   "https://api.mainnet.minepi.com/v2"
    },

    firebase: {
        apiKey: "AIzaSyD9L74WN6V_4lOrIoaQPPtyi_SO-LLtayA",
        authDomain: "chatoo-4566f.firebaseapp.com",
        projectId: "chatoo-4566f",
        storageBucket: "chatoo-4566f.firebasestorage.app",
        appId: "1:724118831864:web:2cca10fa8d290d4288f10d"
    },

    map: {
        defaultCenter: [33.8869, 9.5375],
        defaultZoom: 7,
        darkTileLayer: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        lightTileLayer: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        satelliteLayer: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        overpassEndpoint: "https://overpass-api.de/api/interpreter",
        searchRadius: 3000
    },

    settings: {
        defaultLanguage: "ar",
        direction: "rtl",
        maxNotifications: 3,
        messageHistoryLimit: 50,
        audioMaxDuration: 60
    }
};

// إعدادات Firebase (للتوافق مع الملفات القديمة)
const FIREBASE_CONFIG = CHATOO_CONFIG.firebase;
