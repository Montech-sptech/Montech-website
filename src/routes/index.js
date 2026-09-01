var express = require("express");
var path = require("path");

var router = express.Router();

router.get("/", function (req, res) {
    res.sendFile(
        path.resolve(__dirname, "../../Public/telas/landingPage.html")
    );
});

module.exports = router;