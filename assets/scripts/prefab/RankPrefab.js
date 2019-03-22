
const BaseDialog = require('BaseDialog');
const Configure = require('Configure');
import SignService from '../service/SignService';
const Game2048SocketService = require('Game2048SocketService');
const ScrollViewManager = require('ScrollViewManager');

cc.Class({
    extends: BaseDialog,

    properties: {
        rankItemPrefab: cc.Prefab,
        rankContent: cc.Node,
        rankContentScrollView: cc.ScrollView,
        nodata: cc.Node,
        myRank: cc.Label,
        myAvatar: cc.Node,
        myNickName: cc.Label,
        myScore: cc.Label,
        weishangbang: cc.Node,
    },

    onLoad () {
        this._super();
        this.updateTimer = 0;
        this.scrollViewManager = new ScrollViewManager(this.rankItemPrefab, this.rankContent, this.rankContentScrollView, this, 10);
        this.loadRankList();
        //适配小屏手机
        if (cc.winSize.height < 1234) {
            let offset = 87;
            cc.find('backButton', this.node).getComponent(cc.Widget).bottom = offset;
        }
    },

    setData: function (from, currentScore, callback) {
        this._from = from;
        this._currentScore = currentScore;
        this._callback = callback;
    },

    backButtonClicked: function() {
        this.dismiss();
    },

    scrollEvent: function (sender, event) {
        this.updateTimer ++;
        if (this.updateTimer < 3) {
            return; // we don't need to do the math every frame
        }
        this.updateTimer = 0;
        this.scrollViewManager.updatePosition(this.rankList);
    },

    convertCell: function (cell, data, index) {
        cell.getComponent('RankItem').setData(data);
        if (data.rank === 1) {
            cc.find('indexLabel', cell).color = cc.hexToColor('#FF7043');
            cc.find('indexLabel', cell).getComponent(cc.LabelOutline).color = cc.hexToColor('#FF7043');
        } else if (data.rank === 2) {
            cc.find('indexLabel', cell).color = cc.hexToColor('#FF9B12');
            cc.find('indexLabel', cell).getComponent(cc.LabelOutline).color = cc.hexToColor('#FF9B12');
        } else if (data.rank === 3) {
            cc.find('indexLabel', cell).color = cc.hexToColor('#FABB20');
            cc.find('indexLabel', cell).getComponent(cc.LabelOutline).color = cc.hexToColor('#FABB20');
        } else {
            cc.find('indexLabel', cell).color = cc.hexToColor('#5A93A7');
            cc.find('indexLabel', cell).getComponent(cc.LabelOutline).color = cc.hexToColor('#5A93A7');
        }
        if (index % 2 !== 0) {
            cc.find('bg', cell).opacity = 255;
        } else {
            cc.find('bg', cell).opacity = 0;
        }
    },

    loadRankList: function () {
        SignService.fastSignIn(function (err) {
            Game2048SocketService.getAllRankList({game: '2048', sortBy: 'score', top: 100}, function (err, data) {
                if (!err && data) {
                    this.rankList = data.rankList || [];
                    this.nodata.active = this.rankList.length === 0;
                    setTimeout(function () {
                        this.scrollViewManager.initialize(this.rankList);
                        this.setMyInfo(data);
                    }.bind(this), 200);
                } else {
                    this._callback && this._callback();
                }
            }.bind(this));
        }.bind(this));
    },

    setMyInfo: function (data) {
        if (parseInt(data.myRank) > 0) {
            this.myRank.string = '' + data.myRank;
        } else {
            this.weishangbang.active = true;
        }
        if (!Configure.isTourist) {
            Configure.loadImage(this.myAvatar, Configure.avatarUrl);
        }
        this.myNickName.string = Configure.stringEndEllipsis(unescape(Configure.nickName), 7);
        // if (Configure.isTourist && this._from === 2) {
        //     this.myScore.string = '' + this._currentScore;
        // } else {
        //     if (parseInt(data.myValue) > 0) {
        //         this.myScore.string = '' + data.myValue;
        //     } else {
        //         this.myScore.string = '0';
        //     }
        // }
        if (parseInt(data.myValue) > 0) {
            this.myScore.string = '' + data.myValue;
        } else {
            this.myScore.string = '0';
        }
    },

});
