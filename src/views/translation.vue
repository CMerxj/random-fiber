<script lang="ts">
import ALL from "../utils/common";
import { reactive } from "vue";

import translationPoint from "@/views/translation-point.js";

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
                pointList: [],
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
                width: 350 * 1,
                height: 350 * 1,
                // ! 建议至少为1 为0可能引发不可预知错误
                decimal: 1,
                minPointNum: 8,
                // 最小间距 与原来保持一致
                minDistance: 0,
                maxDistance: 0.001,
                pointRadius: 35,
                // 随机平移的正方形区域的边长的一半
                rangeDistance: 35,
                // 最大面积占比(0,1] 生成的圆形占比的面积占比不超过该数目
                maxPercent: 0.999,
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
                rangeDistance,
            } = form.config;
            // 总共有效圆的数目
            let totalPoint = 0;

            ALL.log("\r\n==== start =====");

            form.info.error = 0;

            if (!!translationPoint && 0 < translationPoint.length) {
                //
            } else {
                return;
            }

            let chart: any = document.getElementById("chart-step1");
            let ctx = chart.getContext("2d");

            // 绘制出区域 [0,0] - [1000,1000]
            ctx.strokeStyle = "#fa541c";
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = "#1890ff";

            translationPoint.map((item: any) => {
                ctx.beginPath();
                ctx.arc(item.x, item.y, pointRadius, 0, 360, false);
                ctx.fill();
                ctx.closePath();
            });

            form.step1.pointList = JSON.parse(JSON.stringify(translationPoint));

            let pointList = translationPoint;
            let { length: len } = pointList;

            // 寻找出所有的边界点
            pointList.map((item: any) => {
                const { x, y } = item;
                if (
                    x > pointRadius &&
                    x < width - pointRadius &&
                    y > pointRadius &&
                    y < height - pointRadius
                ) {
                    // 非边界点
                    return;
                }
                item.isBoundary = 0;
            });

            const distance2 = (minDistance + 2 * pointRadius) ** 2;
            const allowRemove = (
                list: any = [],
                x: number,
                y: number,
                id: number
            ) => {
                //
                if (!Array.isArray(list)) {
                    return -1;
                }
                if (
                    x > pointRadius &&
                    x < width - pointRadius &&
                    y > pointRadius &&
                    y < height - pointRadius
                ) {
                    // 非边界点
                } else {
                    // ! 处于边界点边缘了
                    return -3;
                }
                let { length: len } = list;
                for (let i = 0; i < len; i++) {
                    let { x: rawX, y: rawY, id: rawId } = list[i];
                    if (id == rawId) {
                        // 与自己比较 忽略
                        continue;
                    }
                    if (0 > (rawX - x) ** 2 + (rawY - y) ** 2 - distance2) {
                        // 出现相交
                        return -2;
                    }
                }
                return 0;
            };

            ALL.log(pointList);
            for (let i = 0; i < len * 3; i++) {
                // ! 随机挑选出一个圆心出来
                let item: any =
                    pointList[Math.floor(Math.random() * pointList.length)];
                let { isBoundary, x, y, id, isMove } = item;
                if (0 === isBoundary || 0 === isMove) {
                    // 跳过边界点 | 已经移动了
                    continue;
                }

                // ****** 尝试随机移动 ********
                for (
                    let num = Math.max(rangeDistance / 0.01, 10);
                    num > 0;
                    num--
                ) {
                    //
                    let x1 = parseFloat(
                        (
                            x -
                            rangeDistance +
                            rangeDistance * 2 * Math.random()
                        ).toFixed(decimal)
                    );
                    let y1 = parseFloat(
                        (
                            y -
                            rangeDistance +
                            rangeDistance * 2 * Math.random()
                        ).toFixed(decimal)
                    );
                    let res = allowRemove(pointList, x1, y1, id);

                    if (0 == res) {
                        // 允许移动
                        for (let k = 0, len = pointList.length; k < len; k++) {
                            let obj: any = pointList[k];
                            if (obj.id == id) {
                                (obj.fromX = obj.x),
                                    (obj.fromY = obj.y),
                                    (obj.x = x1),
                                    (obj.y = y1),
                                    (obj.isMove = 0);
                                break;
                            }
                        }
                        break;
                    }
                }
            }
            ALL.log(pointList);

            chart = document.getElementById("chart-step2");
            ctx = chart.getContext("2d");

            // 绘制出区域 [0,0] - [1000,1000]
            ctx.strokeStyle = "#fa541c";
            ctx.rect(0, 0, width, height);
            ctx.stroke();
            ctx.closePath();

            ctx.fillStyle = "#1890ff";

            pointList.map((item: any) => {
                ctx.beginPath();
                ctx.arc(item.x, item.y, pointRadius, 0, 360, false);
                ctx.fill();
                ctx.closePath();
            });

            form.step2.pointList = JSON.parse(JSON.stringify(pointList));

            form.coverAreaPercent = form.step5.coverAreaPercent;

            if (form.step4.coverAreaPercent < 65) {
                setTimeout(() => {
                    // window.location.reload();
                }, 100);
            }
            ALL.log(form);
        }, 800);
        const goRefresh = () => {
            window.location.href =
                "https://tangtaoshadow.github.io/fiber-studio/";
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
            <span style="padding: 4px 4px 4px 10px"> 绘制第一层图心 🔥 </span>
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
        <div style="padding: 10px 0px"></div>
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
            <span style="padding: 4px 4px 4px 10px"> 随机平移圆心 </span>
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
        <div style="padding: 10px 0px"></div>
        <div style="padding: 10px 0px">边界圆分布如下:</div>
        <div style="padding: 10px 0px">
            <json-viewer
                :value="form.step2.pointList"
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
        <div style="padding: 10px 0px"></div>
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
