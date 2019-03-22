
const Configure = module.exports = {};

//游戏信息
Configure.nickName = '';  //我的昵称
Configure.avatarUrl = '';  //我的头像
Configure.isTourist = true;  //是否是游客

//toast
Configure.toast = require('MyToast');

//播放音效
Configure.playAudio = function (fileName) {
    cc.audioEngine.play(cc.url.raw('resources/audios/' + fileName + '.mp3'), false, 1);
};

//播放动画
Configure.playAnimation = function (node, name, wrapMode, callback) {
    let animation = node.addComponent(cc.Animation);
    cc.loader.loadResDir('texture/AnimateImg/' + name, cc.SpriteFrame, function (err, assets) {
        let animationClip = cc.AnimationClip.createWithSpriteFrames(assets, 12);
        animationClip.name = name;
        if (wrapMode === 'Loop') {
            animationClip.wrapMode = cc.WrapMode.Loop;
        } else {
            animationClip.wrapMode = cc.WrapMode.Normal;
        }
        animation.addClip(animationClip);
        animation.on('stop', function () {
            callback && callback();
            cc.loader.release(assets);
        });
        animation.play(name);
    });
};

/**
 * @param {string} originalStr - 需要处理的原始字符串
 * @param {int} expectLength - 希望保留的汉字个数（不需要考虑英文和数字，内部会处理)，两个英文算做一个汉字
 */
Configure.stringEndEllipsis = function (originalStr, expectLength) {
    originalStr = originalStr || '';
    if(!expectLength) {
        expectLength = 5;
    }
    var endIndex = 0;
    var realExpectLength = expectLength * 2;
    var currentLength = 0;
    for (var i = 0; i < originalStr.length; i++) {
        if (originalStr.charCodeAt(i) > 255) {
            currentLength += 2;
        } else {
            ++currentLength;
        }
        endIndex = i;
        if (currentLength >= realExpectLength) {
            break;
        }
    }
    if(endIndex  < originalStr.length - 1) {
        return originalStr.substring(0, endIndex + 1) + '…';
    } else {
        return originalStr;
    }
};

//加载跨域图片(target:节点、imgUrl:图片源地址、errCallback:错误回调,可不传)
Configure.loadImage = function (target, imgUrl, errCallback) {
    if (!(imgUrl && target && target.getComponent(cc.Sprite))) {
        errCallback && errCallback();
        return;
    }
    let protocol = window.location.protocol;  //协议名(http:、https:)
    let host = '//qipai.56.com/u_logo?url=';
    let actualImgUrl = protocol + host + encodeURI(imgUrl);
    console.log('actualImgUrl:' + actualImgUrl);
    cc.loader.load({url: actualImgUrl, type: 'png'}, function (err, tex) {
        if (!err && tex) {
            target.getComponent(cc.Sprite).spriteFrame = new cc.SpriteFrame(tex);
        } else {
            errCallback && errCallback();
        }
    });
};

//截屏(callback: function (base64, frame))
Configure.screenShot = function (callback) {
    if (!cc.sys.isBrowser) return;
    cc.director.on(cc.Director.EVENT_AFTER_DRAW, () => {
        let canvas = document.getElementById('GameCanvas');
        let base64 = canvas.toDataURL('imagea/png');
        cc.director.off(cc.Director.EVENT_AFTER_DRAW);
        let img = new Image();
        img.src = base64;
        img.onload = function () {
            let texture = new cc.Texture2D();
            texture.initWithElement(img);
            texture.handleLoadedTexture();
            let frame = new cc.SpriteFrame(texture);
            callback && callback(base64, frame);
        };
    });
};