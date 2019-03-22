'use strict';

/**
 * 路由常量
 */
const RouteConstants =  {
    /**
     * 游戏流程
     */
    GAME_INIT: 'connector.game2048Handler.initGame2048',
    GAME_START: 'connector.game2048Handler.startGame2048',
    GAME_END: 'connector.game2048Handler.endGame2048',
    SHARE_GAME_2048: 'connector.game2048Handler.shareGame2048',
    GET_ALL_RANK_LIST: 'connector.rankHandler.getAllRankList',
    GET_ADJACENT_RANK_LIST: 'connector.rankHandler.getAdjacentRankList',
    GET_LAST_RANK_LIST: 'connector.rankHandler.getLastRankList',
    INIT_COMPETE: 'connector.competeHandler.initCompete',
    RESERVE: 'connector.competeHandler.reserve',
};

export default RouteConstants;
