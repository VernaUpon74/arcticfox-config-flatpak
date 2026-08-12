import 'photonkit/dist/css/photon.css';
import './style.css';
import $ from 'jquery';
import { ipc, getLocale, closeWindow, readTextFile, resolveResourcePath } from './lib/tauri-bridge.js';
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
            Name: ($('#Name').val() + '\u0000\u0000\u0000\u0000\u0000\u0000\u0000\u0000').substr(0, 8),
            Points: [
                { Time: parseFloat($('#time0').val()), Percent: parseInt($('#percent0').val(), 10) },
                { Time: parseFloat($('#time1').val()), Percent: parseInt($('#percent1').val(), 10) },
                { Time: parseFloat($('#time2').val()), Percent: parseInt($('#percent2').val(), 10) },
                { Time: parseFloat($('#time3').val()), Percent: parseInt($('#percent3').val(), 10) },
                { Time: parseFloat($('#time4').val()), Percent: parseInt($('#percent4').val(), 10) },
                { Time: parseFloat($('#time5').val()), Percent: parseInt($('#percent5').val(), 10) },
                { Time: parseFloat($('#time6').val()), Percent: parseInt($('#percent6').val(), 10) },
                { Time: parseFloat($('#time7').val()), Percent: parseInt($('#percent7').val(), 10) },
                { Time: parseFloat($('#time8').val()), Percent: parseInt($('#percent8').val(), 10) },
                { Time: parseFloat($('#time9').val()), Percent: parseInt($('#percent9').val(), 10) },
                { Time: parseFloat($('#time10').val()), Percent: parseInt($('#percent10').val(), 10) },
                { Time: parseFloat($('#time11').val()), Percent: parseInt($('#percent11').val(), 10) }
            ]
        }
    };
}

$('#save').click(function () {
    ipc.send('pcchange', data());
    closeWindow();
});

$('#export').click(function () {
    ipc.send('pcexport', data());
});

$('#import').click(function () {
    ipc.send('pcimport');
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

    navigator: {
        enabled: false
    },
    xAxis: {
        min: 0,
        max: 8,
        minRange: 8,
    },

    yAxis: {
        title: {
            text: null
        },
        min: 0,
        max: 250
    },

    plotOptions: {
        series: {
            point: {
                events: {
                    drag: function () {
                        chart.series[0].data.forEach((c, i) => {
                            $('#time' + i).val((c.x).toFixed(1));
                            $('#percent' + i).val(c.y);
                        });
                        return true;
                    },
                    drop: function () {
                        chart.series[0].data.forEach((c, i) => {
                            $('#time' + i).val((c.x).toFixed(1));
                            $('#percent' + i).val(c.y);
                        });
                        return true;
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
    console.log(data);
    tableIndex = data.index;
    $('#Name').val(data.table.Name.replace(/\u0000/g, ''));
    chart.series[0].setData([]);
    data.table.Points.forEach((p, i) => {
        $('#time' + i).val(p.Time);
        $('#percent' + i).val(p.Percent);
        chart.series[0].addPoint([p.Time, p.Percent]);
    });

    chart.redraw();
});

ipc.on('table', (event, data) => {
    chart.series[0].setData([]);
    data.forEach((p, i) => {
        $('#time' + i).val(p.Time);
        $('#percent' + i).val(p.Percent);
        chart.series[0].addPoint([p.Time, p.Percent]);
    });

    chart.redraw();
});

$('input.temp').on('input change', function () {
    const index = parseInt($(this).attr('id').replace('time', ''), 10);
    chart.series[0].data[index].update({ x: parseFloat($(this).val()) });
});

$('input.percent').on('input change', function () {
    const index = parseInt($(this).attr('id').replace('percent', ''), 10);
    chart.series[0].data[index].update({ y: parseFloat($(this).val(), 10) });
});
