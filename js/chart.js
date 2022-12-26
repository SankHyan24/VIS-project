'use strict';
import * as d3 from "https://cdn.skypack.dev/d3@7";

const div_chart = d3.select("#usa-chart");

var margin = { top: 50, right: 50, bottom: 50, left: 100 },
    width = 750 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

function drawline(startdate,enddate,currentdate) {
    d3.csv("./assets/data/us-states.csv").then(function (data) {
        let newdata = data.filter(d => d.state == 'Washington');
        newdata = newdata.filter(d => d.date <= enddate && d.date >= startdate);
        newdata.forEach(d => { d.cases_avg_per_100k = +d.cases_avg_per_100k; d.deaths_avg_per_100k = +d.deaths_avg_per_100k; });
        let currentdata = newdata.filter(d => d.date === currentdate);
        var xScale = d3.scalePoint()
            .domain(newdata.map(d => d.date))
            .range([0, width]);
        var svg = div_chart.append("svg")
            .attr("width", width + margin.left + margin.right + 100)
            .attr("height", height + margin.bottom + margin.top)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.right + ")");
        var yScale = d3.scaleLinear()
            .domain(d3.extent(newdata, d => d.cases_avg_per_100k))
            .range([height, 0]);

        var line = d3.line()
            .x(function (d) { return xScale(d.date); })
            .y(function (d) { return yScale(d.cases_avg_per_100k); })
            .curve(d3.curveMonotoneX);

        svg.selectAll("line")
            .data(newdata)
            .enter()
            .append('circle')
            .attr('cx', function(d) { return xScale(d.date);})
            .attr('cy', function(d) { return yScale(d.cases_avg_per_100k);})
            .attr('r', 1.5)
            .on("mouseover",function(d,i){
                d3.select(this)
                    .attr("r",3)
                    .style("fill","red");
                svg.append("text")
                    .attr("id","Get")
                    .attr("x",xScale(i.date))
                    .attr("y",yScale(i.cases_avg_per_100k) + 15)
                    .text(i.date + ',' + i.cases_avg_per_100k)
                })
            .on("mouseout",function(d){
                d3.select(this)
                    .attr("r",1.5)
                    .style("fill","black");
                svg.select("#Get")
                    .remove()
                });

        svg.selectAll("line")
            .data(currentdata)
            .enter()
            .append("circle")
            .attr('cx', function(d) { return xScale(d.date);})
            .attr('cy', function(d) { return yScale(d.cases_avg_per_100k);})
            .attr('r', 3)
            .style("fill","green")

        svg
            .data(currentdata)
            .append("text")
            .attr("x",function(d){return xScale(d.date);})
            .attr("y",function(d){return yScale(d.cases_avg_per_100k) + 15;})
            .text(function(d){return d.date + ',' + d.cases_avg_per_100k;});

        svg.append("path")
            .datum(newdata)
            .attr("class", "line")
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "blue")
            .attr("stroke-width", "1px");

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(d3
                .axisBottom(xScale)
                .tickValues(xScale.domain().filter((e, i) => i % 60 == 0)))
            .selectAll("text")
            .attr("dy", "1.75em")
            .attr("transform", "rotate(-14)")
            .append("text")
            .attr("y", height + 50)
            .attr("x", 650)
            .attr("text-anchor", "end")
            .attr("stroke", "black")
            .text("Date");

        svg.append("g")
            .attr("class", "y axis1")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("y", 50)
            .attr("x", 0)
            .attr("dy", "-5.1em")
            .attr("text-anchor", "end")
            .attr("stroke", "black")
            .text("Cases Avg Per 100k");
    });

}

drawline("2020-01-21","2022-12-21","2022-12-01");

export function update_chart() {
    const startdate = document.getElementById("date_from").value;
    const enddate = document.getElementById("date_to").value;
    const currentdate = document.getElementById("date").value;
    div_chart.selectAll("*").remove();
    drawline(startdate,enddate,currentdate);
}

const update_button_chart = document.getElementById("update");
update_button_chart.onclick = update_chart;

/*为了实现日期调整功能，我计划仿照data_container，在index.html文件中<div id="chart_container">这一行之前增加如下内容：
<div id="date_container_for_chart">
Available time:<br>
<label for="date_from">Date From:</label>
<input type="date" id="date_from" name="date_from" value="2020-01-21"><br>
<label for="date_to">Date To:</label>
<input type="date" id="date_to" name="date_to" value="2022-12-21">
</div>
这样试图获取统计图的起止时间，经过我测试是能正常更新的 
*/

/*这次更新之后添加了当前日期功能，即选定一个日期作为想要查看的日期，在折线图上对应的点用绿色标明，同时固定显示其时间与纵轴数据
此外，还增加了鼠标移动到对应点（默认为黑色）上时，点的颜色变为红色，同时显示横纵轴数值的功能
*/