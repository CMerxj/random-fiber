<script lang="ts">
import ALL from "../utils/common";
import { reactive, computed } from "vue";

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
            json: JSON.stringify([
                { id: 1, name: "first" },
                { id: 2, name: "second" },
            ]),
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

        const convertCSV = () => {
            let { json = null } = form;
            let data = null;
            try {
                data = JSON.parse(json);
            } catch (error) {
                data = null;
            }
            if (!data || !Array.isArray(data)) {
                return;
            }
            let list = [];
            for (let i = 0, len = data.length; i < len; i++) {
                let item: any = data[i];
                let arr = [];
                for (let k in item) {
                    arr.push(item[k]);
                }
                list.push(arr.join(","));
            }
            let link = document.createElement("a");
            let blob = new Blob(["\uFEFF" + list.join("\n")], {
                type: "text/csv;",
            });
            link.href = URL.createObjectURL(blob);
            link.download = ALL.currentFormatTime() + ".csv";
            link.click();
        };

        return { form, convertCSV };
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
                    padding: 4px 4px 4px 4px;
                    border-radius: 4px;
                    background: #fa541c;
                    color: #fff;
                "
            >
                JSON 转 CSV
            </span>

            <button
                class="pointer rotate-scale-down"
                style="
                    margin-left: 20px;
                    background: #42b983;
                    padding: 8px 16px;
                    border: none;
                    font-size: 20px;
                    color: #fff;
                    border-radius: 8px;
                "
                @click="convertCSV"
            >
                导出 🤷‍♂️
            </button>
        </div>
        <div style="padding: 20px 0px 10px">请填写JSON数组,并确保格式准确</div>
        <div style="padding: 10px 0px 20px">
            <textarea
                style="
                    width: 100%;
                    border: none;
                    outline: none;
                    background: #161b22;
                    height: 900px;
                    color: #42b983;
                    font-size: 16px;
                "
                placeholder="请输入JSON数据"
                v-model="form.json"
            ></textarea>
        </div>
    </div>
</template>

<style lang="css" scoped>
/* 鼠标放上去 */
.pointer:hover {
    cursor: pointer;
}
</style>
