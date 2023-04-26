const all: any = {};

all.log = (...allArg: any) => {
    if (process.env.NODE_ENV == "development") {
        // !仅仅开发环境支持
        window.console.log(...allArg);
    }
};

all.sleep = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};
all.currentFormatTime = () => {
    const currentDate = new Date();
    function sup(n: number) {
        return n < 10 ? "0" + n : n;
    }
    const date =
        currentDate.getFullYear() +
        "-" +
        sup(currentDate.getMonth() + 1) +
        "-" +
        sup(currentDate.getDate());
    const time =
        sup(currentDate.getHours()) +
        ":" +
        sup(currentDate.getMinutes()) +
        ":" +
        sup(currentDate.getSeconds());

    return date + " " + time;
};
export default all;
