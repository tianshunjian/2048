
const Configure = require('Configure');

cc.Class({
    extends: cc.Component,

    properties: {
        rank: cc.Label,
        avatar: cc.Node,
        nickname: cc.Label,
        score: cc.Label,
    },
    
    setData: function (data) {
        this.rank.string = '' + data.rank;
        Configure.loadImage(this.avatar, data.avatarUrl);
        this.nickname.string = Configure.stringEndEllipsis(unescape(data.nickname), 7);
        this.score.string = '' + data.value;
    },

});
