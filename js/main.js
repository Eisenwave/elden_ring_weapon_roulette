const BODY = document.getElementById("body");
const MAIN = document.getElementById("main");

const STAT_INPUT_STR = document.getElementById("stat-input-str");
const STAT_INPUT_DEX = document.getElementById("stat-input-dex");
const STAT_INPUT_INT = document.getElementById("stat-input-int");
const STAT_INPUT_FTH = document.getElementById("stat-input-fth");
const STAT_INPUT_ARC = document.getElementById("stat-input-arc");

const WEAPON_WHEEL_CONTAINER = document.getElementById("weapon-wheel-container");
const OFFHAND_WHEEL_CONTAINER = document.getElementById("offhand-wheel-container");
const ASHES_WHEEL_CONTAINER = document.getElementById("ashes-wheel-container");

const WEAPON_WHEEL_SCROLLER = document.getElementById("weapon-wheel-scroller");
const OFFHAND_WHEEL_SCROLLER = document.getElementById("offhand-wheel-scroller");
const ASHES_WHEEL_SCROLLER = document.getElementById("ashes-wheel-scroller");

const INCLUDE_DLC = document.getElementById('filter-no-dlc');

const NO_ASHES = document.getElementById("filter-no-ashes");
const FILTER_NO_MAINHAND_SHIELD = document.getElementById("filter-no-mainhand-shield");
const FILTER_NO_MAINHAND_STAFF = document.getElementById("filter-no-mainhand-staff");
const FILTER_NO_MAINHAND_SEAL = document.getElementById("filter-no-mainhand-seal");
const FILTER_NO_MAINHAND_CROSSBOW = document.getElementById("filter-no-mainhand-bow");
const FILTER_NO_BHS = document.getElementById("filter-no-bhs");
const NO_BASE = document.getElementById("filter-no-base")


const TOGGLE_ALL = document.getElementById("toggle-all");

const GREENSCREEN = document.getElementById("greenscreen");

const PIN_AUDIO = document.getElementById("audio-pin");
PIN_AUDIO.volume = 0.15;
const SUCCESS_AUDIO = document.getElementById("audio-success");
SUCCESS_AUDIO.volume = 0.2;

function isWeaponCategoryEnabled(weaponName) {
    const checkboxName = 'checkbox-' + WEAPONS[weaponName].category
        .toLowerCase()
        .replace(/ /g, '-');
    const checkbox = document.getElementById(checkboxName);
    if (!checkbox) {
        throw new Error("Failed to find checkbox with id" + checkboxName)
    }
    return checkbox.checked;
}

function isWeaponFilteredOut(weaponName, isOffhand) {
    if (isOffhand) {
        return false;
    }
    const category = WEAPONS[weaponName].category;
    switch (category) {
        case 'Small Shield':
        case 'Medium Shield':
        case 'Greatshield':
        case 'Thrusting Shield':
            return FILTER_NO_MAINHAND_SHIELD.checked;
        case 'Glintstone Staff':
            return FILTER_NO_MAINHAND_STAFF.checked;
        case 'Sacred Seal':
            return FILTER_NO_MAINHAND_SEAL.checked;
        case 'Light Bow': 
        case 'Bow':
        case 'Greatbow':
        case 'Crossbow':
            return FILTER_NO_MAINHAND_CROSSBOW.checked;
    }
    return false;
}
function enableCheckboxes(checkboxId, isEnabled){
    const checkbox = document.getElementById(checkboxId)
    if(!checkbox){
        throw new Error("Failed to find checkbox with id" + checkboxID);
    }
    checkbox.disabled = !isEnabled;
}

function toggleDLCCheckboxes(){
    toggleOnlyDlcCheckbox(INCLUDE_DLC.checked);
    toggleDLCWeaponCheckbox(INCLUDE_DLC.checked);
}

function toggleOnlyDlcCheckbox(isEnabled){
    NO_BASE.disabled = !isEnabled;
    if(!isEnabled){
        NO_BASE.checked = false;
    }
}

