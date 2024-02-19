if (location.hash === "#debug") {
    window.EarsDebug = true;
} else if (location.hash.indexOf("#debug=") === 0) {
    var li = location.hash.substring(7).split(",");
    window.EarsDebug = li;
} else {
    window.EarsDebug = false;
}

window.addEventListener('hashchange', () => window.location.reload());
var $ = (s) => document.querySelector(s);
var $$ = (s) => document.querySelectorAll(s);

initCommon();
$("#version").textContent = "v"+window.commonVersion;

$("#btnSwitch").addEventListener("click", () => {
    if (document.documentElement.getAttribute('data-bs-theme') === 'dark') {
        document.documentElement.setAttribute('data-bs-theme','light')
    } else {
        document.documentElement.setAttribute('data-bs-theme','dark')
    }
})

let skinTexNeedsUpdate = false;
function updateDpr() {
    $$(".tex").forEach((e) => {
        let w = (e.width*(3*Math.ceil(devicePixelRatio)))/devicePixelRatio;
        let h = (e.height*(3*Math.ceil(devicePixelRatio)))/devicePixelRatio;
        e.style.width = w+"px";
        e.style.height = h+"px";
    });
}
function drawImage(ctx, img, dx1, dy1, dx2, dy2, sx1, sy1, sx2, sy2) {
    var dx = dx1;
    var dy = dy1;
    var dw = dx2-dx1;
    var dh = dy2-dy1;

    var sx = sx1;
    var sy = sy1;
    var sw = sx2-sx1;
    var sh = sy2-sy1;

    ctx.save();
    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.restore();
}
function invert(obj) {
    let out = {};
    Object.entries(obj).forEach(([k, v]) => out[v] = k);
    return out;
}
rebuildQuads();

function renderDegrees(val) {
    return val+"°";
}

function encodeDegrees(deg, allowZero) {
    if (deg == 0 && allowZero) return 0;
    let val = Math.round((deg/90)*128);
    if (val < 0) val++;
    if (val > 0) val--;
    val += 128;
    if (val === 0xD8) {
        // avoid running into Magic Blue by accident, which disables tail bending for compat
        // nobody will notice a 0.7° inaccuracy
        val--;
    }
    if (val === 0) {
        // 0 means "this segment doesn't exist"
        val = 1;
    }
    return val;
}
function decodeDegrees(val) {
    if (val === 0) return 0;
    let deg = val-128;
    if (deg < 0) deg -= 1;
    if (deg >= 0) deg += 1;
    return (deg/128)*90;
}

let samplePreservesBase = false;
let usingSample = false;
let usingSampleWing = false;
let usingSampleCape = false;
let earsElements = [];
let tailBends = [$("#tail-bend-0"), $("#tail-bend-1"), $("#tail-bend-2"), $("#tail-bend-3")];
let tailBendAngles = [$("#tail-bend-0-angle"), $("#tail-bend-1-angle"), $("#tail-bend-2-angle"), $("#tail-bend-3-angle")];

let buttonSampleSkin = $("#sample");
let buttonSampleEars = $("#sample-preserve");

function toggleEarsEnabled() {
    let en = $("#ears-enabled").checked;
    let ctx = $("#skin").getContext("2d");
    if (en) {
        ctx.fillStyle = magicPixelValues.blue;
        ctx.fillRect(0, 32, 4, 4);
    } else {
        ctx.clearRect(0, 32, 4, 4);
    }
    earsElements.forEach((e) => {
        e.ele.disabled = !en;
        if (en) {
            e.ele.dispatchEvent(new CustomEvent("input"));
        }
    });
    rebuild();
}

function updateNotices() {
    // TODO this is a huge mess\
    let noticeMenu = $("#notice-menu");
    let req121 = $("#req-121-notice");
    let req122 = $("#req-122-notice");
    let req123 = $("#req-123-notice");
    let req124 = $("#req-124-notice");
    let req130 = $("#req-130-notice");
    let req140 = $("#req-140-notice");
    let req141 = $("#req-141-notice");
    let req145 = $("#req-145-notice");
    let bug122 = $("#bug-122-notice");
    let bug123 = $("#bug-123-notice");
    let bug140 = $("#bug-140-notice");
    noticeMenu.style.display = "none";
    req121.style.display = "none";
    req122.style.display = "none";
    req123.style.display = "none";
    req124.style.display = "none";
    req130.style.display = "none";
    req140.style.display = "none";
    req141.style.display = "none";
    req145.style.display = "none";
    bug122.style.display = "none";
    bug123.style.display = "none";
    bug140.style.display = "none";
    $("#sides-bad-uvs").style.display = "none";
    $("#around-bad-uvs").style.display = "none";
    $("#claws-bad-pos").style.display = "none";
    $("#out-anchor-back").style.display = "none";
    /*$("#chest-clip").style.display = "none";*/
    $("#claws-clip").style.display = "none";
    $("#alfalfa-notice").style.display = alfalfaData.version > 0 ? "block" : "none";
    $("#alfalfa-notice-unneeded").style.display = "none";
    $("#tall-ears-mode").style.display = "none";
    $("#wing-anim-off").style.display = "none";
    let earMode = $("#ear-mode").value;
    let earAnchor = $("#ear-anchor").value;
    if (earMode === "pink") {
        req121.style.display = "block";
        noticeMenu.style.display = "";
    }
    if (earMode === "cyan") {
        bug122.style.display = "block";
        $("#around-bad-uvs").style.display = "list-item";
        noticeMenu.style.display = "";
    }
    if (earMode === "green" || earMode === "purple" || earMode === "orange") {
        bug122.style.display = "block";
        $("#sides-bad-uvs").style.display = "list-item";
        noticeMenu.style.display = "";
    }
    if (earMode === "purple2") {
        req123.style.display = "block";
        if (earAnchor === "red") {
            $("#out-anchor-back").style.display = "inline";
        }
        noticeMenu.style.display = "";
    }
    if (earMode === "white" || earMode === "gray") {
        req141.style.display = "block";
        $("#tall-ears-mode").style.display = "list-item";
        noticeMenu.style.display = "";
    }
    let protrusions = $("#protrusions").value;
    if (protrusions === "cyan" || protrusions === "green") {
        if ($("#slim-enabled").checked) {
            bug123.style.display = "block";
            $("#claws-bad-pos").style.display = "list-item";
        }
        bug140.style.display = "block";
        $("#claws-clip").style.display = "list-item";
        noticeMenu.style.display = "";
    }
    let tailMode = $("#tail-mode").value;
    if (tailMode === "orange") {
        req124.style.display = "block";
        noticeMenu.style.display = "";
    } else if ($("#tail-bend-0").value != 0) {
        req122.style.display = "block";
        noticeMenu.style.display = "";
    }
    let req130Count = 0;
    if ($("#snout").checked) {
        req130.style.display = "block";
        $("#req-130-snouts").style.display = "inline";
        req130Count++;
        noticeMenu.style.display = "";
    } else {
        $("#req-130-snouts").style.display = "none";
        noticeMenu.style.display = "";
    }
    if ($("#chest").checked) {
        req130.style.display = "block";
        $("#req-130-chest").style.display = "inline";
        req130Count++;
        bug140.style.display = "block";
        $("#chest-clip").style.display = "list-item";
        noticeMenu.style.display = "";
    } else {
        $("#req-130-chest").style.display = "none";
        noticeMenu.style.display = "";
    }


    let req130Type = req130Count > 1 ? "inline" : "none";
    $("#req-130-and").style.display = req130Type
    if (req130Type !== "none") {
        noticeMenu.style.display = "";
    }
    let wingsMode = $("#wings-mode").value;
    let wingsEnabled = false;
    if (wingsMode !== "red" && wingsMode !== "blue") {
        req140.style.display = "block";
        wingsEnabled = true;
        noticeMenu.style.display = "";
    }
    if ($("#wing-anim").value === "red") {
        req141.style.display = "block";
        $("#wing-anim-off").style.display = "list-item";
        noticeMenu.style.display = "";
    }
    let capeEnabled = $("#cape-enabled").checked;
    if (!capeEnabled && !wingsEnabled) {
        $("#alfalfa-notice-unneeded").style.display = "block";
        noticeMenu.style.display = "";
    }
    if (capeEnabled) {
        req145.style.display = "block";
        noticeMenu.style.display = "";
    }
}

