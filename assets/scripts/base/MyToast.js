
'use strict';

/**
 * 用于弹出Toast提示，有如下功能:
 *
 * 1，允许弹出多个Toast，后一个Toast覆盖前一个Toast显示并重置消失时间。
 * 2，Toast消失后，在预定时间内（10秒）没有再次使用，则释放Prefab资源。
 */
class MyToast
{
    /**
     * 构造函数
     */
    constructor(){

    }

    /**
     * 显示Toast
     * @param {string} text -toast文字
     * @param {number} [duration] -显示时长，单位秒
     *
     */
    show(text, duration){

        if(!text){
            return;
        }

        /// 没有指定时间，默认2秒
        if(!duration){
            duration = 2;
        }

        /// Make使得Prefab存在
        this._makePrefab(function () {
            /// 显示Text
            this._show(text, duration);
        }.bind(this));
    }

    /// 加载Prefab保证Prefab存在
    _makePrefab(complete){
        if(this._prefab){
            complete();
        }else {
            cc.loader.loadRes('prefab/toast', cc.Prefab, function (error, prefab) {
                if(!error){
                    this._prefab = prefab;
                    complete();
                }
            }.bind(this));
        }
    }

    /// 显示
    _show(text, duration) {
        if(this._toastNode && this._canvasNode){
            this._runShowAction(text, duration);
        }else{
            this._makeComponentAndToastNode();
            this._runShowAction(text, duration);
        }
    }

    /// 添加ToastNode
    _makeComponentAndToastNode(){
        this._canvasNode = cc.director.getScene().getComponentInChildren(cc.Canvas).node;
        if(this._canvasNode) {
            this._toastNode = cc.instantiate(this._prefab);
            this._toastNode.setLocalZOrder(1025);
            this._canvasNode.addChild(this._toastNode);
        }

        /// 由于Toast挂载在当前场景的根节点上，场景切换后会清理掉Toast，此时同步下当前状态为Toast未加载。
        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function (eventCustom) {
            cc.loader.releaseAsset(this._prefab);
            this._prefab = undefined;
            this._canvasNode = undefined;
            this._delayAtion = undefined;
            this._toastNode = undefined;
        }.bind(this));
    }

    /// 执行Action
    _runShowAction(text, duration){
        /// 设置文本
        cc.find('bg/msg', this._toastNode).getComponent(cc.Label).string = text;

        /// 停止上次Action
        if(this._action && this._toastNode){
            this._toastNode.stopAction(this._action);
            this._action = undefined;
            /// 如果当前正在消失，则恢复不透明状态
            this._toastNode.setOpacity(255);
        }

        if(this._canvasNode && this._delayAtion){
            this._canvasNode.stopAction(this._delayAtion);
            this._delayAtion = undefined;
        }

        /// 执行显示Action
        this._action = cc.sequence(cc.moveBy(duration, cc.p(0,0)), cc.fadeOut(0.3), cc.callFunc(function () {
            /// 销毁_toastNode
            this._toastNode.removeFromParent(true);
            this._toastNode = undefined;
            this._action = undefined;

            /// 启动延迟释放Prefab程序，如果后续10秒之内没有人再使用Prefab则释放Prefab。
            this._delayAtion = cc.sequence(cc.delayTime(10), cc.callFunc(function () {
                cc.loader.releaseAsset(this._prefab);
                this._prefab = undefined;
                this._canvasNode = undefined;
                this._delayAtion = undefined;
            }.bind(this)));

            this._canvasNode.runAction(this._delayAtion);
        }, this));
        this._toastNode.runAction(this._action);
    }
}

module.exports = new MyToast();
