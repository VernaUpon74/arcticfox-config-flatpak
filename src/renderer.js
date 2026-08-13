import 'photonkit/dist/css/photon.css';
import './style.css';
import $ from 'jquery';
import Highcharts from 'highcharts';
import { ipc, getLocale, getAppVersion, readTextFile, resolveResourcePath, showError, openConfig, saveConfig } from './lib/tauri-bridge.js';

let config;
let lang;
let appVersion = '1.12.0';

ipc.on('connect', (event, status) => {
    $('#connection-status').html(_('Status.Device') + ' ' + (status ? _('Status.Connected') : _('Status.Disconnected')));
});

ipc.on('config', (event, data) => {
    config = data;
    uiUpdate();
});

ipc.on('piregchange', (event, data) => {
    config.profiles[activeProfile].PIRegulatorIsEnabled = data.PIRegulatorIsEnabled;
    config.profiles[activeProfile].PIRegulatorRange = data.PIRegulatorRange;
    config.profiles[activeProfile].PIRegulatorPValue = data.PIRegulatorPValue;
    config.profiles[activeProfile].PIRegulatorIValue = data.PIRegulatorIValue;
});

ipc.on('tfrchange', (event, data) => {
    config.TFRTables[data.index] = data.table;
    uiUpdate();
});

ipc.on('pcchange', (event, data) => {
    config.PowerCurves[data.index] = data.table;
    uiUpdate();
});

ipc.on('batchange', (event, data) => {
    config.CustomBatteryProfiles[data.index] = data.table;
});

let foxfirmware = '170909';

// DEVIATION: The original fork did not expose the per-profile Celsius/Fahrenheit
// selector (IsCelcius, bit 0x20 of Flags). We normalize it here so the UI checkbox
// works for configs loaded from the device or from older .afc files.
function normalizeConfig(cfg) {
    if (!cfg || !Array.isArray(cfg.profiles)) return cfg;
    cfg.profiles.forEach(profile => {
        if (typeof profile.IsCelcius !== 'boolean') {
            if (typeof profile.Flags === 'number') {
                profile.IsCelcius = Boolean(profile.Flags & 0x20);
            } else {
                profile.IsCelcius = false;
            }
        }
    });
    return cfg;
}

ipc.on('foxfirmware', (event, data) => {
    foxfirmware = data;
    $('[data-lang="Message.ConnectDevice"]').html(lang['Message.ConnectDevice'].replace('{0}', foxfirmware).replace(/\n/g, '<br>'));
});

let activeProfile;

function uiInitTabs() {
    $('.tab-group#main .tab-item').click(function () {
        $('.tab-group#main .tab-item').removeClass('active');
        $(this).addClass('active');
        const view = $(this).data('view');
        $('.view-container.view-main .view').hide();
        $('.view-container.view-main #view-' + view).show();
    });

    $('.tab-group#screen .tab-item').click(function () {
        $('.tab-group#screen .tab-item').removeClass('active');
        $(this).addClass('active');
        const view = $(this).data('view');
        $('.view-container.view-screen .subview').hide();
        $('.view-container.view-screen #view-' + view).show();
    });

    $('.tab-group#screen-layout .tab-item').click(function () {
        $('.tab-group#screen-layout .tab-item').removeClass('active');
        $(this).addClass('active');
        const view = $(this).data('view');
        $('.view-container.view-screen-layout .subsubview').hide();
        $('.view-container.view-screen-layout #view-' + view).show();
    });

    $('.tab-group#advanced .tab-item').click(function () {
        $('.tab-group#advanced .tab-item').removeClass('active');
        $(this).addClass('active');
        const view = $(this).data('view');
        $('.view-container.view-advanced .subview').hide();
        $('.view-container.view-advanced #view-' + view).show();
    });

    $('.tab-group#controls .tab-item').click(function () {
        $('.tab-group#controls .tab-item').removeClass('active');
        $(this).addClass('active');
        const view = $(this).data('view');
        $('.view-container.view-controls .subview').hide();
        $('.view-container.view-controls #view-' + view).show();
    });

    $('#profiles .tab-item').click(function () {
        const p = $(this).attr('id').replace('profile-', '');
        uiProfile(p);
    });

    $('.tab-item[data-view="profiles"]').addClass('active');
    $('#view-profiles').show();
}

