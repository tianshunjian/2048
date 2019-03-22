
const BaseDialog = require('BaseDialog');

cc.Class({
    extends: BaseDialog,

    properties: {
        titleLabel: cc.Label,
        scoreLabel: cc.Label,
    },

    onLoad () {
        this._super();
    },

    setDelegate: function (delegate) {
        this._delegate = delegate;
    },

    setData: function (currentScore, bestScore) {
        if (currentScore > bestScore) {
            this.titleLabel.string = '新记录';
        }
        this.scoreLabel.string = '' + currentScore;
    },

    rankButtonClicked: function () {
        this._delegate && this._delegate.showRank(2);
    },

    shareButtonClicked: function () {
        this._delegate && this._delegate.share();
    },

    backButtonClicked: function () {
        this._delegate && this._delegate.back();
    },

    restartButtonClicked: function () {
        this._delegate && this._delegate.restart();
        this._delegate && this._delegate.startGame();
        this.dismiss();
    },

});
