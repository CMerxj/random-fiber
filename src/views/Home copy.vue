<script lang="ts">
import ALL from "../utils/common";
import { reactive } from "vue";

export default {
    name: "home",
    components: {
        //
    },
    setup() {
        const form: any = reactive({
            timeConsuming: 0,
            totalPoint: 0,
            // 面积占比
            coverAreaPercent: "0",
            step1: {
                pointList: [],
            },
            removeBoundaryPercent: 0.2,
            step2: {
                // 边界
                pointBoundaryList: [],
                // 保留
                pointHoldList: [],
                timeConsuming: 0,
            },
            step3: {
                // 产生冲突 或者 随机移除的点
                removeList: [],
                // 保留的点
                retainList: [],
                timeConsuming: 0,
            },
            step4: {
                pointAllList: [],
                timeConsuming: 0,
            },
        });

        setTimeout(async () => {
            // 矿都 高度 精度 [正整数]
            const [width, height, decimal, minPointNum] = [70, 70, 6, 8];
            // 总共有效圆的数目
            let totalPoint = 0;
            // 移除边界点的概率 无法百分百保证 概率
            const removeBoundaryPercent = 0.4;
            form.removeBoundaryPercent = removeBoundaryPercent;

            // 圆的半径 [正整数]
            const pointRadius = 3.5;
            const pointRadius2 = (pointRadius * 2) ** 2;

            ALL.log("\r\n==== start =====");

            // *********************** step 1 ****************
            let start = Date.now();

            let chart: any = document.getElementById("chart-step1");
            let ctx = chart.getContext("2d");

            // 绘制出区域 [0,0] - [1000,1000]
            ctx.strokeStyle = "#fa541c";
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.closePath();

            // ctx.save();

            // ctx.lineWidth = 1;
            // for (let i = 0; i < width; i += pointRadius) {
            //     ctx.beginPath();
            //     ctx.moveTo(i, 0);
            //     ctx.lineTo(i, height);
            //     ctx.stroke();
            //     ctx.closePath();
            // }

            // 画一个实心圆
            // ctx.fillStyle = "#0f0"; //填充颜色,默认是黑色
            // let t = [
            //     [990, 271],
            //     // [979, 425],
            //     // [971, 807],
            //     [974, 271],
            //     // [975, 666],
            // ];

            // t.map((item) => {
            //     ctx.beginPath();
            //     ctx.arc(item[0], item[1], pointRadius, 0, 360, false);
            //     ctx.fill(); //画实心圆
            //     ctx.closePath();
            // });

            ctx.fillStyle = "#1890ff"; //填充颜色,默认是黑色

            let arrXLen = width / pointRadius;
            let pointXList: any = new Array(arrXLen);
            for (let i = 0; i < arrXLen; i++) {
                pointXList[i] = [];
            }

            let arrYLen = height / pointRadius;
            let pointYList: any = new Array(arrYLen);
            for (let i = 0; i < arrYLen; i++) {
                pointYList[i] = [];
            }

            //
            let pointAllList: any = [];
            let pointId = 0;

            const addPoint = (x: number, y: number) => {
                //
                if (x < 0 || y < 0 || x > width || y > height) {
                    return -1;
                }

                // 快速定位区间
                const column = parseInt(x / pointRadius + "");
                const columnY = parseInt(y / pointRadius + "");

                let list = [];

                for (let p = column - 2; p < column + 2; p++) {
                    // 阈值
                    if (p < 0 || p >= arrXLen) {
                        continue;
                    }
                    list = pointXList[p];
                    for (let d = 0, len = list.length; d < len; d++) {
                        const distance =
                            (list[d].x - x) ** 2 +
                            (list[d].y - y) ** 2 -
                            pointRadius2 -
                            0;
                        // ALL.log("distance", distance, list[d], x, y);
                        if (0 > distance) {
                            // 出现相交
                            return -2;
                        }
                    }
                }

                let raw = { x: x, y: y, id: pointId++ };
                // ALL.log(typeof pointAllList);
                try {
                    pointAllList.push(raw),
                        pointYList[columnY].push(raw),
                        pointXList[column].push(raw),
                        totalPoint++;
                } catch (error) {
                    // 此处可能抛异常
                    console.log(error);
                }

                return 0;
            };

            // ! 随机生成圆
            for (; totalPoint < minPointNum; ) {
                //
                const x = parseFloat((Math.random() * width).toFixed(decimal));
                const y = parseFloat((Math.random() * height).toFixed(decimal));
                addPoint(x, y);
            }

            // 开始绘制圆形
            // 画一个实心圆
            // 填充颜色
            ctx.fillStyle = "#1890ff";
            pointXList.map((list: any) => {
                list.map((point: any) => {
                    ctx.beginPath();
                    ctx.arc(point.x, point.y, pointRadius, 0, 360, false);
                    ctx.fill(); //画实心圆
                    ctx.closePath();
                });
            });

            ALL.log(pointXList, pointYList);
            ALL.log("==== end =====");
            ALL.log("==============");
            form.coverAreaPercent = (
                ((Math.PI * pointRadius ** 2 * totalPoint) / (width * height)) *
                100
            ).toFixed(4);
            form.totalPoint = totalPoint;
            form.step1.pointList = JSON.parse(JSON.stringify(pointAllList));
            form.timeConsuming = Date.now() - start;

            // ************** step2 ****************
            start = Date.now();

            let [pointBoundaryList, pointHoldList]: any[] = [[], []];

            chart = document.getElementById("chart-step2");
            ctx = chart.getContext("2d");

            // 绘制出区域 [0,0] - [1000,1000]
            ctx.strokeStyle = "#fa541c";
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = "#1890ff";

            pointAllList.map((item: any) => {
                const { x, y } = item;
                // 最上 右 下 左 边边界
                if (
                    0 > y - pointRadius ||
                    width < x + pointRadius ||
                    height < y + pointRadius ||
                    0 > x - pointRadius
                ) {
                    // 边界圆
                    pointBoundaryList.push(item);
                    ctx.beginPath();
                    ctx.arc(x, y, pointRadius, 0, 360, false);
                    ctx.fill(); //画实心圆
                    ctx.closePath();
                } else {
                    pointHoldList.push(item);
                }
            });
            form.step2.pointBoundaryList = JSON.parse(
                JSON.stringify(pointBoundaryList)
            );
            form.step2.pointHoldList = JSON.parse(
                JSON.stringify(pointHoldList)
            );
            form.step2.timeConsuming = Date.now() - start;

            // *********************** step3 ***************************
            start = Date.now();
            chart = document.getElementById("chart-step3");
            ctx = chart.getContext("2d");

            // 绘制出区域 [0,0] - [1000,1000]
            ctx.strokeStyle = "#fa541c";
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = "#1890ff";

            let retainList: any = [];
            pointBoundaryList.map((item: any) => {
                const { x, y, id } = item;
                if (removeBoundaryPercent > Math.random()) {
                    // 移除出去
                    item.remove = 1;
                    return false;
                }
                // ! 选择保留 看看允不允许保留
                ctx.beginPath();
                ctx.arc(x, y, pointRadius, 0, 360, false);
                ctx.fill(); //画实心圆
                ctx.closePath();
                // 虚拟点
                const virtualPoint: any = [];
                // 先比较 x轴
                const columnX = parseInt(x / pointRadius + "");
                for (let p = columnX - 1; p < columnX + 2; p++) {
                    ctx.fillStyle = "#1890ff";

                    // 遇到边界就要重新调整
                    let [index] = [p];
                    let [x1, y1] = [x, y];
                    0 > p && ((index = arrXLen - 1), (x1 = width + x));
                    arrXLen <= p && ((index = 0), (x1 = x - width));

                    // 记住虚拟点 自己不记住
                    (x == x1 && y == y1) ||
                        virtualPoint.push({
                            x: x1,
                            y: y1,
                            isVirtual: 1,
                            id: pointId++,
                        });

                    let list = pointXList[index];
                    // 是否保留 默认保留
                    let isRetain = 0;
                    for (let d = 0, len = list.length; d < len; d++) {
                        const comparePoint = list[d];
                        if (
                            1 === comparePoint.remove ||
                            comparePoint.id == id
                        ) {
                            // 这个点已被标记为删除 可以忽略
                            continue;
                        }
                        if (
                            0 >
                            (comparePoint.x - x1) ** 2 +
                                (comparePoint.y - y1) ** 2 -
                                pointRadius2
                        ) {
                            isRetain = -1;
                            // ALL.log("边界点出现相交----------", {
                            //     comparePoint,
                            //     x1,
                            //     y1,
                            // });
                            // 标记出相交的圆
                            ctx.fillStyle = "#f5222d";
                            ctx.beginPath();
                            ctx.arc(
                                comparePoint.x,
                                comparePoint.y,
                                pointRadius,
                                0,
                                360,
                                false
                            );
                            ctx.fill();
                            ctx.closePath();
                            ctx.fillStyle = "#722ed1";
                            ctx.beginPath();
                            ctx.arc(x, y, pointRadius, 0, 360, false);
                            ctx.fill();
                            ctx.closePath();

                            item.remove = 1;
                            break;
                        }
                    }

                    // 如果出现相交
                    (0 != isRetain || 1 === item.remove) &&
                        (ctx.fillStyle = "#722ed1");
                    ctx.beginPath();
                    ctx.arc(x1, y1, pointRadius, 0, 360, false);
                    ctx.fill();
                    ctx.closePath();
                }

                // 保留 x 轴未冲突的点
                if (1 === item.remove) {
                    return;
                }

                // 开始比较 y 轴
                const columnY = parseInt(y / pointRadius + "");
                for (let p = columnY - 1; p < columnY + 2; p++) {
                    ctx.fillStyle = "#1890ff";
                    // 遇到边界就要重新调整
                    let [index] = [p];
                    let [x1, y1] = [x, y];
                    0 > p && ((index = arrYLen - 1), (y1 = height + y));
                    arrYLen <= p && ((index = 0), (y1 = y - height));
                    // 记住虚拟点 自己不记住
                    (x == x1 && y == y1) ||
                        virtualPoint.push({
                            x: x1,
                            y: y1,
                            isVirtual: 1,
                            id: pointId++,
                        });

                    let list = pointYList[index];
                    // 是否保留 默认保留
                    let isRetain = 0;
                    for (let d = 0, len = list.length; d < len; d++) {
                        const comparePoint = list[d];
                        if (
                            1 === comparePoint.remove ||
                            comparePoint.id == id
                        ) {
                            // 这个点已被标记为删除 可以忽略
                            continue;
                        }
                        if (
                            0 >
                            (comparePoint.x - x1) ** 2 +
                                (comparePoint.y - y1) ** 2 -
                                pointRadius2
                        ) {
                            isRetain = -1;
                            // ALL.log("边界点出现相交----------", {
                            //     comparePoint,
                            //     x1,
                            //     y1,
                            // });
                            // 标记出相交的圆
                            ctx.fillStyle = "#f5222d";
                            ctx.beginPath();
                            ctx.arc(
                                comparePoint.x,
                                comparePoint.y,
                                pointRadius,
                                0,
                                360,
                                false
                            );
                            ctx.fill();
                            ctx.closePath();
                            ctx.fillStyle = "#722ed1";
                            ctx.beginPath();
                            ctx.arc(x, y, pointRadius, 0, 360, false);
                            ctx.fill();
                            ctx.closePath();

                            item.remove = 1;
                            break;
                        }
                    }

                    // 如果出现相交
                    (0 != isRetain || 1 === item.remove) &&
                        (ctx.fillStyle = "#722ed1");
                    ctx.beginPath();
                    ctx.arc(x1, y1, pointRadius, 0, 360, false);
                    ctx.fill();
                    ctx.closePath();
                }

                if (1 === item.remove) {
                    // 已经被标记为删除
                    return;
                }

                retainList.push(item);
                virtualPoint.map((m: any) => {
                    let raw = { x: m.x, y: m.y, id: m.id, isVirtual: 1 };
                    // ! 确认添加的 需要补上无冲突点
                    const [xIndex, yIndex] = [
                        parseInt(m.x / pointRadius + ""),
                        parseInt(m.y / pointRadius + ""),
                    ];
                    // 因为是边界点 可能有超出边界
                    Array.isArray(pointXList[xIndex]) ||
                        ((pointXList[xIndex] = []),
                        (arrXLen = pointXList.length));
                    Array.isArray(pointYList[yIndex]) ||
                        ((pointYList[yIndex] = []),
                        (arrYLen = pointYList.length));
                    pointAllList.push(raw);
                    pointXList[xIndex].push(raw);
                    pointYList[yIndex].push(raw);
                });
            });

            form.step3.retainList = JSON.parse(JSON.stringify(retainList));
            form.step3.timeConsuming = Date.now() - start;

            // *********************** step4 **************************
            start = Date.now();
            chart = document.getElementById("chart-step4");
            ctx = chart.getContext("2d");

            // 绘制出区域 [0,0] - [1000,1000]
            ctx.strokeStyle = "#fa541c";
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = "#1890ff";
            let finalList: any = [];
            pointXList.map((xList: any) => {
                !!xList &&
                    xList.map((item: any) => {
                        finalList.push(item);
                        ctx.beginPath();
                        ctx.arc(item.x, item.y, pointRadius, 0, 360, false);
                        ctx.fill();
                        ctx.closePath();
                    });
            });

            form.step4.pointAllList = JSON.parse(JSON.stringify(finalList));
            form.step4.timeConsuming = Date.now() - start;

            ALL.log(form);
        }, 300);
        return { form };
    },
};
</script>