rebuildGeom = null;
async function rebuild() {
    if (usingSample) await rebuildSampleSkin();
    rebuildQuads();
    if (rebuildGeom) rebuildGeom();
    updateNotices();
    skinTexNeedsUpdate = true;
}
function wireElement(id, pixel) {
    let ele = document.getElementById(id);
    earsElements.push({ele, pixel});
    if (ele.nodeName === "SELECT") {
        ele.addEventListener("input", () => {
            let ctx = $("#skin").getContext("2d");
            ctx.fillStyle = magicPixelValues[ele.value];
            ctx.fillRect(0+Math.floor(pixel%4), 32+Math.floor(pixel/4), 1, 1);
            rebuild();
        });
    }
}
wireElement("ear-mode", 1);
wireElement("ear-anchor", 2);
wireElement("protrusions", 3);
wireElement("tail-mode", 4);
wireElement("tail-segments", -1);
wireElement("tail-bend-0", -1);
wireElement("unlock-angles", -1);
wireElement("snout", -1);
wireElement("chest", -1);
wireElement("wings-mode", 8);
wireElement("wing-upload", -1);
wireElement("wing-anim", 9);
wireElement("cape-enabled", -1);
wireElement("cape-upload", -1);
async function updateSkin() {
    buttonSampleSkin.classList.remove("btn-light")
    buttonSampleEars.classList.remove("btn-light")
    usingSample = false;
    usingSampleWing = false;
    usingSampleCape = false;
    let files = $("#skin-upload").files;
    if (!files || files.length == 0) return;
    let file = files[0];
    document.body.classList.add("loading");
    try {
        let bitmap = await createImageBitmap(file);
        if (bitmap.width != 64) {
            alert("This doesn't look like a Minecraft skin; the width is wrong. Needs to be 64px.");
            $("#skin-upload").value = null;
            return;
        }
        if (bitmap.height != 64 && bitmap.height != 32) {
            alert("This doesn't look like a Minecraft skin; the height is wrong. Needs to be 64px or 32px.");
            $("#skin-upload").value = null;
            return;
        }
        let ctx = $("#skin").getContext("2d");
        ctx.clearRect(0, 0, 64, 64);
        ctx.drawImage(bitmap, 0, 0);
        if (bitmap.height == 32) {
            console.log("Converting legacy skin.");
            drawImage(ctx, bitmap, 24, 48, 20, 52, 4, 16, 8, 20, null);
            drawImage(ctx, bitmap, 28, 48, 24, 52, 8, 16, 12, 20, null);
            drawImage(ctx, bitmap, 20, 52, 16, 64, 8, 20, 12, 32, null);
            drawImage(ctx, bitmap, 24, 52, 20, 64, 4, 20, 8, 32, null);
            drawImage(ctx, bitmap, 28, 52, 24, 64, 0, 20, 4, 32, null);
            drawImage(ctx, bitmap, 32, 52, 28, 64, 12, 20, 16, 32, null);
            drawImage(ctx, bitmap, 40, 48, 36, 52, 44, 16, 48, 20, null);
            drawImage(ctx, bitmap, 44, 48, 40, 52, 48, 16, 52, 20, null);
            drawImage(ctx, bitmap, 36, 52, 32, 64, 48, 20, 52, 32, null);
            drawImage(ctx, bitmap, 40, 52, 36, 64, 44, 20, 48, 32, null);
            drawImage(ctx, bitmap, 44, 52, 40, 64, 40, 20, 44, 32, null);
            drawImage(ctx, bitmap, 48, 52, 44, 64, 52, 20, 56, 32, null);
        }
        let earsEnabled = false;
        let earsData = new DataView(ctx.getImageData(0, 32, 4, 4).data.buffer);
        if (magicPixels[earsData.getUint32(0)] === "blue") {
            earsEnabled = true;
            earsElements.forEach((e) => {
                let ele = e.ele;
                ele.disabled = false;
                if (e.pixel !== -1) {
                    let magic = magicPixels[String(earsData.getUint32(e.pixel*4))];
                    if (ele.nodeName === "SELECT") {
                        let valid = false;
                        ele.querySelectorAll("option").forEach((opt) => {
                            if (opt.value === magic) {
                                valid = true;
                            }
                        });
                        if (valid) {
                            ele.value = magic;
                        } else {
                            ele.selectedIndex = 0;
                        }
                    } else if (ele.nodeName === "INPUT") {

                    }
                }
            });
            let tailBend = earsData.getUint32(5*4);
            let tailBend0 = decodeDegrees(255-(tailBend&0x000000FF));
            let tailBend1 = 0;
            let tailBend2 = 0;
            let tailBend3 = 0;
            if (magicPixels[tailBend] !== "blue") {
                tailBend1 = decodeDegrees((tailBend&0xFF000000) >> 24);
                tailBend2 = decodeDegrees((tailBend&0x00FF0000) >> 16);
                tailBend3 = decodeDegrees((tailBend&0x0000FF00) >> 8);
            }
            $("#tail-bend-0").value = tailBend0;
            $("#tail-bend-0-angle").textContent = renderDegrees(tailBend0);
            for (let i = 1; i <= 3; i++) {
                $("#tail-bend-"+i).disabled = true;
                $("#tail-bend-"+i+"-angle").textContent = "0°";
            }
            let tailSegments = 1;
            if (tailBend1 != 0) {
                tailSegments++;
                $("#tail-bend-1").disabled = false;
                $("#tail-bend-1-angle").textContent = renderDegrees(tailBend1);
                if (tailBend2 != 0) {
                    tailSegments++;
                    $("#tail-bend-2").disabled = false;
                    $("#tail-bend-2-angle").textContent = renderDegrees(tailBend2);
                    if (tailBend3 != 0) {
                        tailSegments++;
                        $("#tail-bend-3").disabled = false;
                        $("#tail-bend-3-angle").textContent = renderDegrees(tailBend3);
                    }
                }
            }
            $("#tail-segments").value = tailSegments;
            $("#tail-bend-1").value = tailBend1;
            $("#tail-bend-2").value = tailBend2;
            $("#tail-bend-3").value = tailBend3;
            let snout = earsData.getUint32(6*4);
            let etc = earsData.getUint32(7*4);
            let snoutOffset = 0;
            let snoutWidth = 0;
            let snoutHeight = 0;
            let snoutDepth = 0;
            if (magicPixels[snout] !== "blue") {
                snoutOffset = ((etc>>16)&0xFF);
                snoutWidth = ((snout>>24)&0xFF);
                snoutHeight = ((snout>>16)&0xFF);
                snoutDepth = ((snout>>8)&0xFF);
                if (snoutOffset > 8-snoutHeight) snoutOffset = 8-snoutHeight;
                if (snoutWidth > 7) snoutWidth = 7;
                if (snoutHeight > 4) snoutHeight = 4;
                if (snoutDepth > 6) snoutDepth = 6;
            }
            if (snoutWidth !== 0 && snoutHeight !== 0 && snoutDepth !== 0) {
                $("#snout").checked = true;
                $("#snout-size").style.visibility = "visible";
                $("#snout-width").disabled = false;
                $("#snout-width").value = snoutWidth;
                $("#snout-width-value").textContent = snoutWidth;
                $("#snout-height").disabled = false;
                $("#snout-height").value = snoutHeight;
                $("#snout-height-value").textContent = snoutHeight;
                $("#snout-depth").disabled = false;
                $("#snout-depth").value = snoutDepth;
                $("#snout-depth-value").textContent = snoutDepth;
                $("#snout-offset").disabled = false;
                $("#snout-offset").value = snoutOffset;
                $("#snout-offset-value").textContent = snoutOffset;
            } else {
                $("#snout").checked = false;
                $("#snout-size").style.visibility = "hidden";
                $("#snout-width").disabled = true;
                $("#snout-height").disabled = true;
                $("#snout-depth").disabled = true;
                $("#snout-offset").disabled = true;
            }
            let chestSize = 0;
            if (magicPixels[etc] !== "blue") {
                chestSize = ((etc>>24)&0xFF)/128;
                if (chestSize > 1) chestSize = 1;
            }
            if (chestSize > 0) {
                $("#chest-outer").style.display = "table-row";
                $("#chest").checked = true;
                $("#chest-size").disabled = false;
                $("#chest-size").value = (chestSize*128)|0;
            } else {
                /*$("#chest-outer").style.display = "none";*/
                $("#chest").checked = false;
                $("#chest-size").disabled = true;
            }
        } else {
            earsElements.forEach((e) => {
                e.disabled = true;
            });
        }
        $("#ears-enabled").checked = earsEnabled;
        rebuildQuads();
        if (alfalfaData.wing) {
            $("#wing-upload").value = null;
            await copyFromAlfalfa("wing", "#wings");
        }
        if (alfalfaData.cape) {
            $("#cape-upload").value = null;
            await copyFromAlfalfa("cape", "#cape");
        }
        await rebuild();
    } finally {
        $("#skin-upload").value = null;
        document.body.classList.remove("loading");
    }
}