function uiScreenLayoutView(skin) {
    // 96x16 displays use Classic (0) and Lite (1); Lite uses the Small layout tab.
    const isSmallDisplay = config && config.DisplaySize === 1;
    const names = isSmallDisplay
        ? ['classic', 'small']
        : ['classic', 'circle', 'foxy', 'small', 'medium'];
    const name = names[skin] || 'classic';
    $('.tab-group#screen-layout .tab-item').removeClass('active');
    $('[data-view="screen-layout-' + name + '"]').addClass('active');
    $('.view-container.view-screen-layout .subsubview').hide();
    $('.view-container.view-screen-layout #view-screen-layout-' + name).show();
}

// DEVIATION: The original fork had a fixed Classic/Circle/Foxy skin dropdown.
// For 96x16 displays ArcticFox uses value 1 for the "Lite" skin, so we repopulate
// the dropdown dynamically and relabel the Small layout tab accordingly.
function uiUpdateSkinOptions() {
    const $skin = $('#MainScreenSkin');
    const isSmallDisplay = config && config.DisplaySize === 1;
    $skin.empty();
    if (isSmallDisplay) {
        $skin.append('<option value="0" data-lang="Skin.Classic">' + _('Skin.Classic') + '</option>');
        $skin.append('<option value="1" data-lang="Skin.Lite">' + _('Skin.Lite') + '</option>');
    } else {
        $skin.append('<option value="0" data-lang="Skin.Classic">' + _('Skin.Classic') + '</option>');
        $skin.append('<option value="1" data-lang="Skin.Circle">' + _('Skin.Circle') + '</option>');
        $skin.append('<option value="2" data-lang="Skin.Foxy">' + _('Skin.Foxy') + '</option>');
    }

    // Show/hide layout tabs that don't apply to this display size.
    $('[data-view="screen-layout-circle"]').toggle(!isSmallDisplay);
    $('[data-view="screen-layout-foxy"]').toggle(!isSmallDisplay);
    $('[data-view="screen-layout-medium"]').toggle(!isSmallDisplay);
    const $smallTab = $('[data-view="screen-layout-small"]');
    if (isSmallDisplay) {
        $smallTab.show().attr('data-lang', 'Skin.Lite').html(_('Skin.Lite'));
    } else {
        $smallTab.hide();
    }
}

function uiPreheat(val) {
    switch (Number(val)) {
        case 0:
            $('.fox-curveonly').hide();
            $('.fox-notcurve').show();
            $('#preheatUnit').html('W');
            break;
        case 1:
            $('.fox-curveonly').hide();
            $('.fox-notcurve').show();
            $('#preheatUnit').html('%');
            break;
        case 2:
            $('.fox-curveonly').show();
            $('.fox-notcurve').hide();
            break;
    }
}

function uiTempControl(val) {
    if (val) {
        $('.fox-tconly').show();
    } else {
        $('.fox-tconly').hide();
    }
}

function uiTcr(material) {
    if (material === '4') {
        $('#TCR').show();
    } else {
        $('#TCR').hide();
    }
}

function uiInitChangeHandlers() {
    $('#mode').change(function () {
        uiTempControl($(this).val() === 'tc');
    });

    $('#PreheatType').change(function () {
        uiPreheat($(this).val());
    });

    $('#Material').change(function () {
        uiTcr($('#Material').val());
    });

    $('#MainScreenSkin').change(function () {
        uiScreenLayoutView($(this).val());
    });
}

