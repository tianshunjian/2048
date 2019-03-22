#!/bin/sh
# http://docs.cocos.com/creator/manual/zh/publish/publish-in-command-line.html

debug=$1
md5Cache=$2
inlineSpriteFrames=$3

if [[ "$#" -eq 0 ]]; then
    echo "参数均使用默认值:[debug=false,md5Cache=true,inlineSpriteFrames=true] ";
    debug=false
    md5Cache=true
    inlineSpriteFrames=true
else
    if [[ "$#" -ne 3 ]]; then
        echo "必须带上3个参数:[debug=true|false,md5Cache=true|false,inlineSpriteFrames=true|false] ";
        exit
    fi

    if [[ "$debug" != "false" && "$debug" != "true" ]]; then
        echo "参数输入有误，debug只能传 [true,false] ";
        exit
    fi

    if [[ "$md5Cache" != "false" && "$md5Cache" != "true" ]]; then
        echo "参数输入有误，md5Cache只能传 [true,false] ";
        exit
    fi

    if [[ "$inlineSpriteFrames" != "false" && "$inlineSpriteFrames" != "true" ]]; then
        echo "参数输入有误，inlineSpriteFrames只能传 [true,false] ";
        exit
    fi
fi

ccp=$(which CocosCreator);
if [ -n "$ccp" ]; then
    echo 'CocosCreator exist'
else
    ccp="/Applications/CocosCreator.app/Contents/MacOS"
    export PATH=$ccp":"$PATH
    echo "Auto Exported CocosCreator Path:"$ccp
fi

ccwp=$PWD
buildp=$ccwp"/build"
rm -rf $buildp
CocosCreator --path $ccwp --build "platform=web-mobile;debug=${debug};md5Cache=${md5Cache};inlineSpriteFrames=${inlineSpriteFrames};webOrientation=portrait"

dist="${buildp}/web-mobile"
if [[ -d $dist ]]; then
    echo "打包成功，开始替换启动动画"
    /bin/cp ./custom-template/* build/web-mobile/
    echo "启动动画替换完毕"
fi