async function getSkinFromUserName(username) {
    const errorToast = bootstrap.Toast.getOrCreateInstance($("#error-toast"));
    let errorToastText = $("#error-toast-text");
    let spinner = $("#spinner-loading-skin");
    let button = $("#nickname-skin-get");
    button.disabled = true;
    spinner.hidden = false;
    let id = null;
    try {
        await fetch("https://playerdb.co/api/player/minecraft/" + username)
            .then(res => res.json())
            .then(json => {
                if (json.success === false) throw new Error("Failed to fetch player data from playerdb.co");
                id = json.data.player.id;
            });
    } catch (e) {
        spinner.hidden = true;
        button.disabled = false;
        errorToast.show();
        errorToastText.textContent = e.toString();
        console.error(e);
        return;
    }

    let skinUrl = "https://visage.surgeplay.com/skin/" + id;
    try {
        let res = await fetch(skinUrl);
        if (!res.ok) throw new Error("Failed to fetch skin from " + skinUrl);
        let blob = await res.blob();
        let file = new File([blob], "skin.png");
        let dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        $("#skin-upload").files = dataTransfer.files;
        updateSkin();
    } catch (e) {
        errorToastText.textContent = e.toString();
        errorToast.show();
        console.error(e);
    }
    spinner.hidden = true;
    button.disabled = false;
}

