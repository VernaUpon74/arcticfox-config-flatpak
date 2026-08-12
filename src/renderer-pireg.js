import 'photonkit/dist/css/photon.css';
import './style.css';
import $ from 'jquery';
import { ipc, getLocale, closeWindow, readTextFile, resolveResourcePath } from './lib/tauri-bridge.js';

let lang = {};

$('#cancel').click(function () {
    closeWindow();
});

$('#save').click(function () {
    ipc.send('piregchange', {
        PIRegulatorIsEnabled: $('#PIRegulatorIsEnabled').is(':checked'),
        PIRegulatorRange: $('#PIRegulatorRange').val(),
        PIRegulatorPValue: $('#PIRegulatorPValue').val(),
        PIRegulatorIValue: $('#PIRegulatorIValue').val()
    });
    closeWindow();
});

ipc.on('data', (event, data) => {
    $('#PIRegulatorIsEnabled').prop('checked', data.PIRegulatorIsEnabled);
    $('#PIRegulatorRange').val(data.PIRegulatorRange);
    $('#PIRegulatorPValue').val(data.PIRegulatorPValue);
    $('#PIRegulatorIValue').val(data.PIRegulatorIValue);
});

async function uiTranslate() {
    try {
        const locale = await getLocale();
        const fp = await resolveResourcePath('i18n/' + locale + '.json');
        const text = await readTextFile(fp);
        lang = JSON.parse(text);
    } catch (err) {
        return;
    }
    $('[data-lang]').each(function () {
        const key = $(this).data('lang');
        const phrase = lang[key];
        if (phrase) {
            $(this).html(phrase);
        }
    });
}

uiTranslate();
