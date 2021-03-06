/**

Franjo Kluz - The Game

Copyright (C) 2015 Aleksandar Erkalovic <aerkalov@gmail.com>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

(function (win, _) {
  'use strict';

  win.franjo = (function () {
    var data = {
      'currentScreen': null,
      'stage': null,
      'renderer': null
    };

    return  {
      'data': data
    };
  })();


  win.franjo.objects = (function () {

    /**
      ButtonNext
    */
    var ButtonNext = function () {
      PIXI.DisplayObjectContainer.call( this );

      var self = this;

      this.texture1 = PIXI.Texture.fromImage("assets/images/button_next.png");
      this.texture2 = PIXI.Texture.fromImage("assets/images/button_next_active.png");

      this.button = new PIXI.Sprite(this.texture1);
      this.button.interactive = true
      this.button.buttonMode = true

      this.button.mouseover = function (e) {
        this.setTexture(self.texture2);
      };

      this.button.mouseout = function (e) {
        this.setTexture(self.texture1);
      };

      this.button.click = this.button.tap = function (e) {
        self.click(e);
      };  

      this.addChild(this.button);
    };

    ButtonNext.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
    ButtonNext.prototype.constructor = ButtonNext;


    /**
       ChatBubble

    */

    var ChatBubble = function (obj) {
      PIXI.DisplayObjectContainer.call( this );

      this.obj = obj;
      this.visible = false;

      this.text = new PIXI.Text("", { font: "18px Silkscreen", fill: '#ffd5aa', align: "left" });
      this.text.position.x = 4;
      this.text.position.y = 4;

      this.graphics = new PIXI.Graphics();

      this.graphics.addChild(this.text);    
      this.addChild(this.graphics);
    };

    ChatBubble.prototype = Object.create(PIXI.DisplayObjectContainer.prototype);
    ChatBubble.prototype.constructor = ChatBubble;

    ChatBubble.prototype.hide = function (text) {
      this.visible = false;
    };

    ChatBubble.prototype.sayText = function (text) {
      this.text.setText(text);

      // Get position of the object
      var posx = this.obj.position.x;
      var posy = this.obj.position.y;

      var w = this.text.width + 8;
      var h = this.text.height + 8;

      this.graphics.clear();
      this.graphics.position.y = posy - (h + 12 + 8);
      this.graphics.position.x = posx - (w * 0.25);

      if (this.graphics.position.x <= 0) {
        this.graphics.position.x = 32;
      }

      if (this.graphics.position.x + w > 800) {
        this.graphics.position.x = 800 - 32 - w;
      }

      this.graphics.beginFill(0xd4a66a);
      this.graphics.lineStyle(1, 0xd4a66a, 0);
    
      this.graphics.moveTo(4, 0);
      this.graphics.lineTo(w - 4, 0);
      this.graphics.lineTo(w - 4, 4);
      this.graphics.lineTo(w, 4);
      this.graphics.lineTo(w, h - 4);
      this.graphics.lineTo(w - 4, h - 4);
      this.graphics.lineTo(w - 4, h);
      this.graphics.lineTo(4, h);
      this.graphics.lineTo(4, h - 4);
      this.graphics.lineTo(0, h - 4);
      this.graphics.lineTo(0, 4);
      this.graphics.lineTo(4, 4);
      this.graphics.lineTo(4, 0);

      this.graphics.endFill();   

      var diff = Math.abs(this.graphics.position.x - posx) + 64;

      this.graphics.beginFill(0xd4a66a);
      this.graphics.lineStyle(2, 0xd4a66a, 0);
      this.graphics.drawRect(diff, h, 16, 4)
      this.graphics.drawRect(diff - 4, h + 4, 12, 4)
      this.graphics.drawRect(diff - 4 - 4, h + 4 + 4, 8, 4)
      this.graphics.drawRect(diff -4 - 4 -4, h + 4 + 4 + 4, 4, 4)
      this.graphics.endFill();     

      this.visible = true;
    };

    /**
       Timeline.
  
    */

    var Timeline = function (timeline) {
      this.timelineStart = null
      this.timelinePos = 0;

      this.timeline = timeline;
    };

    Timeline.prototype.reset = function () {
      this.timelineStart = null;
      this.timelinePos = 0;      
    };

    Timeline.prototype.animate = function (screen) {
      if (!this.timelineStart) {
        this.timelineStart = _.now();
      } else {
        var diff = Math.trunc((_.now() - this.timelineStart)/1000);

        while (true) {
          if (!_.isUndefined(this.timeline[this.timelinePos]) && this.timeline[this.timelinePos][0] <= diff) {
            this.timeline[this.timelinePos][1].call(screen);
            this.timelinePos += 1;
          } else {
            break;
          }
        }
      }
    };

    /**
      Work

      Arguments:
       - init
       - callback
    */

    var Work = function (opts) {
      this.opts = opts || {};

      if (opts.init) {
        opts.init.call(this);
      }
    };

    Work.prototype.constructor = Work;

    Work.prototype.animate = function () {
      if(this.opts.callback) {
        this.opts.callback.call(this);
      }
    };

    /**
       Screen
  
    */

    var Screen = function () {
      var self = this;

      this.container = new PIXI.DisplayObjectContainer();

      this.isReady = false;
      this._audioReady = false;
      this._assetsReady = false;

      this.assetsToLoader = this.assetsToLoader || [];
      this.soundsToLoad = this.soundsToLoad || [];
      this.operations = [];

      this._progressToLoad = this.assetsToLoader.length + (this.soundsToLoad.length > 0 ? 0 : 1);
      this._progressHasLoaded = 0;
      this._progressEnabled = (this._progressEnabled !== undefined) ? this._progressEnabled : true;

      if (this._progressEnabled) {
        this._progressGraphics = new PIXI.Graphics();
        this._progressGraphics.beginFill(0x552f00);
        this._progressGraphics.drawRect(0, 0, 200, 50);
        this._progressGraphics.endFill();     

        this._progressGraphics.position.set(300, 300);
        this.container.addChild(this._progressGraphics);
      }

      if (this.assetsToLoader.length > 0) {
        this.loader = new PIXI.AssetLoader(this.assetsToLoader, true);

        this.loader.onProgress = function (e) {
          self._progressHasLoaded += 1;
          self._onProgress.call(self);          
        };

        this.loader.onComplete = function () {
          self._assetsReady = true;
          self._check.call(self);
        };

        this.loader.load();
      } else {  
          self._assetsReady = true;
          self._check.call(self);
      }

      if (this.soundsToLoad.length > 0) {
        /* Some of these properties should be defined somewhere else */
        this.sound = new Howl({
          src: this.soundsToLoad,
          autoplay: true,
          loop: true,
          preload: true,
          onload: function () {
            self._audioReady = true;
            self._check.call(self);

            self._progressHasLoaded += 1;
            self._onProgress.call(self);
          },
          onloaderror: function () {
            console.log('Can not read audio.');
          }
        });
      } else {        
        this.sound = null;        
        this._audioReady = true;
        self._check.call(self);        
      }
    };

    Screen.prototype._onProgress = function () {
      if (!this._progressEnabled) {
        return;
      }

      this._progressGraphics.clear();

      this._progressGraphics.beginFill(0x552f00);
      this._progressGraphics.drawRect(0, 0, 200, 50);      
      this._progressGraphics.endFill();     

      this._progressGraphics.beginFill(0xd4a66a);
      this._progressGraphics.drawRect(4, 4, 192 * this._progressHasLoaded / this._progressToLoad, 42);      
      this._progressGraphics.endFill();     
    };

    Screen.prototype._check = function () {
      var self = this;

      if (self._audioReady && self._assetsReady) {
        if (this._progressEnabled) {
          self.container.removeChild(self._progressGraphics);
        }

        self.init.call(self);
        self.isReady = true;
      } 
    };

    Screen.prototype.init = function () { 
    };

    Screen.prototype.show = function () {
      win.franjo.data.stage.addChild(this.container);
    };

    Screen.prototype.hide = function () {
      this.sound = null;
      this.loader = null;
      win.franjo.data.stage.removeChild(this.container);
    };

    Screen.prototype.onKeyDown = function (evt) {

    };

    Screen.prototype.tap = function (evt) {

    };

    Screen.prototype.animate = function () {
      var i = 0;

      while (i < this.operations.length) {
        var ret = this.operations[i].animate();
        if (!_.isUndefined(ret)) {
          if (ret === false) {
            this.operations.splice(i, 1);
          } else {
            i += 1;
          }
        } else {
          i += 1;
        }
      }
    };


    /**
      YugoScreen
    */

    var YugoScreen = function () {
      var self = this;

      this.assetsToLoader = [
        "assets/images/sprite_lightpole.png",      
        "assets/images/sprite_women.png",      
        "assets/images/sprite_man.png",
        "assets/images/sprite_man_2.png",      
      ];

      this.soundsToLoad = ['assets/music/city.mp3'];

      this.timeline = new Timeline([
        [2, function () {
          this.bubble2.sayText("Tragedija pretpostavlja vjerovanje\nu dobrotu.");
        }],
        [4, function () {
          this.bubble2.hide();
        }],
        [5, function () {
          this.bubble3.sayText("Ne, sudbina je nesrece da\nsama sebi grize prste,\ns uzivanjem.");
        }],        
        [8, function () {
          this.bubble3.hide();
          this.bubble1.sayText("Ja ne mrzim nista. Odbacujem suvisno.");          
        }],
        [10, function () {
          this.bubble1.hide();
        }],
        [12, function () {
          this.bubble2.sayText("Mi smo vremenom prozeti, a ono tek po\nnama ima svoj smisao.");
        }],
        [15, function () {
          this.bubble2.hide();
          this.bubble1.sayText("Ljudi su ljudi i sve je ljudsko samo ljudsko, nazalost!");
        }],
        [18, function () {
          this.bubble1.hide();
        }],
        [40, function () {
          this.bubble2.sayText("I farted.");
        }]
      ]);

      Screen.call(this);
    };


    YugoScreen.prototype = Object.create(Screen.prototype);
    YugoScreen.prototype.constructor = YugoScreen;

    YugoScreen.prototype.init = function () {
      var self = this;

      this.sound.on('faded', function () {
        var scrn = new CoupScreen();
        win.franjo.game.setScreen(scrn);
      });

      this.nextButton = new  ButtonNext();
      this.nextButton.position.set(700, 500);
      this.nextButton.click = this.nextButton.tap = function (e) {
        self.sound.fade(1.0, 0, 1000);
      };

      this.women = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_women.png"));
      this.women.anchor.x = 0;
      this.women.anchor.y = 0;
      this.women.position.x = 480;
      this.women.position.y = 475;
      this.women.visible = true;


      this.man = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_man.png"));
      this.man.anchor.x = 0;
      this.man.anchor.y = 0;
      this.man.position.x = 90;
      this.man.position.y = 495;
      this.man.visible = true;

      this.man2 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_man_2.png"));
      this.man2.anchor.x = 0;
      this.man2.anchor.y = 0;
      this.man2.position.x = 320;
      this.man2.position.y = 390;
      this.man2.visible = true;



      this.lightpole = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_lightpole.png"));
      this.lightpole.anchor.x = 0;
      this.lightpole.anchor.y = 0;
      this.lightpole.position.x = 220;
      this.lightpole.position.y = 340;

      this.lightpole2 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_lightpole.png"));
      this.lightpole2.anchor.x = 0;
      this.lightpole2.anchor.y = 0;
      this.lightpole2.position.x = 420;
      this.lightpole2.position.y = 340;

      this.lightpole3 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_lightpole.png"));
      this.lightpole3.anchor.x = 0;
      this.lightpole3.anchor.y = 0;
      this.lightpole3.position.x = 620;
      this.lightpole3.position.y = 340;


      var titleText = new PIXI.Text("Tripartite Pact", { font: "24px SilkscreenBold", fill: '#552f00', stroke: '#552f00', align: "left" });
      titleText.position.x = 20;
      titleText.position.y = 20;

      var descMessage = "On March 25, 1941 in Vienna, Dragisa Cvetkovic, Prime\n\
Minister of the Kingdom of Yugoslavia, signed the\n\
Tripartite Pact, forming an alliance with Axis powers\n\
Germany, Italy, and Japan. This was result of a pressure\n\
and ultimatums from German side. Had it not complied,\n\
Yugoslavia would be occupied by Axis powers.";

      var descText = new PIXI.Text(descMessage, { font: "18px Silkscreen", fill: '#552f00', align: "left"});
      descText.position.x = 20;
      descText.position.y = 55;

      this.bubble1 = new ChatBubble(this.man);
      this.bubble2 = new ChatBubble(this.man2);      
      this.bubble3 = new ChatBubble(this.women);

      this.container.addChild(descText);
      this.container.addChild(titleText); 

      this.container.addChild(this.lightpole);
      this.container.addChild(this.lightpole2);
      this.container.addChild(this.lightpole3);

      this.container.addChild(this.women);
      this.container.addChild(this.man);      
      this.container.addChild(this.man2);

      this.container.addChild(this.bubble1);
      this.container.addChild(this.bubble2);
      this.container.addChild(this.bubble3);
      this.container.addChild(this.nextButton);

    };

    YugoScreen.prototype.animate = function () {
      this.timeline.animate(this);

      Screen.prototype.animate.call(this);
    };


    /** 
      CoupScreen
    */

    var CoupScreen = function () {
      var self = this;

      this.assetsToLoader = [
        "assets/images/sprite_women.png",      
        "assets/images/sprite_man.png",
        "assets/images/sprite_man_2.png",
        "assets/images/sprite_bus.png",
        "assets/images/sprite_lightpole.png"
      ];
      this.soundsToLoad = ['assets/music/large_arena_crowd_chanting.mp3'];
      this.busRunning = true;

      Screen.call(this);
    };

    CoupScreen.prototype = Object.create(Screen.prototype);
    CoupScreen.prototype.constructor = CoupScreen;

    CoupScreen.prototype.init = function () {
      var self = this;

      this.operations.push(new Work({
        'init': function () {
        },
        'callback': function () {
          if (self.busRunning) {
             self.bus.position.x += 2;

            if (self.bus.position.x > 850) {
              self.bus.position.x = -500;
            }
          }
        }
      }));

      this.operations.push(new Work({
        'init': function () {
          this.counter = 0;
        },
        'callback': function () {
          this.counter += 1;

          if (this.counter > 20) {
            _.each(self.bubbles, function (bubble) { bubble.hide(); });
              var bubble = _.sample(self.bubbles);
              bubble.sayText(_.sample(['Long live the king!', 'Adolf can suck balls!', 'Bolje rat nego pakt!', 
                'Bolje grob nego rob!', 'Viktor fon Heren has small penis!' ,'No Hope No Fear!',
                'Rent Is Too Damn High!'
              ]));

              setTimeout(function () { bubble.hide(); }, 2000);
            this.counter = 0;
          }
        }
      }));

      this.sound.on('faded', function () {
        var scrn = new IntroScreen();
        win.franjo.game.setScreen(scrn);
      });

      this.nextButton = new  ButtonNext();
      this.nextButton.position.set(700, 500);
      this.nextButton.click = this.nextButton.tap = function (e) {
          self.sound.fade(1.0, 0, 1000);
      };

      this.bus = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_bus.png"));
      this.bus.anchor.x = 0;
      this.bus.anchor.y = 0;
      this.bus.position.x = -510;
      this.bus.position.y = 410;
      this.bus.visible = true;


      this.lightpole = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_lightpole.png"));
      this.lightpole.position.x = 220;
      this.lightpole.position.y = 260;

      this.lightpole2 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_lightpole.png"));
      this.lightpole2.position.x = 420;
      this.lightpole2.position.y = 260;

      this.lightpole3 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_lightpole.png"));
      this.lightpole3.position.x = 620;
      this.lightpole3.position.y = 260;


      var titleText = new PIXI.Text("Coup d'etat ", { font: "24px SilkscreenBold", fill: '#552f00', stroke: '#552f00', align: "left" });
      titleText.position.x = 20;
      titleText.position.y = 20;

      var descMessage = "Coup occured 2 days later in Belgrade. It was planned\n\
and conducted by a group of Royal Yugoslav Air Force\n\
officers led by General Dusan Simovic. Conspirators\n\
brouth to power the 17 year old King Petar II \n\
Karadordevic. It had been planned for several months,\n\
but the signing of the Tripartite Pact spurred the\n\
organisers to carry it out.";

      var descText = new PIXI.Text(descMessage, { font: "18px Silkscreen", fill: '#552f00', align: "left", strokeThickness: 0, dropShadow : false});
      descText.position.x = 20;
      descText.position.y = 55;

      this.container.addChild(descText);
      this.container.addChild(titleText);      
      this.container.addChild(this.lightpole);
      this.container.addChild(this.lightpole2);
      this.container.addChild(this.lightpole3);


      this.people = [];
      this.bubbles = [];

      _(6).times( function (n) {
        var found = false;

        _(10).times( function (j) {
          var image = _.sample(["assets/images/sprite_man.png", "assets/images/sprite_man_2.png"], 1);

          var man = new PIXI.Sprite(PIXI.Texture.fromFrame(image));        
          man.anchor.x = 0;
          man.anchor.y = 0;

          man.position.x = 40 + _.random(620);
          man.position.y = 320 + (n * 20) + _.random(20);
          man.visible = true;

          self.people.push(man);
          self.container.addChild(man);
        });
      });

      var bubbleTypes = [false, false, false];

      _.each(this.people, function (elem) {
        if (!bubbleTypes[0]) {
          if (elem.position.x < 250) {
            var bubble = new ChatBubble(elem);

            self.bubbles.push(bubble);
            self.container.addChild(bubble);
            bubbleTypes[0] = true;
            return;
          }
        }
        if (!bubbleTypes[1]) {
          if (elem.position.x > 250 && elem.position.x < 400) {
            var bubble = new ChatBubble(elem);

            self.bubbles.push(bubble);
            self.container.addChild(bubble);
            bubbleTypes[1] = true;
            return;
          }
        }   

        if (!bubbleTypes[3]) {
          if (elem.position.x > 400) {
            var bubble = new ChatBubble(elem);

            self.bubbles.push(bubble);
            self.container.addChild(bubble);
            bubbleTypes[3] = true;
            return;
          }
        }

      });

      this.container.addChild(this.bus);      
      this.container.addChild(self.nextButton);
    };


    /**
      FirstScreen

    */

   var FirstScreen = function () {
      var self = this;

      this.assetsToLoader = [
        "assets/images/logo_small.png"
      ];
      this._progressEnabled = false;

      Screen.call(this);
    };

    FirstScreen.prototype = Object.create(Screen.prototype); 
    FirstScreen.prototype.constructor = FirstScreen;

    FirstScreen.prototype.init = function () {
      var self = this;

      this.graphics = new PIXI.Graphics();
      this.graphics.beginFill(0xffffff);
      this.graphics.drawRect(0, 0, 801, 601);
      this.graphics.endFill();     



      var titleText = new PIXI.Text("binarni.net", { font: "80px Silkscreen", fill: '#000000', stroke: '#000000', align: "left" });
      titleText.position.x = 400 - titleText.width / 2;
      titleText.position.y = 200;


      this.logo = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/logo_small.png"));
      this.logo.position.x = 322;
      this.logo.position.y = 500;
      this.logo.scale.x = 0.5;
      this.logo.scale.y = 0.5;

      this.container.addChild(this.graphics);
      this.container.addChild(titleText);
      this.container.addChild(this.logo);      
    };    


    /** 
      IntroScreen
    */

    var IntroScreen = function () {
      this.assetsToLoader = [
        "assets/images/kraljevina_mapa.png",      
        "assets/images/sprite_nazie_flag.png",
        "assets/images/sprite_krst.png"
      ];
      this.soundsToLoad = ['assets/music/war.mp3'];

      Screen.call(this);
    };

    IntroScreen.prototype = Object.create(Screen.prototype);
    IntroScreen.prototype.constructor = IntroScreen;

    IntroScreen.prototype.init = function () {
      var self = this;

      this.nextButton = new  ButtonNext();
      this.nextButton.position.set(700, 500);
      this.nextButton.click = this.nextButton.tap = function (e) {
        self.sound.fade(1.0, 0, 1000);
      };

      this.sound.on('faded', function () {
        var scrn = new InstructionsScreen();
        win.franjo.game.setScreen(scrn);        
      });


      this.mapa = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/kraljevina_mapa.png"));
      this.mapa.position.x = 218;
      this.mapa.position.y = 270;

      this.flag1 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_nazie_flag.png"));
      this.flag1.position.x = 300 + 198;
      this.flag1.position.y = 274;

      this.flag2 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_nazie_flag.png"));
      this.flag2.position.x = 100 + 198;
      this.flag2.position.y = 274;

      this.flag3 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_nazie_flag.png"));
      this.flag3.position.x = 320 + 198;
      this.flag3.position.y = 430;


      this.krst = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_krst.png"));
      this.krst.position.x = 210 + 198;
      this.krst.position.y = 390;

      var titleText = new PIXI.Text("Fuhrer Directive No. 25", { font: "24px SilkscreenBold", fill: '#552f00', stroke: '#552f00', align: "left" });
      titleText.position.x = 20;
      titleText.position.y = 20;

      var desc = "The coup resulted in the German-led Axis invasion\n\
of Yugoslavia. Invasion began on 6 April 1941. It ended\n\
with unconditional surrender of the Royal Yugoslav Army\n\
18 April 1941. The invasion commenced with an\n\
overwhelming air attack on Belgrade and facilities\n\
of the Royal Yugoslav Air Force by the Luftwaffe.";
      
      var descText = new PIXI.Text(desc, { font: "18px Silkscreen", fill: '#552f00', align: "left" });
      descText.setText(desc);
      descText.position.x = 20;
      descText.position.y = 55;

      this.operations.push(new Work({
        'callback': function () {
          if (self.flag1.position.x > 230 + 198) {
            self.flag1.position.x -= 0.5;
            self.flag1.position.y += 0.5;
          } else {
            self.flag1.position.x = 300 + 198;
            self.flag1.position.y = 274;
          }

          if (self.flag2.position.x < 150 + 198) {
            self.flag2.position.x += 0.5;
            self.flag2.position.y += 0.5;
          } else {
            self.flag2.position.x = 100 + 198;
            self.flag2.position.y = 274;
          }

          if (self.flag3.position.x > 250 + 198) {
            self.flag3.position.x -= 0.5;
            self.flag3.position.y += 0.2;
          } else {
            self.flag3.position.x = 320 + 198;
            self.flag3.position.y = 430;
          }
        }
      }));

      this.container.addChild(descText);
      this.container.addChild(titleText);      
      this.container.addChild(this.mapa);

      this.container.addChild(this.krst);      
      this.container.addChild(this.flag1);      
      this.container.addChild(this.flag2);            
      this.container.addChild(this.flag3);      
      this.container.addChild(this.nextButton);
    };

    /**
      IK3


    */

    var IK3 = function () {
      var frames = [
        PIXI.Texture.fromFrame('assets/images/sprite_ikarus_1.png'),
        PIXI.Texture.fromFrame('assets/images/sprite_ikarus_2.png'),
      ];

      PIXI.MovieClip.call(this, frames);
      this.anchor.set(0.7, 0.5);
      this.speed = new PIXI.Point();
      this.gravity = 0.2;
      this.position.x = 150;
      this.maxSpeed = 10;
      this.rotation = 0;

      this.scale.x = 0.5;
      this.scale.y = 0.5;

      this.angle = 0;
      this.strangeThings = [];

      this.play();
      this.animationSpeed = 0.4;

      this._z = 0;
    };

    IK3.prototype = Object.create(PIXI.MovieClip.prototype);

    IK3.prototype.speedUp = function () {
      var self = this;

      this.speed.y -= 5;

      _(5).times(function () {
        self.strangeThings.push(-1.5);
      });
    };

    IK3.prototype.update = function () {      
      this.speed.y += this.gravity;
      this.speed.y = Math.min(this.speed.y, this.maxSpeed);
      this.speed.y = Math.max(this.speed.y, -this.maxSpeed);
      this.position.y += this.speed.y; 

      if (this.position.y < 0) {
        this.position.y = 0;
        this.speed.y = 0;     
      }

      // if (this.position.y > 590) {
      //   this.position.y = 590;

      if (this.position.y > 380) {
        this.position.y = 380;

        this.speed.y = 0;
        this.angle = 0;
      }

      if (this.angle > 20) {        
        this.angle = 20;
        this.strangeThings = [];
      }

      if (this.angle < -20) {        
        this.angle = -20;
        this.strangeThings = [];
      }

      this._z += 1;

      if (this._z > 2) {
        this.strangeThings.push(1);
        this._z = 0;
      }

      if (this.strangeThings.length > 0) {
        this.angle += this.strangeThings[0];
        this.strangeThings.splice(0, 1);
      }

      this.rotation = 0.01745 * this.angle;
    };

    IK3.prototype.reset = function () {
      this.position.y = 200;
      this.speed.y = 0;
      this.rotation = 0;
      this.angle = 0;
      this.strangeThings = [];
    };


    /**
      InstructionsScreen
    */


    var InstructionsScreen = function () {
      this.assetsToLoader = [
        "assets/images/sprite_ikarus_1.png",
        "assets/images/sprite_ikarus_2.png",
        "assets/images/sprite_hand.png",
        "assets/images/sprite_space.png",
        "assets/images/sprite_space_2.png",
        "assets/images/sprite_enter_1.png",
        "assets/images/sprite_enter_2.png",
        "assets/images/sprite_bullet.png",
        "assets/images/sprite_circle.png"        
      ];
      this.soundsToLoad = [];
      this.bullets = [];

      Screen.call(this);
    };

    InstructionsScreen.prototype = Object.create(Screen.prototype);
    InstructionsScreen.prototype.constructor = InstructionsScreen;

    InstructionsScreen.prototype.init = function () {
      var self = this;

      this.instructionState = 0;
      this.flyingClicked = 0;
      this.shootingClicked = 0;

      this.ikarus = new IK3();
      this.ikarus.position.y = 270;

      this.instruction = new PIXI.Text("FLYING", { font: "36px Silkscreen", fill: '#ffd9aa', stroke: '#552f00', align: "left" });
      this.instruction.position.x = 400 - this.instruction.width / 2;
      this.instruction.position.y = 50;
      this.container.addChild(this.instruction);

      this.instruction2 = new PIXI.Text("TOUCH LEFT SIDE OF SCREEN", { font: "20px Silkscreen", fill: '#ffd9aa', stroke: '#552f00', align: "center" });
      this.instruction2.position.x = 50;
      this.instruction2.position.y = 390;
      this.container.addChild(this.instruction2);

      this.instruction3 = new PIXI.Text("PRESS SPACE", { font: "20px Silkscreen", fill: '#ffd9aa', stroke: '#552f00', align: "center" });
      this.instruction3.position.x = 570;
      this.instruction3.position.y = 390;
      this.container.addChild(this.instruction3);

      this.hand = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_hand.png"));
      this.hand.position.x = 118 + 30;   
      this.hand.position.y = 440;

      this.graphics = new PIXI.Graphics();
      this.graphics.position.set(140 + 30, 450);
      var f = new PIXI.PixelateFilter();
      f.size.x = 4;
      f.size.y = 4;
      this.graphics.filters = [f];
      this.container.addChild(this.graphics);


      this.hand2 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_hand.png"));
      this.hand2.position.x = 625;   
      this.hand2.position.y = 490 + 30;

      var handTexture01 = PIXI.Texture.fromFrame("assets/images/sprite_space.png");
      var handTexture02 = PIXI.Texture.fromFrame("assets/images/sprite_space_2.png");

      this.enterTexture01 = PIXI.Texture.fromFrame("assets/images/sprite_enter_1.png");
      this.enterTexture02 = PIXI.Texture.fromFrame("assets/images/sprite_enter_2.png");

      this.bulletTexture = PIXI.Texture.fromFrame("assets/images/sprite_bullet.png");

      this.circleTexture = PIXI.Texture.fromFrame("assets/images/sprite_circle.png");

      this.circle = new PIXI.Sprite(this.circleTexture);
      this.circle.position.x = 610;   
      this.circle.position.y = 220;
      this.container.addChild(this.circle);

      this.counter = new PIXI.Text("7", { font: "32px Silkscreen", fill: '#ffd9aa', stroke: '#552f00', align: "center" });
      this.counter.position.x = 624;
      this.counter.position.y = 224;
      this.container.addChild(this.counter);

      this.space = new PIXI.Sprite(handTexture01);
      this.space.position.x = 550;   
      this.space.position.y = 440;
      this.container.addChild(this.space);

      _(20).times(function (idx) {
          var bullet  = new PIXI.Sprite(self.bulletTexture);
          bullet.position.x = -100;   
          bullet.position.y = -100;
          bullet.visible = false;

          self.bullets.push(bullet);    

          self.container.addChild(bullet);
      });


      this.work1 = new Work({
        'init': function () {
          this.direction = 0;
          this.direction2 = 0;
          this.circle = -1;
          this.marked = -1;
        },
        'callback': function () {
          if (this.circle >= 0) {
            self.graphics.clear();
            self.graphics.beginFill(0xd4a66a);
            self.graphics.drawCircle(0, 0, Math.abs(this.circle));
            self.graphics.endFill();   

            this.circle += 1;

            if (this.circle > 12) {
              this.circle = -1;
              self.graphics.clear();
            }
          } 

          if (this.direction == 0) {
            self.hand.position.y += 2;
          } else {
            self.hand.position.y -= 2;
          }

          if  (self.hand.position.y < 440) {
            self.hand.position.y = 440;
            this.direction = 0;
            this.circle = 1;
          } 
          if (self.hand.position.y > 470) {
            self.hand.position.y = 470;
            this.direction = 1;
          }

          if (this.direction2 == 0) {
            self.hand2.position.y += 2;
          } else {
            self.hand2.position.y -= 2;
          }

          if (this.marked === 0) {
            self.space.setTexture(handTexture01);
            this.marked = -1;
          }

          if (this.marked > 0) {
            this.marked -= 1;
          }        

          if  (self.hand2.position.y < 490) {
            self.hand2.position.y = 490;
            this.direction2 = 0;
            this.marked = 5;
            self.space.setTexture(handTexture02);
          } 

          if (self.hand2.position.y > 520) {
            self.hand2.position.y = 520;
            this.direction2 = 1;
          }
        }
      });

      this.work2 = new Work({
        'init': function () {
          this.direction = 0;
          this.direction2 = 0;
          this.circle = -1;
          this.marked = -1;
        },
        'callback': function () {
          _.each(self.bullets, function (bullet, idx) {
            if (bullet.visible === false) {              
              return;
            }
            bullet.position.x += 20 * bullet._x;
            bullet.position.y += 20 * bullet._y;

            if (bullet.position.x > 800) {
              bullet.visible = false;
            }
          });

          if (this.circle >= 0) {
            self.graphics.clear();
            self.graphics.beginFill(0xd4a66a);
            self.graphics.drawCircle(0, 0, Math.abs(this.circle));
            self.graphics.endFill();   

            this.circle += 1;

            if (this.circle > 12) {
              this.circle = -1;
              self.graphics.clear();
            }
          } 

          if (this.direction == 0) {
            self.hand.position.y += 2;
          } else {
            self.hand.position.y -= 2;
          }

          if  (self.hand.position.y < 440) {
            self.hand.position.y = 440;
            this.direction = 0;
            this.circle = 1;
          } 
          if (self.hand.position.y > 470) {
            self.hand.position.y = 470;
            this.direction = 1;
          }

          if (this.direction2 == 0) {
            self.hand2.position.y += 2;
          } else {
            self.hand2.position.y -= 2;
          }

          if (this.marked === 0) {
            self.space.setTexture(self.enterTexture01);
            this.marked = -1;
          }

          if (this.marked > 0) {
            this.marked -= 1;
          }        

          if  (self.hand2.position.y < 490) {
            self.hand2.position.y = 490;
            this.direction2 = 0;
            this.marked = 5;
            self.space.setTexture(self.enterTexture02);
          } 

          if (self.hand2.position.y > 520) {
            self.hand2.position.y = 520;
            this.direction2 = 1;
          }
        }
      });

      this.operations.push(this.work1);


      this.container.addChild(this.hand);
      this.container.addChild(this.hand2);

      this.container.addChild(this.ikarus);
      win.franjo.data.stage.interactive = true;

      this.operations.push(new Work({
        'callback': function () {
          self.ikarus.update();
        }
      }));
    };

    InstructionsScreen.prototype.tap = function (e) {
        this.ikarus.speedUp();
    };

    InstructionsScreen.prototype.setSecondInstructions = function () {
      this.operations.splice(0, 1);
      this.operations.push(this.work2);

      this.instructionState = 1;

      this.instruction.setText('SHOOTING');
      this.instruction.position.x = 400 - this.instruction.width / 2;

      this.instruction2.setText('PRESS ENTER');
      this.instruction2.position.x = 100;

      this.instruction3.setText('TOUCH RIGHT SIDE OF SCREEN');
      this.instruction3.position.x = 400;

      this.space.setTexture(this.enterTexture01);
      this.space.position.x = 130;   

      this.hand.position.x = 540;   
      this.graphics.position.set(22 + 540 , 450);

      this.hand2.position.x = 180;   

      this.counter.setText("7");
    };

    InstructionsScreen.prototype.onKeyDown = function (e) {
      if (e.keyCode == 13) {
        if (this.instructionState == 1) {
          this.shootingClicked += 1;

          this.counter.setText(7 - this.shootingClicked);

          for (var i = 0; i < this.bullets.length; i++) {
            if (this.bullets[i].visible == false) {

              var self = this;
              var bullet = self.bullets[i];
              bullet._y = (self.ikarus.angle < 0? -1: 1) * Math.sin(Math.abs(self.ikarus.rotation));
              bullet._x = Math.cos(Math.abs(self.ikarus.rotation));

              bullet.position.x = self.ikarus.position.x;   
              bullet.position.y = self.ikarus.position.y;
              bullet.visible = true;

              break;
            }
          }

          if (this.shootingClicked ===7) {
            var scrn = new FirstLevelScreen();
            win.franjo.game.setScreen(scrn);
          }
        }
      }

      if (e.keyCode == 32) {
        if (this.instructionState === 0) {
          this.flyingClicked += 1;
          this.counter.setText(7 - this.flyingClicked);

          if (this.flyingClicked === 7) {
            this.setSecondInstructions();
          }
        } 

        this.ikarus.speedUp();
      }
    };


    /**
      FirstLevelScreen
    */


    var FirstLevelScreen = function () {
      this.assetsToLoader = [
        "assets/images/sprite_ikarus_1.png",
        "assets/images/sprite_ikarus_2.png",
        "assets/images/sprite_oerlikon_1.png",
        "assets/images/sprite_oerlikon_2.png",        
        "assets/images/sprite_bullet.png",
        "assets/images/sprite_circle.png"        
      ];
      this.soundsToLoad = [];
      this.bullets = [];

      Screen.call(this);
    };

    FirstLevelScreen.prototype = Object.create(Screen.prototype);
    FirstLevelScreen.prototype.constructor = FirstLevelScreen;

    FirstLevelScreen.prototype.init = function () {
      var self = this;

      this.shootingClicked = 0;

      // Define boundaries for IK3
      this.ikarus = new IK3();
      this.ikarus.position.y = 270;

      this.gun1 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_oerlikon_1.png"));
      this.gun1.position.x = 50;   
      this.gun1.position.y = 530;

      this.gun2 = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_oerlikon_2.png"));
      this.gun2.position.x = 50;   
      this.gun2.position.y = 530;

      this.thing = new PIXI.Graphics();
      this.gun1.addChild(this.thing);
//      stage.addChild(thing);
      this.thing.position.x = 0;
      this.thing.position.y = 0;
      this.showGun();
      this.gun1.mask = this.thing;

      this.container.addChild(this.ikarus);
      this.container.addChild(this.gun2);
      this.container.addChild(this.gun1);

      win.franjo.data.stage.interactive = true;

      this._changed = false;

      this.operations.push(new Work({
        'init': function () {
          this.i = 0;
        },
        'callback': function () {
          self.ikarus.update();

          if (this._changed) {
            this._changed = false;
            return;
          }

          this.i += 1;

          if (this.i % 20 === 0) {
            this.i = 0;

            self.showGun();

            if (self.shootingClicked > 0) {
              self.shootingClicked -= 1;
            } 
          }
        }
      }));

    };

    FirstLevelScreen.prototype.showGun = function () {
      this.thing.clear();
      this.thing.beginFill(0x8bc5ff, 0.4);    
      this.thing.drawRect(this.shootingClicked * 10, 0, 128, 50);
      this.thing.endFill();
    };

    FirstLevelScreen.prototype.onKeyDown = function (e) {
      if (e.keyCode == 13) {
        if (this.shootingClicked < 13) {
          this.shootingClicked += 1;

          this.showGun();
          this._changed = true;
        }

          /*
          for (var i = 0; i < this.bullets.length; i++) {
            if (this.bullets[i].visible == false) {

              var self = this;
              var bullet = self.bullets[i];
              bullet._y = (self.ikarus.angle < 0? -1: 1) * Math.sin(Math.abs(self.ikarus.rotation));
              bullet._x = Math.cos(Math.abs(self.ikarus.rotation));

              bullet.position.x = self.ikarus.position.x;   
              bullet.position.y = self.ikarus.position.y;
              bullet.visible = true;

              break;
            }
            
          }
        } */
      }

      if (e.keyCode == 32) {
        this.ikarus.speedUp();
      }
    };


    /**
      SplashScreen

    */
    var SplashScreen = function () {
      this.assetsToLoader = [
        "assets/images/splash_line.png",
        "assets/images/sprite_hangar.png",
        "assets/images/sprite_airport.png",        
        "assets/images/sprite_windsocket.png",                
        "assets/images/sprite_avion.png",                
        "assets/images/sprite_cloud_1.png",
        "assets/images/beta.png"        
      ];

      this.soundsToLoad = ['assets/music/Nils_505_Feske_-_29_-_Siebenschlfer.mp3'];      

      Screen.call(this);
    };

    SplashScreen.prototype = Object.create(Screen.prototype);
    SplashScreen.prototype.constructor = SplashScreen;

    SplashScreen.prototype.showDescription = function (text) {

      if (_.isUndefined(text)) {
        this.playText.visible = false;
      } else {
        this.playText.setText(text);
        this.playText.position.x = 400 - this.playText.width / 2;
        this.playText.position.y = 530;
        this.playText.visible = true;
      }

    };

    SplashScreen.prototype.init = function () {
      var self = this;

      this.line = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/splash_line.png"));
      this.line.position.x = 100;
      this.line.position.y = 110;

      this.hangar = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_hangar.png"));
      this.hangar.position.x = 110;
      this.hangar.position.y = 381;
      this.hangar.interactive = true
      this.hangar.buttonMode = true

      this.hangar.mouseover = function (e) {
        self.showDescription("Hangar");
      };

      this.hangar.mouseout = function (e) {
        self.showDescription();
      };

      this.hangar.click = this.hangar.tap = function (e) {
        window.location = 'https://github.com/aerkalov/franjo-kluz/wiki';
      };


      this.windsocket = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_windsocket.png"));
      this.windsocket.position.x = 360;
      this.windsocket.position.y = 363;
      this.windsocket.interactive = true
      this.windsocket.buttonMode = true

      this.windsocket.mouseover = function (e) {
        self.showDescription("WHO IS FRANJO?");
      };

      this.windsocket.mouseout = function (e) {
        self.showDescription();
      };

      this.windsocket.click = function (e) {
        window.location = 'http://en.wikipedia.org/wiki/Franjo_Kluz';
      };


      this.airport = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_airport.png"));
      this.airport.position.x = 0;
      this.airport.position.y = 500;

      this.avion = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_avion.png"));
      this.avion.position.x = 460;
      this.avion.position.y = 425;
      this.avion.interactive = true
      this.avion.buttonMode = true

      this.avion.mouseover = function (e) {
        self.showDescription("PLAY GAME");
      };

      this.avion.mouseout = function (e) {
        self.showDescription();
      };

      this.avion.click = this.avion.tap = function (e) {
        self.sound.fade(1.0, 0, 2000);
        self.container.filters = [new PIXI.PixelateFilter()];
      };

      this.clouds = _(6).times(function (n) {
        var cloud = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/sprite_cloud_1.png"));
        cloud._speed = _.random(1, 3);
        cloud.position.x = _.random(900);
        cloud.position.y = _.random(210, 320);

        return cloud;
      });

      var franjoText = new PIXI.Text("FRANJO KLUZ", { font: "58px SilkscreenBold", fill: '#552f00', stroke: '#552f00', align: "left" });
      franjoText.position.x = 100;
      franjoText.position.y = 30;

      this.playText = new PIXI.Text("", { font: "40px Silkscreen", fill: '#552f00', stroke: '#552f00', align: "left" });


      this.beta = new PIXI.Sprite(PIXI.Texture.fromFrame("assets/images/beta.png"));
      this.beta.position.x = 580;
      this.beta.position.y = 94;

      this.operations.push(new Work({
        'callback': function () {
          _.each(self.clouds, function (cloud) {
            cloud.position.x -= cloud._speed;

            if (cloud.position.x < -100) {
              cloud._speed = _.random(1, 3);
              cloud.position.x = 900 + _.random(100);
              cloud.position.y = _.random(210, 320);
            }
          });
        }
      }));

      this.container.addChild(this.airport);      
      this.container.addChild(this.windsocket);      
      this.container.addChild(this.hangar);      

      this.container.addChild(this.avion);

      this.container.addChild(franjoText);      
      this.container.addChild(this.playText);      
      this.container.addChild(this.line);
      this.container.addChild(this.beta);

      _.each(this.clouds, function (cloud) {
        self.container.addChild(cloud);
      });

      this.sound.on('faded', function (e) {
        var scrn = new YugoScreen();
        win.franjo.game.setScreen(scrn);
      });
    };

    return {
      'Screen': Screen,
      'FirstScreen': FirstScreen,    
      'SplashScreen': SplashScreen
    };
  })();

  /**
    Game module.
  */

  win.franjo.game = (function () {
    var before = new Date().getTime();
    var FPS = 40;
    var fpsInterval = 1000 / FPS;

    var setScreen = function (scrn) {
      if (win.franjo.data.currentScreen) {
        win.franjo.data.currentScreen.hide();
      };

      win.franjo.data.currentScreen = scrn;
      scrn.show();
    };

    var showSplashScreen = function () {
      var splashScreen = new win.franjo.objects.SplashScreen();

      setScreen(splashScreen);
    };

    var showFirstScreen = function () {
      var splashScreen = new win.franjo.objects.FirstScreen();

      setScreen(splashScreen);
      setTimeout( function () { showSplashScreen(); }, 3000);
    };


    var animate = function () {
        requestAnimFrame(animate);

        if (before) {
            var now = new Date().getTime();
            var diff = now - before;

            if (diff >= fpsInterval) {
                before = now - (diff % fpsInterval);

              if (win.franjo.data.currentScreen) {
                if (win.franjo.data.currentScreen.isReady) {
                  win.franjo.data.currentScreen.animate();
                }
              };

              before = now;
            }
        }

        // render the stage
        win.franjo.data.renderer.render(win.franjo.data.stage);
     }


    var _init = function () {
      win.franjo.data.stage = new PIXI.Stage(0xaa7839);
      win.franjo.data.stage.interactive = true;

      win.franjo.data.renderer = PIXI.autoDetectRenderer(800, 600);

      win.franjo.data.stage.tap = function (e) {
        if (win.franjo.data.currentScreen.isReady) {
          win.franjo.data.currentScreen.tap(e);
        }
      };

      // add the renderer view element to the DOM
      document.body.appendChild(win.franjo.data.renderer.view);
      document.addEventListener('keydown', function (evt) {
        if (win.franjo.data.currentScreen) {
          if (win.franjo.data.currentScreen.isReady) {
            win.franjo.data.currentScreen.onKeyDown(evt);
          }
        }
      });

      showFirstScreen();

      requestAnimFrame(animate);
    };

    return {
      'init': _init,
      'setScreen': setScreen,
      'showSplashScreen': showSplashScreen,
    };
  })();

})(window, _);
