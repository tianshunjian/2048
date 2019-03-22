'use strict';
import GameSocketConnector from '../shared/service/GameSocketConnector';
import RouteConstants from './RouteConstants';
import EventEmitter from '../shared/event/events';
import SignService from './SignService';

/**
 *  单利对象 Game2048SocketService
 *  所有的业务层均要由此发出！
 */
class Game2048SocketService extends EventEmitter
{
    /**
     * 监听广播；回调收到的结构体如下：
     * {"playCount":1,"priority":3,"showInBattle":-1,"id":"IDS_Trumpet_Content_02","createTime":1529045884391,"content":"恭喜mango在我乐踩方块游戏获得乐卡x9","extInfo":{avatarUrl:'https://wx.qlogo.cn/mmopen/vi_32/6eMXNWvYk60U3v2QPGesI3Brd7iaiaNSDjVA7JdV4F5hGf3C9EwNSjv3sLBKb6cEq8w1nKPGPUoqiaaOic4TDL3gAQ/132'}}
     */
    onTrumpet(id,callback) {
        if (!this._initListenTrumpet) {
            this._initListenTrumpet = true;
            GameSocketConnector.listenTrumpet(window.BroadcastConfigs, function (msg) {
                console.log('received trumpet:' + JSON.stringify(msg));
                const id = msg.id;
                if (id) {
                    this.emit(id,msg);
                }
            }.bind(this));

        }
        this.on(id,callback);
    }

    /**
     * 移除广播监听
     */
    offTrumpet(id,callback){
        this.off(id,callback);
    }

    /**
     * 发送请求(用于请求带result结构的接口)
     * @param route
     * @param params
     * @param callback
     * @param target
     */
    request(route,params,callback,target) {
        SignService.fastSignIn(function (err) {
            if (!err) {
                GameSocketConnector.request(route,params,callback,target);
            } else {
                callback && callback(err, null);
            }
        });
    }

    /**
     * 发送请求(用于请求不带result结构的接口)
     * @param route
     * @param params
     * @param callback
     * @param target
     */
    requestV2(route,params,callback,target) {
        SignService.fastSignIn(function (err) {
            if (!err) {
                GameSocketConnector.requestV2(route,params,callback,target);
            } else {
                callback && callback(err, null);
            }
        });
    }

    /**
     * 游戏流程
     */

    /**
     * 初始化游戏
     * @param {function(err, data)} callback
     */
    initGame(callback) {
        this.requestV2(RouteConstants.GAME_INIT, {}, callback);
    }

    /**
     * 开始游戏
     * @param {object} ps
     * @param {number} ps.gameType2048 - 1:比赛模式, 2:普通模式
     * @param {number} ps.championshipId - 默认-1
     * @param {function(err, data)} callback
     */
    startGame(ps, callback) {
        this.requestV2(RouteConstants.GAME_START, ps, callback);
    }

    /**
     * 结束游戏
     * @param {object} ps
     * @param {number} ps.score - 普通模式对应分数，比赛模式对应时间(秒)
     * @param {number} ps.step - 步数（用于作弊检测）
     * @param {function(err, data)} callback
     */
    endGame(ps, callback) {
        this.requestV2(RouteConstants.GAME_END, ps ,callback);
    }

    /**
     * 分享获取参赛券
     * @param {object} ps
     * @param {number} ps.isShared - 1:分享翻倍获取4张，0:免费领取两张或分享获取1张
     * @param {function(err, data)} callback
     */
    shareGame2048(ps, callback) {
        this.requestV2(RouteConstants.SHARE_GAME_2048, ps, callback);
    }

    /**
     * 排行榜
     * @param {object} ps
     * @param {string} ps.game - 游戏('2048'、'jumper')
     * @param {string} ps.sortBy - 模式('competeScore':比赛模式、'score':普通模式)
     * @param {number} ps.top - 前多少名
     * @param {function(err, data)} callback
     */
    getAllRankList(ps, callback) {
        this.request(RouteConstants.GET_ALL_RANK_LIST, ps, callback);
    }

    /**
     * 相邻排行榜
     * @param {string} ps.game - 游戏('2048'、'jumper')
     * @param {string} ps.sortBy - 模式('competeScore':比赛模式、'score':普通模式)
     * @param {function(err, data)} callback
     */
    getAdjacentRankList(ps, callback) {
        this.request(RouteConstants.GET_ADJACENT_RANK_LIST, ps, callback);
    }

    /**
     * 上赛季排行榜
     * @param {object} ps
     * @param {string} ps.game - 游戏('2048'、'jumper')
     * @param {string} ps.sortBy - 模式('competeScore':比赛模式、'score':普通模式)
     * @param {number} ps.top - 前多少名
     * @param {function(err, data)} callback
     */
    getLastRankList(ps, callback) {
        this.request(RouteConstants.GET_LAST_RANK_LIST, ps, callback);
    }

    /**
     * 初始化，获取最近赛季场次
     * @param {object} ps
     * @param {number} ps.displayCount - 最近几场
     * @param {function(err, data)} callback
     */
    initCompete(ps, callback) {
        this.request(RouteConstants.INIT_COMPETE, ps, callback);
    }

    /**
     * 预约
     * @param {object} ps
     * @param {number} ps.competeNO - 赛季ID
     * @param {function(err, data)} callback
     */
    reserve(ps, callback) {
        this.request(RouteConstants.RESERVE, ps, callback);
    }

}

export default new Game2048SocketService();
