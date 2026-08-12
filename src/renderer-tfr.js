import 'photonkit/dist/css/photon.css';
import './style.css';
import $ from 'jquery';
import { ipc, getLocale, closeWindow, readTextFile, resolveResourcePath, importTfr, exportTfr } from './lib/tauri-bridge.js';
import Highcharts from 'highcharts';
import 'highcharts-draggable-points';

let lang = {};

$('#cancel').click(function () {
    closeWindow();
});

function data() {
    return {
        index: tableIndex,
        table: {
            Name: ($('#Name').val() + '\u0000\u0000\u0000\u0000').substr(0, 4),
            Points: [
                { Temperature: parseInt($('#temp0').val(), 10), Factor: parseFloat($('#factor0').val()) },
                { Temperature: parseInt($('#temp1').val(), 10), Factor: parseFloat($('#factor1').val()) },
                { Temperature: parseInt($('#temp2').val(), 10), Factor: parseFloat($('#factor2').val()) },
                { Temperature: parseInt($('#temp3').val(), 10), Factor: parseFloat($('#factor3').val()) },
                { Temperature: parseInt($('#temp4').val(), 10), Factor: parseFloat($('#factor4').val()) },
                { Temperature: parseInt($('#temp5').val(), 10), Factor: parseFloat($('#factor5').val()) },
                { Temperature: parseInt($('#temp6').val(), 10), Factor: parseFloat($('#factor6').val()) }
            ]
        }
    };
}

$('#save').click(function () {
    closeWindow();
    ipc.send('tfrchange', data());
});

$('#export').click(async function () {
    try {
        await exportTfr(data().table);
    } catch (err) {
        console.error('export tfr failed', err);
    }
});

$('#import').click(async function () {
    try {
        const table = await importTfr();
        if (table) {
            chart.series[0].setData([]);
            table.forEach((p, i) => {
                $('#temp' + i).val(p.Temperature);
                $('#factor' + i).val(p.Factor);
                chart.series[0].addPoint([p.Temperature, p.Factor]);
            });
            chart.redraw();
        }
    } catch (err) {
        console.error('import tfr failed', err);
    }
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

const chart = new Highcharts.Chart({
    chart: {
        renderTo: 'container',
        animation: false
    },

    title: {
        text: null
    },

    tooltip: { enabled: false },
    credits: {
        enabled: false
    },

    xAxis: {
        min: 0,
        max: 800
    },
    yAxis: {
        title: {
            text: null
        },
        min: 1,
        max: 4
    },

    plotOptions: {
        series: {
            point: {
                events: {
                    drag: function () {
                        chart.series[0].data.forEach((c, i) => {
                            $('#temp' + i).val(parseInt(c.x));
                            $('#factor' + i).val(c.y);
                        });
                    },
                    drop: function () {
                        chart.series[0].data.forEach((c, i) => {
                            $('#temp' + i).val(parseInt(c.x));
                            $('#factor' + i).val(c.y);
                        });
                    }
                }
            },
            stickyTracking: false
        },
        column: {
            stacking: 'normal'
        },
        line: {
            cursor: 'ns-resize',
            marker: {
                enabled: true
            }
        }
    },

    series: [{
        data: [],
        draggableY: true,
        draggableX: true
    }],

    legend: {
        enabled: false
    }
});

let tableIndex;

ipc.on('data', (event, data) => {
    tableIndex = data.index;
    $('#Name').val(data.table.Name.replace(/\u0000/g, ''));
    chart.series[0].setData([]);
    data.table.Points.forEach((p, i) => {
        $('#temp' + i).val(p.Temperature);
        $('#factor' + i).val(p.Factor);
        chart.series[0].addPoint([p.Temperature, p.Factor]);
    });

    chart.redraw();
});

ipc.on('table', (event, data) => {
    chart.series[0].setData([]);
    data.forEach((p, i) => {
        $('#temp' + i).val(p.Temperature);
        $('#factor' + i).val(p.Factor);
        chart.series[0].addPoint([p.Temperature, p.Factor]);
    });

    chart.redraw();
});

$('input.temp').on('input change', function () {
    const index = parseInt($(this).attr('id').replace('temp', ''), 10);
    chart.series[0].data[index].update({ x: parseInt($(this).val(), 10) });
});

$('input.factor').on('input change', function () {
    const index = parseInt($(this).attr('id').replace('factor', ''), 10);
    chart.series[0].data[index].update({ y: parseFloat($(this).val()) });
});