async function getSkinFromHash() {
    let input = $("#skin-upload");
    let hash = window.location.hash.slice(1);
    let params = hash.split(',').reduce((params, param) => {
        let [key, value] = param.split('=');
        return Object.assign(params, { [key]: value });
    }, {});
    if (input.files.length > 0 || !params["username"] && !params["id"]) return;
    let id = (params["id"] || null);
    if (!id && params["username"]) {
        try {
            await fetch("https://playerdb.co/api/player/minecraft/" + params["username"])
                .then(res => res.json())
                .then(json => {
                    if (json.success === false) throw new Error("Failed to fetch player data from playerdb.co");
                    id = json.data.player.id;
                });
        } catch (e) {
            console.error(e);
            return;
        }
    }
    let skinUrl = "https://visage.surgeplay.com/skin/" + id;
    try {
        let res = await fetch(skinUrl);
        if (!res.ok) throw new Error("Failed to fetch skin from " + skinUrl);
        let blob = await res.blob();
        let file = new File([blob], "skin.png");
        let dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        updateSkin();
    }
    catch (e) {
        console.error(e);
        return;
    }
}

function copyFromAlfalfa(id, sel) {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = () => {
            let canvas = $(sel);
            let ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, -(canvas.height-img.height)/2, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
            resolve();
        };
        img.onerror = reject;
        img.src = 'data:image/png;base64,'+btoa(alfalfaData[id]);
    });
}

async function updateWing() {
    usingSampleWing = false;
    let files = $("#wing-upload").files;
    if (!files || files.length == 0) return;
    let file = files[0];
    document.body.classList.add("loading");
    try {
        let bitmap = await createImageBitmap(file);
        if (bitmap.width != 12 && bitmap.width != 20) {
            alert("This doesn't look like an Ears wing; the width is wrong. Needs to be 12px or 20px.");
            $("#wing-upload").value = null;
            return;
        }
        if (bitmap.height != 12 && bitmap.height != 16) {
            alert("This doesn't look like an Ears wing; the height is wrong. Needs to be 12px or 16px.");
            $("#wing-upload").value = null;
            return;
        }
        let ctx = $("#wings").getContext("2d");
        ctx.clearRect(0, 0, 20, 16);
        ctx.drawImage(bitmap, 0, bitmap.height == 12 ? 2 : 0);
        encodeToAlfalfa("wing", "#wings");
        await rebuild();
    } finally {
        $("#wing-upload").value = null;
        document.body.classList.remove("loading");
    }
}
async function updateCape(enc) {
    usingSampleCape = false;
    let files = $("#cape-upload").files;
    if (!files || files.length == 0) return;
    let file = files[0];
    document.body.classList.add("loading");
    try {
        let bitmap = await createImageBitmap(file);
        if (!((bitmap.width === 20 && bitmap.height === 16) || (bitmap.width === 64 && bitmap.height === 32))) {
            alert("This doesn't look like an Ears cape or Mojang cape; the size is wrong. Needs to be 20x16 (Ears) or 64x32 (Mojang).");
            $("#cape-upload").value = null;
            return;
        }
        let ctx = $("#cape").getContext("2d");
        ctx.clearRect(0, 0, 20, 16);
        if (bitmap.height == 32) {
            console.log("Converting Mojang cape.");
            ctx.drawImage(bitmap, 1, 1, 10, 16, 0, 0, 10, 16);
            ctx.drawImage(bitmap, 12, 1, 10, 16, 10, 0, 10, 16);
        } else {
            ctx.drawImage(bitmap, 0, 0);
        }
        if (enc) {
            encodeToAlfalfa("cape", "#cape");
        }
        await rebuild();
    } finally {
        $("#cape-upload").value = null;
        document.body.classList.remove("loading");
    }
}
function encodeToAlfalfa(id, sel) {
    if (!window.alfalfaData || !window.alfalfaData.version) {
        window.alfalfaData = {version:1};
    }
    let data = $(sel).toDataURL('image/png');
    window.alfalfaData[id] = atob(data.substr(data.indexOf(',')+1));
    encodeAlfalfa();
}
$("#ears-enabled").addEventListener('input', () => {
    toggleEarsEnabled()
});

