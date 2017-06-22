/**
 * Created by excalibur on 2017/6/18.
 */

let srcData;
let mapSvg;
let histogramSvg;
let radius;
let color;

function map(height, width, data) {
    const svg = mapSvg;
    srcData = data;

    //定义地图的投影
    const projection = d3.geo.albersUsa()
        .translate([width/2, height/2])
        .scale([height*2]);

    //定义路径生成器
    const path = d3.geo.path()
        .projection(projection);

    // 计算每一个子类别对应的总营销额以及利润
    let arr = [];
    for (let d of data){
        let hasSubCategory = false;
        for (let a of arr) {
            if ( d.State === a[0] ) {
                a[1] += Number(d.Sales);
                a[2] += Number(d.Profit);
                hasSubCategory = true;
            }
        }
        if (!hasSubCategory) {
            let newArr = [d.State, Number(d.Sales), Number(d.Profit), d.Category];
            arr.push(newArr);
        }
    }
    let profit = [];
    for (let a of arr) {
        profit.push(Math.log( Math.abs(a[2]) ));
    }
    profit.sort(function (x, y) {
        return x - y;
    });

    // 定义半径比例尺
    radius = d3.scale.linear()
        .domain([
            d3.min(arr, function(d) { return Math.abs(parseFloat(d[1])); }),
            d3.max(arr, function(d) { return Math.abs(parseFloat(d[1])); })
        ])
        .range([5, 40]);
    // 定义颜色比例尺
    color = d3.scale.linear()
        .domain([
            - Math.log(Math.abs(d3.min(arr, function(d) { return parseFloat(d[2]); }))),
            0,
            Math.log(d3.max(arr, function(d) { return parseFloat(d[2]); }))
        ])
        .range(["#e51c23", "#cccccc", "#259b24"]);

    //读入GeoJSON数据
    d3.json("us-states.json", function(states) {
        //混合利润数据和GeoJSON
        //循环利润数据集中的每个值
        for (let d of arr) {
            //获取州名
            let dataState  = d[0];
            //获取该州所对应的数据值，并将字符串类型转换成浮点数类型
            let dataSales  = parseFloat(d[1]);
            let dataProfit = parseFloat(d[2]);
            //在GeoJSON中找到相应的州
            for (let state of states.features) {
                let stateName = state.properties.name;
                if (stateName === dataState) {
                    //把利润数据值复制到json中
                    state.properties.Sales  = Number(dataSales);
                    state.properties.Profit = Number(dataProfit);
                    //停止循环JSON数据
                    break;
                }
            }
        }

        //绑定数据并为每一个GeoJSON feature创建一个路径
        const state = svg.selectAll("path")
            .data(states.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("stroke", "#aaaaaa")
            .attr("stroke-width", 0.4)
            .attr("fill", function (d) {
                const location = this.getBoundingClientRect();
                //选择悬停元素的父元素svg，并向里面添加圆点
                d3.select(this.parentNode)
                    .datum(d)
                    .append('g')
                    .append('circle')
                    .attr('cx', location.left + location.width/2)
                    .attr('cy', location.top + location.height/2 - 26)
                    .attr('r', function (d) {
                        let sales = Math.abs(d.properties.Sales);
                        return radius(sales);
                    })
                    .attr("fill", function(d) {
                        let profit = Math.log(Math.abs(d.properties.Profit));
                        if (d.properties.Profit > 0)
                            return color(profit);
                        else
                            return color(-profit);
                    })
                    .attr("opacity", 0.76);

                return "#cccccc";
                /*
                 把州的颜色也变了觉得蛮好看，所以就留下代码了
                 let profit = Math.log(Math.abs(d.properties.Profit));
                 if (d.properties.Profit > 0)
                 return color(profit);
                 else
                 return color(-profit);
                 */
            });

        let circle = svg.selectAll("circle");
        circle.on("mouseover", function(d) {
            //鼠标悬停添加文字
            //取得鼠标所在元素的坐标
            const location = this.getBoundingClientRect();

            //控制文字显示位置
            const x = location.left + location.width/2 - 34 - 8;
            const y = location.top + location.height/2 - 21 - 8;

            // 更新提示条的位置和值
            d3.select("#tooltip-map").style("display", "block")
                .style("left", x + "px")
                .style("top",  y + "px");

            // 填充数据
            d3.select("#State-map")
                .text(d.properties.name);
            d3.select("#Profit-map")
                .text(parseInt(d.properties.Profit));
        })
        .on("mouseout", function(d) {
            //鼠标移开隐藏文字
            d3.select("#tooltip-map").style("display", "none");
        });

        state.on("mouseover", function(d) {
            //鼠标悬停添加文字
            //取得鼠标所在元素的坐标
            const location = this.getBoundingClientRect();

            //控制文字显示位置
            const x = location.left + location.width/2 - 34;
            const y = location.top + location.height/2 - 21;

            // 更新提示条的位置和值
            d3.select("#tooltip-map").style("display", "block")
                .style("left", x + "px")
                .style("top",  y + "px");

            // 填充数据
            d3.select("#State-map")
                .text(d.properties.name);
            d3.select("#Profit-map")
                .text(parseInt(d.properties.Profit));
        })
        .on("mouseout", function(d) {
            //鼠标移开隐藏文字
            d3.select("#tooltip-map").style("display", "none");
        });
    });
}

function histogram(height, width, data) {
    const svg = histogramSvg;

    // 计算每一个子类别对应的总营销额以及利润
    let arr = [];
    for (let i = 0; i < data.length; i++){
        let hasSubCategory = false;
        for (let j = 0; j < arr.length; j++) {
            if ( data[i].SubCategory === arr[j][0] ) {
                arr[j][1] += Number(data[i].Sales);
                arr[j][2] += Number(data[i].Profit);
                hasSubCategory = true;
            }
        }
        if (!hasSubCategory) {
            let newArr = [data[i].SubCategory, Number(data[i].Sales), Number(data[i].Profit), data[i].Category];
            arr.push(newArr);
        }
    }

    // arr排序
    arr.sort(function (x, y) {
        return y[1] - x[1]
    });
    let SubCategory = [], Sales = [], Profit = [];
    for (let i of arr) {
        SubCategory.push(i[0]);
        Sales.push(i[1]);
        Profit.push(i[2]);
    }

    // 给坐标轴预留出来空白
    const padding = {left:80, right:80, top:20, bottom:20};
    // 计算比例尺
    const xScale = d3.scale.ordinal()
        .domain(SubCategory)
        .rangeRoundBands( [0, width - padding.left - padding.right], 0.1 );
    const yScale = d3.scale.linear()
        .domain([ 0, parseInt(d3.max(Sales))+1 ])
        .range([ height - padding.top - padding.bottom, 0 ]);
    // 颜色比例尺
    const colorScale = d3.scale.linear()
        .domain([ parseInt(d3.min(Profit)), -1, 0, parseInt(d3.max(Profit))+1 ])
        .range(["#e51c23", "#f9bdbb", "#a3e9a4", "#259b24"]);

    //定义坐标轴
    const xAxis = d3.svg.axis().scale(xScale).orient("bottom");
    const yAxis = d3.svg.axis().scale(yScale).orient("left");

    //添加坐标轴
    svg.append("g")
        .attr("class","axis")
        .attr("transform","translate(" + padding.left + "," + (height - padding.bottom) + ")")
        .call(xAxis)
        // 增加坐标值说明
        .append('text')
        .text('SubCategory')//子类别
        .attr('transform', "translate(" + (width - padding.left - padding.right) + ", -7)");
    svg.append("g")
        .attr("class","axis")
        .attr("transform","translate(" + padding.left + "," + padding.top + ")")
        .call(yAxis)
        // 增加坐标值说明
        .append('text')
        .text("Sales")//销售量
        .attr('transform', "translate(-34, -10)");

    // 添加矩形元素
    let rect = svg.selectAll("rect")
        .data(arr)
        .enter()
        .append("rect")
        .attr("transform","translate(" + padding.left + "," + padding.top + ")")
        .attr("fill", function (d) {
            return colorScale(d[2]);
        })
        .attr("x", function(d){
            return xScale(d[0]);
        })
        .attr("y",function(d){
            return yScale(d[1])-0.5;
        })
        .attr("width", xScale.rangeBand())
        .attr("height", function(d){
            return height - padding.top - padding.bottom - yScale(d[1]);
        });

    // 添加鼠标事件
    rect.on("mouseover", function(d) {
            //鼠标悬停添加文字
            //取得鼠标所在元素的坐标
            const location = this.getBoundingClientRect();

            //控制文字显示位置
            const x = location.left;
            // 高于一半则显示在下方，否则显示在上方
            const fontHeight = 20;
            const y = innerHeight - 70 - location.height - 14 + 26 - 4*fontHeight;

            // 更新提示条的位置和值
            d3.select("#tooltip-histogram").style("display", "block")
                .style("left", x + "px")
                .style("top",  y + "px");

            // 填充数据
            d3.select("#Category-histogram")
                .text(d[3]);
            d3.select("#SubCategory-histogram")
                .text(d[0]);
            d3.select("#Sales-histogram")
                .text(parseInt(d[1]));
            d3.select("#Profit-histogram")
                .text(parseInt(d[2]));
        })
        .on("mouseout", function() {
            //鼠标移开隐藏文字
            d3.select("#tooltip-histogram").style("display", "none");
        });

    rect.on("click", function (d) {
        SubCategory = d[0];

        d3.selectAll("rect")
            .attr("fill", function (d) {
                if (SubCategory === d[0])
                    return colorScale(d[2]);
                else
                    return "#cccccc";
            });

        updateMap(SubCategory);
    })
}

function updateMap(SubCategory) {
    // 计算每一个子类别对应的总营销额以及利润
    let mapArr = [];
    for (let d of srcData){
        let hasSubCategory = false;
        for (let a of mapArr) {
            if ( d.State === a[0] && d.SubCategory === a[3] ) {
                a[1] += Number(d.Sales);
                a[2] += Number(d.Profit);
                hasSubCategory = true;
            }
        }
        if (!hasSubCategory) {
            let newArr = [d.State, Number(d.Sales), Number(d.Profit), d.SubCategory];
            mapArr.push(newArr);
        }
    }

    let arr = [];
    for (let d of mapArr) {
        if (d[3] === SubCategory)
            arr.push(d);
    }

    radius.domain([
        d3.min(arr, function(d) { return Math.abs(parseFloat(d[1])); }),
        d3.max(arr, function(d) { return Math.abs(parseFloat(d[1])); })
    ]);

    mapSvg.selectAll("circle")
        .data(arr)
        .attr("fill", function(d) {
            let profit = Math.log(Math.abs(d[2]));
            if (d[2] > 0)
                return color(profit);
            else
                return color(-profit);
        })
        .transition().duration(500)
        .attr('r', function (d) {
            let sales = Math.abs(d[1]);
            return radius(sales);
        });

    mapSvg.selectAll("circle")
        .on("mouseover", function(d) {
            //鼠标悬停添加文字
            //取得鼠标所在元素的坐标
            const location = this.getBoundingClientRect();

            //控制文字显示位置
            const x = location.left + location.width/2 - 34 - 8;
            const y = location.top + location.height/2 - 21 - 8;

            // 更新提示条的位置和值
            d3.select("#tooltip-map").style("display", "block")
                .style("left", x + "px")
                .style("top",  y + "px");

            // 填充数据
            d3.select("#State-map")
                .text(d[0]);
            d3.select("#Profit-map")
                .text(parseInt(d[2]));
        })
        .on("mouseout", function(d) {
            //鼠标移开隐藏文字
            d3.select("#tooltip-map").style("display", "none");
        });

    mapSvg.selectAll("path")
        .data(arr)
        .on("mouseover", function(d) {
            //鼠标悬停添加文字
            //取得鼠标所在元素的坐标
            const location = this.getBoundingClientRect();

            //控制文字显示位置
            const x = location.left + location.width/2 - 34;
            const y = location.top + location.height/2 - 21;

            // 更新提示条的位置和值
            d3.select("#tooltip-map").style("display", "block")
                .style("left", x + "px")
                .style("top",  y + "px");

            // 填充数据
            d3.select("#State-map")
                .text(d[0]);
            d3.select("#Profit-map")
                .text(parseInt(d[2]));
        })
        .on("mouseout", function(d) {
            //鼠标移开隐藏文字
            d3.select("#tooltip-map").style("display", "none");
        });
}