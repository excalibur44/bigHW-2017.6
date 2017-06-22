/**
 * Created by excalibur on 2017/6/18.
 */

let srcData;
let mapSvg;
let lineSvg;
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
                    .attr('cy', location.top + location.height/2)
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

function line(height, width, data) {
    const svg = lineSvg;

    // 构造时间解析器
    const parseDate = d3.time.format("%Y/%m/%d").parse;
    const getMonth  = d3.time.format("%m");

    // 计算每一个类别对应的总营销额以及月份
    let arr = [];
    for (let i = 0; i < data.length; i++){
        let month = getMonth(parseDate(data[i].OrderDate));

        let hasSet = false;
        for (let j = 0; j < arr.length; j++) {
            if ( data[i].Category === arr[j][0] && month === arr[j][1] ) {
                arr[j][2] += Number(data[i].Sales);
                hasSet = true;
            }
        }
        if (!hasSet) {
            let newArr = [data[i].Category, month, Number(data[i].Sales)];
            arr.push(newArr);
        }
    }
    // 按照数据种类提取数据
    let Category = [], OrderMonth = [], Sales = [];
    for (let i of arr) {
        Category.push(i[0]);
        OrderMonth.push(i[1]);
        Sales.push(i[2]);
    }
    // 按照类别提取数据
    let OfficeSupplies = [], Technology = [], Furniture = [];
    for (let i of arr) {
        if (i[0] === "Office Supplies")
            OfficeSupplies.push(i);
        if (i[0] === "Technology")
            Technology.push(i);
        if (i[0] === "Furniture")
            Furniture.push(i);
    }
    // 按照月份排序数据
    OfficeSupplies.sort(function(x, y){
        return x[1] - y[1];
    });
    Technology.sort(function(x, y){
        return x[1] - y[1];
    });
    Furniture.sort(function(x, y){
        return x[1] - y[1];
    });

    const color = new Map()
        .set("Office Supplies", "#e84e40")
        .set("Technology", "#5677fc")
        .set("Furniture", "#009688");

    const bgcolor = new Map()
        .set("Office Supplies", "#f9bdbb")
        .set("Technology", "#d0d9ff")
        .set("Furniture", "#b2dfdb");

    // 给坐标轴预留出来空白
    const padding = {left:80, right:80, top:20, bottom:20};
    // 定义坐标轴的比例尺
    let xScale = d3.scale.linear()
        .domain(d3.extent(OrderMonth))
        .range([0, width - padding.left - padding.right]);
    let yScale = d3.scale.linear()
        .domain([0, d3.max(Sales)])
        .range([height - padding.top - padding.bottom, 0]);

    // 定义坐标轴
    const xAxis = d3.svg.axis().scale(xScale).orient('bottom');
    const yAxis = d3.svg.axis().scale(yScale).orient('left');

    // 添加坐标轴
    svg.append('g')
        .attr('class', 'axis')
        .attr("transform","translate(" + padding.left + "," + (height - padding.bottom) + ")")
        .call(xAxis)
        // 增加坐标值说明
        .append('text')
        .text('月份')
        .attr('transform', "translate(" + (width - padding.left - padding.right) + ", -5)");
    svg.append('g')
        .attr('class', 'axis')
        .attr("transform","translate(" + padding.left + "," + padding.top + ")")
        .call(yAxis)
        // 增加坐标值说明
        .append('text')
        .text("销售量")
        .attr('transform', "translate(-34, -10)");

    //路径生成器
    let line = d3.svg.line()
        .x(function(d) { return xScale(d[1]) + padding.left; })
        .y(function(d) { return yScale(d[2]) + padding.top; })
        .interpolate("linear"); // monotone -> 平滑

    // 向svg添加线条
    svg.append('path')
        .data(arr)
        .attr("fill", "transparent")
        .attr("stroke", color.get("Office Supplies"))
        .attr('stroke-width', 2)
        .attr('d', line(OfficeSupplies));
    svg.append('path')
        .data(arr)
        .attr("fill", "transparent")
        .attr("stroke", color.get("Technology"))
        .attr('stroke-width', 2)
        .attr('d', line(Technology));
    svg.append('path')
        .data(arr)
        .attr("fill", "transparent")
        .attr("stroke", color.get("Furniture"))
        .attr('stroke-width', 2)
        .attr('d', line(Furniture));

    let circle = svg.selectAll('circle')
        .data(arr)
        .enter()
        .append('g')
        .append('circle')
        .attr('fill', function (d) {
            return color.get(d[0])
        })
        .attr('cx', line.x())
        .attr('cy', line.y())
        .attr('r', 4);

    circle.on('mouseover', function(d) {
            d3.select(this).transition().duration(5).attr('r', 6);

            const location = this.getBoundingClientRect();
            const top  = location.top;
            const left = (location.left > document.body.clientWidth - 200)
                ? location.left - 226
                : location.left + 2;

            // 更新提示条的位置和值，并显示提示条
            d3.select("#tooltip-line").style("display", "block")
                .style("left", (left + 5) + "px")
                .style("top", (top + 5) + "px")
                .style("background-color", bgcolor.get(d[0]));

            // 填充数据
            d3.select("#Month-line")
                .text(d[1]);
            d3.select("#Category-line")
                .text(d[0]);
            d3.select("#Sales-line")
                .text(parseInt(d[2]));
        })
        .on('mouseout', function() {
            d3.select(this).transition().duration(5).attr('r', 4);
            // 隐藏提示条
            d3.select("#tooltip-line").style("display", "none");
        });

    circle.on("click", function (d) {
        updateMap(d[0]);
    })
}

function updateMap(Category) {
    // 计算每一个子类别对应的总营销额以及利润
    let mapArr = [];
    for (let d of srcData){
        let hasSubCategory = false;
        for (let a of mapArr) {
            if ( d.State === a[0] && d.Category === a[3] ) {
                a[1] += Number(d.Sales);
                a[2] += Number(d.Profit);
                hasSubCategory = true;
            }
        }
        if (!hasSubCategory) {
            let newArr = [d.State, Number(d.Sales), Number(d.Profit), d.Category];
            mapArr.push(newArr);
        }
    }

    let arr = [];
    for (let d of mapArr) {
        if (d[3] === Category)
            arr.push(d);
    }

    mapSvg.selectAll("circle")
        .data(arr)
        .transition().duration(500)
        .attr('r', function (d) {
            let sales = Math.abs(d[1]);
            return radius(sales);
        })
        .transition().duration(500)
        .attr("fill", function(d) {
            let profit = Math.log(Math.abs(d[2]));
            if (d[2] > 0)
                return color(profit);
            else
                return color(-profit);
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