function uiProfile(p) {
    activeProfile = p;
    $('#profiles .tab-item').removeClass('active');
    const $tab = $('#profiles #profile-' + p);
    $tab.addClass('active');

    $('.fox-pval').each(function () {
        const id = $(this).attr('id');
        const val = config.profiles[p][id];
        if ($(this).is('input')) {
            if ($(this).attr('type') === 'checkbox') {
                $(this).prop('checked', val);
            } else {
                $(this).val(val);
            }
        } else if ($(this).is('select')) {
            $(this).find('option[value="' + val + '"]').prop('selected', true);
        }
    });

    uiPreheat($('#PreheatType').val());
    uiTcr(config.profiles[p].Material);
    uiTempControl(config.profiles[p].Material !== 0);

    $('#mode option[value="' + (config.profiles[p].Material !== 0 ? 'tc' : 'vw') + '"]').prop('selected', true);
    if (config.profiles[p].Material === 4) {
        $('#TCR').show();
    } else {
        $('#TCR').hide();
    }
}

async function loadDefaultConfig() {
    try {
        const fp = await resolveResourcePath('default.afc.json');
        const text = await readTextFile(fp);
        return JSON.parse(text);
    } catch (err) {
        console.error('failed to load default config', err);
        showError('Error', 'Failed to load default configuration');
        return null;
    }
}

function uiInitButtons() {
    $('#tc-setup').click(function () {
        ipc.send('pireg', config.profiles[activeProfile]);
    });

    // Use event delegation for footer buttons; some WebKit/Tauri builds don't
    // fire directly-bound clicks on Photon toolbar buttons.
    $(document).on('click', '#download-settings', function () {
        ipc.send('download');
    });

    $(document).on('click', '#upload-settings', function () {
        window.uploadSettings();
    });

    $(document).on('click', '#reset-settings', async function () {
        config = await loadDefaultConfig();
        ipc.send('upload', config);
        uiUpdate();
    });

    $('#BatteryModel').change(function () {
        if ($(this).val() > 0) {
            $('#battery-edit').show();
        } else {
            $('#battery-edit').hide();
        }
    });

    $('#battery-edit').click(function () {
        const index = $('#BatteryModel').val() - 1;
        ipc.send('bat', { index, table: config.CustomBatteryProfiles[index] });
    });
}