<template>
    <div
        style="
            background: #000;
            color: #52c41a;
            text-align: left;
            border-radius: 8px;
            padding: 10px 32px;
        "
    >
        <div
            style="
                margin-top: 30px;
                font-size: 20px;
                font-weight: 600;
                border-left: 4px solid #fa541c;
                padding-left: 5px;
                color: #fa541c;
            "
        >
            <span
                style="
                    padding: 4px 4px;
                    border-radius: 4px;
                    background: #fa541c;
                    color: #fff;
                "
            >
                STEP1
            </span>
            <span style="padding: 4px 4px 4px 10px"> 绘制随机实心图分布 </span>
        </div>

        <div style="text-align: left; width: 100%; padding: 20px 0px 30px">
            <canvas id="chart-step1" width="1000" height="1000" />
        </div>
        <div
            style="
                font-size: 20px;
                font-weight: 600;
                border-left: 4px solid #52c41a;
                padding-left: 5px;
            "
        >
            生成报告
        </div>
        <div style="padding: 10px 0px">
            共生成 {{ form.totalPoint }} 个圆 , 耗时{{ form.timeConsuming }} ms
            , 面积占比 {{ form.coverAreaPercent }}%
        </div>
        <div style="padding: 10px 0px">随机圆分布如下:</div>
        <div style="padding: 10px 0px">
            <json-viewer
                :value="form.step1.pointList"
                style="background: #95de64"
                copyable
                boxed
                sort
            />
        </div>

        <div
            style="
                margin-top: 60px;
                font-size: 20px;
                font-weight: 600;
                border-left: 4px solid #fa541c;
                padding-left: 5px;
                color: #fa541c;
            "
        >
            <span
                style="
                    padding: 4px 4px;
                    border-radius: 4px;
                    background: #fa541c;
                    color: #fff;
                "
            >
                STEP2
            </span>
            <span style="padding: 4px 4px 4px 10px"> 选出边界实心圆 </span>
        </div>

        <div style="text-align: left; width: 100%; padding: 20px 0px 30px">
            <canvas id="chart-step2" width="1000" height="1000" />
        </div>

        <div
            style="
                font-size: 20px;
                font-weight: 600;
                border-left: 4px solid #52c41a;
                padding-left: 5px;
            "
        >
            生成报告
        </div>
        <div style="padding: 10px 0px">
            共找到 {{ form.step2.pointBoundaryList.length }} 个圆分布在边界上 ,
            耗时{{ form.step2.timeConsuming }} ms
        </div>
        <div style="padding: 10px 0px">边界圆分布如下:</div>
        <div style="padding: 10px 0px">
            <json-viewer
                :value="form.step2.pointBoundaryList"
                style="background: #95de64"
                copyable
                boxed
                sort
            />
        </div>

        <div
            style="
                margin-top: 60px;
                font-size: 20px;
                font-weight: 600;
                border-left: 4px solid #fa541c;
                padding-left: 5px;
                color: #fa541c;
            "
        >
            <span
                style="
                    padding: 4px 4px;
                    border-radius: 4px;
                    background: #fa541c;
                    color: #fff;
                "
            >
                STEP3
            </span>
            <span style="padding: 4px 4px 4px 10px">
                保留边界实心圆,绘制真实边界分布图
            </span>
        </div>

        <div style="padding: 20px 0px">
            <div style="color: ">
                注意: 边界圆与边界圆冲突颜色可能不能准确标记
            </div>
            <div style="color: #722ed1; padding-top: 5px">
                移除圆: 被移除的圆
            </div>
            <div style="color: #f5222d; padding-top: 5px">
                冲突圆: 被移除的圆与该圆产生冲突,冲突圆是保留圆
            </div>
        </div>

        <div style="text-align: left; width: 100%; padding: 20px 0px 30px">
            <canvas id="chart-step3" width="1000" height="1000" />
        </div>

        <div
            style="
                font-size: 20px;
                font-weight: 600;
                border-left: 4px solid #52c41a;
                padding-left: 5px;
            "
        >
            生成报告
        </div>
        <div style="padding: 10px 0px">
            移除边界点的概率为 {{ form.removeBoundaryPercent * 100 }} % , 共移除
            {{
                form.step2.pointBoundaryList.length -
                form.step3.retainList.length
            }}
            个边界圆 , 最终保留的圆共 {{ form.step3.retainList.length }} 个
        </div>
        <div style="padding: 10px 0px">最终保留的边界圆分布如下:</div>
        <div style="padding: 10px 0px">
            <json-viewer
                :value="form.step3.retainList"
                style="background: #95de64"
                copyable
                boxed
                sort
            />
        </div>

        <div
            style="
                margin-top: 60px;
                font-size: 20px;
                font-weight: 600;
                border-left: 4px solid #fa541c;
                padding-left: 5px;
                color: #fa541c;
            "
        >
            <span
                style="
                    padding: 4px 4px;
                    border-radius: 4px;
                    background: #fa541c;
                    color: #fff;
                "
            >
                STEP4
            </span>
            <span style="padding: 4px 4px 4px 10px"> 最终合成图 </span>
        </div>
        <div style="text-align: left; width: 100%; padding: 20px 0px 30px">
            <canvas id="chart-step4" width="1000" height="1000" />
        </div>
        <div
            style="
                font-size: 20px;
                font-weight: 600;
                border-left: 4px solid #52c41a;
                padding-left: 5px;
            "
        >
            生成报告
        </div>
        <div style="padding: 10px 0px">
            共生成 {{ form.step4.pointAllList.length }} 个圆 , 耗时{{
                form.step4.timeConsuming
            }}
            ms
        </div>
        <div style="padding: 10px 0px">随机圆分布如下:</div>
        <div style="padding: 10px 0px">
            <json-viewer
                :value="form.step4.pointAllList"
                style="background: #95de64"
                copyable
                boxed
                sort
            />
        </div>
    </div>
</template>