function rebuildSampleSkin() {
    return new Promise((resolve, reject) => {
        let img = new Image();
        img.onload = async () => {
            let ctx = $("#skin").getContext("2d");
            if (!samplePreservesBase) {
                ctx.clearRect(4, 0, 60, 64);
                ctx.clearRect(0, 0, 4, 32);
                ctx.clearRect(0, 36, 4, 28);
                ctx.drawImage(img, 0, 0, 64, 64, 0, 0, 64, 64);
                let slim = $("#slim-enabled").checked;
                ctx.drawImage(img, slim ? 128 : 64, 0, 64, 64, 0, 0, 64, 64);
                if (!$("#head2-enabled").checked) {
                    ctx.clearRect(32, 0, 32, 16);
                }
                if (!$("#torso2-enabled").checked) {
                    ctx.clearRect(16, 32, 24, 16);
                }
                if (!$("#left_arm2-enabled").checked) {
                    ctx.clearRect(48, 48, 16, 16);
                }
                if (!$("#right_arm2-enabled").checked) {
                    ctx.clearRect(40, 32, 16, 16);
                }
                if (!$("#left_leg2-enabled").checked) {
                    ctx.clearRect(0, 48, 16, 16);
                }
                if (!$("#right_leg2-enabled").checked) {
                    ctx.clearRect(4, 32, 12, 16);
                    ctx.clearRect(0, 36, 4, 12);
                }
            }
            let earMode = $("#ear-mode").value;
            if (earMode === "blue") {
                ctx.drawImage(img, 192, 0, 64, 64, 0, 0, 64, 64);
            } else if (earMode === "cyan") {
                ctx.drawImage(img, 0, 64, 64, 64, 0, 0, 64, 64);
            } else if (earMode === "green" || earMode == "purple" || earMode == "orange" || earMode == "pink" || earMode === "purple2") {
                ctx.drawImage(img, 64, 64, 64, 64, 0, 0, 64, 64);
            } else if (earMode === "white" || earMode === "gray") {
                ctx.drawImage(img, 128, 128, 64, 64, 0, 0, 64, 64);
            }
            if ($("#tail-mode").value !== "red") {
                ctx.drawImage(img, 0, 128, 64, 64, 0, 0, 64, 64);
            }
            let protrusions = $("#protrusions").value;
            if (protrusions === "cyan" || protrusions === "purple") {
                ctx.drawImage(img, 128, 64, 64, 64, 0, 0, 64, 64);
            }
            if (protrusions === "cyan" || protrusions === "green") {
                ctx.drawImage(img, 192, 64, 64, 64, 0, 0, 64, 64);
            }
            if ($("#snout").checked) {
                let width = Number($("#snout-width").value);
                let height = Number($("#snout-height").value);
                let depth = Number($("#snout-depth").value);
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(0, 0, width, 1);
                ctx.fillStyle = '#FFAA00';
                ctx.fillRect(0, 1, width, 1);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 2, width, height);
                ctx.fillStyle = '#FF00FF';
                ctx.fillRect(0, 2+height, width, 1);
                ctx.fillStyle = '#00FFFF';
                ctx.fillRect(0, 2+height+1, width, 1);
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(7, 0, 1, height);
                ctx.fillStyle = '#0000FF';
                ctx.fillRect(7, 4, 1, height);
                ctx.fillStyle = '#FFFFFF';
            }
            if ($("#chest").checked) {
                ctx.drawImage(img, 64, 128, 64, 64, 0, 0, 64, 64);
            }
            if (usingSampleWing) {
                let wingsCtx = $("#wings").getContext("2d");
                wingsCtx.clearRect(0, 0, 20, 16);
                let wingsMode = $("#wings-mode").value;
                if (wingsMode !== "red" && wingsMode !== "blue") {
                    wingsCtx.drawImage(img, 32, 192, 20, 16, 0, 0, 20, 16);
                    encodeToAlfalfa("wing", "#wings");
                } else {
                    delete window.alfalfaData.wing;
                    if (Object.keys(window.alfalfaData).length === 1) {
                        window.alfalfaData.version = 0;
                    }
                    encodeAlfalfa();
                }
            } else {
                encodeToAlfalfa("wing", "#wings");
            }
            if (usingSampleCape) {
                let capeCtx = $("#cape").getContext("2d");
                capeCtx.clearRect(0, 0, 20, 16);
                let capeEnabled = $("#cape-enabled").checked;
                if (capeEnabled) {
                    capeCtx.drawImage(img, 12, 192, 20, 16, 0, 0, 20, 16);
                    encodeToAlfalfa("cape", "#cape");
                } else {
                    delete window.alfalfaData.cape;
                    if (Object.keys(window.alfalfaData).length === 1) {
                        window.alfalfaData.version = 0;
                    }
                    encodeAlfalfa();
                }
            } else {
                encodeToAlfalfa("cape", "#cape");
            }
            resolve();
        };
        img.onerror = reject;
        img.src = 'resources/sample_skin_atlas.png';
    });
}

function randomUUID() {
    return randhex(8) + "-" + randhex(4) + "-4" + randhex(3) + "-" + choice(["8", "9", "a", "b"]) + randhex(3) + "-" + randhex(12);
}

function generateElement(name, box_uv, from, to, autouv, color, origin, faces) {
    return {
        name: name,
        box_uv: box_uv,
        rescale: false,
        locked: false,
        from: from,
        to: to,
        autouv: autouv,
        color: color,
        origin: origin,
        faces: faces,
        type: "cube",
        uuid: randomUUID()
    };
}

function generateFace(uv, texture) {
    let face = {
        uv: uv,
        texture: texture
    };
}

function exportBbmodel() {
    let model = {
        meta: {
            format_version: "4.5",
            model_format: "free",
            box_uv: true
        },
        name: "Ears Manipulator Export",
        model_identifier: "",
        visible_box: [ 1, 1, 0 ],
        variable_placeholders: "",
        variable_placeholder_buttons: [],
        timeline_setups: [],
        unhandled_root_fields: {},
        resolution: {
            width: 64,
            height: 64
        },
        elements: [],
        outliner: [],
        textures: [],
    };

    let head = generateElement(
        "Head", true,
        [-4, 24, -4], [4, 32, 4],
        0, 0
    )
    console.log(model)
}

