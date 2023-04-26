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
            info: {
                error: 0,
            },
            step1: {
                pointList: [],
                timeConsuming: 0,
                totalPoint: 0,
                // 面积占比
                coverAreaPercent: "0",
            },
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
                coverAreaPercent: 0,
                finalPoint: 0,
            },
            step5: {
                // 移除的数量
                removeNum: 0,
                // 随机移除的圆
                removeList: [],
                // 最终保留的圆
                retainList: [],
                timeConsuming: 0,
                coverAreaPercent: 0,
                finalPoint: 0,
            },
            coverAreaPercent: 0,
            config: {
                width: 175 * 1,
                height: 175 * 1,
                // ! 整数 圆心坐标保留小数点几位 不能为负数
                decimal: 1,
                minPointNum: 8,
                minDistance: 0.002,
                maxDistance: 0.004,
                // 半径
                pointRadius: 3.5,
                // 最大面积占比(0,1] 生成的圆形占比的面积占比不超过该数目
                maxPercent: 0.60,
                // 移除边界点的概率 无法百分百保证 概率
                removeBoundaryPercent: 0,
            },
        });

        setTimeout(async () => {
            // 矿都 高度 精度 [正整数]
            const {
                width,
                height,
                decimal,
                minPointNum,
                minDistance,
                maxDistance,
                pointRadius,
                removeBoundaryPercent,
                maxPercent,
            } = form.config;
            // 总共有效圆的数目
            let totalPoint = 0;

            ALL.log("\r\n==== start =====");

            form.info.error = 0;

            // *********************** step 1 ****************
            let start = Date.now();

            let chart: any = document.getElementById("chart-step1");
            let ctx = chart.getContext("2d");

            // 绘制出区域 [0,0] - [1000,1000]
            ctx.strokeStyle = "#fa541c";
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.closePath();

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

            let pointAllList: any = [];
            let pointId = 0;

            const addPoint = (x: number, y: number) => {
                // ! 随机生成的圆心坐标 x,y
                if (x < 0 || y < 0 || x > width || y > height) {
                    return -1;
                }
                // 随机生成一个间距 随机的关键
                const distance2 =
                    (minDistance +
                        Math.random() * (maxDistance - minDistance) +
                        2 * pointRadius) **
                    2;
                // 快速定位区间
                const columnX = parseInt(x / pointRadius + "");
                const columnY = parseInt(y / pointRadius + "");
                let list = [];

                for (let p = columnX - 2; p <= columnX + 2; p++) {
                    // 阈值
                    if (p < 0 || p >= arrXLen) {
                        continue;
                    }
                    list = pointXList[p];
                    for (let d = 0, len = list.length; d < len; d++) {
                        const distance =
                            (list[d].x - x) ** 2 +
                            (list[d].y - y) ** 2 -
                            distance2;
                        if (0 > distance) {
                            // 出现相交
                            return -2;
                        }
                    }
                }
                let raw = { x, y, id: pointId++ };
                try {
                    pointAllList.push(raw),
                        pointYList[columnY].push(raw),
                        pointXList[columnX].push(raw),
                        totalPoint++;
                } catch (error) {
                    // 此处可能抛异常
                    console.log(error);
                    form.info.error++;
                }

                return 0;
            };

            for (let y = pointRadius * 0; y <= height; ) {
                const yDistance =
                    Math.random() * (height / (height / pointRadius) ** 1.6);
                const max = width * 10 ** decimal * 2;
                ALL.log("正在尝试", y, y + yDistance, max);
                if (0.5 < Math.random()) {
                    continue;
                }
                for (let num = 0; num <= max; num++) {
                    // x 缓缓递增
                    const x1 = parseFloat(
                        (width * Math.random()).toFixed(decimal)
                    );
                    const y1 = parseFloat(
                        (y + Math.random() * yDistance).toFixed(decimal)
                    );
                    if (0.5 < Math.random()) {
                        continue;
                    }
                    addPoint(x1, y1);
                }
                y += yDistance;
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

            ALL.log(pointAllList, pointXList, pointYList);
            ALL.log("==== end =====");
            ALL.log("==============");
            form.step1.coverAreaPercent = (
                ((Math.PI * pointRadius ** 2 * totalPoint) / (width * height)) *
                100
            ).toFixed(4);
            form.step1.totalPoint = totalPoint;
            form.step1.pointList = JSON.parse(JSON.stringify(pointAllList));
            form.step1.timeConsuming = Date.now() - start;

            await ALL.sleep(300);

            // *****************step2 挑选边界圆 ********************

            start = Date.now();
            // pointBoundaryList 边界圆心
            // pointHoldList 非边界圆心
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
                    x < pointRadius ||
                    x > width - pointRadius ||
                    y < pointRadius ||
                    y > height - pointRadius
                ) {
                    // 边界圆
                    pointBoundaryList.push(item);
                    ctx.beginPath();
                    ctx.arc(x, y, pointRadius, 0, 360, false);
                    ctx.fill(); //画实心圆
                    ctx.closePath();
                } else {
                    // 非边界圆心
                    pointHoldList.push(item);
                }
            });

            ALL.log(
                pointAllList.length,
                pointBoundaryList.length,
                "====",
                pointHoldList.length
            );

            form.step2.pointBoundaryList = JSON.parse(
                JSON.stringify(pointBoundaryList)
            );
            form.step2.pointHoldList = JSON.parse(
                JSON.stringify(pointHoldList)
            );
            form.step2.timeConsuming = Date.now() - start;

            // *********************** 随机移除圆 step3 ***************************
            start = Date.now();
            chart = document.getElementById("chart-step3");
            ctx = chart.getContext("2d");
            // 绘制出区域
            ctx.strokeStyle = "#fa541c";
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = "#1890ff";

            let retainList: any = [];

            const allowPoint = (item: any) => {
                const { x, y, id } = item;
                // 随机生成一个间距 随机的关键
                const distance2 = (minDistance + 2 * pointRadius) ** 2;
                const columnX = parseInt(x / pointRadius + "");
                let list = [];
                for (let p = columnX - 2; p <= columnX + 2; p++) {
                    if (p < 0 || p >= arrXLen) {
                        continue;
                    }
                    list = pointXList[p];
                    for (let d = 0, len = list.length; d < len; d++) {
                        const comparePoint = list[d];
                        if (
                            1 === comparePoint.remove ||
                            comparePoint.id == id
                        ) {
                            // 这个点已被标记为删除
                            // 这个点和自己是同一个点
                            continue;
                        }
                        const distance =
                            (comparePoint.x - x) ** 2 +
                            (comparePoint.y - y) ** 2 -
                            distance2;
                        if (0 > distance) {
                            // 与已经存在的圆产生冲突
                            // 绘制冲突圆
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
                            return -2;
                        }
                    }
                }
                return 0;
            };

            // 开始遍历所有边界圆
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
                ctx.fill();
                ctx.closePath();
                // 虚拟点
                const vPoint: any = [];
                // 先添加自己本身所在的位置
                vPoint.push(item);
                // ! 处于边角时会出现2个虚拟点
                // 处于x轴左边
                x < pointRadius &&
                    vPoint.push({
                        x: x + width,
                        y,
                        id: pointId++,
                        rawId: id,
                        position: "xRight",
                    });
                // 处于x轴右边
                x > width - pointRadius &&
                    vPoint.push({
                        x: x - width,
                        y,
                        id: pointId++,
                        rawId: id,
                        position: "xLeft",
                    });
                // 处于y轴上边
                y < pointRadius &&
                    vPoint.push({
                        x,
                        y: y + height,
                        id: pointId++,
                        rawId: id,
                        position: "yBottom",
                    });
                // 处于y轴下边
                y > height - pointRadius &&
                    vPoint.push({
                        x,
                        y: y - height,
                        id: pointId++,
                        rawId: id,
                        position: "yTop",
                    });

                if (2 < vPoint.length) {
                    // 对称位置 镜像位置
                    let [_x, _y] = [x, y];
                    x < pointRadius && (_x = x + width);
                    x > width - pointRadius && (_x = x - width);
                    y < pointRadius && (_y = y + height);
                    y > width - pointRadius && (_y = y - height);
                    vPoint.push({
                        x: _x,
                        y: _y,
                        id: pointId++,
                        rawId: id,
                        position: "x_y",
                    });
                }
                for (let t = 0, len = vPoint.length; t < len; t++) {
                    0 == allowPoint(vPoint[t]) || (item.remove = 1);
                }
                if (1 === item.remove) {
                    return;
                }

                // 成功保留
                retainList.push(item);
                // 把虚拟圆添加进来
                vPoint.map((obj: any) => {
                    const { position = -1, x, y } = obj || {};
                    if (-1 == position) {
                        return;
                    }
                    let columnX = parseInt(x / pointRadius + "");
                    let columnY = parseInt(y / pointRadius + "");
                    columnX < 0 && (columnX = 0);
                    columnX >= arrXLen && (columnX = arrXLen - 1);
                    columnY < 0 && (columnY = 0);
                    columnY >= arrXLen && (columnY = arrYLen - 1);
                    pointAllList.push(obj);
                    pointXList[columnX].push(obj);
                    pointYList[columnY].push(obj);
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
                        if (1 === item.remove) {
                            return;
                        }
                        finalList.push(item);
                        ctx.beginPath();
                        ctx.arc(item.x, item.y, pointRadius, 0, 360, false);
                        ctx.fill();
                        ctx.closePath();
                    });
            });

            let finalPoint =
                form.step2.pointHoldList.length + form.step3.retainList.length;
            form.step4.pointAllList = JSON.parse(JSON.stringify(finalList));
            form.step4.timeConsuming = Date.now() - start;
            form.step4.finalPoint = finalPoint;
            form.step4.coverAreaPercent = (
                ((Math.PI * pointRadius ** 2 * finalPoint) / (width * height)) *
                100
            ).toFixed(4);

            // ****************step5 符合面积占比 ******************
            start = Date.now();
            chart = document.getElementById("chart-step5");
            ctx = chart.getContext("2d");

            // 绘制出区域 [0,0] - [1000,1000]
            ctx.strokeStyle = "#fa541c";
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = "#1890ff";

            let areaPercent = parseFloat(maxPercent);
            areaPercent = 0 < areaPercent && areaPercent <= 1 ? areaPercent : 1;
            // 求得最大的圆数目
            let maxPointNum = Math.floor(
                (width * height * areaPercent) / (Math.PI * pointRadius ** 2)
            );

            let removeList: any = [];
            let removeNum = 0;

            if (maxPointNum < finalPoint && finalList.length >= finalPoint) {
                // ! 需要随机移除
                for (let i = 0; i < finalPoint - maxPointNum; i++) {
                    //
                    let item =
                        finalList[Math.floor(finalList.length * Math.random())];
                    let { rawId = -1, id = null } = item;
                    let target = 0 <= rawId ? rawId : id;
                    finalList = finalList.filter((obj: any) => {
                        let res = target == obj.id || target == obj.rawId;
                        res && removeList.push(obj);
                        return !res;
                    });
                }
                removeNum = finalPoint - maxPointNum;
            }

            finalList.map((item: any) => {
                ctx.beginPath();
                ctx.arc(item.x, item.y, pointRadius, 0, 360, false);
                ctx.fill();
                ctx.closePath();
            });

            form.step5.removeList = removeList;
            form.step5.retainList = finalList;
            form.step5.timeConsuming = Date.now() - start;
            form.step5.removeNum = removeNum;
            form.step5.finalPoint = finalPoint - removeNum;
            form.step5.coverAreaPercent = (
                ((Math.PI * pointRadius ** 2 * (finalPoint - removeNum)) /
                    (width * height)) *
                100
            ).toFixed(4);

            form.coverAreaPercent = form.step5.coverAreaPercent;

            if (form.step4.coverAreaPercent < 65) {
                setTimeout(() => {
                    // window.location.reload();
                }, 100);
            }
            ALL.log(form);
        }, 800);
        const goRefresh = () => {
            if (5 < window.location.href.indexOf("github.io")) {
                window.location.href =
                    "https://tangtaoshadow.github.io/fiber-studio/";
            } else {
                window.location.reload();
            }
        };
        return { form, goRefresh };
    },
};
</script>