function toggleDLCWeaponCheckbox(isEnabled){
    const checkboxes = [
        "checkbox-backhand-blade",
        "checkbox-beast-claw",
        "checkbox-great-katana",
        "checkbox-hand-to-hand-art",
        "checkbox-light-greatsword",
        "checkbox-perfume-bottle",
        "checkbox-throwing-blade",
        "checkbox-thrusting-shield",
    ];
    checkboxes.forEach(checkboxId => enableCheckboxes(checkboxId, isEnabled));
}

//checks both ashes and weapons, loaded in dlc-exclusives
function isDLCExclusive(name){
    if(INCLUDE_DLC.checked){
        return false;
    }
    return DLC_EXCLUSIVES[name];
}

function onlyDLCExclusives(name){
    if(NO_BASE.checked){
        return !DLC_EXCLUSIVES[name]; 
    }
    return false;
}

function isWeaponUsable(weaponName, isOffhand) {
    // include dlc weapons
    if(isDLCExclusive(weaponName)) {
        return false;
    }
    // excludes non dlc weapons
    if(onlyDLCExclusives(weaponName)) {
        return false
    }
    if (isOffhand && WEAPONS[weaponName].type === 'two-handed') {
        return false;
    }
    if (!isWeaponCategoryEnabled(weaponName) || isWeaponFilteredOut(weaponName, isOffhand)) {
        return false;
    }

    const twoHandedStr = isOffhand ? 1 : 1.5;
    return WEAPONS[weaponName].str <= STAT_INPUT_STR.value * twoHandedStr &&
        WEAPONS[weaponName].dex <= STAT_INPUT_DEX.value &&
        WEAPONS[weaponName].int <= STAT_INPUT_INT.value &&
        WEAPONS[weaponName].fth <= STAT_INPUT_FTH.value &&
        WEAPONS[weaponName].arc <= STAT_INPUT_ARC.value;
}

function collectUsableWeaponNames(isOffhand) {
    return Object.keys(WEAPONS).filter(w => isWeaponUsable(w, isOffhand));
}

function isAshUsableForWeapon(name){
    const weaponName = WEAPON_WHEEL_SCROLLER.children
        .item(2)
        .getAttribute('data-name');
    // fallback option for non-infusible weapons
    if (!WEAPONS[weaponName].infusible) {
        return name === 'No Skill';
    }
    return ASHES_OF_WAR[name].includes(WEAPONS[weaponName].category);
}

function collectUsableAshNames() {
    return Object
        .keys(ASHES_OF_WAR)
        .filter(name =>
            //order important, so it leaves the function earlier
            !NO_ASHES.checked&& 
            !isDLCExclusive(name) &&
            !onlyDLCExclusives(name) &&
            isAshUsableForWeapon(name) &&
            (name !== "Bloodhound's Step" || !FILTER_NO_BHS.checked)
        );
}