let scratchTarr = new Uint32Array(1);
function choice(arr) {
    crypto.getRandomValues(scratchTarr);
    return arr[Math.floor(scratchTarr[0]%arr.length)]
}
function randhex(count) {
    crypto.getRandomValues(scratchTarr);
    return ("00000000"+scratchTarr[0].toString(16)).slice(-count);
}
buttonSampleSkin.addEventListener('click', () => {
    buttonSampleEars.classList.remove("btn-light")
    buttonSampleSkin.classList.remove("btn-light")
    buttonSampleSkin.classList.add("btn-light")
    $("#ears-enabled").checked = true;
    samplePreservesBase = false;
    usingSample = true;
    usingSampleWing = true;
    usingSampleCape = true;
    toggleEarsEnabled();
});
buttonSampleEars.addEventListener('click', () => {
    $("#sample").classList.remove("btn-light")
    buttonSampleEars.classList.remove("btn-light")
    buttonSampleEars.classList.add("btn-light")
    $("#ears-enabled").checked = true;
    samplePreservesBase = true;
    usingSample = true;
    usingSampleWing = true;
    usingSampleCape = true;
    toggleEarsEnabled();
});
$("#slim-enabled").addEventListener("change", (e) => {
    rebuild();
});
$("#torso2-enabled").addEventListener("change", (e) => {
    rebuild();
});
["head", "torso", "left_arm", "right_arm", "left_leg", "right_leg"].forEach((n) => {
    $("#"+n+"2-enabled").addEventListener("change", (e) => {
        if (usingSample) rebuild();
    });
});
function updateTailBendPixel() {
    let ctx = $("#skin").getContext("2d");
    let scratch = ctx.createImageData(1, 1);
    let segs = $("#tail-segments").value;
    for (let i = 0; i < segs; i++) {
        let v = encodeDegrees(tailBends[i].value, i == 0);
        if (i > 0) {
            scratch.data[i-1] = (v&0xFF);
        } else {
            let a = (255-v)&0xFF;
            if (a < 0) a = 1;
            scratch.data[3] = a;
        }
    }
    ctx.putImageData(scratch, 1, 33);
    rebuild();
}
$("#unlock-angles").addEventListener("input", () => {
    let en = $("#unlock-angles").checked;
    tailBends.forEach((e) => {
        e.step = en ? 1 : 15;
    });
});
$("#tail-segments").addEventListener("input", () => {
    let en = $("#ears-enabled").checked;
    tailBends.forEach((e, i) => {
        if (en) {
            e.disabled = $("#tail-segments").value <= i;
            if (!e.disabled) {
                tailBendAngles[i].textContent = renderDegrees(e.value);
            } else {
                tailBendAngles[i].textContent = "0°";
            }
        } else {
            e.disabled = true;
            tailBendAngles[i].textContent = "0°";
        }
    });
    updateTailBendPixel();
});
tailBends.forEach((e, i) => {
    e.addEventListener("input", () => {
        tailBendAngles[i].textContent = renderDegrees(e.value);
        updateTailBendPixel();
    });
});
$("#snout").addEventListener('input', () => {
    let en = $("#snout").checked;
    $("#snout-width").disabled = !en;
    $("#snout-height").disabled = !en;
    $("#snout-depth").disabled = !en;
    $("#snout-offset").disabled = !en;
    $("#snout-size").style.visibility = en ? "visible" : "hidden";
    updateSnoutAndEtcPixel();
});
['width', 'height', 'depth', 'offset'].forEach((n) => {
    $("#snout-"+n).addEventListener('input', () => {
        $("#snout-"+n+"-value").textContent = $("#snout-"+n).value;
        updateSnoutAndEtcPixel();
    });
});
function updateSnoutAndEtcPixel() {
    let ctx = $("#skin").getContext("2d");
    let scratch = ctx.createImageData(2, 1);
    let en = $("#snout").checked;
    let width = en ? $("#snout-width").value : 0;
    let height = en ? $("#snout-height").value : 0;
    let depth = en ? $("#snout-depth").value : 0;
    $("#snout-offset").max = 8-height;
    let offset = en ? $("#snout-offset").value : 0;
    if (offset > 8-height) offset = 8-height;
    scratch.data[0] = width;
    scratch.data[1] = height;
    scratch.data[2] = depth;
    scratch.data[3] = 255;
    scratch.data[4] = $("#chest").checked ? $("#chest-size").value : 0;
    scratch.data[5] = offset;
    scratch.data[6] = ($("#cape-enabled").checked ? 16 : 0);
    scratch.data[7] = 255;
    ctx.putImageData(scratch, 2, 33);
    rebuild();
}

$("#nickname-skin-get").addEventListener('click', () => {
    let nickname = $("#nickname").value;
    if (nickname.length === 0) {
        return
    }

    $("#cape").getContext('2d').clearRect(0, 0, 20, 16);
    $("#wings").getContext('2d').clearRect(0, 0, 20, 16);
    window.alfalfaData = {version:0};
    encodeAlfalfa();

    getSkinFromUserName(nickname);
})
$("#chest").addEventListener('input', () => {
    let en = $("#chest").checked;
    $("#chest-size").disabled = !en;
    updateSnoutAndEtcPixel();
    rebuild();
});
$("#chest-size").addEventListener('input', () => {
    let ctx = $("#skin").getContext("2d");
    updateSnoutAndEtcPixel();
    rebuild();
});
$("#cape-enabled").addEventListener('input', () => {
    if (!$("#cape-enabled").checked) {
        delete window.alfalfaData.cape
        encodeAlfalfa();
    } else {
        updateCape(true);
        encodeToAlfalfa("cape", "#cape");
    }
    updateSnoutAndEtcPixel();
    rebuild();
});
$("#skin-upload").addEventListener('change', () => updateSkin());
$("#wing-upload").addEventListener('change', () => updateWing());
$("#remove-wing").addEventListener('click', () => {
    $("#wings").getContext('2d').clearRect(0, 0, 20, 16);
    delete window.alfalfaData.wing;
    encodeAlfalfa();
    rebuild();
});
$("#cape-upload").addEventListener('change', () => {
    if ($("#cape-enabled").checked) {
        updateCape(true);
        encodeToAlfalfa("cape", "#cape");
    } else {
        updateCape(false);
    }
});
$("#remove-alfalfa").addEventListener('click', () => {
    if (usingSample && !usingSampleWing) {
        usingSampleWing = true;
    }
    if (usingSample && !usingSampleCape) {
        usingSampleCape = true;
    }
    $("#wings").getContext('2d').clearRect(0, 0, 20, 16);
    $("#cape").getContext('2d').clearRect(0, 0, 20, 16);
    window.alfalfaData = {version:0};
    encodeAlfalfa();
    rebuild();
});
window.addEventListener("resize", () => updateDpr());
updateDpr();
updateSkin();
getSkinFromHash();

