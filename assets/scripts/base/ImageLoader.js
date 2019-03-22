
const ImageLoader = {

    loadImage: function (target, imgUrl, errCallback) {
        if (!imgUrl) {
            if (errCallback) {
                errCallback();
            }
            return;
        }
        cc.textureCache.addImageAsync({url: imgUrl, type: 'png'}, function (tex) {
            if (tex instanceof cc.Texture2D) {
                if (target && target.getComponent(cc.Sprite)) {
                    target.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(tex);
                }
            } else {
                if (errCallback) {
                    errCallback();
                }
            }
        });
    },

    _setAsDefaultImage: function (target, def) {
        if (target && target.getComponent(cc.Sprite)) {
            if (typeof def === 'string') {
                target.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(cc.url.raw(def));
            } else {
                let defAvatar;
                if (def === 1) {
                    defAvatar = 'resources/texture/other/default_avatar.png';
                } else {
                    defAvatar = 'resources/texture/other/default_avatar.png';
                }
                target.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(cc.url.raw(defAvatar));
            }
        }
    },

    loadLocalImage: function (target, image) {
        if (target && target.getComponent(cc.Sprite)) {
            target._addedImgUrl = null;
            cc.loader.loadRes('texture/' + image, cc.SpriteFrame, function (err, frame) {
                target.getComponent(cc.Sprite).spriteFrame = frame;
            });
            // target.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(cc.url.raw('resources/texture/' + image + '.png'));
        }
    },

    loadAvatar: function (target, imgUrl, def) {
        target.cancelRequest = false;
        if (!target) {
            return;
        }

        if (imgUrl === undefined ||
            imgUrl === null ||
            imgUrl === '' ||
            imgUrl === '\0' ||
            cc.sys.isBrowser) {//没头像或者在浏览器中显示默认头像
            ImageLoader._setAsDefaultImage(target, def);
            return;
        }

        if (target._addedImgUrl === imgUrl) {
            return;//如果已经加载过相同图片 就不再加载
        }

        cc.textureCache.addImageAsync({url: imgUrl, type: 'png'}, function (tex) {
            if (tex instanceof cc.Texture2D) {
                if (target && target.getComponent(cc.Sprite) && !target.cancelRequest) {
                    target.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(tex);
                    target._addedImgUrl = imgUrl;
                }
            } else {
                ImageLoader._setAsDefaultImage(target, def);
            }
        });
    },


};


module.exports = ImageLoader;