function uiUpdate() {
    if (!config) {
        return;
    }
    normalizeConfig(config);

    $('#startscreen').hide();

    $('#ProductName').val(config.ProductName);

    uiUpdateSkinOptions();

    const $Material = $('#Material');
    const $MaterialTable = $('#table-material');
    $Material.html('');
    $MaterialTable.html('');
    $Material.append('<option value="1">Nickel 200</option>');
    $Material.append('<option value="2">Titanium 1</option>');
    $Material.append('<option value="3">SS 316</option>');
    $Material.append('<option value="4">TCR</option>');

    config.TFRTables.forEach((tfr, index) => {
        $Material.append('<option value="' + (index + 5) + '">[TFR] ' + tfr.Name + '</option>');
        $MaterialTable.append('<tr><td>' + tfr.Name + '</td><td><button class="tfr-button btn btn-default" data-tfr="' + index + '">Edit</button></td></tr>');
    });

    $('.tfr-button').click(function () {
        const index = $(this).data('tfr');
        ipc.send('tfr', { index, table: config.TFRTables[index] });
    });

    const $PowerTable = $('#table-power');
    $PowerTable.html('');
    Highcharts.setOptions({
        chart: {
            margin: [0, 0, 0, 0],
            style: {
                overflow: 'visible'
            }
        },
        title: {
            text: ''
        },
        credits: {
            enabled: false
        },
        legend: {
            enabled: false
        },
        xAxis: {
            labels: {
                enabled: false
            },
            tickLength: 0,
            min: 0,
            max: 8
        },
        yAxis: {
            title: {
                text: null
            },
            maxPadding: 0,
            minPadding: 0,
            gridLineWidth: 0,
            ticks: false,
            endOnTick: false,
            labels: {
                enabled: false
            },
            min: 0,
            max: 250
        },
        tooltip: {
            enabled: false
        },
        plotOptions: {
            series: {
                enableMouseTracking: false,
                lineWidth: 1,
                shadow: false,
                states: {
                    hover: {
                        lineWidth: 1
                    }
                },
                marker: {
                    enabled: false
                }
            }
        }
    });

    config.PowerCurves.forEach((pc, index) => {
        $PowerTable.append('<tr><td style="width: 80px;">' + pc.Name + '</td><td style="width: 160px;"><div class="sparkline" id="pc' + index + '"></div></td><td><button class="power-button btn btn-default" data-pc="' + index + '">Edit</button></td></tr>');
        const data = [];
        pc.Points.forEach(p => {
            data.push({ x: p.Time, y: p.Percent });
        });
        new Highcharts.Chart({
            chart: {
                renderTo: 'pc' + index,
            },
            series: [{
                fillColor: 'rgba(124, 181, 236, 0.3)',
                type: 'area',
                name: pc.Name,
                data
            }]
        });
    });

    $('.power-button').click(function () {
        const index = $(this).data('pc');
        ipc.send('pc', { index, table: config.PowerCurves[index] });
    });

    const $SelectedCurve = $('#SelectedCurve');
    $SelectedCurve.html('');
    config.PowerCurves.forEach((pc, index) => {
        $SelectedCurve.append('<option value="' + index + '">' + pc.Name + '</option>');
    });

    $('.fox-val').each(function () {
        const id = $(this).attr('id');
        let val = config[id];

        if (id === 'HardwareVersion') {
            val = Number(val).toFixed(2);
        }

        if ($(this).is('input')) {
            if ($(this).attr('type') === 'checkbox') {
                $(this).prop('checked', val);
            } else {
                $(this).val(val);
            }
        } else if ($(this).is('select')) {
            $(this).find('option[value="' + val + '"]').prop('selected', true);
        }
    });

    uiScreenLayoutView(config.MainScreenSkin);
    uiProfile(config.SelectedProfile);
}

async function uiTranslate() {
    try {
        const locale = (await getLocale()).substr(0, 2);
        const fp = await resolveResourcePath('i18n/' + locale + '.json');
        const text = await readTextFile(fp);
        lang = JSON.parse(text);
    } catch (err) {
        return;
    }
    $('[data-lang]').each(function () {
        const key = $(this).data('lang');
        let phrase = lang[key];
        if (key === 'Message.ConnectDevice') {
            phrase = phrase.replace('{0}', foxfirmware);
        }
        if (phrase) {
            $(this).html(phrase);
        }
    });
    $('[data-lang-title]').each(function () {
        const key = $(this).data('lang-title');
        const phrase = lang[key];
        if (phrase) {
            $(this).attr('title', phrase);
        }
    });
}

function _(key) {
    if (lang && lang[key]) {
        return lang[key];
    } else {
        return key;
    }
}