<template>
    <div
        style="
            background: #161b22;
            color: #52c41a;
            text-align: left;
            border-radius: 8px;
            padding: 10px 32px;
            margin: 10px 0px 50px;
        "
    >
        <div style="padding: 10px 0px">
            <button
                class="pointer rotate-scale-down"
                style="
                    background: #fa541c;
                    padding: 16px 20px;
                    border: none;
                    font-size: 20px;
                    color: #fff;
                    border-radius: 8px;
                "
                @click="goRefresh"
            >
                重新运行 💦
            </button>
            <span
                v-if="0 < form.coverAreaPercent"
                style="padding-left: 16px; font-size: 24px"
            >
                {{ form.coverAreaPercent }} %
            </span>
        </div>
        <div
            style="
                margin-top: 30px;
                font-size: 20px;
                font-weight: 600;
                border-left: 4px solid #cf1322;
                padding-left: 5px;
                color: #f5222d;
            "
            v-if="0 < form.info.error"
        >
            <span style="color: #cf1322"
                >❌❌❌❌❌❌❌❌❌❌❌❌ 计算过程发生错误,建议丢弃数据
                ❌❌❌❌❌❌❌❌❌❌❌❌</span
            >
        </div>
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
            <span style="padding: 4px 4px 4px 10px">
                绘制随机实心图分布 🔥
            </span>
        </div>

        <div style="text-align: left; width: 100%; padding: 20px 0px 30px">
            <canvas
                id="chart-step1"
                :width="form.config.width"
                :height="form.config.height"
            />
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
            矩形区域 X {{ form.config.width }} , Y {{ form.config.height }} ,
            圆的半径 {{ form.config.pointRadius }} , 间距为 [
            {{ form.config.minDistance }},
            {{ form.config.maxDistance }}
            ] ,
            <br />
            共生成 {{ form.step1.totalPoint }} 个圆 , 耗时{{
                form.step1.timeConsuming
            }}
            ms , 面积占比 {{ form.step1.coverAreaPercent }}%
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
            <canvas
                id="chart-step2"
                :width="form.config.width"
                :height="form.config.height"
            />
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
            <canvas
                id="chart-step3"
                :width="form.config.width"
                :height="form.config.height"
            />
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
            移除边界点的概率为 {{ form.config.removeBoundaryPercent * 100 }} % ,
            共移除
            {{
                form.step2.pointBoundaryList.length -
                form.step3.retainList.length
            }}
            个边界圆 , 最终保留的边界圆共 {{ form.step3.retainList.length }} 个
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
            <span style="padding: 4px 4px 4px 10px"> 边界合成图 </span>
        </div>
        <div style="text-align: left; width: 100%; padding: 20px 0px 30px">
            <canvas
                id="chart-step4"
                :width="form.config.width"
                :height="form.config.height"
            />
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
            共保留
            {{ form.step4.finalPoint }}
            个圆 , 耗时{{ form.step4.timeConsuming }} ms, 面积占比
            {{ form.step4.coverAreaPercent }}%
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

        <!--  -->
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
                STEP5
            </span>
            <span style="padding: 4px 4px 4px 10px"> 最终合成图 </span>
        </div>
        <div style="text-align: left; width: 100%; padding: 20px 0px 30px">
            <canvas
                id="chart-step5"
                :width="form.config.width"
                :height="form.config.height"
            />
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
            设定最大百分比
            {{ parseInt(form.config.maxPercent * 1000000) / 10000 }} % , 耗时{{
                form.step5.timeConsuming
            }}
            ms, 移除 {{ form.step5.removeNum }} 个圆 , 最终保留
            {{ form.step5.finalPoint }} 个圆 , 面积占比为
            {{ form.step5.coverAreaPercent }} %
        </div>
        <div style="padding: 10px 0px">移除的圆心分布如下:</div>
        <div style="padding: 10px 0px">
            <json-viewer
                :value="form.step5.removeList"
                style="background: #95de64"
                copyable
                boxed
                sort
            />
        </div>
        <div style="padding: 10px 0px">最后保留的圆心分布如下:</div>
        <div style="padding: 10px 0px">
            <json-viewer
                :value="form.step5.retainList"
                style="background: #95de64"
                copyable
                boxed
                sort
            />
        </div>
    </div>
