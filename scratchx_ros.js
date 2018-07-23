(function(ext) {

    /*-------------------------------*/
    /*----------　変数定義　-----------*/
    /*-------------------------------*/

    var receive_object = "";
    var receive_object_num = 0;
    var moving_state = false;

    var rulo_button1_state = false;
    var rulo_button2_state = false;
    var rulo_button4_state = false;
    var rulo_button8_state = false;
    var rulo_button16_state = false;
    var rulo_button32_state = false;
    var rulo_bumper_right_state = false;
    var rulo_bumper_left_state = false;


    /*---------------------------------------------*/
    /*-----Socket config & ROS topic setting-------*/
    /*---------------------------------------------*/

    var socket = new WebSocket('ws://192.168.11.60:9090');

    var adv_scratch_ros = {
        "op": "advertise",
        "topic": "/scratch_ros",
        "type": "std_msgs/String"
    };

    var sub_ros_scratch = {
        "op": "subscribe",
        "topic": "/ros_scratch",
        "type": "std_msgs/String"
    };

    socket.onopen = function () {//接続が確立された際、TopicのPubSub設定を行う
        socket.send(JSON.stringify(adv_scratch_ros));
        socket.send(JSON.stringify(sub_ros_scratch));
        console.log("Advertise OK")
    };//onopen

    socket.onmessage = function() {

        obj = JSON.parse(event.data);
        msg_data = obj.msg.data;
        console.log('Message from server', msg_data);

        if ( msg_data.indexOf('arrival:') != -1) {
            moving_state = false;
        }else if ( msg_data.indexOf('object:') != -1) {
            receive_object = msg_data.substr(7);
        }else if ( msg_data.indexOf('object_num:') != -1) {
            receive_object_num = Number(msg_data.substr(11));
        }else if( msg_data.indexOf('arrive:') != -1){
            moving_state = false;
        }else if(msg_data.indexOf('rulo_bumper:') != -1){
            if(msg_data.indexOf('right_true') != -1){ rulo_bumper_right_state = true; }
            else if(msg_data.indexOf('right_false') != -1){ rulo_bumper_right_state = false; }
            else if(msg_data.indexOf('left_true') != -1){ rulo_bumper_left_state = true; }
            else if(msg_data.indexOf('left_false') != -1){ rulo_bumper_left_state = false; }
        }else if(msg_data.indexOf('rulo_button:') != -1){
            event_num = Number(msg_data.substr(12));
            if(event_num == 0){
                rulo_button1_state = false;
                rulo_button2_state = false;
                rulo_button4_state = false;
                rulo_button8_state = false;
                rulo_button16_state = false;
                rulo_button32_state = false;
            }else if(event_num == 1){ rulo_button1_state = true; }
            else if(event_num == 2){ rulo_button2_state = true; }
            else if(event_num == 4){ rulo_button4_state = true; }
            else if(event_num == 8){ rulo_button8_state = true; }
            else if(event_num == 16){ rulo_button16_state = true; }
            else if(event_num == 32){ rulo_button32_state = true; }
        }//rulo_button
    };//onmessage


    /*-------------------------------------------*/
    /*----------　ここからScratchxの設定　-----------*/
    /*-------------------------------------------*/

    ext._shutdown = function() {};

    ext._getStatus = function() {
        if(socket.readyState == 1){ return {status: 2, msg: 'Ready'}; }
        else{ return {status: 1, msg: 'Trying'}; }
    };

    ext.pub_scratch_ros = function(str){
        var data = {"data": str};
        var msg = { "op": "publish", "topic": "/scratch_ros", "msg": data };
        socket.send(JSON.stringify(msg));
        console.log('publish data : ' + str);
    };

    /*-------------------------------------------*/
    /*-------------　Rulo用の関数定義　-------------*/
    /*-------------------------------------------*/

    //Ruloの動作モード変更
    ext.rulo_set_ip = function(str){ socket = new WebSocket('ws://' + str + ':9090'); };
    ext.rulo_mode = function(str) { ext.pub_scratch_ros("rulo_drive_mode:" + str); };
    ext.rulo_clean = function(str1, str2){ ext.pub_scratch_ros("rulo_clean:"+str1+','+str2); };
    ext.rulo_stop_crean = function(){ ext.pub_scratch_ros("rulo_clean:0,0"); };


    ext.rulo_cmd_vel = function(str1, str2){
        if(str1 == '0' && str2 == '0'){ moving_state = false; }
        else{ moving_state = true; }
        ext.pub_scratch_ros("rulo_cmd_vel:" + str1 + ',' + str2);
    };

    ext.rulo_stop_move = function(){
        moving_state = false;
        ext.pub_scratch_ros("rulo_cmd_vel:0,0");
    }//rulo_stop_move

    ext.rulo_straight = function(str){//直進
        moving_state = true;
        ext.pub_scratch_ros("rulo_straight:" + str);
    };//rulo_straight

    ext.rulo_turn = function(str){//回転
        moving_state = true;
        ext.pub_scratch_ros("rulo_turn:" + str);
    };//rulo_turn

    ext.rulo_push_1 = function(){ return rulo_button1_state; };
    ext.rulo_push_2 = function(){ return rulo_button2_state; };
    ext.rulo_push_4 = function(){ return rulo_button4_state; };
    ext.rulo_push_8 = function(){ return rulo_button8_state; };
    ext.rulo_push_16 = function(){ return rulo_button16_state; };
    ext.rulo_push_32 = function(){ return rulo_button32_state; };
    ext.rulo_bumper_right = function(){ return rulo_bumper_right_state; };
    ext.rulo_bumper_left = function(){ return rulo_bumper_left_state; };


    //ROSノード起動
    ext.ros_node_launch = function(str) { ext.pub_scratch_ros("ros_launch:" + str); };

    //ROSノード削除
    ext.ros_node_kill = function(str) { ext.pub_scratch_ros("ros_kill:" + str); };

    //音声合成
    ext.ros_speak = function(str) { ext.pub_scratch_ros("ros_speech:" + str); };

    ext.ros_move = function(str){//自立移動
        moving_state = true;
        ext.pub_scratch_ros("ros_move:" + str);
    };//move

    //検出された物体の個数
    ext.object_num = function(){ return receive_object_num; };

    //移動中か否か
    ext.is_moving = function(){ return moving_state; };

    ext.rulo_button_hat = function(str){
        if (str == 'スタート&ストップ' && rulo_button1_state == true){ return true; }
        else if (str == 'ホーム' && rulo_button2_state == true){ return true; }
        else if (str == '念入り' && rulo_button4_state == true){ return true; }
        else if (str == 'スポット' && rulo_button8_state == true){ return true; }
        else if (str == '予約' && rulo_button16_state == true){ return true; }
        else if (str == '毎日' && rulo_button32_state == true){ return true; }
    };//rulo_button_hat

    ext.object_recognition = function(str){
        console.log('object_recognition:' + str);
        if (str == receive_object) {
            console.log('object_recognition' + str);
            receive_object = "";
            return true;
        }
        return false;
    };//object_recognition

    // ブロックのフォーマット指定
    var descriptor = {
        blocks: [
            ['h', 'Rulo %m.rulo_button ボタンが押された時', 'rulo_button_hat', 'スタート&ストップ'],
            [' ', 'Rulo 動作モード %m.rulo_mode_name', 'rulo_mode','normal'],
            [' ', 'Rulo 前後 %n cm/s 左右 %n deg/s', 'rulo_cmd_vel', '30','0'],
            [' ', 'Rulo 動作停止', 'rulo_stop_move'],
            [' ', 'Rulo 直進 %n cm', 'rulo_straight', '100'],
            [' ', 'Rulo 回転 %n deg', 'rulo_turn', '90'],
            [' ', 'Rulo 掃除 吸引 %n % ブラシ %n %', 'rulo_clean', '50','50'],
            [' ', 'Rulo 掃除停止', 'rulo_stop_crean'],
            ['b', 'Rulo スタート&ストップ ボタン', 'rulo_push_1'],
            ['b', 'Rulo ホーム ボタン', 'rulo_push_2'],
            ['b', 'Rulo 念入り ボタン', 'rulo_push_4'],
            ['b', 'Rulo スポット ボタン', 'rulo_push_8'],
            ['b', 'Rulo 予約 ボタン', 'rulo_push_16'],
            ['b', 'Rulo 毎日 ボタン', 'rulo_push_32'],
            ['b', 'Rulo バンパ右', 'rulo_bumper_right'],
            ['b', 'Rulo バンパ左', 'rulo_bumper_left'],
            [' ', '%s と話す', 'ros_speak', 'こんにちわ'],
            ['h', '%m.object を検出したとき', 'object_recognition', 'person'],
            ['r', '検出した個数', 'object_num'],
            ['b', '移動中か否か', 'is_moving'],
        ],
        menus: {
            rulo_mode_name: ['normal', 'manual'],
            rulo_button: ['スタート&ストップ', 'ホーム', '念入り','スポット','予約','毎日'],
            node_name: ['LRF Sensor','RGBD Sensor','TextToSpeech','SLAM','Draknet_ros'],
            move_destination: ['origin', 'point1', 'point2', 'point3', 'point4'],
            object: ['person'],
        },
    };

    // Scratch に作ったブロックを登録
    ScratchExtensions.register('Rulo × ROS blocks', descriptor, ext);
})({});
