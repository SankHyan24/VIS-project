'use strict';
import * as d3 from "https://cdn.skypack.dev/d3@7";

const div_chart = d3.select("#usa-chart");

var margin = {top:50,right:50,bottom:100,left:100},
    width = 750 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = div_chart.append("svg")
    .attr("width",width + margin.left + margin.right)
    .attr("height",height + margin.bottom + margin.top)
    .append("g")
    .attr("transform","translate("+ margin.left + "," + margin.right +")");

function drawline(enddate)
{
    d3.csv("./assets/data/us-states.csv").then(function(data)
    {
        let newdata = data.filter(d => d.state == 'Washington');
        newdata = newdata.filter(d => d.date <= enddate && d.date >= '2020-01-21');
        newdata.forEach(d => {d.cases_avg_per_100k = +d.cases_avg_per_100k; d.deaths_avg_per_100k = +d.deaths_avg_per_100k;});
        var xScale = d3.scalePoint()
            .domain(newdata.map(d => d.date))
            .range([0,width]);

        var yScale = d3.scaleLinear()
            .domain(d3.extent(newdata,d => d.cases_avg_per_100k))
            .range([height,0]);


        var line = d3.line()
            .x(function(d) { return xScale(d.date);})
            .y(function(d) { return yScale(d.cases_avg_per_100k);})
            .curve(d3.curveMonotoneX);

        svg.append("path")
            .datum(newdata)
            .attr("class","line")
            .attr("d",line)
            .attr("fill","none")
            .attr("stroke","#ffab00")
            .attr("stroke-width","3px");

        svg.append("g")
            .attr("class","x axis")
            .attr("transform","translate(0," + height + ")")
            .call(d3
                .axisBottom(xScale)
                .tickValues(xScale.domain().filter((e,i)=>i%60==0)))
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
    });

}

drawline("2022-12-21");

function update() {
    const date = document.getElementById("date").value;
    div_chart.selectAll("svg").remove();
    drawline(date);
}

// 按钮update：更新地图
const update_button_chart = document.getElementById("update");
update_button_chart.onclick = update_chart;