function uiInitMenu() {
    // Replace Electron remote Menu with a simple DOM dropdown.
    const menuHtml = '<ul id="configuration-menu-dropdown" class="nav-group" style="display:none;position:absolute;z-index:1000;background:#fff;border:1px solid #ccc;list-style:none;padding:4px 0;margin:0;min-width:120px;">' +
        '<li id="menu-new" style="padding:4px 12px;cursor:pointer;">' + _('ConfigurationMenu.New') + '</li>' +
        '<li id="menu-open" style="padding:4px 12px;cursor:pointer;">' + _('ConfigurationMenu.Open') + '</li>' +
        '<li id="menu-save" style="padding:4px 12px;cursor:pointer;">' + _('ConfigurationMenu.SaveAs') + '</li>' +
        '</ul>';
    $('body').append(menuHtml);

    $('#menu-new').click(async function () {
        try {
            const newConfig = await loadDefaultConfig();
            if (newConfig) {
                config = newConfig;
                uiUpdate();
            }
        } catch (err) {
            console.error('new config failed', err);
            showError('New Configuration', err.toString());
        }
        $('#configuration-menu-dropdown').hide();
    });

    $('#menu-open').click(async function () {
        try {
            const res = await openConfig();
            if (res) {
                config = res;
                uiUpdate();
            }
        } catch (err) {
            console.error('open config failed', err);
            showError('Open Configuration', err.toString());
        }
        $('#configuration-menu-dropdown').hide();
    });

    $('#menu-save').click(async function () {
        if (!config) {
            showError('Save Configuration', 'No configuration loaded');
            $('#configuration-menu-dropdown').hide();
            return;
        }
        try {
            await saveConfig(config);
        } catch (err) {
            console.error('save config failed', err);
            showError('Save Configuration', err.toString());
        }
        $('#configuration-menu-dropdown').hide();
    });

    $('#configuration-menu').click(function () {
        const offset = $('#configuration-menu').offset();
        const $dropdown = $('#configuration-menu-dropdown');
        const menuWidth = $dropdown.outerWidth() || 120;
        const windowWidth = $(window).width();
        let left = Math.floor(offset.left);
        if (left + menuWidth > windowWidth) {
            left = windowWidth - menuWidth - 10;
        }
        $dropdown.css({
            left: Math.max(10, left),
            top: 50
        }).toggle();
    });

    $(document).click(function (e) {
        if (!$(e.target).closest('#configuration-menu, #configuration-menu-dropdown').length) {
            $('#configuration-menu-dropdown').hide();
        }
    });
}

async function uiInit() {
    try {
        appVersion = await getAppVersion();
    } catch (e) {
    }
    $('#version').html('v' + appVersion);
    await uiTranslate();
    uiInitButtons();
    uiInitMenu();
    uiInitTabs();
    uiInitChangeHandlers();

    $('#link-new').click(async function () {
        config = await loadDefaultConfig();
        uiUpdate();
    });

    $('#link-open').click(async function () {
        try {
            const res = await openConfig();
            if (res) {
                config = res;
                uiUpdate();
            }
        } catch (err) {
            console.error('open config failed', err);
            showError('Open Configuration', err.toString());
        }
    });

    $('#link-download').click(function (event) {
        event.preventDefault();
        $('#connection-status').html(_('Status.Device') + ' ' + _('Status.Connecting'));
        ipc.send('download');
    });

    $(document).on('change', '.fox-val', function () {
        const id = $(this).attr('id');
        const currentVal = config[id];
        let newVal;
        if ($(this).attr('type') === 'checkbox') {
            newVal = $(this).is(':checked');
        } else {
            newVal = $(this).val();
        }

        switch (typeof currentVal) {
            case 'number':
                newVal = parseFloat(newVal);
                break;
            case 'boolean':
                if (newVal === 'false') {
                    newVal = false;
                } else {
                    newVal = Boolean(newVal);
                }
                break;
            default:
        }
        config[id] = newVal;
    });

    $(document).on('change', '.fox-pval', function () {
        const id = $(this).attr('id');
        const currentVal = config.profiles[activeProfile][id];
        let newVal;
        if ($(this).attr('type') === 'checkbox') {
            newVal = $(this).is(':checked');
        } else {
            newVal = $(this).val();
        }

        switch (typeof currentVal) {
            case 'number':
                newVal = parseFloat(newVal);
                break;
            case 'boolean':
                if (newVal === 'false') {
                    newVal = false;
                } else {
                    newVal = Boolean(newVal);
                }
                break;
            default:
        }
        // DEVIATION: IsCelcius comes from a <select> with string values, so coerce it
        // to a boolean explicitly before storing it on the profile.
        if (id === 'IsCelcius') {
            newVal = (newVal === true || newVal === 'true');
        }
        config.profiles[activeProfile][id] = newVal;
    });

    uiUpdate();
}

