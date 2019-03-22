'use strict';

/**
 * 对话框的基础类
 * 提供显示，隐藏等功能
 */
var BaseDialog = cc.Class({
    extends: cc.Component,

    properties: {

    },

    onLoad() {
        this._showing = false;
        this._showed = false;
        this._animeDuration = 0.2;
        this._dialogScale = 0.6;
        this._shadeOpacity = 204;
    },

    /**
     * 显示对话框
     * @param {object} [parent] -基于parent
     */
    show: function (parent, noAnime) {

        /// 当前正在显示或者显示过程中
        if (this._showed || this._showing) {
            return;
        }

        /// 可能parameter和onSceneLaunched只传了某一个
        let argsLength = arguments.length;
        if(argsLength === 1) {
            if (typeof parent === 'boolean') {
                noAnime = parent;
                parent = undefined;
            }
        }

        if (!parent) {
            parent = cc.find('Canvas');
        }

        if (!parent) {
            return;
        }

        /// 构建遮罩
        this._shade = this.makeShade();
        this._shade.parent = parent;
        this._shade.setLocalZOrder(1024);
        this.node.parent = this._shade;
        this.node.position = cc.p(0, 0);

        /// 弹出不出现动画
        if(noAnime){
            this.node.setScale(1);
            this._shade.content.opacity = this._shadeOpacity;
            this._showed = true;
            this._showing = false;
            return;
        }

        /// 对话框执行缩放从0.6~1.0
        this.node.setScale(this._dialogScale);
        this._showing = true;
        this._showed = false;
        let nodeAction = cc.sequence(cc.scaleTo(this._animeDuration, 1.0), cc.callFunc(function () {
            this._showed = true;
            this._showing = false;
        }, this));
        this.node.runAction(nodeAction);

        /// 遮罩执行透明度从0到155，
        this._shade.content.opacity = 0;
        let shadeAction = cc.fadeTo(this._animeDuration, this._shadeOpacity);
        this._shade.content.runAction(shadeAction);
    },

    /**
     * 消失对话框
     */
    dismiss: function (noAnime, callback) {

        if (!this._showed) {
            return;
        }
        this._showed = false;

        if (noAnime) {
            this._shade.destroy();
            this._shade.removeFromParent(true);
            return;
        }

        /// 对话框执行缩放从1.0~0.6
        let nodeAction = cc.sequence(cc.scaleTo(this._animeDuration, this._dialogScale), cc.callFunc(function () {
            this._shade.destroy();
            this._shade.removeFromParent(true);
        }, this));
        
        this.node.runAction(nodeAction);

        /// 遮罩执行透明度从155~0
        let shadeAction = cc.fadeTo(this._animeDuration, 0);
        this._shade.runAction(shadeAction);

        if (callback) {
            callback();
        }
    },

    /**
     * 生成一个遮罩层
     * @returns {*}
     */
    makeShade: function () {
        let collection = new cc.Node;
        let shade = new cc.Node();
        let component = shade.addComponent(cc.Sprite);
        cc.loader.loadRes('texture/other/default_sprite_splash', cc.SpriteFrame, function (err, spriteFrame) {
            component.spriteFrame = spriteFrame;
        });
        //component.spriteFrame = new cc.SpriteFrame(cc.url.raw('resources/texture/other/default_sprite_splash.png'));
        component.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        shade.color = cc.Color.BLACK;
        shade.setContentSize(cc.winSize);
        collection.addChild(shade);
        collection.content = shade;
        shade.on(cc.Node.EventType.TOUCH_START, function () {
            return true;
        });
        return collection;
    },
});

module.exports = BaseDialog;
