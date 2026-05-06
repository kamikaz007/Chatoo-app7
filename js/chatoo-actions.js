// chatoo-actions.js - Cinematic UI Web3 + عقد عائمة حقيقية
// المسؤول: Kamikaz007

const PI_HORIZONS = [
    "https://api.mainnet.minepi.com",
    "https://horizon.minepi.com"
];

class ChatooActions {
    constructor() {
        this.state = {
            room: null,
            id: 'Koukiz007_' + Math.random().toString(36).substring(2, 8),
            nodesVisible: true,
            userLocation: null,
            nearbyVenues: [],
            lastFetchTime: 0
        };
        this.venueIcons = {
            cafe: ['☕', '🍵', '🧋', '🫖'],
            restaurant: ['🍽️', '🥘', '🍜', '🍝', '🥗'],
            bar: ['🍹', '🍸', '🥂', '🍺'],
            hotel: ['🏨', '🏩', '🛎️', '🏢'],
            fast_food: ['🍔', '🍕', '🌭', '🍟'],
            bakery: ['🥐', '🍞', '🥖', '🧁'],
            default: ['📍', '🏠', '⚡', '🏛️']
        };
        this.fetchInterval = null;
        this.initCinematicUI();
    }

    initCinematicUI() {
        console.log("🚀 Chatoo UI - Real Venue Nodes Initializing...");
        this.injectCinematicStyles();
        this.setupCustomNavButtons();
        this.startLocationTracking();
        buildWalletModal();

        if (window.chatooNotif) {
            window.chatooNotif.systemAlert('واجهة Chatoo السينمائية نشطة');
        }
    }

    // ═══════════════════ تتبع الموقع ═══════════════════
    startLocationTracking() {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => this._onLocationUpdate(pos),
                () => this._useDefaultLocation(),
                { enableHighAccuracy: true, timeout: 15000 }
            );

