'use strict';
import * as d3 from "https://cdn.skypack.dev/d3@7";
// topojson = require("topojson-client@3");
// import * as topojson from "https://unpkg.com/topojson@3";
const div_map = d3.select("#usa-map");
// 地图表格
function Choropleth(data, {
    id = d => d.id, // given d in data, returns the feature id
    value = () => undefined, // given d in data, returns the quantitative value
    title, // given a feature f and possibly a datum d, returns the hover text
    format, // optional format specifier for the title
    scale = d3.scaleSequential, // type of color scale
    domain, // [min, max] values; input of color scale
    range = d3.interpolateBlues, // output of color scale
    width = 640, // outer width, in pixels
    height, // outer height, in pixels
    projection, // a D3 projection; null for pre-projected geometry
    features, // a GeoJSON feature collection
    featureId = d => d.id, // given a feature, returns its id
    borders, // a GeoJSON object for stroking borders
    outline = projection && projection.rotate ? { type: "Sphere" } : null, // a GeoJSON object for the background
    unknown = "#ccc", // fill color for missing data
    fill = "white", // fill color for outline
    stroke = "white", // stroke color for borders
    strokeLinecap = "round", // stroke line cap for borders
    strokeLinejoin = "round", // stroke line join for borders
    strokeWidth, // stroke width for borders
    strokeOpacity, // stroke opacity for borders
} = {}) {
    // Compute values.
    const N = d3.map(data, id);
    const V = d3.map(data, value).map(d => d == null ? NaN : +d);
    const Im = new d3.InternMap(N.map((id, i) => [id, i]));
    const If = d3.map(features.features, featureId);

    // Compute default domains.
    if (domain === undefined) domain = d3.extent(V);

    // Construct scales.
    const color = scale(domain, range);
    if (color.unknown && unknown !== undefined) color.unknown(unknown);

    // Compute titles.
    if (title === undefined) {
        format = color.tickFormat(100, format);
        title = (f, i) => `${f.properties.name}\n${format(V[i])}`;
    } else if (title !== null) {
        const T = title;
        const O = d3.map(data, d => d);
        title = (f, i) => T(f, O[i]);
    }

    // Compute the default height. If an outline object is specified, scale the projection to fit
    // the width, and then compute the corresponding height.
    if (height === undefined) {
        if (outline === undefined) {
            height = 400;
        } else {
            const [[x0, y0], [x1, y1]] = d3.geoPath(projection.fitWidth(width, outline)).bounds(outline);
            const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
            projection.scale(projection.scale() * (l - 1) / l).precision(0.2);
            height = dy;
        }
    }

    // Construct a path generator.
    const path = d3.geoPath(projection);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "width: 100%; height: auto; height: intrinsic;");

    if (outline != null) svg.append("path")
        .attr("fill", fill)
        .attr("stroke", "currentColor")
        .attr("d", path(outline));

    svg.append("g")
        .selectAll("path")
        .data(features.features)
        .join("path")
        .attr("fill", (d, i) => color(V[Im.get(If[i])]))
        .attr("d", path)
        .append("title")
        .text((d, i) => title(d, Im.get(If[i])));

    if (borders != null) svg.append("path")
        .attr("pointer-events", "none")
        .attr("fill", "none")
        .attr("stroke", stroke)
        .attr("stroke-linecap", strokeLinecap)
        .attr("stroke-linejoin", strokeLinejoin)
        .attr("stroke-width", strokeWidth)
        .attr("stroke-opacity", strokeOpacity)
        .attr("d", path(borders));

    return Object.assign(svg.node(), { scales: { color } });
}

const getSpecDateData = (data, date) => {
    return data.filter(d => d.date === date);
};
const removeNoIdData = (data) => {
    return data.filter(d => d.id !== "");
};

// 获取美国地图
var us;// 美国地图数据
await fetch('https://cdn.jsdelivr.net/npm/us-atlas@1/us/10m.json')
    .then((response) => response.json())
    .then((data) => {
        us = data;
        console.log(us.objects);
    });
const counties = topojson.feature(us, us.objects.counties);
const states = topojson.feature(us, us.objects.states);
const statemap = new Map(states.features.map(d => [d.id, d]));
const statemesh = topojson.mesh(us, us.objects.states, (a, b) => a !== b);


// 读取新冠数据
var dataset;
await d3.csv("./assets/data/us-counties-recent.csv").then(function (data) {
    console.log(data);
    // turn to Array
    data = data.map(d => {
        return {
            id: d.fips,
            date: d.date,
            county: d.county,
            state: d.state,
            cases: +d.cases,
            deaths: +d.deaths
        };
    });
    dataset = data;

    // 获取起始日期
    let startdate = d3.min(data, d => d.date);
    let enddate = d3.max(data, d => d.date);
    const available_date_from = document.getElementById("available_date_from");
    const available_date_to = document.getElementById("available_date_to");
    // 更新日期范围
    available_date_from.innerHTML = startdate;
    available_date_to.innerHTML = enddate;
    // 绘制地图
    let specdata = getSpecDateData(data, startdate);
    specdata = removeNoIdData(specdata);
    specdata = specdata.map(d => {
        return {
            id: d.id,
            state: d.state,
            county: d.county,
            rate: (d.deaths / d.cases) * 300
        }
    })
    const usa_map = Choropleth(specdata, {
        id: d => d.id,
        value: d => d.rate,
        scale: d3.scaleQuantize,
        domain: [1, 10],
        range: d3.schemeBlues[9],
        title: (f, d) => `${f.properties.name}, ${statemap.get(f.id.slice(0, 2)).properties.name}\n${d?.rate}%`,
        features: counties,
        borders: statemesh,
        width: 975,
        height: 610
    });
    div_map.append(() => usa_map);
});

// 根据html里的date信息更新地图
function update() {
    const date = document.getElementById("date").value;
    console.log(date);
    let specdata = getSpecDateData(dataset, date);
    specdata = removeNoIdData(specdata);
    specdata = specdata.map(d => {
        return {
            id: d.id,
            state: d.state,
            county: d.county,
            rate: (d.deaths / d.cases) * 300
        }
    })
    console.log(specdata);
    // 绘制地图
    const usa_map = Choropleth(specdata, {
        id: d => d.id,
        value: d => d.rate,
        scale: d3.scaleQuantize,
        domain: [1, 10],
        range: d3.schemeBlues[9],
        title: (f, d) => `${f.properties.name}, ${statemap.get(f.id.slice(0, 2)).properties.name}\n${d?.rate}%`,
        features: counties,
        borders: statemesh,
        width: 975,
        height: 610
    });
    // clear div_map and append new map
    div_map.selectAll("*").remove();
    div_map.append(() => usa_map);
}


// 按钮update：更新地图
const update_button = document.getElementById("update");
update_button.onclick = update;