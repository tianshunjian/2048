/**
 * @document https://qipai.56.com/dev/wiki/sdk/SDK-H5交互方法.html
 */

import setupSHJSBridge from "./WebNetiveBridge.js";

class Application {

    constructor(){
        this._onHideCallbacks = [];
        this._onShowCallbacks = [];
    }

    /**
     * @available WeChat,SDK
     * @brief 应用失活隐藏
     */
    onHide(callback){

        const _window = window || global;
        if (_window.WechatGame){
            wx.onHide(callback);
        }else {
            this._onHideCallbacks.push(callback);
            const self = this;
            setupSHJSBridge(function (bridge) {
                bridge.registerMethod('onHide',function () {
                    self._onHideCallbacks.forEach(function (c) {
                        c();
                    });
                })
            });
        }
    }

    /**
     * @available WeChat,SDK
     * @brief 应用激活展示
     */
    onShow(callback){

        const _window = window || global;
        if (_window.WechatGame){
            wx.onShow(callback);
        }else {
            this._onShowCallbacks.push(callback);
            const self = this;
            setupSHJSBridge(function (bridge) {
                bridge.registerMethod('onShow',function () {
                    self._onShowCallbacks.forEach(function (c) {
                        c();
                    });
                })
            });
        }
    }

    /**
     * @available WeChat
     * @brief 遇到错误
     */
    onError(callback){
        const _window = window || global;
        if (_window.WechatGame){
            wx.onError(callback);
        }else {
            // TODO
        }
    }

    /**
     * @available WeChat
     * @brief 音频中断
     */
    onAudioInterruptionBegin(callback){
        const _window = window || global;
        if (_window.WechatGame){
            wx.onAudioInterruptionBegin && wx.onAudioInterruptionBegin(callback);
        }else {
            // TODO
        }
    }

    /**
     * @available SDK
     * @brief 关闭web页面
     */
    goback(){
        const _window = window || global;
        if (_window.H5){
            setupSHJSBridge(function (bridge) {
                bridge.invokeNative('goback');
            });
        }
    }

    /**
     * @available SDK
     * @brief 更新导航标题
     */
    updateNavTitle(title){
        const _window = window || global;
        if (_window.H5) {
            setupSHJSBridge(function (bridge) {
                bridge.invokeNative('updateNavTitle', {title: title});
            });
        }
    }

    /**
     * @available SDK
     * @brief 保存图片到相册
     * @param parameters
     * @param parameters.base64Photo  base64编码的图片
     * @param callback 保存图片回调
     * @param callback.code 0:没有访问权限, 1: 保存失败, 2:保存成功
     * @param callback.msg  SDK 根据code格式化好的文案，可用于toast提示
     */
    savePhoto(parameters,callback){
        const _window = window || global;
        if (_window.H5) {
            setupSHJSBridge(function (bridge) {
                bridge.invokeNative('savePhoto', parameters, callback);
            });
        }
    }

    /**
     * @available SDK
     * @brief 拉起App分享控件
     * @param parameters
     * @param parameters.h5ShareData  H5分享信息
     * @param parameters.h5ShareData.title 标题：我乐踩方块小游戏
     * @param parameters.h5ShareData.description 描述：小试身手，跳一跳更自信~
     * @param parameters.h5ShareData.imageUrl 图片地址
     * @param parameters.h5ShareData.webpageUrl H5页面地址
     * @param parameters.wechatCard 微信小程序卡片
     * @param parameters.wechatCard.webpageUrl H5页面地址，不支持卡片的时候用
     * @param parameters.wechatCard.appid 小程序id
     * @param parameters.wechatCard.path 一般没要求可写'/index.html'
     * @param parameters.wechatCard.title 标题： '我乐踩方块';
     * @param parameters.wechatCard.imageUrl 图片地址
     * @param parameters.wechatCard.description 描述：'小试身手，跳一跳更自信~';
     * @param parameters.wechatCard.miniProgramType (拉起小程序类型：正式:0，开发:1，体验:2）
     * @param parameters.shareImageData 图片分享信息
     * @param parameters.shareImageData.imageData base64编码的图片
     * @param callback 分享回调 result.code
     *          result.code == 0 分享成功
     *          result.code == 1 分享失败
     *          result.code == 2 分享取消
     *          result.code == 3 复制成功
     *          result.code == 4 复制失败
     */
    share(parameters,callback){
        const _window = window || global;
        if (_window.H5){
            setupSHJSBridge(function (bridge) {
                bridge.invokeNative('share',parameters,callback);
            });
        }
    }

    /**
     * @available SDK
     * @param parameters 参数
     * @param parameters.id 行为点，产品定义，必传
     * @param parameters.memo 附加参数，可选
     */
    ccReport(parameters){
        const _window = window || global;
        if (_window.H5){
            setupSHJSBridge(function (bridge) {
                bridge.invokeNative('ccReport',parameters);
            });
        }
    }

    /**
     * @available SDK
     * @param {parameters: object} - 参数
     * @param {parameters.productId: string} - 产品id
     */
    gameInit (parameters) {
        const _window = window || global;
        if (_window.H5) {
            setupSHJSBridge(function (bridge) {
                bridge.invokeNative('gameInit', parameters);
            });
        }
    }

    /**
     * @available SDK
     * @param {numberId: string} - 用户id
     */
    updateNumberId (numberId) {
        const _window = window || global;
        if (_window.H5) {
            setupSHJSBridge(function (bridge) {
                bridge.invokeNative('updateNumberId', numberId + '');
            });
        }
    }

    /**
     * @available SDK
     * @param {callback: function(result)} - 登录回调
     * @param {result.code: number} - 登录结果，0:取消,1:成功,2:失败
     */
    showAppLoginPage (callback) {
        const _window = window || global;
        if (_window.H5) {
            setupSHJSBridge(function (bridge) {
                bridge.invokeNative('showAppLoginPage', {}, callback);
            });
        }
    }

}

export default new Application();