</template>

<style lang="css" scoped>
/* 鼠标放上去 */
.pointer:hover {
    cursor: pointer;
}

.rotate-scale-down {
    -webkit-animation: rotate-scale-down 0.65s linear both;
    animation: rotate-scale-down 0.65s linear both;
}

/**
 * ----------------------------------------
 * animation rotate-scale-down
 * ----------------------------------------
 */
@-webkit-keyframes rotate-scale-down {
    0% {
        -webkit-transform: scale(1) rotateZ(0);
        transform: scale(1) rotateZ(0);
    }
    50% {
        -webkit-transform: scale(0.5) rotateZ(180deg);
        transform: scale(0.5) rotateZ(180deg);
    }
    100% {
        -webkit-transform: scale(1) rotateZ(360deg);
        transform: scale(1) rotateZ(360deg);
    }
}
@keyframes rotate-scale-down {
    0% {
        -webkit-transform: scale(1) rotateZ(0);
        transform: scale(1) rotateZ(0);
    }
    50% {
        -webkit-transform: scale(0.5) rotateZ(180deg);
        transform: scale(0.5) rotateZ(180deg);
    }
    100% {
        -webkit-transform: scale(1) rotateZ(360deg);
        transform: scale(1) rotateZ(360deg);
    }
}
</style>
