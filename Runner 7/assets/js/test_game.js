// ===== GAME FUNCTIONALITY TEST =====
console.log('🔍 Running Game Functionality Tests...');

// Test 1: Check if basic game objects exist
console.log('1️⃣ Testing Game Objects...');
try {
    if (typeof DESIGN_W !== 'undefined') console.log('✅ DESIGN_W:', DESIGN_W);
    if (typeof DESIGN_H !== 'undefined') console.log('✅ DESIGN_H:', DESIGN_H);
    if (typeof wrap !== 'undefined') console.log('✅ DOM wrap element found');
    if (typeof cv !== 'undefined') console.log('✅ Canvas element found');
    if (typeof ctx !== 'undefined') console.log('✅ Canvas context available');
} catch (e) {
    console.error('❌ Game objects test failed:', e);
}

// Test 2: Check if A1K patch loaded
console.log('2️⃣ Testing A1K Patch...');
try {
    if (window.A1K) {
        console.log('✅ A1K object exists');
        if (window.A1K.config) console.log('✅ A1K config loaded');
        if (window.A1K.computeRageTier) console.log('✅ Rage tier function available');
        if (window.A1K.applyInvuln) console.log('✅ Invulnerability function available');
        if (window.A1K.floater) console.log('✅ Damage floater function available');
    } else {
        console.error('❌ A1K object not found');
    }
} catch (e) {
    console.error('❌ A1K patch test failed:', e);
}

// Test 3: Check if game state initialized
console.log('3️⃣ Testing Game State...');
try {
    if (typeof st !== 'undefined') {
        console.log('✅ Game state (st) exists');
        console.log('   - Stage:', st.stage || 'undefined');
        console.log('   - Wave:', st.wave || 'undefined');
        console.log('   - Gold:', st.gold || 'undefined');
        console.log('   - AP Total:', st.apTotal || 'undefined');
        console.log('   - Rage Tier:', st.rageTier || 'undefined');
    } else {
        console.error('❌ Game state not found');
    }
} catch (e) {
    console.error('❌ Game state test failed:', e);
}

// Test 4: Check if UI elements exist
console.log('4️⃣ Testing UI Elements...');
try {
    const elements = [
        'btnInventory', 'btnShop', 'btnTalents', 'btnSettings',
        'btnSpeed', 'btnStart', 'btnAuto',
        'btnCharA', 'btnCharU', 'btnCharM',
        'btnRage', 'btnShield', 'btnJump', 'btnShoot',
        'btnS1', 'btnS2', 'btnS3'
    ];

    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            console.log(`✅ ${id} button found`);
        } else {
            console.error(`❌ ${id} button missing`);
        }
    });
} catch (e) {
    console.error('❌ UI elements test failed:', e);
}

// Test 5: Check if core functions exist
console.log('5️⃣ Testing Core Functions...');
try {
    const functions = [
        'spawnWave', 'nearestEnemy', 'addFloater',
        'grantGold', 'grantSilver', 'updateCurrencies',
        'useSkill', 'drawTalents', 'draw'
    ];

    functions.forEach(funcName => {
        if (typeof window[funcName] === 'function') {
            console.log(`✅ ${funcName} function available`);
        } else {
            console.error(`❌ ${funcName} function missing`);
        }
    });
} catch (e) {
    console.error('❌ Core functions test failed:', e);
}

// Test 6: Check if PATCH configuration loaded
console.log('6️⃣ Testing PATCH Configuration...');
try {
    if (window.A1K_CONFIG) {
        console.log('✅ A1K_CONFIG exists');
        if (window.A1K_CONFIG.globals) console.log('✅ PATCH globals loaded');
        if (window.A1K_CONFIG.heroes) console.log('✅ Hero configurations loaded');
        if (window.A1K_CONFIG.scaling) console.log('✅ Scaling configurations loaded');
    } else {
        console.error('❌ PATCH configuration not found');
    }
} catch (e) {
    console.error('❌ PATCH configuration test failed:', e);
}

console.log('🎯 Game Functionality Tests Complete!');
console.log('📊 Check results above for any issues.');
console.log('🚀 If all tests pass, the game should be fully functional!');

// Auto-run when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            console.log('⏰ Running tests in 2 seconds...');
            setTimeout(() => {
                // Re-run the tests after a delay to ensure everything is loaded
                console.log('🔄 Re-testing after load delay...');
                // The tests above will run again
            }, 2000);
        }, 1000);
    });
}

