const config = {
    delay: 1000,
    defTimeout: 0,
    timeout: 30000,
    maxTimeout: 60000,
    url: "https://oficinajudicialvirtual.pjud.cl/",
    targeturi: "https://oficinajudicialvirtual.pjud.cl/home/index.php",
    homeUrl: "https://oficinajudicialvirtual.pjud.cl/indexN.php",
    maxLogin: 10,
    separatorDate: '/',
    version: {
        "status": 200,
        "version": "1.0.0",
        "date": 20221205
    },
    launchConf: {
        headless: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--use-gl=egl',
            '--disable-site-isolation-trials',
            '--disable-dev-shm-usage'
        ],
        env: {
            DISPLAY: process.env.DISPLAY
        }

    }
}

module.exports = config;