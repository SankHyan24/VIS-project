'use strict';
import * as d3 from "https://cdn.skypack.dev/d3@7";

const div_chart = d3.select("#usa-chart");
function drawline(enddate)
{
    var margin = {top:50,right:50,bottom:100,left:100},
    width = 750 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

    var svg = d3.select("body").append("svg")
        .attr("width",width + margin.left + margin.right)
        .attr("height",height + margin.bottom + margin.top)
        .append("g")
        .attr("transform","translate("+ margin.left + "," + margin.right +")");

    d3.csv("./assets/data/us-states.csv").then(function(data)
    {
        // let startdate = d3.min(data, d => d.date);
        // let enddate = d3.max(data, d => d.date);

    // 更新日期范围
    // available_date_from.innerHTML = startdate;
    // available_date_to.innerHTML = enddate;

        let newdata = data.filter(d => d.state == 'Washington');
        newdata = newdata.filter(d => d.date <= "2020-08-21" );//&& d.date >= startdate);
        newdata.forEach(d => {d.cases_avg_per_100k = +d.cases_avg_per_100k; d.deaths_avg_per_100k = +d.deaths_avg_per_100k;});
        var xScale = d3.scalePoint()
            .domain(newdata.map(d => d.date))
            .range([0,width]);

        var yScale = d3.scaleLinear()
            .domain(d3.extent(newdata,d => d.cases_avg_per_100k))
        //.domain([0,d3.max(newdata,d => d.cases_avg_per_100k)])
        //.domain([5,13])
            .range([height,0]);

        // var yScale2 = d3.scaleLinear()
        //         .domain(d3.extent(newdata,d => d.deaths_avg_per_100k))
        //         .range([height,0]);

        var line = d3.line()
            .x(function(d) { return xScale(d.date);})
            .y(function(d) { return yScale(d.cases_avg_per_100k);})
            .curve(d3.curveMonotoneX);

        // var line2 = d3.line()
        //     .x(function(d) { return xScale(d.date);})
        //     .y(function(d) { return yScale2(d.deaths_avg_per_100k);})
        //     .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(newdata)
            .attr("class","line")
            .attr("d",line)
            .attr("fill","none")
            .attr("stroke","#ffab00")
            .attr("stroke-width","3px");

        // svg.append("path")
        //     .datum(newdata)
        //     .attr("class","line2")
        //     .attr("d",line2);

        // var trans = function(item,i)
        // {
        //     if(i%2===0)
        //     {
        //         return '.75em';
        //     }
        //     else
        //     return '1.75em';
        // }
        svg.append("g")
            .attr("class","x axis")
            .attr("transform","translate(0," + height + ")")
            .call(d3
                .axisBottom(xScale)
                .tickFormat(function(d){
                    if(d.indexOf("-21")==-1)
                    {
                        return ;
                    }
                    else
                    return d;
                })
                .ticks(30))
            .selectAll("text")
            .attr("dy","1.75em")
            .attr("transform","rotate(-14)")
            .append("text")
            .attr("y",height+50)
            .attr("x",650)
            .attr("text-anchor","end")
            .attr("stroke","black")
            .text("Date");

        svg.append("g")
            .attr("class","y axis1")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("y",50)
            .attr("x",0)
            .attr("dy","-5.1em")
            .attr("text-anchor","end")
            .attr("stroke","black")
            .text("Cases Avg Per 100k");

        // svg.append("g")
        //     .attr("class","y axis2")
        //     .call(d3.axisRight(yScale2))
        //     .append("text")
        //     .attr("y",50)
        //     .attr("x",70)
        //     .attr("dy","-5.1em")
        //     .attr("text-anchor","end")
        //     .attr("stroke","black")
        //     .text("Total Deaths");
    });

    return Object.assign(svg.node(),{ scales: { color } });//这里不对，只是权宜之计
}

var usa_chart_initial = drawline(2022);
// clear div_map and append new map
div_chart.append(() => usa_chart_initial);//用来测试能否画图，值得注意的是如果把这里去掉，改在update函数里使用，似乎不会把原图清除而是会多画一张图

function update() {
    //const date = document.getElementById("date").value;
    // console.log(date);
    // let specdata = getSpecDateData(dataset, date);
    // specdata = removeNoIdData(specdata);
    // specdata = specdata.map(d => {
    //     return {
    //         id: d.id,
    //         state: d.state,
    //         county: d.county,
    //         rate: (d.deaths / d.cases) * 300
    //     }
    // })
    // console.log(specdata);
    //const usa_chart = drawline(2020);
    // clear div_map and append new map
    div_chart.selectAll("*").remove();
    //div_chart.append(() => usa_chart);
}

// 按钮update：更新
const update_button = document.getElementById("update");
update_button.onclick = update;