            this.fetchInterval = setInterval(() => {
                navigator.geolocation.getCurrentPosition(
                    (pos) => this._onLocationUpdate(pos),
                    () => {},
                    { enableHighAccuracy: true, timeout: 10000 }
                );
            }, 30000);
        } else {
            this._useDefaultLocation();
        }
    }

    _onLocationUpdate(position) {
        const { latitude, longitude } = position.coords;
        const oldLat = this.state.userLocation?.lat;
        const oldLon = this.state.userLocation?.lon;

        if (!oldLat || !oldLon ||
            this._calculateDistance(oldLat, oldLon, latitude, longitude) > 100 ||
            Date.now() - this.state.lastFetchTime > 60000) {

            this.state.userLocation = { lat: latitude, lon: longitude };
            this._fetchNearbyVenues(latitude, longitude);
        }
    }

    _useDefaultLocation() {
        this.state.userLocation = { lat: 33.8869, lon: 9.5375 };
        this._fetchNearbyVenues(33.8869, 9.5375);
    }

    _calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    async _fetchNearbyVenues(lat, lon) {
        console.log(`📍 جلب الأماكن القريبة من ${lat.toFixed(4)}, ${lon.toFixed(4)}...`);

        const query = `[out:json];
            node["amenity"~"cafe|restaurant|bar|fast_food|pub|hotel|bakery"]
            (around:${CHATOO_CONFIG.map.searchRadius},${lat},${lon});
            out body 12;`;

        try {
            const response = await fetch(
                `${CHATOO_CONFIG.map.overpassEndpoint}?data=${encodeURIComponent(query)}`
            );

            if (!response.ok) throw new Error('Overpass API failed');

            const data = await response.json();

            if (data.elements && data.elements.length > 0) {
                this.state.nearbyVenues = data.elements
                    .filter(v => v.tags && v.tags.name)
                    .slice(0, 8)
                    .map(v => ({
                        name: v.tags.name,
                        type: v.tags.amenity || 'default',
                        lat: v.lat,
                        lon: v.lon,
                        status: this._determineStatus(v.tags),
                        address: v.tags['addr:street'] || v.tags['addr:city'] || '',
                        openingHours: v.tags.opening_hours || '',
                        phone: v.tags.phone || '',
                        website: v.tags.website || ''
                    }));

                this.state.lastFetchTime = Date.now();
                this.renderFloatingNodes();

                console.log(`✅ تم جلب ${this.state.nearbyVenues.length} مكاناً قريباً`);

                if (window.chatooNotif && this.state.nearbyVenues.length > 0) {
                    window.chatooNotif.toast(
                        `📍 تم العثور على ${this.state.nearbyVenues.length} أماكن قريبة`
                    );
                }

                // تحديث الـ radar و marquee
                if (typeof chatoo !== 'undefined') {
                    chatoo.updateRadarStrip();
                    chatoo.updateMarquee();
                }

            } else {
                this._useDefaultVenues();
            }
        } catch (error) {
            console.warn('⚠️ Overpass API failed:', error.message);
            this._useDefaultVenues();
        }
    }

    _determineStatus(tags) {
        const hour = new Date().getHours();
        if (tags.opening_hours) {
            return (hour >= 8 && hour <= 23) ? 'active' : 'inactive';
        }
        const statuses = ['active', 'live', 'active', 'active', 'active'];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }

    _useDefaultVenues() {
        this.state.nearbyVenues = [
            { name: "Haj Mostapha", type: "restaurant", lat: 36.8665, lon: 10.1647, status: "active" },
            { name: "Salle Des Fêtes Hawa", type: "cafe", lat: 36.8000, lon: 10.1800, status: "active" },
            { name: "Café Bizerte", type: "cafe", lat: 37.2744, lon: 9.8739, status: "live" },
            { name: "Restaurant El Manâr", type: "restaurant", lat: 36.8500, lon: 10.2100, status: "active" },
            { name: "Central Node", type: "bar", lat: 36.8065, lon: 10.1815, status: "sync" },
            { name: "Node 007", type: "cafe", lat: 36.8200, lon: 10.1900, status: "active" }
        ];
        this.renderFloatingNodes();

        if (typeof chatoo !== 'undefined') {
            chatoo.updateRadarStrip();
            chatoo.updateMarquee();
        }
    }

    // ═══════════════════ CSS ═══════════════════
    injectCinematicStyles() {
        if (document.getElementById('chatoo-cinematic-css')) return;
        const style = document.createElement('style');
        style.id = 'chatoo-cinematic-css';
        style.innerHTML = `
            .floating-node {
                position: fixed;
                width: 90px; height: 90px;
                border-radius: 50%;
                background: radial-gradient(circle at 35% 35%, rgba(130,87,229,0.35), rgba(9,9,11,0.92) 70%);
                border: 1.5px solid rgba(255,215,0,0.6);
                box-shadow: 0 0 18px rgba(255,215,0,0.25), inset 0 0 12px rgba(130,87,229,0.2);
                display: flex; flex-direction: column;
                align-items: center; justify-content: center;
                gap: 3px; color: #fff; cursor: pointer;
                z-index: 400; backdrop-filter: blur(8px);
                transition: all 0.3s ease;
                will-change: transform;
                touch-action: none; user-select: none;
            }
            .floating-node::before {
                content: ''; position: absolute; inset: -4px;
                border-radius: 50%;
                border: 1px solid rgba(255,215,0,0.2);
                animation: ringPulse 3s ease-in-out infinite;
            }
            .floating-node::after {
                content: ''; position: absolute; inset: -10px;
                border-radius: 50%;
                border: 1px solid rgba(130,87,229,0.15);
                animation: ringPulse 3s ease-in-out infinite 1.5s;
            }
            @keyframes ringPulse {
                0%, 100% { transform: scale(1); opacity: 0.6; }
                50% { transform: scale(1.15); opacity: 0; }
            }
            .floating-node:hover, .floating-node:active {
                border-color: #fff;
                box-shadow: 0 0 35px rgba(255,215,0,0.6),
                            0 0 60px rgba(130,87,229,0.3),
                            inset 0 0 20px rgba(255,215,0,0.1);
                transform: scale(1.08);
            }
            .node-icon { font-size: 22px; line-height: 1; filter: drop-shadow(0 0 6px rgba(255,215,0,0.5)); }
            .node-name {
                font-size: 8px; font-weight: 700; text-align: center;
                padding: 0 4px; white-space: nowrap; overflow: hidden;
                text-overflow: ellipsis; max-width: 80px;
                color: #ffd700; letter-spacing: 0.3px;
            }
            .node-status {
                font-size: 7px; color: #00FF88;
                font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px;
            }
            .fn-0 { animation: float0 7s ease-in-out infinite; }
            .fn-1 { animation: float1 9s ease-in-out infinite; }
            .fn-2 { animation: float2 8s ease-in-out infinite; }
            .fn-3 { animation: float3 10s ease-in-out infinite; }
            .fn-4 { animation: float4 6.5s ease-in-out infinite; }
            .fn-5 { animation: float5 11s ease-in-out infinite; }
            .fn-6 { animation: float6 8.5s ease-in-out infinite; }
            .fn-7 { animation: float7 9.5s ease-in-out infinite; }
            @keyframes float0 { 0%,100%{transform:translate(0,0) rotate(0deg)} 25%{transform:translate(8px,-14px) rotate(2deg)} 50%{transform:translate(-5px,-8px) rotate(-1deg)} 75%{transform:translate(10px,6px) rotate(1.5deg)} }
            @keyframes float1 { 0%,100%{transform:translate(0,0) rotate(0deg)} 30%{transform:translate(-12px,-10px) rotate(-2deg)} 60%{transform:translate(7px,-18px) rotate(1deg)} 80%{transform:translate(-4px,8px) rotate(-1deg)} }
            @keyframes float2 { 0%,100%{transform:translate(0,0)} 20%{transform:translate(14px,-6px) rotate(2deg)} 55%{transform:translate(-8px,-16px) rotate(-1.5deg)} 80%{transform:translate(5px,10px) rotate(1deg)} }
            @keyframes float3 { 0%,100%{transform:translate(0,0) rotate(0deg)} 35%{transform:translate(-10px,12px) rotate(-2deg)} 65%{transform:translate(12px,-10px) rotate(2deg)} }
            @keyframes float4 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(10px,-12px) rotate(1.5deg)} 70%{transform:translate(-14px,6px) rotate(-2deg)} }
            @keyframes float5 { 0%,100%{transform:translate(0,0) rotate(0deg)} 30%{transform:translate(-6px,-18px) rotate(-1deg)} 60%{transform:translate(12px,8px) rotate(2deg)} 85%{transform:translate(-8px,-4px) rotate(-1.5deg)} }
            @keyframes float6 { 0%,100%{transform:translate(0,0) rotate(0deg)} 25%{transform:translate(-15px,-5px) rotate(3deg)} 50%{transform:translate(3px,-12px) rotate(-2deg)} 75%{transform:translate(12px,8px) rotate(1deg)} }
            @keyframes float7 { 0%,100%{transform:translate(0,0) rotate(0deg)} 35%{transform:translate(8px,-16px) rotate(-3deg)} 65%{transform:translate(-10px,14px) rotate(2deg)} }
            .node-ripple {
                position: fixed; border-radius: 50%;
                border: 2px solid rgba(255,215,0,0.8);
                pointer-events: none; z-index: 9999;
                animation: nodeRippleAnim 0.6s ease-out forwards;
            }
            @keyframes nodeRippleAnim {
                0%   { transform: scale(0.5); opacity: 1; }
                100% { transform: scale(3); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }

    // ═══════════════════ أزرار التنقل - لا تضيف شيئاً، الأزرار في HTML ═══════════════════
    setupCustomNavButtons() {
        // ✅ الأزرار موجودة مباشرة في HTML - لا حاجة لإضافة ديناميكية
        console.log('✅ Nav buttons ready in HTML');
    }

    // ═══════════════════ عرض العقد العائمة ═══════════════════
    renderFloatingNodes() {
        document.querySelectorAll('.floating-node').forEach(el => el.remove());

        const venues = this.state.nearbyVenues;
        if (!venues || venues.length === 0) return;

        const safeZoneTop = 130;
        const safeZoneBottom = 140;
        const nodeSize = 95;
        const usableH = window.innerHeight - safeZoneTop - safeZoneBottom - nodeSize;
        const usableW = window.innerWidth - nodeSize - 16;

        const placed = [];
        const minDist = 110;

        venues.forEach((venue, index) => {
            const el = document.createElement('div');
            el.className = `floating-node fn-${index % 8}`;

            const icons = this.venueIcons[venue.type] || this.venueIcons.default;
            const icon = icons[index % icons.length];

            const venueId = venue.name.toLowerCase().replace(/\s+/g, '_');
            const owner = window.chatooAdmin?.venueOwners?.[venueId] || '';

            el.innerHTML = `
                <div class="node-icon">${icon}</div>
                <div class="node-name">${venue.name}</div>
                <div class="node-status">${venue.status.toUpperCase()}</div>
                ${owner ? `<div style="font-size:6px;color:rgba(255,215,0,0.5);">👤 ${owner}</div>` : ''}
            `;

            let x, y, tries = 0;
            do {
                x = Math.floor(Math.random() * usableW) + 8;
                y = Math.floor(Math.random() * usableH) + safeZoneTop;
                tries++;
            } while (tries < 60 && placed.some(p => Math.hypot(p.x - x, p.y - y) < minDist));
            placed.push({ x, y });

            el.style.left = `${x}px`;
            el.style.top = `${y}px`;
            el.style.animationDelay = `${(index * 0.7).toFixed(1)}s`;

            el.addEventListener('click', (e) => {
                this._nodeRipple(e);
                this._openNodeChat(venue.name, owner);
            });

            document.body.appendChild(el);
        });
    }

    _nodeRipple(e) {
        const r = document.createElement('div');
        r.className = 'node-ripple';
        r.style.cssText = `left:${e.clientX - 45}px;top:${e.clientY - 45}px;width:90px;height:90px;`;
        document.body.appendChild(r);
        setTimeout(() => r.remove(), 650);
    }

    _openNodeChat(venueName, ownerName) {
        if (typeof chatoo !== 'undefined' && chatoo.openChat) {
            if (ownerName) sessionStorage.setItem(`venue_owner_${venueName}`, ownerName);
            chatoo.openChat(venueName);
            if (window.chatooAchievements) window.chatooAchievements.trackVenueVisit();
        } else {
            Swal.fire({
                title: `⚡ ${venueName}`,
                text: ownerName ? `المالك: ${ownerName}` : 'جاري الاتصال بالعقدة...',
                background: "#121214", color: "#fff",
                confirmButtonColor: "#ffd700",
                timer: 2000, timerProgressBar: true
            });
        }
    }
}

// ═══════════════════ دوال المحفظة ═══════════════════
function buildWalletModal() {
    if (document.getElementById("wallet-modal")) return;

    const modal = document.createElement("div");
    modal.id = "wallet-modal";
    modal.style.cssText = `
        position:fixed; inset:0; z-index:9000;
        background:rgba(0,0,0,0.92); backdrop-filter:blur(22px);
        display:none; align-items:center; justify-content:center;
        padding:20px; font-family:'Inter',system-ui,sans-serif;
    `;

    modal.innerHTML = `
      <div style="width:100%;max-width:390px;background:linear-gradient(160deg,#0d1117,#161b27);border:1px solid rgba(255,215,0,0.18);border-radius:32px;padding:28px 24px;box-shadow:0 40px 100px rgba(0,0,0,0.95);position:relative;overflow:hidden;">
        <button onclick="closeWallet()" style="position:absolute;top:16px;left:16px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.08);border:none;color:#fff;font-size:15px;cursor:pointer;">✕</button>
        <div style="text-align:center;margin-bottom:22px;padding-top:4px;">
          <div style="font-size:42px;margin-bottom:6px;">🥧</div>
          <div style="font-size:21px;font-weight:900;color:#fff;letter-spacing:3px;">Pi Wallet</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.3);margin-top:3px;">POWERED BY PI NETWORK</div>
        </div>
        <div id="w-balance-card" style="background:linear-gradient(135deg,rgba(130,87,229,0.22),rgba(255,215,0,0.07));border:1px solid rgba(255,215,0,0.22);border-radius:22px;padding:24px 20px;text-align:center;margin-bottom:16px;display:none;">
          <div style="font-size:10px;color:rgba(255,255,255,0.4);letter-spacing:3px;margin-bottom:8px;">BALANCE</div>
          <div style="display:flex;align-items:baseline;justify-content:center;gap:6px;">
            <div id="w-balance-val" style="font-size:52px;font-weight:900;color:#ffd700;line-height:1;text-shadow:0 0 40px rgba(255,215,0,0.55);">—</div>
            <div style="font-size:18px;color:rgba(255,215,0,0.65);font-weight:700;">π</div>
          </div>
          <div id="w-address" style="font-size:10px;color:rgba(255,255,255,0.2);font-family:monospace;margin-top:6px;"></div>
        </div>
        <div id="w-message" style="background:rgba(255,255,255,0.03);border-radius:14px;padding:15px;text-align:center;margin-bottom:16px;font-size:13px;color:rgba(255,255,255,0.5);">
          اضغط <b style="color:#ffd700">اتصال بالمحفظة</b> لعرض رصيدك
        </div>
        <button id="w-btn-connect" onclick="connectWallet()" style="width:100%;padding:15px;background:linear-gradient(135deg,#8257e5,#5d3bb3);border:none;border-radius:16px;color:#fff;font-size:15px;font-weight:700;cursor:pointer;">🔗 اتصال بالمحفظة</button>
        <button id="w-btn-refresh" onclick="refreshWallet()" style="width:100%;padding:13px;background:rgba(255,215,0,0.07);border:1px solid rgba(255,215,0,0.22);border-radius:16px;color:#ffd700;font-size:14px;font-weight:600;cursor:pointer;display:none;margin-top:8px;">🔄 تحديث الرصيد</button>
      </div>
    `;
    document.body.appendChild(modal);
}

function openWallet() {
    if (!document.getElementById("wallet-modal")) buildWalletModal();
    document.getElementById("wallet-modal").style.display = "flex";

    const token = sessionStorage.getItem("pi_token");
    const user = sessionStorage.getItem("pi_user");
    const address = sessionStorage.getItem("pi_address");

    if (token && user) {
        showBalanceCard(user);
        if (address && window.chatooBlock) {
            window.chatooBlock.getAccountBalance(address).then(result => {
                showBalance(result.balance, address);
            }).catch(() => showBalance(0, address));
        }
    }
}

function closeWallet() {
    const modal = document.getElementById("wallet-modal");
    if (modal) modal.style.display = "none";
}

async function connectWallet() {
    if (typeof Pi === 'undefined') {
        document.getElementById("w-message").innerHTML =
            '⚠️ يجب فتح التطبيق من <b style="color:#ffd700">Pi Browser</b>';
        return;
    }

    const savedUser = sessionStorage.getItem("pi_user");
    const savedAddr = sessionStorage.getItem("pi_address");

    if (savedUser) {
        showBalanceCard(savedUser);
        if (savedAddr && window.chatooBlock) {
            try {
                const result = await window.chatooBlock.getAccountBalance(savedAddr);
                showBalance(result.balance, savedAddr);
            } catch (e) {
                showBalance(0, savedAddr);
            }
        }
        if (window.chatooNotif) window.chatooNotif.toast('✅ محفظة (جلسة محفوظة)');
        return;
    }

    try {
        const auth = await Pi.authenticate(
            ["username", "payments"],
            (p) => console.warn("Incomplete:", p)
        );
        const username = auth.user.username;
        const address = auth.user.wallet_address || auth.user.uid;

        sessionStorage.setItem("pi_token", auth.accessToken);
        sessionStorage.setItem("pi_user", username);
        if (address) sessionStorage.setItem("pi_address", address);

        showBalanceCard(username);

        if (address && window.chatooBlock) {
            try {
                const result = await window.chatooBlock.getAccountBalance(address);
                showBalance(result.balance, address);
            } catch (e) {
                showBalance(0, address);
            }
        }

        if (window.chatooNotif) window.chatooNotif.toast('✅ تم الاتصال بالمحفظة');
    } catch (err) {
        document.getElementById("w-message").innerHTML =
            `❌ ${err.message || 'فشل الاتصال'}`;
    }
}

function showBalanceCard(username) {
    const balCard = document.getElementById("w-balance-card");
    const msg = document.getElementById("w-message");
    const btnConnect = document.getElementById("w-btn-connect");
    const btnRefresh = document.getElementById("w-btn-refresh");
    if (balCard) balCard.style.display = "block";
    if (msg) msg.style.display = "none";
    if (btnConnect) btnConnect.style.display = "none";
    if (btnRefresh) btnRefresh.style.display = "block";
}

function showBalance(balance, address) {
    const el = document.getElementById("w-balance-val");
    if (el) el.textContent = Number(balance).toLocaleString("en", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 7
    });
    const addrEl = document.getElementById("w-address");
    if (addrEl && address) {
        addrEl.textContent = "📍 " + address.slice(0, 8) + "..." + address.slice(-8);
        addrEl.style.display = "block";
    }
}

async function refreshWallet() {
    const address = sessionStorage.getItem("pi_address");
    if (address && window.chatooBlock) {
        try {
            const result = await window.chatooBlock.getAccountBalance(address);
            showBalance(result.balance, address);
            if (window.chatooNotif) window.chatooNotif.toast('🔄 تم تحديث الرصيد');
        } catch (e) {
            if (window.chatooNotif) window.chatooNotif.toast('❌ فشل التحديث');
        }
    }
}

function openSettingsModal() {
    Swal.fire({
        title: "⚙️ إعدادات Chatoo",
        html: `
            <div style="text-align:right;color:#fff;">
                <label style="font-size:13px;color:#8257e5;">وضع العرض</label>
                <select id="cinematic-mode" class="swal2-input"
                    style="background:#18181c;color:#fff;border-color:#333;">
                    <option value="dark"
                        ${(localStorage.getItem("chatoo_mode")||"dark")==="dark"?"selected":""}>
                        🌑 داكن
                    </option>
                    <option value="vibrant"
                        ${localStorage.getItem("chatoo_mode")==="vibrant"?"selected":""}>
                        ✨ حيوي
                    </option>
                </select>
            </div>`,
        background: "#121214",
        color: "#fff",
        confirmButtonColor: "#ffd700",
        confirmButtonText: "حفظ",
        showCancelButton: true,
        cancelButtonText: "إلغاء"
    }).then(r => {
        if (r.isConfirmed) {
            localStorage.setItem(
                "chatoo_mode",
                document.getElementById("cinematic-mode").value
            );
            if (window.chatooNotif) window.chatooNotif.toast('⚙️ تم حفظ الإعدادات');
        }
    });
}

// ═══════════════════ تهيئة ═══════════════════
document.addEventListener('DOMContentLoaded', () => {
    window.chatooActions = new ChatooActions();
    console.log('🎬 Chatoo Actions Ready');
});