if (WEBGL.isWebGLAvailable()) {
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(45, (window.innerWidth / 2)/window.innerHeight, 0.1, 1000);
    let renderer = new THREE.WebGLRenderer({
        powerPreference: "low-power",
        failIfMajorPerformanceCaveat: false,
        antialias: false
    });
    window.addEventListener("resize", () => {
        camera.aspect = (window.innerWidth / 2)/ window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth / 2, window.innerHeight, true);
        renderer.setPixelRatio(window.devicePixelRatio);
    });
    renderer.autoClear = true;
    renderer.setSize(window.innerWidth / 2, window.innerHeight, true);
    let dragging = false;
    var yaw = 45;
    var pitch = 15;
    var zoom = 65;
    $("#three").addEventListener("mousedown", (e) => {
        if (e.button === 0) {
            e.preventDefault();
            dragging = true;
        }
    });
    $("#three").addEventListener("mousemove", (e) => {
        if (e.button === 0) {
            e.preventDefault();
            if (dragging) {
                yaw = (yaw+e.movementX)%360;
                pitch = pitch+e.movementY;
                if (pitch < -89) pitch = -89;
                if (pitch > 89) pitch = 89;
            }
        }
    });
    $("#three").addEventListener("mouseup", (e) => {
        if (e.button === 0) {
            e.preventDefault();
            dragging = false;
        }
    });
    $("#three").addEventListener("wheel", (e) => {
        e.preventDefault();
        zoom += e.deltaY/8;
        if (zoom < 10) zoom = 10;
        if (zoom > 120) zoom = 120;
    });
    $("#three").appendChild(renderer.domElement);

    let skinTex = new THREE.CanvasTexture(
        $("#skin"), THREE.UVMapping,
        THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
        THREE.NearestFilter, THREE.NearestFilter);

    let wingsTex = new THREE.CanvasTexture(
        $("#wings"), THREE.UVMapping,
        THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
        THREE.NearestFilter, THREE.NearestFilter);

    let capeTex = new THREE.CanvasTexture(
        $("#cape"), THREE.UVMapping,
        THREE.ClampToEdgeWrapping, THREE.ClampToEdgeWrapping,
        THREE.NearestFilter, THREE.NearestFilter);

    let textures = {
        skin: skinTex,
        wing: wingsTex,
        cape: capeTex
    }

    let mat = new THREE.MeshLambertMaterial({
        reflectivity: -1,
        flatShading: true,
        fog: false,
        refractionRatio: 0,
        color: 0xFFFFFF,
        map: skinTex
    });
    let matOverlay = new THREE.MeshLambertMaterial({
        reflectivity: -1,
        flatShading: true,
        fog: false,
        refractionRatio: 0,
        color: 0xFFFFFF,
        map: skinTex,
        blending: THREE.NormalBlending,
        side: THREE.DoubleSide,
        alphaTest: 0.1,
        transparent: true
    });

    let earsMatParams = {
        reflectivity: -1,
        flatShading: true,
        fog: false,
        refractionRatio: 0,
        color: 0xFFFFFF,
        blending: THREE.NormalBlending,
        alphaTest: 0.1,
        transparent: true
    };

    let uvDiv = 64;

    function makeUVs(minU, minV, maxU, maxV) {
        return [
            new THREE.Vector2(minU/uvDiv, 1-maxV/uvDiv),
            new THREE.Vector2(maxU/uvDiv, 1-maxV/uvDiv),
            new THREE.Vector2(maxU/uvDiv, 1-minV/uvDiv),
            new THREE.Vector2(minU/uvDiv, 1-minV/uvDiv)
        ];
    }

    let meshes = {};

    function bodyPart(name, x, y, z, w, h, d, u, v, overlay, rotX, rotY, rotZ) {
        let grow = overlay ? name === "head2" ? 0.5 : 0.25 : 0;

        let top = makeUVs(u+d, v, u+d+w, v+d);
        let bottom = makeUVs(u+d+w, v, u+d+w+w, v+d);
        let left = makeUVs(u, v+d, u+d, v+d+h);
        let front = makeUVs(u+d, v+d, u+d+w, v+d+h);
        let right = makeUVs(u+d+w, v+d, u+d+w+d, v+d+h);
        let back = makeUVs(u+d+w+d, v+d, u+d+w+d+w, v+d+h);
        let geom = new THREE.BoxGeometry((w+(grow*2)), (h+(grow*2)), (d+(grow*2)));
        geom.faceVertexUvs[0] = [
            [right[3], right[0], right[2]],
            [right[0], right[1], right[2]],
            [left[3], left[0], left[2]],
            [left[0], left[1], left[2]],
            [top[3], top[0], top[2]],
            [top[0], top[1], top[2]],
            [bottom[0], bottom[3], bottom[1]],
            [bottom[3], bottom[2], bottom[1]],
            [front[3], front[0], front[2]],
            [front[0], front[1], front[2]],
            [back[3], back[0], back[2]],
            [back[0], back[1], back[2]]
        ];
        let mesh = new THREE.Mesh(geom, overlay ? matOverlay : mat);
        mesh.renderOrder = overlay ? 1 : 0;
        mesh.position.set(x, y, z);
        if (rotX || rotY || rotZ) {
            mesh.rotation.set(THREE.Math.degToRad(rotX), THREE.Math.degToRad(rotY), THREE.Math.degToRad(rotZ));
        }
        meshes[name] = mesh;
        return mesh;
    }

    function addToScene(m) {
        scene.add(m);
    }

    addToScene(bodyPart("head",
        0, 10, 0, 8, 8, 8, 0, 0, false, 0, 20, 0));
    addToScene(bodyPart("head2",
        0, 10, 0, 8, 8, 8, 32, 0, true, 0, 20, 0));

    addToScene(bodyPart("torso",
        0, 0, 0, 8, 12, 4, 16, 16, false));
    addToScene(bodyPart("torso2",
        0, 0, 0, 8, 12, 4, 16, 32, true));

    function addArms() {
        var isSlim = $("#slim-enabled").checked
        var armX = isSlim ? 5.5 : 6;
        var armWidth = isSlim ? 3 : 4;

        addToScene(bodyPart("right_arm",
            -armX, 0, 1, armWidth, 12, 4, 40, 16, false, -10, 0, 0));
        addToScene(bodyPart("right_arm2",
            -armX, 0, 1, armWidth, 12, 4, 40, 32, true, -10, 0, 0));

        addToScene(bodyPart("left_arm",
            armX, 0, -1, armWidth, 12, 4, 32, 48, false, 10, 0, 0));
        addToScene(bodyPart("left_arm2",
            armX, 0, -1, armWidth, 12, 4, 48, 48, true, 10, 0, 0));
    }

    addArms();

    addToScene(bodyPart("right_leg",
        -2, -12, 0,
        4, 12, 4,
        0, 16,
        false,
        0, 0, 0));
    addToScene(bodyPart("right_leg2",
        -2, -12, 0,
        4, 12, 4,
        0, 32,
        true,
        0, 0, 0));

    addToScene(bodyPart("left_leg",
        2, -12, 0,
        4, 12, 4,
        16, 48,
        false,
        0, 0, 0));
    addToScene(bodyPart("left_leg2",
        2, -12, 0,
        4, 12, 4,
        0, 48,
        true,
        0, 0, 0));

    $("#slim-enabled").addEventListener("change", (e) => {
        scene.remove(meshes["left_arm"]);
        scene.remove(meshes["left_arm2"]);
        scene.remove(meshes["right_arm"]);
        scene.remove(meshes["right_arm2"]);
        addArms();
        rebuildQuads();
        if (rebuildGeom) rebuildGeom();
    });

    function convertUV(arr) {
        return new THREE.Vector2(arr[0], 1-arr[1]);
    }

    let earsMeshes = [];
    rebuildGeom = function() {
        earsMeshes.forEach((mesh) => {
            scene.remove(mesh);
        });
        earsMeshes = [];
        renderObjects.forEach((o) => {
            let mat = new THREE.Matrix4().makeScale(1, 1, -1);
            o.moves.forEach((m) => {
                if (m.type === "anchor") {
                    let tgt = meshes[m.part];
                    if (!tgt) {
                        console.warn("Unknown body part "+m.part+" while processing render object move", m);
                        return;
                    }
                    mat.multiply(new THREE.Matrix4().makeTranslation(tgt.position.x, tgt.position.y, tgt.position.z));
                    mat.multiply(new THREE.Matrix4().makeRotationZ(-tgt.rotation.z));
                    mat.multiply(new THREE.Matrix4().makeRotationY(-tgt.rotation.y));
                    mat.multiply(new THREE.Matrix4().makeRotationX(-tgt.rotation.x));
                    mat.multiply(new THREE.Matrix4().makeTranslation(-tgt.geometry.parameters.width/2, -tgt.geometry.parameters.height/2, -tgt.geometry.parameters.depth/2));
                } else if (m.type === "translate") {
                    mat.multiply(new THREE.Matrix4().makeTranslation(m.x, -m.y, m.z));
                } else if (m.type === "scale") {
                    mat.multiply(new THREE.Matrix4().makeScale(m.x, m.y, m.z));
                } else if (m.type === "rotate") {
                    mat.multiply(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(-m.x, m.y, -m.z), THREE.Math.degToRad(m.ang)));
                } else {
                    console.warn("Unknown type "+m.type+" while processing render object move", m);
                }
            });
            if (o.type === "quad") {
                let geom = new THREE.PlaneGeometry(o.width, o.height);
                geom.faceVertexUvs[0] = [
                    [convertUV(o.uvs[3]), convertUV(o.uvs[0]), convertUV(o.uvs[2])],
                    [convertUV(o.uvs[0]), convertUV(o.uvs[1]), convertUV(o.uvs[2])]
                ];
                geom.translate(o.width/2, -o.height/2, 0);
                geom.applyMatrix4(mat);
                geom.computeVertexNormals();
                let material = new THREE.MeshLambertMaterial({
                    ...earsMatParams,
                    side: o.back ? THREE.BackSide : THREE.FrontSide,
                    map: textures[o.texture]
                });
                let mesh = new THREE.Mesh(geom, material);
                mesh.renderOrder = 0;
                earsMeshes.push(mesh);
                scene.add(mesh);
            } else if (o.type === "point") {
                let geom = new THREE.Geometry();
                geom.vertices.push(new THREE.Vector3(0, 0, 0));
                geom.applyMatrix4(mat);
                let points = new THREE.Points(geom, new THREE.PointsMaterial({
                    color: o.color,
                    size: 2
                }));
                earsMeshes.push(points);
                scene.add(points);
            } else {
                console.warn("Unknown type "+o.type+" while processing render object", o);
            }
        });
    };
    rebuildGeom();

    // standard item lighting

    if (matchMedia("(prefers-color-scheme: light)").matches) {
        scene.add(new THREE.AmbientLight(new THREE.Color(0.5, 0.5, 0.5)));
    } else {
        scene.add(new THREE.AmbientLight(new THREE.Color(0.3, 0.3, 0.3)));
    }

    let light0 = new THREE.DirectionalLight(new THREE.Color(0.6, 0.6, 0.6), 1);
    light0.position.set(0.3, 1, -0.9);
    light0.position.normalize();
    scene.add(light0);
    let light1 = new THREE.DirectionalLight(new THREE.Color(0.6, 0.6, 0.6), 1);
    light1.position.set(-0.3, 1, 0.9);
    light1.position.normalize();
    scene.add(light1);

    let lastRender = performance.now();

    function render() {
        lastRender = performance.now();
        requestAnimationFrame(render);

        if (skinTexNeedsUpdate) {
            Object.values(textures).forEach((e) => e.needsUpdate = true);
            skinTexNeedsUpdate = false;
        }

        scene.background = new THREE.Color(getComputedStyle(document.body).backgroundColor);

        Object.entries(meshes).forEach(([name, mesh]) => {
            let ele = document.getElementById(name+"-enabled");
            if (ele) {
                mesh.visible = ele.checked;
            }
        });

        let pRot = Math.sin(THREE.Math.degToRad(pitch));
        let p = 1-Math.abs(pRot);
        camera.position.set(Math.cos(THREE.Math.degToRad(yaw))*p, pRot, Math.sin(THREE.Math.degToRad(yaw))*p);
        camera.position.normalize();
        camera.position.x *= zoom;
        camera.position.y *= zoom;
        camera.position.z *= zoom;
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        let earMode = $("#ear-mode").value;
        if ($("#ears-enabled").checked && (earMode === "gray" || earMode === "white")) {
            camera.position.y += 5;
        }

        renderer.render(scene, camera);
    }
    requestAnimationFrame(render);
} else {
    $("#three").appendChild(WEBGL.getWebGLErrorMessage());
}
