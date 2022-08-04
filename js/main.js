const STAT_INPUT_STR = document.getElementById("stat-input-str");
const STAT_INPUT_DEX = document.getElementById("stat-input-dex");
const STAT_INPUT_INT = document.getElementById("stat-input-int");
const STAT_INPUT_FTH = document.getElementById("stat-input-fth");
const STAT_INPUT_ARC = document.getElementById("stat-input-arc");

const WEAPON_WHEEL_CONTAINER = document.getElementById("weapon-wheel-container");
const ASHES_WHEEL_CONTAINER = document.getElementById("ashes-wheel-container");
const WEAPON_WHEEL_SCROLLER = document.getElementById("weapon-wheel-scroller");
const ASHES_WHEEL_SCROLLER = document.getElementById("ashes-wheel-scroller");

function isWeaponUsable(weaponName) {
    return WEAPONS[weaponName].str <= STAT_INPUT_STR.value * 1.5 &&
        WEAPONS[weaponName].dex <= STAT_INPUT_DEX.value &&
        WEAPONS[weaponName].int <= STAT_INPUT_INT.value &&
        WEAPONS[weaponName].fth <= STAT_INPUT_FTH.value &&
        WEAPONS[weaponName].arc <= STAT_INPUT_ARC.value;
}

function collectUsableWeaponNames() {
    return Object.keys(WEAPONS).filter(isWeaponUsable);
}

function collectUsableAshNames() {
    return Object.keys(ASHES_OF_WAR).filter(name => {
        const weaponName = WEAPON_WHEEL_SCROLLER.children
            .item(2)
            .getAttribute('data-name');
        // fallback option for non-infusible weapons
        if (!WEAPONS[weaponName].infusible) {
            return name === 'No Skill';
        }
        return ASHES_OF_WAR[name].includes(WEAPONS[weaponName].category);
    });
}

function createTile(name) {
    let img = undefined;
    try {
        img = document.getElementById(name.replace(/ /g, '_'))
            .cloneNode(false);
    } catch (e) {
        console.error("Failed to find image for " + name);
        console.error(e);
        return null;
    }
    img.removeAttribute('id');
    img.hidden = '';
    img.className = 'tile';

    const outerWrapper = document.createElement('div');
    outerWrapper.className = 'tile-outer-wrapper';
    outerWrapper.setAttribute('data-name', name);

    const wrapper = document.createElement('div');
    wrapper.className = 'tile-wrapper';
    wrapper.appendChild(img);
    outerWrapper.appendChild(wrapper);

    const text = document.createElement('div');
    text.className = 'tile-text';
    wrapper.appendChild(text);

    const bottomText = document.createElement('span');
    bottomText.className = 'tile-bottom-text';
    bottomText.textContent = name;
    text.appendChild(bottomText);

    return outerWrapper;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function pickRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}


const TILE_COUNT = 500;
const CHOSEN_TILE_INDEX = 400;
const SCROLLING_STEPS = 100;
const SCROLLING_DURATION = 1000 * 5;
const SCROLLING_DISTANCE = 160 * CHOSEN_TILE_INDEX;

let scrollingStep = 0;
let scrollingIntervalId = undefined;

function wheelCurve(x) {
    //return -x * (x - 2);
    return Math.pow(x, 0.025);
}

function fillWeaponWheel(scroller, limit) {
    const usableWeapons = collectUsableWeaponNames();
    const categoryMap = new Map();

    for (const weapon of usableWeapons) {
        const category = WEAPONS[weapon].category;
        if (categoryMap.has(category)) {
            categoryMap.get(category).push(weapon);
        }
        else {
            categoryMap.set(category, [weapon]);
        }
    }

    const partitionedUsableWeapons = [];
    for ([category, weapons] of categoryMap.entries()) {
        partitionedUsableWeapons.push(weapons);
    }

    for (let i = 0; i < limit; ++i) {
        const category = pickRandomElement(partitionedUsableWeapons);
        const card = createTile(pickRandomElement(category));
        scroller.appendChild(card);
    }
}

function fillAshesWheel(scroller, limit) {
    const usableAshes = collectUsableAshNames();

    for (let i = 0; i < limit; ++i) {
        const card = createTile(pickRandomElement(usableAshes));
        scroller.appendChild(card);
    }
}

function completeSpinningAnimation(scroller) {
    for (let i = 0; i < 5; ++i) {
        const copy = scroller.children.item(CHOSEN_TILE_INDEX + i).cloneNode(true);
        scroller.children.item(i).replaceWith(copy);
        scroller.scrollTo({top: 0, left: 0, behavior: "instant"});
    }
    while (scroller.children.length > 5) {
        scroller.lastChild.remove();
    }
    if (scroller === WEAPON_WHEEL_SCROLLER) {
        const selectedWeapon = scroller.children[2].getAttribute('data-name');
        setContainerActive(ASHES_WHEEL_CONTAINER, WEAPONS[selectedWeapon].infusible);
    }

    scrollingStep = 0;
}

// I had a great day

function playSpinningAnimation(scroller) {
    scrollingStep = 0;
    scrollingIntervalId = setInterval(() => {
        let progress = wheelCurve(scrollingStep++ / SCROLLING_STEPS);
        scroller.scrollTo({top: 0, left: progress * SCROLLING_DISTANCE, behavior: "smooth"});

        if (progress === 1) {
            clearInterval(scrollingIntervalId);
            setTimeout(() => completeSpinningAnimation(scroller), 500);
        }
    }, SCROLLING_DURATION / SCROLLING_STEPS);
}

function setContainerActive(wheel, active) {
    if (active) {
        wheel.classList.remove("inactive");
    }
    else if (!wheel.classList.contains("inactive")) {
        wheel.classList.add("inactive");
    }
}

function spin(scroller, fillFunction) {
    if (scrollingStep !== 0) {
        return;
    }

    fillFunction(scroller, TILE_COUNT);
    playSpinningAnimation(scroller);
}

WEAPON_WHEEL_CONTAINER.addEventListener('click', e => {
    if (!WEAPON_WHEEL_CONTAINER.classList.contains('inactive'))
        spin(WEAPON_WHEEL_SCROLLER, fillWeaponWheel);
})

ASHES_WHEEL_CONTAINER.addEventListener('click', e => {
    if (!ASHES_WHEEL_CONTAINER.classList.contains('inactive'))
        spin(ASHES_WHEEL_SCROLLER, fillAshesWheel);
})

for ([key, val] of Object.entries(WEAPONS)) {
    val.str = val.str ?? 0;
    val.dex = val.dex ?? 0;
    val.int = val.int ?? 0;
    val.fth = val.fth ?? 0;
    val.arc = val.arc ?? 0;
}

for ([category, weapons] of Object.entries(WEAPON_CATEGORIES)) {
    for (const weapon of weapons) {
        WEAPONS[weapon].category = category;
    }
}

fillWeaponWheel(WEAPON_WHEEL_SCROLLER, 5);

for (let i = 0; i < 5; ++i) {
    const ashTile = createTile('No Skill');
    ASHES_WHEEL_SCROLLER.appendChild(ashTile);
}

setContainerActive(ASHES_WHEEL_CONTAINER, false);