// Ensure the config object matches the current DOM values before uploading.
// This protects against missing/late change events on selects/checkboxes.
function syncConfigFromUi() {
    if (!config) return;

    $('.fox-val').each(function () {
        const id = $(this).attr('id');
        if (!id) return;
        const currentVal = config[id];
        let newVal;
        if ($(this).attr('type') === 'checkbox') {
            newVal = $(this).is(':checked');
        } else {
            newVal = $(this).val();
        }
        switch (typeof currentVal) {
            case 'number':
                newVal = parseFloat(newVal);
                break;
            case 'boolean':
                newVal = (newVal === 'false') ? false : Boolean(newVal);
                break;
            default:
        }
        config[id] = newVal;
    });

    $('.fox-pval').each(function () {
        const id = $(this).attr('id');
        if (!id || !config.profiles[activeProfile]) return;
        const currentVal = config.profiles[activeProfile][id];
        let newVal;
        if ($(this).attr('type') === 'checkbox') {
            newVal = $(this).is(':checked');
        } else {
            newVal = $(this).val();
        }
        switch (typeof currentVal) {
            case 'number':
                newVal = parseFloat(newVal);
                break;
            case 'boolean':
                newVal = (newVal === 'false') ? false : Boolean(newVal);
                break;
            default:
        }
        // DEVIATION: IsCelcius is stored as a boolean but rendered as a <select>;
        // normalize the string value before upload.
        if (id === 'IsCelcius') {
            newVal = (newVal === true || newVal === 'true');
        }
        config.profiles[activeProfile][id] = newVal;
    });
}

// Expose handlers for inline onclick attributes, menu items and keyboard shortcuts.
window.downloadSettings = function () {
    ipc.send('download');
};
window.uploadSettings = function () {
    if (!config) {
        showError('Upload Settings', 'No configuration loaded');
        return;
    }
    syncConfigFromUi();
    ipc.send('upload', config);
};
window.resetSettings = async function () {
    config = await loadDefaultConfig();
    ipc.send('upload', config);
    uiUpdate();
};

$(document).on('keydown', function (e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
    }
    if (e.key === 'd' || e.key === 'D') {
        window.downloadSettings();
    } else if (e.key === 'u' || e.key === 'U') {
        window.uploadSettings();
    }
});

// Wrap the main tab bar and the view container in a fixed-width, centered
// wrapper so they scale as a single block. The HTML keeps them as direct
// children of .window-content for backward compatibility; we relocate them at
// runtime so the transform/scale applies to the whole content area.
function uiWrapContentForScaling() {
    const main = document.getElementById('main');
    const content = document.querySelector('.window-content');
    const view = document.querySelector('.window-content > .view-container.view-main');
    if (!main || !content || !view) return;
    if (content.querySelector('.content-scale-wrap')) return;

    const wrap = document.createElement('div');
    wrap.className = 'content-scale-wrap';
    wrap.appendChild(main);
    wrap.appendChild(view);
    content.appendChild(wrap);
}

// Scale the whole content area (main tabs + views) to fit the window while
// keeping the header/footer at their natural size. The content block is fixed
// at the 536px design width and centered horizontally, matching the centered
// header/footer layout.
function updateContentZoom() {
    const header = document.querySelector('.toolbar-header');
    const footer = document.querySelector('.toolbar-footer');
    const content = document.querySelector('.window-content');
    if (!header || !footer || !content) return;

    const baseWidth = 536;
    const baseHeight = 596;
    const headerHeight = header.offsetHeight;
    const footerHeight = footer.offsetHeight;

    const baseContentHeight = baseHeight - headerHeight - footerHeight;
    const availableWidth = window.innerWidth;
    const availableContentHeight = window.innerHeight - headerHeight - footerHeight;

    const scale = Math.min(availableWidth / baseWidth, availableContentHeight / baseContentHeight);
    document.documentElement.style.setProperty('--content-scale', scale.toFixed(4));
}

window.addEventListener('resize', updateContentZoom);

uiWrapContentForScaling();
uiInit();
updateContentZoom();
