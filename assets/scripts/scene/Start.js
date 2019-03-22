
import '../shared/ARuntime/runtime.js';
import SignService from '../service/SignService';
import Game2048SocketService from '../service/Game2048SocketService';
import Configure from '../service/Configure';
import Utils from '../shared/service/Utils';
import setupSHJSBridge from '../shared/bridge/WebNetiveBridge';
import Application from '../shared/bridge/Application';
//设置cFrom、版本号、平台
import {SetCFrom, SetVersion, PLATFORM, SetPlatform} from '../shared/service/Constants';
SetCFrom('2048');
SetVersion('1.0.1');
SetPlatform(PLATFORM.kH5);
// //设置服务器环境
// import {SetENV, DEVELOP_ENV_TYPE} from '../shared/service/Env';
// SetENV(DEVELOP_ENV_TYPE);
//设置log
import LoggerUtil from '../shared/log/LoggerUtil';
LoggerUtil.init('2048');
//设置是否是移动端
window.isMobile = cc.sys.isMobile;

cc.Class({
    extends: cc.Component,

    properties: {
        bestScore: 0,
        currentScore: 0,
        bestScoreLabel: cc.Label,
        currentScoreLabel: cc.Label,
        emoji: cc.Node,
        gamePrefab: cc.Node,
        restartBtn: cc.Button,
        rankBtn: cc.Button,
    },

    onLoad () {

        //log打印至native
        setupSHJSBridge(function (bridge) {
            function mylog (str) {
                bridge.invokeNative('log', str);
            }
            console.log = mylog;
            console.error = mylog;
        });

        //监听退出
        Application.onHide(function () {
            SignService.disconnect();
        });

        //适配小屏手机
        if (cc.winSize.height < 1206) {
            let offset = 10;
            this.restartBtn.node.getComponent(cc.Widget).bottom = offset;
            this.rankBtn.node.getComponent(cc.Widget).bottom = offset;
        }

        //游戏脚本
        this.game = this.gamePrefab.getComponent('Game');

        //监听网络状态
        SignService.observerNetworkStatus(function () {
            this._showModal('网络不给力哦', this.back.bind(this));
        }.bind(this));

        //登录
        this._login();
    },

    //登录
    _login: function () {
        SignService.fastSignIn(function (err) {
            if (!err) {  //登录成功，开始游戏
                this.startGame();
            } else {  //登录失败，弹窗提示
                let code = err.code;
                if (code !== 7 && code !== 15 && code !== 17 && code !== 18) {
                    this._showModal('登录失败，请重新登录', this._login.bind(this));
                }
            }
        }.bind(this));
    },

    //弹窗提示
    _showModal: function (content, callback) {
        Utils.showModal({
            title: '提示',
            content: content,
            showCancel: false,
            success: function (res) {
                if (res.confirm) {
                    callback && callback();
                }
            }
        });
    },

    /**
     * 点击事件
     */

    //返回
    back: function () {
        Application.goback();
    },

    //分享
    share: function () {
        console.log('点击分享按钮');
        let h5ShareData = {};
        h5ShareData.title = '哈哈2048小游戏';
        h5ShareData.description = '简单小巧的益智游戏，挑战你的智力极限，令人停不下来的数字消除游戏！';
        h5ShareData.imageUrl = 'https://duqipai.56.com/2048/other/imgs/share_1.png';
        h5ShareData.webpageUrl = 'https://m.tv.sohu.com/static/sgame/2048/index.html';
        let wechatCard = {};
        wechatCard.webpageUrl = 'https://m.tv.sohu.com/static/sgame/2048/index.html';
        wechatCard.appid = 'gh_0f7e79c3e546';  //wxa656d179c77a07fb
        wechatCard.path = '/index.html';
        wechatCard.title = 'pick哈哈2048有钱花~';
        wechatCard.imageUrl = 'https://duqipai.56.com/2048/other/imgs/share_1.png';
        wechatCard.description = '简单小巧的益智游戏，挑战你的智力极限，令人停不下来的数字消除游戏！';
        wechatCard.miniProgramType = 0;  //代表分享小程序的版本(正式:0，开发:1，体验:2)
        let shareImageData = {};
        let shareData = {};
        shareData.h5ShareData = h5ShareData;
        shareData.wechatCard = wechatCard;
        shareData.shareImageData = shareImageData;

        //分享拼图
        let score = this.currentScore;
        let tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = 750;
        tmpCanvas.height = 1334;
        let ctx = tmpCanvas.getContext('2d');
        let bgImg = new Image();
        bgImg.src = 'res/raw-assets/resources/texture/other/h5ShareBg.png';
        bgImg.onload = function () {
            console.log('加载分享背景图成功');
            ctx.drawImage(bgImg,0,0,750,1334);
            bgImg = null;
            ctx.save();
            ctx.rotate(25*Math.PI/180.0);
            ctx.font = '48px Helvetica';
            ctx.fillStyle = '#FFFFFF';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(score,585,-20);
            ctx.restore();
            shareImageData.imageData = tmpCanvas.toDataURL('image/png');
            Application.share(shareData);
        };
        bgImg.onerror = function () {
            console.log('加载分享 背景图片失败');
            Application.share(shareData);
        };
    },

    //排行榜按钮点击
    rankButtonClick: function () {
        this.showRank(1);
    },

    //展示排行榜(from代表入口，1:游戏页、2:结果页)
    showRank: function (from) {
        this.rankBtn.interactable = false;
        cc.loader.loadRes('prefab/rankPrefab', cc.Prefab, function (err, prefab) {
            this.rankBtn.interactable = true;
            if (!err && prefab) {
                let rankPrefab = cc.instantiate(prefab).getComponent('RankPrefab');
                rankPrefab.setData(from, this.currentScore, function () {
                    this._showModal('网络不给力哦', this.back.bind(this));
                }.bind(this));
                rankPrefab.show();
            }
        }.bind(this));
    },

    //再来一局
    restart: function () {
        //更新分数
        this.updateScore(0);
        //重置游戏
        this.game.reset();
    },

    /**
     * 眨眼动画
     */

    //开始眨眼
    startZhaYan: function () {
        this.stopZhaYan();
        this.timer = setInterval(function () {
            Configure.playAnimation(this.emoji, 'zhayan', 'Normal');
        }.bind(this), 5000);
    },

    //停止眨眼
    stopZhaYan: function () {
        clearInterval(this.timer);
    },

    /**
     * 开始、结束游戏接口
     */

    //开始游戏
    startGame: function () {
        // if (Configure.isTourist) return;
        Game2048SocketService.startGame({gameType2048: 2, championshipId: -1}, function (err, data) {
            if (!err && data) {
                this.bestScore = data.topScore > 0 ? data.topScore : 0;
                this.bestScoreLabel.string = '' + this.bestScore;
            } else {
                if (err.code === 2) {  //游戏中
                    this.endGame(0, 0, this.startGame.bind(this));
                } else {  //接口调用失败，弹窗提示
                    this._showModal('网络不给力哦', this.back.bind(this));
                }
            }
        }.bind(this));
    },

    //结束游戏
    endGame: function (score, step, callback) {
        // if (Configure.isTourist) {
        //     callback && callback();
        //     return;
        // }
        Game2048SocketService.endGame({score: score, step: step}, function (err, data) {
            if (!err && data) {
                callback && callback();
            } else {
                if (err.code === 0) {  //作弊
                    Configure.toast.show('步数太少，未通过作弊检测');
                } else {  //接口调用失败，弹窗提示
                    this._showModal('网络不给力哦', this.back.bind(this));
                }
            }
        }.bind(this));
    },

    /**
     * Game回调方法，必须实现
     */

    //游戏开始
    gameStart: function () {
        //音效
        Configure.playAudio('ready_go');
        //眨眼动画
        Configure.playAnimation(this.emoji, 'zhayan', 'Normal');
        this.startZhaYan();
    },

    //刷新分数
    updateScore: function (score) {
        this.currentScore = score;
        this.currentScoreLabel.string = '' + score;
        if (score > this.bestScore) {
            this.bestScoreLabel.string = '' + score;
        }
        if (score === 0) {
            this.bestScoreLabel.string = '' + this.bestScore;
        }
    },

    //初步动画
    chubuSmile: function () {
        this.stopZhaYan();
        Configure.playAnimation(this.emoji, 'chubu', 'Normal', this.startZhaYan.bind(this));
    },

    //游戏结束
    gameOver: function () {
        //音效
        Configure.playAudio('success');
        //动画
        this.stopZhaYan();
        Configure.playAnimation(this.emoji, 'shibai', 'Normal');
        //结束游戏
        this.restartBtn.interactable = false;
        this.rankBtn.interactable = false;
        this.endGame(this.currentScore, this.game.step, function () {
            cc.loader.loadRes('prefab/resultPrefab', cc.Prefab, function (err, prefab) {
                this.restartBtn.interactable = true;
                this.rankBtn.interactable = true;
                if (!err && prefab) {
                    let resultPrefab = cc.instantiate(prefab).getComponent('ResultPrefab');
                    resultPrefab.setDelegate(this);
                    resultPrefab.setData(this.currentScore, this.bestScore);
                    resultPrefab.show();
                }
            }.bind(this));
        }.bind(this));
    },

});