function createTile(name, detail) {
    let img = undefined;
    try {
        img = document.getElementById(name.replace(/ /g, '_'))
            .cloneNode(true);
    } catch (e) {
        console.error("Failed to find image for " + name);
        console.error(e);
        return null;
    }
    img.removeAttribute('id');
    img.hidden = '';
    img.classList.add('tile');

    const outerWrapper = document.createElement('div');
    outerWrapper.className = 'tile-outer-wrapper';
    outerWrapper.setAttribute('data-name', name);
    outerWrapper.setAttribute('data-detail', detail ?? '');

    const wrapper = document.createElement('div');
    wrapper.className = 'tile-wrapper';
    wrapper.appendChild(img);
    outerWrapper.appendChild(wrapper);

    const text = document.createElement('div');
    text.className = 'tile-text';
    wrapper.appendChild(text);

    if (detail) {
        const topText = document.createElement('span');
        topText.className = 'tile-top-text';
        topText.textContent = detail;
        text.appendChild(topText);
    }

    const bottomTextContainer = document.createElement('div');
    bottomTextContainer.className = 'tile-bottom-text-container';
    text.appendChild(bottomTextContainer);

    const bottomText = document.createElement('span');
    bottomText.className = 'tile-bottom-text';
    bottomText.textContent = name;
    bottomTextContainer.appendChild(bottomText);

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


const TILE_COUNT = 100;
const CHOSEN_TILE_INDEX = TILE_COUNT - 5;
const SCROLLING_DURATION = 1000 * 8;
const SCROLLING_STEPS_PER_SECOND = 25;
const SCROLLING_STEPS = SCROLLING_DURATION / 1000 * SCROLLING_STEPS_PER_SECOND;
const SCROLLING_DISTANCE = 160 * CHOSEN_TILE_INDEX;

let scrollingStep = 0;
let scrollingIntervalId = undefined;

function wheelCurve(x) {
    //return -x * (x - 2);
    return Math.pow(x, 0.1);
}

const TYPE_USE_WEIGHTS = {
    "melee": [2 / 6, 3 / 6, 1 / 6],
    "two-handed": [1, 0, 0],
    "paired": [1 / 2, 1 / 4, 1 / 4],
    "offhand": [1 / 8, 3 / 4, 1 / 8]
};

function chooseWeaponUse(weapon) {
    const type = WEAPONS[weapon].type;
    if (type === undefined) {
        throw new Error("No weapon type for weapon " + weapon);
    }

    const weights = TYPE_USE_WEIGHTS[type];
    if (weights === undefined) {
        throw new Error("No weights found for weapon type " + type);
    }
    // weapons may have been chosen for which we only meet the STR requirement
    // two-handed, so we have to avoid 1H or PS for them
    if (WEAPONS[weapon].str > STAT_INPUT_STR.value) {
        return '2H';
    }

    const sample = Math.random();
    if (sample <= weights[0]) {
        return '2H';
    }
    if (sample <= weights[0] + weights[1]) {
        return '1H';
    }
    return 'PS';
}

function fillWeaponWheel(scroller, limit, isOffhand) {
    const usableWeapons = collectUsableWeaponNames(isOffhand);
    if (usableWeapons.length === 0) {
        return false;
    }

    const categoryMap = new Map();

    for (const weapon of usableWeapons) {
        const category = WEAPONS[weapon].category;
        if (categoryMap.has(category)) {
            categoryMap.get(category).push(weapon);
        } else {
            categoryMap.set(category, [weapon]);
        }
    }

    const partitionedUsableWeapons = [];
    for ([category, weapons] of categoryMap.entries()) {
        partitionedUsableWeapons.push(weapons);
    }

    for (let i = 0; i < limit; ++i) {
        const category = pickRandomElement(partitionedUsableWeapons);
        const weapon = pickRandomElement(category);
        let use = undefined;
        if (!isOffhand) {
            use = WEAPONS[weapon].type === 'two-handed' ? undefined
                : chooseWeaponUse(weapon);
        }
        const card = createTile(weapon, use);
        scroller.appendChild(card);
    }

    return true;
}

function fillAshesWheel(scroller, limit) {
    const usableAshes = collectUsableAshNames();
    if(usableAshes.length == 0){
        return false;
    }

    for (let i = 0; i < limit; ++i) {
        const card = createTile(pickRandomElement(usableAshes));
        scroller.appendChild(card);
    }

    return true;
}

function completeSpinningAnimation(scroller) {
    SUCCESS_AUDIO.playbackRate = 1.0 + (Math.random() * 0.75 - 0.25);
    SUCCESS_AUDIO.play();

    for (let i = 0; i < 5; ++i) {
        const copy = scroller.children.item(CHOSEN_TILE_INDEX + i).cloneNode(true);
        scroller.children.item(i).replaceWith(copy);
        scroller.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    scroller.children.item(2).firstElementChild.firstElementChild.classList.add('highlighted')
    while (scroller.children.length > 5) {
        scroller.lastChild.remove();
    }

    scrollingStep = 0;

    if (scroller === WEAPON_WHEEL_SCROLLER) {
        const selected = scroller.children[2];
        const selectedUse = selected.getAttribute('data-detail');
        const selectedWeapon = selected.getAttribute('data-name');
        setContainerActive(OFFHAND_WHEEL_CONTAINER, selectedUse === '1H');
        setContainerActive(ASHES_WHEEL_CONTAINER, WEAPONS[selectedWeapon].infusible);
        // this does not cover the possibility that there may not be ashes, even though a weapon is infusible
        if(NO_ASHES.checked){
            setContainerActive(ASHES_WHEEL_CONTAINER, false);
            return;
        }     
    }
}

// I had a great day

function playSpinningAnimation(scroller) {
    scrollingStep = 0;
    let previousIndex = 0;

    scrollingIntervalId = setInterval(() => {
        const progress = wheelCurve(scrollingStep++ / SCROLLING_STEPS);
        const scroll = progress * SCROLLING_DISTANCE;
        scroller.scrollTo({
            top: 0,
            left: scroll,
            behavior: "smooth"
        });

        const index = Math.floor((scroll + 80) / 160);
        if (index !== previousIndex) {
            const audio = PIN_AUDIO.cloneNode(true);
            audio.volume = PIN_AUDIO.volume;
            audio.play();
        }
        previousIndex = index;

        if (progress === 1) {
            clearInterval(scrollingIntervalId);
            setTimeout(() => completeSpinningAnimation(scroller), 500);
        }
    }, SCROLLING_DURATION / SCROLLING_STEPS);
}

function setContainerActive(wheel, active) {
    if (active) {
        wheel.classList.remove("inactive");
    } else if (!wheel.classList.contains("inactive")) {
        wheel.classList.add("inactive");
    }
}

function spin(scroller, fillFunction, isOffhand) {
    if (scrollingStep !== 0) {
        return;
    }
    if (scroller === WEAPON_WHEEL_SCROLLER) {
        setContainerActive(OFFHAND_WHEEL_CONTAINER, false);
        setContainerActive(ASHES_WHEEL_CONTAINER, false);
    }

    if (fillFunction(scroller, TILE_COUNT, isOffhand)) {
        setContainerActive(scroller, true);
        playSpinningAnimation(scroller, fillFunction);
        return; //replaces else-statement
    }
    //deactivates wheal, when fill returns false, cause its empty
    setContainerActive(scroller, false);
}

WEAPON_WHEEL_CONTAINER.addEventListener('click', e => {
    if (!WEAPON_WHEEL_CONTAINER.classList.contains('inactive'))
        spin(WEAPON_WHEEL_SCROLLER, fillWeaponWheel, false);
})

OFFHAND_WHEEL_CONTAINER.addEventListener('click', e => {
    if (!OFFHAND_WHEEL_CONTAINER.classList.contains('inactive'))
        spin(OFFHAND_WHEEL_SCROLLER, fillWeaponWheel, true);
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

for ([category, info] of Object.entries(WEAPON_CATEGORIES)) {
    for (const weapon of info.weapons) {
        WEAPONS[weapon].category = category;
        WEAPONS[weapon].type = info.type;
    }
}

fillWeaponWheel(WEAPON_WHEEL_SCROLLER, 5, false);
fillWeaponWheel(OFFHAND_WHEEL_SCROLLER, 5, true);


for (let i = 0; i < 5; ++i) {
    const ashTile = createTile('No Skill');
    ASHES_WHEEL_SCROLLER.appendChild(ashTile);
}

setContainerActive(OFFHAND_WHEEL_CONTAINER, false);
setContainerActive(ASHES_WHEEL_CONTAINER, false);

TOGGLE_ALL.addEventListener('change', _ => {
    for (const box of document.querySelectorAll('[id^=checkbox]')) {
        box.checked = TOGGLE_ALL.checked;
    }
})

GREENSCREEN.addEventListener('change', _ => {
    console.log(GREENSCREEN);
    if (GREENSCREEN.checked) {
        BODY.classList.add('greenscreen');
        MAIN.classList.remove('drop-shadow');
    }
    else {
        BODY.classList.remove('greenscreen');
        MAIN.classList.add('drop-shadow');
    }
})