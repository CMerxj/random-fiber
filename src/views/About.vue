<script lang="ts">
import ALL from "../utils/common";
import { reactive } from "vue";

export default {
    setup() {
        const form: any = reactive({
            step1: {},
        });
        return { form };
    },
};
</script>

<template>
    <div class="about">
        <button id="btn-start-recording">Start Recording</button>
        <button id="btn-stop-recording" disabled>Stop Recording</button>
        <button id="btn-release-microphone" disabled>Release Microphone</button>
        <button id="btn-download-recording" disabled>Download</button>

        <hr />
        <div><audio controls autoplay playsinline></audio></div>
    </div>
</template>
